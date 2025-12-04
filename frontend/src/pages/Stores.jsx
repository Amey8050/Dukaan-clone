import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import storeService from '../services/storeService';
import LoadingSpinner from '../components/LoadingSpinner';
import LazyImage from '../components/LazyImage';
import './Store.css';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const result = await storeService.getMyStores();
      if (result.success) {
        setStores(result.data.stores);
      } else {
        setError('Failed to load stores');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storeId, storeName) => {
    if (!window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await storeService.deleteStore(storeId);
      if (result.success) {
        const message = result.message || 'Store deleted successfully';
        alert(message);
        loadStores();
      } else {
        const errorMsg = result.error?.details || result.error?.message || 'Failed to delete store';
        alert(errorMsg);
      }
    } catch (err) {
      const errorData = err.response?.data?.error;
      let errorMessage = 'Failed to delete store';
      
      if (errorData) {
        if (errorData.details) {
          errorMessage = `${errorData.message}\n\n${errorData.details}`;
          if (errorData.suggestion) {
            errorMessage += `\n\nSuggestion: ${errorData.suggestion}`;
          }
        } else {
          errorMessage = errorData.message || errorMessage;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="stores-container">
      <header className="stores-header">
        <div className="header-left">
          <button 
            className="back-to-dashboard"
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="header-title-section">
            <h1>My Stores</h1>
            <p className="header-subtitle">
              {stores.length > 0 
                ? `${stores.length} ${stores.length === 1 ? 'store' : 'stores'} in your account`
                : 'Manage all your stores in one place'
              }
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="create-store-button"
            onClick={() => navigate('/stores/create')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create Store
          </button>
          <div className="user-menu">
            <div className="user-avatar">
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="user-dropdown">
              <span className="user-name">{user?.full_name || user?.email}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="stores-content">
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner />
            <p>Loading your stores...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={loadStores}>
              Try Again
            </button>
          </div>
        ) : stores.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <h2>No stores yet</h2>
            <p>Create your first store and start selling online in minutes!</p>
            <button
              className="create-store-button-primary"
              onClick={() => navigate('/stores/create')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create Your First Store
            </button>
          </div>
        ) : (
          <>
            <div className="stores-stats">
              <div className="stat-card">
                <div className="stat-icon active">✓</div>
                <div className="stat-content">
                  <h3>{stores.filter(s => s.is_active).length}</h3>
                  <p>Active Stores</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon total">📦</div>
                <div className="stat-content">
                  <h3>{stores.length}</h3>
                  <p>Total Stores</p>
                </div>
              </div>
            </div>
            <div className="stores-grid">
              {stores.map((store) => (
                <div key={store.id} className="store-card-modern">
                  <div
                    className="store-card-header"
                    style={{ backgroundColor: store.theme_color || '#667eea' }}
                  >
                    {store.logo_url ? (
                      <LazyImage src={store.logo_url} alt={store.name} className="store-logo-modern" />
                    ) : (
                      <div className="store-logo-placeholder-modern">
                        {store.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="store-status-overlay">
                      <span className={`status-badge-modern ${store.is_active ? 'active' : 'inactive'}`}>
                        {store.is_active ? (
                          <>
                            <span className="status-dot"></span>
                            Live
                          </>
                        ) : (
                          <>
                            <span className="status-dot"></span>
                            Paused
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="store-card-body">
                    <h3 className="store-name">{store.name}</h3>
                    {store.description && (
                      <p className="store-description-modern">{store.description}</p>
                    )}
                  </div>
                  <div className="store-card-footer">
                    <button
                      className="action-button primary"
                      onClick={() => navigate(`/stores/${store.id}/dashboard`)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                      </svg>
                      Dashboard
                    </button>
                    <button
                      className="action-button secondary"
                      onClick={() => navigate(`/stores/${store.id}/products`)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                      Products
                    </button>
                    <div className="action-dropdown">
                      <button className="action-button-more">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1"/>
                          <circle cx="12" cy="5" r="1"/>
                          <circle cx="12" cy="19" r="1"/>
                        </svg>
                      </button>
                      <div className="dropdown-menu">
                        <button onClick={() => navigate(`/stores/${store.id}/edit`)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit Store
                        </button>
                        <button 
                          className="delete-action"
                          onClick={() => handleDelete(store.id, store.name)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                          Delete Store
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Stores;

