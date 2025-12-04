import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import orderService from '../services/orderService';
import storeService from '../services/storeService';
import FileUpload from '../components/FileUpload';
import LoadingSpinner from '../components/LoadingSpinner';
import LazyImage from '../components/LazyImage';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';
import '../components/BackButton.css';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalStores: 0,
    totalSpent: 0
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      const profileResult = await authService.getCurrentUser();
      if (profileResult.success) {
        const userData = profileResult.data.user;
        setProfile(userData);
        setFormData({
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          avatar_url: userData.avatar_url || ''
        });
      }

      // Load user's orders (from all stores)
      try {
        const ordersResult = await orderService.getMyOrders();
        if (ordersResult.success) {
          const allOrders = ordersResult.data.orders || [];
          setOrders(allOrders);
          
          // Calculate total spent
          const totalSpent = allOrders
            .filter(order => order.status === 'delivered' && order.payment_status === 'paid')
            .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
          
          setStats(prev => ({
            ...prev,
            totalOrders: allOrders.length,
            totalSpent: totalSpent
          }));
        }
      } catch (err) {
        console.warn('Failed to load orders:', err);
      }

      // Load user's stores
      try {
        const storesResult = await storeService.getMyStores();
        if (storesResult.success) {
          const userStores = storesResult.data.stores || [];
          setStores(userStores);
          setStats(prev => ({
            ...prev,
            totalStores: userStores.length
          }));
        }
      } catch (err) {
        console.warn('Failed to load stores:', err);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await authService.updateProfile(formData);
      
      if (result.success) {
        setProfile(result.data.user);
        setEditing(false);
        // Refresh user in auth context
        if (refreshUser) {
          await refreshUser();
        }
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      alert('Failed to update profile: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button
          className="back-button-profile"
          onClick={() => navigate('/dashboard')}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="header-content">
          <h1>My Profile</h1>
          <p className="header-subtitle">Manage your account settings and view your activity</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Logout
        </button>
      </div>

      <div className="profile-wrapper">

      {/* Profile Stats */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon orders">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stores">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalStores}</div>
            <div className="stat-label">My Stores</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon revenue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.totalSpent)}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Information */}
        <div className="profile-section main-section">
          <div className="section-header">
            <div>
              <h2>Profile Information</h2>
              <p className="section-description">Your personal account details</p>
            </div>
            {!editing && (
              <button className="edit-button" onClick={handleEdit}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <div className="profile-form">
              <div className="avatar-upload-section">
                <div className="avatar-preview-large">
                  {formData.avatar_url ? (
                    <LazyImage src={formData.avatar_url} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder-large">
                      {formData.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="avatar-upload-controls">
                  <FileUpload
                    multiple={false}
                    bucket="user-avatars"
                    folder={user?.id}
                    onUpload={(file) => {
                      setFormData({ ...formData, avatar_url: file.url });
                    }}
                    onError={(error) => alert(error)}
                    label="Upload Avatar"
                  />
                  <div className="url-input-group">
                    <label>Or enter URL:</label>
                    <input
                      type="url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="form-actions">
                <button className="save-button" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
                <button className="cancel-button" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  {profile?.avatar_url ? (
                    <LazyImage src={profile.avatar_url} alt={profile.full_name || 'User'} />
                  ) : (
                    <div className="avatar-placeholder">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="profile-name">
                  <h3>{profile?.full_name || 'User'}</h3>
                  <p className="profile-email">{profile?.email || 'N/A'}</p>
                </div>
              </div>
              <div className="profile-details">
                <div className="detail-item">
                  <div className="detail-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{profile?.email || 'Not set'}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{profile?.phone || 'Not set'}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div className="detail-content">
                    <span className="detail-label">Member Since</span>
                    <span className="detail-value">
                      {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="profile-section sidebar-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-card" onClick={() => navigate('/stores/create')}>
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
              </div>
              <div className="action-content">
                <h3>Create Store</h3>
                <p>Set up a new store</p>
              </div>
            </button>
            <button className="action-card" onClick={() => navigate('/dashboard')}>
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <div className="action-content">
                <h3>Dashboard</h3>
                <p>View overview</p>
              </div>
            </button>
            <button className="action-card" onClick={() => navigate('/stores')}>
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
              </div>
              <div className="action-content">
                <h3>My Stores</h3>
                <p>Manage stores</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* My Stores */}
      {stores.length > 0 && (
        <div className="profile-section">
          <div className="section-header">
            <div>
              <h2>My Stores</h2>
              <p className="section-description">Your active stores</p>
            </div>
            <button className="view-all-button" onClick={() => navigate('/stores')}>
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          <div className="stores-grid">
            {stores.slice(0, 3).map((store) => (
              <div key={store.id} className="store-card" onClick={() => navigate(`/stores/${store.id}/dashboard`)}>
                <div 
                  className="store-header"
                  style={{ backgroundColor: store.theme_color || '#667eea' }}
                >
                  {store.logo_url ? (
                    <LazyImage src={store.logo_url} alt={store.name} className="store-logo" />
                  ) : (
                    <div className="store-logo-placeholder">
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="store-body">
                  <h3>{store.name}</h3>
                  <div className="store-meta">
                    <span className={`status-badge ${store.is_active ? 'active' : 'inactive'}`}>
                      {store.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="store-actions">
                  <button className="manage-button">Manage Store</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="profile-section">
          <div className="section-header">
            <div>
              <h2>Recent Orders</h2>
              <p className="section-description">Your latest orders</p>
            </div>
            <button className="view-all-button" onClick={() => navigate('/dashboard')}>
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          <div className="orders-list">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="order-card" onClick={() => {
                const storeId = order.store_id || order.items?.[0]?.store_id;
                if (storeId) {
                  navigate(`/stores/${storeId}/orders/${order.id}`);
                }
              }}>
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-id">Order #{order.id.substring(0, 8)}</span>
                    <span className="order-date">{formatDate(order.created_at)}</span>
                  </div>
                  <span className={`order-status status-${order.status}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-footer">
                  <span className="order-total">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Profile;
