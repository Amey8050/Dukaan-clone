import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import storeService from '../services/storeService';
import FileUpload from '../components/FileUpload';
import '../components/BackButton.css';
import './Store.css';

const EditStore = () => {
  const { storeId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    theme_color: '#000000',
    logo_url: '',
    banner_url: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStore, setLoadingStore] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStore();
  }, [storeId]);

  const loadStore = async () => {
    try {
      setLoadingStore(true);
      const result = await storeService.getStore(storeId);
      if (result.success) {
        const store = result.data.store;
        setFormData({
          name: store.name || '',
          description: store.description || '',
          theme_color: store.theme_color || '#000000',
          logo_url: store.logo_url || '',
          banner_url: store.banner_url || '',
        });
      } else {
        setError('Failed to load store');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load store');
    } finally {
      setLoadingStore(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await storeService.updateStore(storeId, formData);
      
      if (result.success) {
        navigate('/stores');
      } else {
        setError(result.error?.message || 'Failed to update store');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loadingStore) {
    return (
      <div className="store-form-container">
        <div className="store-form-card">
          <div className="loading">Loading store...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-form-container">
      <div className="store-form-card">
        <div className="form-header-section">
          <button
            className="back-button-form"
            onClick={() => navigate('/stores')}
            type="button"
          >
            ← Back
          </button>
          <h1>Edit Store</h1>
          <p className="form-subtitle">Update your store information</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Store Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your store name"
              maxLength={100}
            />
            <small>This will be your store's display name</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your store..."
              rows={4}
            />
            <small>Tell customers what your store is about</small>
          </div>

          <div className="form-group">
            <label htmlFor="theme_color">Theme Color</label>
            <div className="color-input-group">
              <input
                type="color"
                id="theme_color"
                name="theme_color"
                value={formData.theme_color}
                onChange={handleChange}
              />
              <input
                type="text"
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                placeholder="#000000"
                maxLength={7}
              />
            </div>
            <small>Choose a color theme for your store</small>
          </div>

          <div className="form-group">
            <label>Store Logo</label>
            <FileUpload
              multiple={false}
              bucket="store-logos"
              onUpload={(file) => {
                setFormData({ ...formData, logo_url: file.url });
              }}
              onError={(error) => setError(error)}
              label="Upload Store Logo"
            />
            {formData.logo_url && (
              <div className="image-preview-container">
                <img src={formData.logo_url} alt="Logo preview" className="logo-preview" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Store Banner</label>
            <FileUpload
              multiple={false}
              bucket="store-banners"
              onUpload={(file) => {
                setFormData({ ...formData, banner_url: file.url });
              }}
              onError={(error) => setError(error)}
              label="Upload Store Banner"
            />
            {formData.banner_url && (
              <div className="image-preview-container">
                <img src={formData.banner_url} alt="Banner preview" className="banner-preview" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate('/stores')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStore;

