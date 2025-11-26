import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import storeService from '../services/storeService';
import FileUpload from '../components/FileUpload';
import LazyImage from '../components/LazyImage';
import '../components/BackButton.css';
import './Store.css';

const CreateStore = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    theme_color: '#667eea',
    logo_url: '',
    banner_url: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const result = await storeService.createStore(formData);
      
      if (result.success) {
        navigate('/stores');
      } else {
        setError(result.error?.message || 'Failed to create store');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="store-form-container">
      <div className="store-form-card">
        <div className="form-header-section">
          <button
            className="back-button-form"
            onClick={() => navigate('/dashboard')}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <div className="header-content">
            <div className="header-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h1>Create Your Store</h1>
            <p className="form-subtitle">Set up your online store in minutes. Customize it to match your brand.</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="section-header">
              <h2>Basic Information</h2>
              <p className="section-description">Tell us about your store</p>
            </div>

            <div className="form-group">
              <label htmlFor="name">
                Store Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., My Awesome Store"
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
                placeholder="Describe what your store offers..."
                rows={4}
              />
              <small>Help customers understand what your store is about</small>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h2>Branding</h2>
              <p className="section-description">Make your store stand out</p>
            </div>

            <div className="form-group">
              <label htmlFor="theme_color">Theme Color</label>
              <div className="color-input-group">
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    id="theme_color"
                    name="theme_color"
                    value={formData.theme_color}
                    onChange={handleChange}
                    className="color-picker"
                  />
                  <label htmlFor="theme_color" className="color-picker-label">
                    <div 
                      className="color-preview" 
                      style={{ backgroundColor: formData.theme_color }}
                    ></div>
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.theme_color}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                      setFormData({ ...formData, theme_color: value });
                    }
                  }}
                  placeholder="#667eea"
                  maxLength={7}
                  className="color-input-text"
                />
              </div>
              <small>Choose a color that represents your brand</small>
            </div>

            <div className="form-group">
              <label>Store Logo</label>
              <div className="upload-section">
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
                    <div className="preview-header">
                      <span>Logo Preview</span>
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => setFormData({ ...formData, logo_url: '' })}
                      >
                        Remove
                      </button>
                    </div>
                    <LazyImage 
                      src={formData.logo_url} 
                      alt="Logo preview" 
                      className="logo-preview" 
                    />
                  </div>
                )}
              </div>
              <small>Recommended: Square image, at least 200x200px</small>
            </div>

            <div className="form-group">
              <label>Store Banner</label>
              <div className="upload-section">
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
                    <div className="preview-header">
                      <span>Banner Preview</span>
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => setFormData({ ...formData, banner_url: '' })}
                      >
                        Remove
                      </button>
                    </div>
                    <LazyImage 
                      src={formData.banner_url} 
                      alt="Banner preview" 
                      className="banner-preview" 
                    />
                  </div>
                )}
              </div>
              <small>Recommended: 1200x400px for best display</small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Creating...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  Create Store
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStore;
