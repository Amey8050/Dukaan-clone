import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import storeService from '../services/storeService';
import orderService from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';
import LazyImage from '../components/LazyImage';
import notificationIcon from '../assets/notification.svg';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStores: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeStores: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stores and orders in parallel
      const [storesResult, ordersResult] = await Promise.allSettled([
        storeService.getMyStores(),
        orderService.getMyOrders()
      ]);

      // Process stores
      if (storesResult.status === 'fulfilled' && storesResult.value.success) {
        const userStores = storesResult.value.data.stores || [];
        setStores(userStores.slice(0, 6)); // Show latest 6 stores
        const activeStores = userStores.filter(store => store.is_active).length;
        setStats(prev => ({
          ...prev,
          totalStores: userStores.length,
          activeStores: activeStores
        }));
      }

      // Process orders
      if (ordersResult.status === 'fulfilled' && ordersResult.value.success) {
        const allOrders = ordersResult.value.data.orders || [];
        setOrders(allOrders.slice(0, 5)); // Show latest 5 orders
        
        // Calculate total revenue from completed paid orders
        const totalRevenue = allOrders
          .filter(order => order.status === 'delivered' && order.payment_status === 'paid')
          .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
        
        setStats(prev => ({
          ...prev,
          totalOrders: allOrders.length,
          totalRevenue: totalRevenue
        }));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
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
      <div className="dashboard-container">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p className="welcome-text">Welcome back, {user?.full_name || user?.email}</p>
        </div>
        <div className="user-info">
          <button
            type="button"
            className="notification-button"
            aria-label="Notifications"
          >
            <img src={notificationIcon} alt="" aria-hidden="true" />
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stores">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalStores}</h3>
              <p>Total Stores</p>
              <span className="stat-subtitle">{stats.activeStores} active</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orders">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
            </div>
            <div className="stat-content">
              <h3>{stats.totalOrders}</h3>
              <p>Total Orders</p>
              <span className="stat-subtitle">All time</span>
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
              <h3>{formatCurrency(stats.totalRevenue)}</h3>
              <p>Total Revenue</p>
              <span className="stat-subtitle">From completed orders</span>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon quick-action">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <div className="stat-content">
              <button 
                className="create-store-btn"
                onClick={() => navigate('/stores/create')}
              >
                Create New Store
              </button>
              <p>Get started</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Stores Section */}
          <div className="dashboard-card stores-section">
            <div className="card-header">
              <h2>My Stores</h2>
              {stores.length > 0 && (
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/stores')}
                >
                  View All
                </button>
              )}
            </div>
            
            {stores.length === 0 ? (
              <div className="empty-state">
                <p>You don't have any stores yet.</p>
                <button 
                  className="primary-button"
                  onClick={() => navigate('/stores/create')}
                >
                  Create Your First Store
                </button>
              </div>
            ) : (
              <div className="stores-grid">
                {stores.map((store) => (
                  <div 
                    key={store.id} 
                    className="store-card"
                    onClick={() => navigate(`/stores/${store.id}/dashboard`)}
                  >
                    <div 
                      className="store-header"
                      style={{ backgroundColor: store.theme_color || '#667eea' }}
                    >
                      {store.logo_url ? (
                        <LazyImage 
                          src={store.logo_url} 
                          alt={store.name} 
                          className="store-logo"
                        />
                      ) : (
                        <div className="store-logo-placeholder">
                          {store.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="store-body">
                      <h3>{store.name}</h3>
                      {store.description && (
                        <p className="store-description">{store.description}</p>
                      )}
                      <div className="store-meta">
                        <span className={`status-badge ${store.is_active ? 'active' : 'inactive'}`}>
                          {store.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="store-actions">
                      <button
                        className="dashboard-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/stores/${store.id}/dashboard`);
                        }}
                      >
                        Dashboard
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders Section */}
          <div className="dashboard-card orders-section">
            <div className="card-header">
              <h2>Recent Orders</h2>
              {orders.length > 0 && (
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/profile')}
                >
                  View All
                </button>
              )}
            </div>
            
            {orders.length === 0 ? (
              <div className="empty-state">
                <p>No orders yet.</p>
                <p className="empty-subtitle">Orders from your stores will appear here.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <h4>Order #{order.id.slice(0, 8)}</h4>
                      <p className="order-date">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="order-details">
                      <span className={`order-status ${order.status}`}>
                        {order.status}
                      </span>
                      <span className="order-amount">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            <button 
              className="action-card"
              onClick={() => navigate('/stores/create')}
            >
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
              </div>
              <h3>Create Store</h3>
              <p>Set up a new online store</p>
            </button>
            
            <button 
              className="action-card"
              onClick={() => navigate('/stores')}
            >
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
              </div>
              <h3>Manage Stores</h3>
              <p>View and edit your stores</p>
            </button>
            
            <button 
              className="action-card"
              onClick={() => navigate('/profile')}
            >
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3>My Profile</h3>
              <p>Update your account settings</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
