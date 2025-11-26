import { useState, useEffect, memo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import productService from '../services/productService';
import recommendationService from '../services/recommendationService';
import analyticsService from '../services/analyticsService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import LazyImage from '../components/LazyImage';
import { formatCurrency } from '../utils/currency';
import '../components/BackButton.css';
import './ProductDetail.css';

const ProductDetail = () => {
  const { storeId, productId } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (productId && storeId) {
      loadProduct();
      loadRelatedProducts();
    }
  }, [productId, storeId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const result = await productService.getProduct(productId);
      if (result.success) {
        setProduct(result.data.product);
        // Track product view
        analyticsService.trackProductView(storeId, productId);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    try {
      const result = await recommendationService.getProductRecommendations(storeId, productId, { limit: 4 });
      if (result.success) {
        setRelatedProducts(result.data.recommendations || []);
      }
    } catch (err) {
      console.warn('Failed to load related products:', err);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      alert('Please login to add products to cart');
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    const result = await addToCart(storeId, product.id, quantity);
    
    if (result.success) {
      // Track add to cart event
      analyticsService.trackAddToCart(storeId, product.id, quantity);
      alert('Product added to cart!');
      navigate(`/stores/${storeId}/cart`);
    } else {
      alert(result.error || 'Failed to add to cart');
    }
    setAddingToCart(false);
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-container">
        <div className="error-message">{error || 'Product not found'}</div>
        <button className="back-button" onClick={() => navigate(`/stores/${storeId}/products`)}>
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <button className="back-button" onClick={() => navigate(`/stores/${storeId}/products`)}>
        ← Back to Products
      </button>

      <div className="product-detail-layout">
        <div className="product-images-section">
          {product.images && product.images.length > 0 ? (
            <>
              <div className="main-image">
                <LazyImage 
                  src={product.images[selectedImageIndex]} 
                  alt={product.name}
                  loading="lazy"
                />
              </div>
              {product.images.length > 1 && (
                <div className="image-thumbnails">
                  {product.images.map((image, index) => (
                    <LazyImage
                      key={index}
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className={selectedImageIndex === index ? 'active' : ''}
                      onClick={() => setSelectedImageIndex(index)}
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="image-placeholder">No Image</div>
          )}
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>
          
          {product.short_description && (
            <p className="short-description">{product.short_description}</p>
          )}

          <div className="product-price-section">
            <span className="price">{formatCurrency(product.price)}</span>
            {product.compare_at_price && (
              <span className="compare-price">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>

          {product.description && (
            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          {product.track_inventory && (
            <div className="inventory-info">
              <p>
                <strong>Stock:</strong> {product.inventory_quantity} available
              </p>
            </div>
          )}

          <div className="add-to-cart-section">
            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-controls">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={product.track_inventory ? product.inventory_quantity : undefined}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={product.track_inventory && quantity >= product.inventory_quantity}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={addingToCart || (product.track_inventory && product.inventory_quantity === 0)}
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className="product-tags">
              <strong>Tags:</strong>
              {product.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h2>You May Also Like</h2>
          <div className="related-products-grid">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                to={`/stores/${storeId}/products/${relatedProduct.id}`}
                className="related-product-card"
              >
                {relatedProduct.images && relatedProduct.images.length > 0 && (
                  <img src={relatedProduct.images[0]} alt={relatedProduct.name} />
                )}
                <h3>{relatedProduct.name}</h3>
                <div className="related-product-price">
                  {formatCurrency(relatedProduct.price)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

