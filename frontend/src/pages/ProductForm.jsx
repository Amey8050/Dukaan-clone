import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import productService from '../services/productService';
import aiService from '../services/aiService';
import FileUpload from '../components/FileUpload';
import { formatCurrency } from '../utils/currency';
import '../components/BackButton.css';
import './ProductForm.css';

const ProductForm = () => {
  const { storeId, productId } = useParams();
  const isEditMode = !!productId;
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    compare_at_price: '',
    cost_per_item: '',
    sku: '',
    barcode: '',
    track_inventory: true,
    inventory_quantity: '0',
    low_stock_threshold: '5',
    weight: '',
    status: 'active',
    featured: false,
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    images: [],
    tags: '',
  });

  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState({
    description: false,
    seo: false,
    pricing: false,
    image: false
  });
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  useEffect(() => {
    if (isEditMode && productId) {
      loadProduct();
    }
  }, [productId, isEditMode]);

  const loadProduct = async () => {
    try {
      setLoadingProduct(true);
      const result = await productService.getProduct(productId);
      if (result.success) {
        const product = result.data.product;
        setFormData({
          name: product.name || '',
          description: product.description || '',
          short_description: product.short_description || '',
          price: product.price?.toString() || '',
          compare_at_price: product.compare_at_price?.toString() || '',
          cost_per_item: product.cost_per_item?.toString() || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          track_inventory: product.track_inventory !== undefined ? product.track_inventory : true,
          inventory_quantity: product.inventory_quantity?.toString() || '0',
          low_stock_threshold: product.low_stock_threshold?.toString() || '5',
          weight: product.weight?.toString() || '',
          status: product.status || 'active',
          featured: product.featured || false,
          seo_title: product.seo_title || '',
          seo_description: product.seo_description || '',
          seo_keywords: product.seo_keywords?.join(', ') || '',
          images: product.images || [],
          tags: product.tags?.join(', ') || '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load product');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, imageUrl.trim()],
      });
      setImageUrl('');
    }
  };

  const handleImageUpload = (uploadedFiles) => {
    if (Array.isArray(uploadedFiles)) {
      // Multiple files uploaded
      const urls = uploadedFiles.map(file => file.url);
      setFormData({
        ...formData,
        images: [...formData.images, ...urls],
      });
    } else {
      // Single file uploaded
      setFormData({
        ...formData,
        images: [...formData.images, uploadedFiles.url],
      });
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  // AI Generation Handlers
  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) {
      setError('Please enter a product name first');
      return;
    }

    setAiLoading({ ...aiLoading, description: true });
    setError('');

    try {
      const result = await aiService.generateDescription({
        product_name: formData.name,
        category: formData.tags ? formData.tags.split(',')[0].trim() : undefined,
        features: formData.short_description || undefined,
        price: formData.price || undefined,
      });

      if (result.success && result.data.description) {
        setFormData({
          ...formData,
          description: result.data.description,
        });
      } else {
        setError('Failed to generate description. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to generate description');
    } finally {
      setAiLoading({ ...aiLoading, description: false });
    }
  };

  const handleGenerateSEO = async () => {
    if (!formData.name.trim()) {
      setError('Please enter a product name first');
      return;
    }

    setAiLoading({ ...aiLoading, seo: true });
    setError('');

    try {
      const result = await aiService.generateSEO({
        product_name: formData.name,
        category: formData.tags ? formData.tags.split(',')[0].trim() : undefined,
        description: formData.description || undefined,
      });

      if (result.success && result.data) {
        setFormData({
          ...formData,
          seo_title: result.data.seo_title || formData.seo_title,
          seo_description: result.data.seo_description || formData.seo_description,
          seo_keywords: result.data.keywords
            ? result.data.keywords.join(', ')
            : formData.seo_keywords,
        });
      } else {
        setError('Failed to generate SEO data. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to generate SEO data');
    } finally {
      setAiLoading({ ...aiLoading, seo: false });
    }
  };

  const handleGeneratePricing = async () => {
    if (!formData.cost_per_item) {
      setError('Please enter cost per item first');
      return;
    }

    setAiLoading({ ...aiLoading, pricing: true });
    setError('');

    try {
      const result = await aiService.getPricingSuggestions({
        product_name: formData.name || 'Product',
        category: formData.tags ? formData.tags.split(',')[0].trim() : undefined,
        cost: parseFloat(formData.cost_per_item),
      });

      if (result.success && result.data.suggested_price) {
        // Use the suggested price (medium tier)
        const suggestedPrice = parseFloat(result.data.suggested_price);
        setFormData({
          ...formData,
          price: suggestedPrice.toFixed(2),
        });
        // Show a success message
        alert(`AI Suggested Price: ${formatCurrency(suggestedPrice)}\n\nReasoning: ${result.data.reasoning || 'Based on cost and market analysis'}`);
      } else {
        setError('Failed to generate pricing suggestions. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to generate pricing suggestions');
    } finally {
      setAiLoading({ ...aiLoading, pricing: false });
    }
  };

  const handleAnalyzeImage = async (imageUrl, index, action = 'analyze') => {
    if (!imageUrl) {
      setError('Please provide an image URL');
      return;
    }

    setAiLoading({ ...aiLoading, image: true });
    setError('');
    setSelectedImageIndex(index);

    try {
      const result = await aiService.cleanupImage(imageUrl, action);

      if (result.success && result.data) {
        setImageAnalysis({
          imageUrl: imageUrl,
          index: index,
          analysis: result.data.analysis,
          action: result.data.action,
          message: result.data.message
        });

        // If action is 'description', try to use it for product description
        if (action === 'description' && result.data.analysis && !formData.description) {
          setFormData({
            ...formData,
            description: result.data.analysis.substring(0, 500) // Limit length
          });
        }
      } else {
        setError('Failed to analyze image. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to analyze image');
    } finally {
      setAiLoading({ ...aiLoading, image: false });
    }
  };

  const closeImageAnalysis = () => {
    setImageAnalysis(null);
    setSelectedImageIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data
      const submitData = {
        store_id: storeId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        short_description: formData.short_description.trim() || null,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        cost_per_item: formData.cost_per_item ? parseFloat(formData.cost_per_item) : null,
        sku: formData.sku.trim() || null,
        barcode: formData.barcode.trim() || null,
        track_inventory: formData.track_inventory,
        inventory_quantity: parseInt(formData.inventory_quantity) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        status: formData.status,
        featured: formData.featured,
        seo_title: formData.seo_title.trim() || null,
        seo_description: formData.seo_description.trim() || null,
        seo_keywords: formData.seo_keywords
          ? formData.seo_keywords.split(',').map((k) => k.trim()).filter((k) => k)
          : null,
        images: formData.images,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter((t) => t)
          : [],
      };

      let result;
      if (isEditMode) {
        result = await productService.updateProduct(productId, submitData);
      } else {
        result = await productService.createProduct(submitData);
      }

      if (result.success) {
        navigate(`/stores/${storeId}/products`);
      } else {
        setError(result.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="product-form-container">
        <div className="loading">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="product-form-container">
      <div className="product-form-card">
        <div className="form-header">
          <button className="back-button" onClick={() => {
            const fromDashboard = location.state?.from === 'dashboard';
            if (fromDashboard) {
              navigate(`/stores/${storeId}/dashboard`, { state: { tab: location.state?.tab || 'products' } });
            } else {
              navigate(`/stores/${storeId}/products`);
            }
          }}>
            ← Back
          </button>
          <h1>{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter product name"
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label htmlFor="short_description">Short Description</label>
              <input
                type="text"
                id="short_description"
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                placeholder="Brief description (appears in listings)"
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <div className="form-group-header">
                <label htmlFor="description">Full Description</label>
                <button
                  type="button"
                  className="ai-generate-button"
                  onClick={handleGenerateDescription}
                  disabled={aiLoading.description || !formData.name.trim()}
                  title="Generate description using AI"
                >
                  {aiLoading.description ? (
                    <>
                      <span className="ai-loading-spinner">⟳</span> Generating...
                    </>
                  ) : (
                    <>
                      ✨ AI Generate
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed product description"
                rows={6}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section">
            <h2>Pricing</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="compare_at_price">Compare at Price</label>
                <input
                  type="number"
                  id="compare_at_price"
                  name="compare_at_price"
                  value={formData.compare_at_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
                <small>Original price (for showing discounts)</small>
              </div>
            </div>

            <div className="form-group">
              <div className="form-group-header">
                <label htmlFor="cost_per_item">Cost per Item</label>
                <button
                  type="button"
                  className="ai-generate-button"
                  onClick={handleGeneratePricing}
                  disabled={aiLoading.pricing || !formData.cost_per_item}
                  title="Get AI pricing suggestions"
                >
                  {aiLoading.pricing ? (
                    <>
                      <span className="ai-loading-spinner">⟳</span> Analyzing...
                    </>
                  ) : (
                    <>
                      AI Suggest Price
                    </>
                  )}
                </button>
              </div>
              <input
                type="number"
                id="cost_per_item"
                name="cost_per_item"
                value={formData.cost_per_item}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              <small>Your cost (for profit calculation)</small>
            </div>
          </div>

          {/* Inventory */}
          <div className="form-section">
            <h2>Inventory</h2>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="track_inventory"
                  checked={formData.track_inventory}
                  onChange={handleChange}
                />
                Track inventory
              </label>
            </div>

            {formData.track_inventory && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="inventory_quantity">Quantity</label>
                    <input
                      type="number"
                      id="inventory_quantity"
                      name="inventory_quantity"
                      value={formData.inventory_quantity}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="low_stock_threshold">Low Stock Alert</label>
                    <input
                      type="number"
                      id="low_stock_threshold"
                      name="low_stock_threshold"
                      value={formData.low_stock_threshold}
                      onChange={handleChange}
                      min="0"
                      placeholder="5"
                    />
                    <small>Alert when stock falls below this</small>
                  </div>
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sku">SKU</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="Stock Keeping Unit"
                />
              </div>

              <div className="form-group">
                <label htmlFor="barcode">Barcode</label>
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Product barcode"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Images */}
          <div className="form-section">
            <h2>Product Images</h2>
            
            <div className="form-group">
              <label>Upload Images</label>
              <FileUpload
                multiple={true}
                maxFiles={10}
                bucket="product-images"
                folder={storeId}
                onUpload={handleImageUpload}
                onError={(error) => setError(error)}
                label="Upload Product Images"
              />
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Or Add Image URL</label>
              <div className="image-input-group">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <button type="button" onClick={handleAddImage} className="add-image-button">
                  Add
                </button>
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="images-preview">
                {formData.images.map((img, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={img} alt={`Product ${index + 1}`} />
                    <div className="image-actions">
                      <button
                        type="button"
                        onClick={() => handleAnalyzeImage(img, index, 'analyze')}
                        className="ai-analyze-image-button"
                        disabled={aiLoading.image}
                        title="Analyze image with AI"
                      >
                        {aiLoading.image && selectedImageIndex === index ? (
                          <span className="ai-loading-spinner">⟳</span>
                        ) : (
                          'Search'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="remove-image-button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {imageAnalysis && (
              <div className="image-analysis-modal">
                <div className="image-analysis-content">
                  <div className="image-analysis-header">
                    <h3>AI Image Analysis</h3>
                    <button
                      type="button"
                      onClick={closeImageAnalysis}
                      className="close-analysis-button"
                    >
                      ×
                    </button>
                  </div>
                  <div className="image-analysis-body">
                    <div className="analyzed-image-preview">
                      <img src={imageAnalysis.imageUrl} alt="Analyzed" />
                    </div>
                    <div className="analysis-text">
                      <h4>Analysis Results:</h4>
                      <p>{imageAnalysis.analysis}</p>
                      {imageAnalysis.message && (
                        <small className="analysis-note">{imageAnalysis.message}</small>
                      )}
                    </div>
                    <div className="analysis-actions">
                      <button
                        type="button"
                        onClick={() => handleAnalyzeImage(imageAnalysis.imageUrl, imageAnalysis.index, 'description')}
                        className="ai-action-button"
                        disabled={aiLoading.image}
                      >
                        Generate Description from Image
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAnalyzeImage(imageAnalysis.imageUrl, imageAnalysis.index, 'suggestions')}
                        className="ai-action-button"
                        disabled={aiLoading.image}
                      >
                        Get Improvement Suggestions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="form-section">
            <h2>Settings</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                  />
                  Featured Product
                </label>
                <small>Show this product prominently</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="tag1, tag2, tag3"
              />
              <small>Separate tags with commas</small>
            </div>
          </div>

          {/* SEO */}
          <div className="form-section">
            <div className="form-section-header">
              <h2>SEO Settings</h2>
              <button
                type="button"
                className="ai-generate-button"
                onClick={handleGenerateSEO}
                disabled={aiLoading.seo || !formData.name.trim()}
                title="Generate SEO keywords and meta tags using AI"
              >
                {aiLoading.seo ? (
                  <>
                    <span className="ai-loading-spinner">⟳</span> Generating SEO...
                  </>
                ) : (
                  <>
                    AI Generate SEO
                  </>
                )}
              </button>
            </div>
            
            <div className="form-group">
              <label htmlFor="seo_title">SEO Title</label>
              <input
                type="text"
                id="seo_title"
                name="seo_title"
                value={formData.seo_title}
                onChange={handleChange}
                placeholder="SEO optimized title"
                maxLength={60}
              />
            </div>

            <div className="form-group">
              <label htmlFor="seo_description">SEO Description</label>
              <textarea
                id="seo_description"
                name="seo_description"
                value={formData.seo_description}
                onChange={handleChange}
                placeholder="SEO meta description"
                rows={3}
                maxLength={160}
              />
            </div>

            <div className="form-group">
              <label htmlFor="seo_keywords">SEO Keywords</label>
              <input
                type="text"
                id="seo_keywords"
                name="seo_keywords"
                value={formData.seo_keywords}
                onChange={handleChange}
                placeholder="keyword1, keyword2, keyword3"
              />
              <small>Separate keywords with commas</small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                const fromDashboard = location.state?.from === 'dashboard';
                if (fromDashboard) {
                  navigate(`/stores/${storeId}/dashboard`, { state: { tab: location.state?.tab || 'products' } });
                } else {
                  navigate(`/stores/${storeId}/products`);
                }
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

