import { useState, useEffect, memo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import homepageService from '../services/homepageService';
import analyticsService from '../services/analyticsService';
import LazyImage from '../components/LazyImage';
import { formatCurrency } from '../utils/currency';
import './StoreHomepage.css';

const StoreHomepage = () => {
  const { storeId } = useParams();
  const [homepageData, setHomepageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated } = useAuth();
  const { addToCart, cart, loadCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (storeId) {
      loadHomepageData();
      // Load cart if authenticated
      if (isAuthenticated) {
        loadCart(storeId);
      }
      // Track page view
      analyticsService.trackPageView(storeId, `/stores/${storeId}`);
    }
  }, [storeId, isAuthenticated]);

  const loadHomepageData = async () => {
    try {
      setLoading(true);
      const result = await homepageService.getHomepageData(storeId);
      if (result.success) {
        setHomepageData(result.data);
      } else {
        setError('Failed to load homepage');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load homepage');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      alert('Please login to add products to cart');
      navigate('/login');
      return;
    }

    try {
      const result = await addToCart(storeId, product.id, 1);
      if (result.success) {
        // Track add to cart event
        analyticsService.trackAddToCart(storeId, product.id, 1);
        alert('Product added to cart!');
      } else {
        alert(result.error || 'Failed to add product to cart');
      }
    } catch (err) {
      alert('Failed to add product to cart');
    }
  };

  const handleProductClick = (product) => {
    // Track product view
    analyticsService.trackProductView(storeId, product.id);
    navigate(`/stores/${storeId}/products/${product.id}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Track search event
      analyticsService.trackSearch(storeId, searchQuery);
      navigate(`/stores/${storeId}/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getCartItemCount = () => {
    if (!cart || !cart.items || !storeId) return 0;
    return cart.total_items || 0;
  };

  const ProductCard = ({ product }) => (
    <div className="product-card">
      <div className="product-image-container">
        {product.images && product.images.length > 0 ? (
          <LazyImage src={product.images[0]} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-image-placeholder">No Image</div>
        )}
        {product.featured && <span className="featured-badge">Featured</span>}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        {product.short_description && (
          <p className="product-description">{product.short_description}</p>
        )}
        <div className="product-price">
          <span className="price">{formatCurrency(product.price)}</span>
          {product.compare_at_price && (
            <span className="compare-price">
              {formatCurrency(product.compare_at_price)}
            </span>
          )}
        </div>
        <div className="product-actions">
          <button
            className="view-button"
            onClick={() => handleProductClick(product)}
          >
            View Details
          </button>
          <button
            className="add-to-cart-button"
            onClick={() => handleAddToCart(product)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );

  const ProductSection = ({ title, products, emptyMessage }) => {
    if (!products || products.length === 0) {
      return null;
    }

    return (
      <section className="homepage-section">
        <div className="section-header">
          <h2>{title}</h2>
          <Link to={`/stores/${storeId}/products`} className="view-all-link">
            View All →
          </Link>
        </div>
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="homepage-container">
        <div className="loading">Loading store homepage...</div>
      </div>
    );
  }

  if (error || !homepageData) {
    return (
      <div className="homepage-container">
        <div className="error-message">{error || 'Failed to load homepage'}</div>
      </div>
    );
  }

  const { store, sections } = homepageData;

  return (
    <div className="homepage-container">
      {/* Store Header */}
      <header className="store-header">
        {store.banner_url && (
          <div className="store-banner">
            <LazyImage src={store.banner_url} alt={store.name} loading="lazy" />
          </div>
        )}
        <div className="store-header-content">
          {store.logo_url && (
            <LazyImage src={store.logo_url} alt={store.name} className="store-logo" loading="lazy" />
          )}
          <div className="store-info">
            <h1>{store.name}</h1>
            {store.description && <p className="store-description">{store.description}</p>}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
        {isAuthenticated && (
          <Link to={`/stores/${storeId}/cart`} className="cart-link">
            Cart
            {getCartItemCount() > 0 && (
              <span className="cart-badge">{getCartItemCount()}</span>
            )}
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="homepage-nav">
        <Link to={`/stores/${storeId}/products`}>All Products</Link>
        {sections.categories?.map((category) => (
          <Link key={category.id} to={`/stores/${storeId}/products?category=${category.id}`}>
            {category.name}
          </Link>
        ))}
        {isAuthenticated && homepageData.is_store_owner && (
          <Link to={`/stores/${storeId}/dashboard`}>Dashboard</Link>
        )}
      </nav>

      {/* Main Content */}
      <main className="homepage-content">
        {/* Personalized Recommendations */}
        {isAuthenticated && sections.personalized && sections.personalized.length > 0 && (
          <ProductSection
            title="Recommended for You"
            products={sections.personalized}
          />
        )}

        {/* Featured Products */}
        <ProductSection
          title="Featured Products"
          products={sections.featured}
        />

        {/* Products by Category - Show products organized by their categories */}
        {sections.products_by_category && Object.keys(sections.products_by_category).length > 0 && (
          <>
            {Object.values(sections.products_by_category).map((categoryData) => (
              <ProductSection
                key={categoryData.category.id}
                title={categoryData.category.name}
                products={categoryData.products}
                emptyMessage={`No products in ${categoryData.category.name} category`}
              />
            ))}
          </>
        )}

        {/* Popular Products */}
        <ProductSection
          title="Popular This Week"
          products={sections.popular}
        />

        {/* New Arrivals */}
        <ProductSection
          title="New Arrivals"
          products={sections.new_arrivals}
        />

        {/* Categories */}
        {sections.categories && sections.categories.length > 0 && (
          <section className="homepage-section">
            <h2>Shop by Category</h2>
            <div className="categories-grid">
              {sections.categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/stores/${storeId}/products?category=${category.id}`}
                  className="category-card"
                >
                  {category.image_url && (
                    <LazyImage src={category.image_url} alt={category.name} loading="lazy" />
                  )}
                  <h3>{category.name}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="homepage-footer">
        <p>&copy; {new Date().getFullYear()} {store.name}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default StoreHomepage;

