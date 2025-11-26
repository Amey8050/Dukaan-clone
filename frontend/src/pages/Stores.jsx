import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import storeService from '../services/storeService';
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
        // Show the message from backend (may include info about archived products)
        const message = result.message || 'Store deleted successfully';
        alert(message);
        loadStores(); // Reload stores
      } else {
        const errorMsg = result.error?.details || result.error?.message || 'Failed to delete store';
        alert(errorMsg);
      }
    } catch (err) {
      const errorData = err.response?.data?.error;
      let errorMessage = 'Failed to delete store';
      
      if (errorData) {
        // Show detailed error message if available
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
        <h1>My Stores</h1>
        <div className="header-actions">
          <button
            className="create-store-button"
            onClick={() => navigate('/stores/create')}
          >
            + Create Store
          </button>
          <div className="user-info">
            <span>{user?.full_name || user?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="stores-content">
        {loading ? (
          <div className="loading">Loading stores...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : stores.length === 0 ? (
          <div className="empty-state">
            <h2>No stores yet</h2>
            <p>Create your first store to get started!</p>
            <button
              className="create-store-button"
              onClick={() => navigate('/stores/create')}
            >
              Create Your First Store
            </button>
          </div>
        ) : (
          <div className="stores-grid">
            {stores.map((store) => (
              <div key={store.id} className="store-card">
                <div
                  className="store-header"
                  style={{ backgroundColor: store.theme_color || '#000000' }}
                >
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="store-logo" />
                  ) : (
                    <div className="store-logo-placeholder">
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="store-body">
                  <h3>{store.name}</h3>
                  {store.description && <p className="store-description">{store.description}</p>}
                  <div className="store-meta">
                    <span className={`status-badge ${store.is_active ? 'active' : 'inactive'}`}>
                      {store.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="store-slug">/{store.slug}</span>
                  </div>
                </div>
                <div className="store-actions">
                  <button
                    className="dashboard-button"
                    onClick={() => navigate(`/stores/${store.id}/dashboard`)}
                  >
                    Dashboard
                  </button>
                  <button
                    className="view-button"
                    onClick={() => navigate(`/stores/${store.id}/products`)}
                  >
                    Products
                  </button>
                  <button
                    className="edit-button"
                    onClick={() => navigate(`/stores/${store.id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(store.id, store.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Stores;

