import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import productService from '../services/productService';
import storeService from '../services/storeService';
import { formatCurrency } from '../utils/currency';
import '../components/BackButton.css';
import './Product.css';

const Products = () => {
  const { storeId } = useParams();
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, draft, archived
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (storeId) {
      loadStore();
      loadProducts();
    }
  }, [storeId]);

  const loadStore = async () => {
    try {
      const result = await storeService.getStore(storeId);
      if (result.success) {
        setStore(result.data.store);
      }
    } catch (err) {
      console.error('Failed to load store:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await productService.getProductsByStore(storeId);
      if (result.success) {
        setProducts(result.data.products);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await productService.deleteProduct(productId);
      if (result.success) {
        // Check if it was archived instead of deleted
        const message = result.message || 'Product deleted successfully';
        alert(message);
        loadProducts(); // Reload products
      } else {
        const errorMsg = result.error?.details || result.error?.message || 'Failed to delete product';
        alert(errorMsg);
      }
    } catch (err) {
      const errorData = err.response?.data?.error;
      let errorMessage = 'Failed to delete product';
      
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'draft':
        return 'status-draft';
      case 'archived':
        return 'status-archived';
      default:
        return '';
    }
  };

  const productStats = useMemo(() => {
    const stats = {
      total: products.length,
      active: 0,
      draft: 0,
      archived: 0,
      lowStock: 0
    };

    products.forEach((product) => {
      const status = product.status || 'draft';
      if (stats[status] !== undefined) {
        stats[status] += 1;
      }
      if (
        product.track_inventory &&
        product.inventory_quantity !== undefined &&
        product.inventory_quantity <= (product.low_stock_threshold || 5)
      ) {
        stats.lowStock += 1;
      }
    });

    return stats;
  }, [products]);

  const displayedProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredProducts = products.filter((product) => {
      const matchesFilter = filter === 'all' ? true : product.status === filter;
      const matchesSearch =
        !normalizedSearch ||
        product.name?.toLowerCase().includes(normalizedSearch) ||
        product.short_description?.toLowerCase().includes(normalizedSearch) ||
        product.category?.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });

    const sortedProducts = [...filteredProducts];
    sortedProducts.sort((a, b) => {
      const getDateValue = (item) =>
        item.updated_at || item.created_at ? new Date(item.updated_at || item.created_at).getTime() : 0;

      const getPrice = (item) => parseFloat(item.price) || 0;
      const getInventory = (item) => item.inventory_quantity || 0;

      switch (sortOption) {
        case 'price-desc':
          return getPrice(b) - getPrice(a);
        case 'price-asc':
          return getPrice(a) - getPrice(b);
        case 'inventory':
          return getInventory(b) - getInventory(a);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return getDateValue(b) - getDateValue(a);
      }
    });

    return sortedProducts;
  }, [products, filter, searchTerm, sortOption]);

  const filterLabels = {
    all: 'All products',
    active: 'Active products',
    draft: 'Draft products',
    archived: 'Archived products'
  };

  const searchPlaceholder = store?.name ? `Search ${store.name} catalog` : 'Search products';
  const hasProducts = products.length > 0;
  const noResultsAfterFiltering = hasProducts && displayedProducts.length === 0 && !loading && !error;
  const isFilteredView = filter !== 'all' || Boolean(searchTerm.trim().length);

  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
    setSortOption('recent');
  };

  return (
    <div className="products-container">
      <header className="products-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/stores')}>
            ← Back to Stores
          </button>
          <div>
            <h1>{store?.name || 'Products'}</h1>
            {store && <p className="store-slug">/{store.slug}</p>}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="create-product-button"
            onClick={() => navigate(`/stores/${storeId}/products/create`)}
          >
            + Add Product
          </button>
          <button
            className="inventory-button pill-button"
            onClick={() => navigate(`/stores/${storeId}/inventory`)}
          >
            Inventory
          </button>
          <button
            className="orders-button pill-button"
            onClick={() => navigate(`/stores/${storeId}/orders`)}
          >
            Orders
          </button>
          <div className="user-info">
            <span>{user?.full_name || user?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="products-content">
        <section className="store-hero">
          <div className="store-info-card">
            <div className="store-badge">{store?.is_active ? 'Live store' : 'Paused'}</div>
            <h2>{store?.name || 'Store catalog'}</h2>
            <p>
              {store?.description ||
                'Organize inventory, monitor performance, and create beautiful product cards in one place.'}
            </p>
            <div className="store-meta">
              <span>/{store?.slug || 'store-slug'}</span>
              {store?.industry && <span>{store.industry}</span>}
              <span>{productStats.total} items</span>
            </div>
            <div className="store-hero-actions">
              <button
                className="ghost-button"
                onClick={() => navigate(`/stores/${storeId}/dashboard`)}
              >
                View dashboard
              </button>
              <button
                className="ghost-button"
                onClick={() => navigate(`/stores/${storeId}/products/create`)}
              >
                Quick add product
              </button>
            </div>
          </div>
          <div className="store-highlight-card">
            <p>Low stock alerts</p>
            <h3>{productStats.lowStock}</h3>
            <span className="subtext">items under threshold</span>
            <div className="highlight-pill">Keep shelves full</div>
          </div>
        </section>

        <div className="product-stats-grid">
          <div className="product-stat-card">
            <p>Total products</p>
            <h4>{productStats.total}</h4>
            <span>{store?.name || 'Store'}</span>
          </div>
          <div className="product-stat-card">
            <p>Active</p>
            <h4>{productStats.active}</h4>
            <span>Live on storefront</span>
          </div>
          <div className="product-stat-card">
            <p>Drafts</p>
            <h4>{productStats.draft}</h4>
            <span>Need final touches</span>
          </div>
          <div className="product-stat-card">
            <p>Archived</p>
            <h4>{productStats.archived}</h4>
            <span>Hidden from customers</span>
          </div>
        </div>

        <div className="products-toolbar">
          <div className="toolbar-left">
            <div className="search-field">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
              />
            </div>
            <div className="filter-pill">
              {filterLabels[filter]}
            </div>
            {isFilteredView && (
              <button className="clear-filters" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
          <div className="toolbar-right">
            <label htmlFor="sortProducts">Sort by</label>
            <select
              id="sortProducts"
              className="sort-select"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
            >
              <option value="recent">Recently updated</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="inventory">Inventory</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            <span>All</span>
            <span className="tab-count">{productStats.total}</span>
          </button>
          <button
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            <span>Active</span>
            <span className="tab-count">{productStats.active}</span>
          </button>
          <button
            className={filter === 'draft' ? 'active' : ''}
            onClick={() => setFilter('draft')}
          >
            <span>Draft</span>
            <span className="tab-count">{productStats.draft}</span>
          </button>
          <button
            className={filter === 'archived' ? 'active' : ''}
            onClick={() => setFilter('archived')}
          >
            <span>Archived</span>
            <span className="tab-count">{productStats.archived}</span>
          </button>
        </div>

        {/* Filter Tabs */}
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : !hasProducts ? (
          <div className="empty-state">
            <h2>No products yet</h2>
            <p>Add your first product to start selling!</p>
            <button
              className="create-product-button"
              onClick={() => navigate(`/stores/${storeId}/products/create`)}
            >
              Add Your First Product
            </button>
          </div>
        ) : noResultsAfterFiltering ? (
          <div className="empty-state search-empty">
            <h2>No products match your filters</h2>
            <p>Try adjusting the search text or switching the status filter.</p>
            <button className="ghost-button" onClick={clearFilters}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {displayedProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="product-image" />
                  ) : (
                    <div className="product-image-placeholder">
                      <span>No Image</span>
                    </div>
                  )}
                  {product.featured && (
                    <span className="featured-badge">Featured</span>
                  )}
                </div>
                <div className="product-body">
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
                  <div className="product-meta">
                    <span className={`status-badge ${getStatusBadgeClass(product.status)}`}>
                      {product.status}
                    </span>
                    {product.track_inventory && (
                      <span className={`inventory ${
                        product.inventory_quantity === 0 
                          ? 'stock-out' 
                          : product.inventory_quantity <= (product.low_stock_threshold || 5)
                            ? 'stock-low' 
                            : ''
                      }`}>
                        Stock: {product.inventory_quantity}
                        {product.inventory_quantity <= (product.low_stock_threshold || 5) && (
                          <span className="low-stock-indicator"></span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div className="product-actions">
                  <button
                    className="view-button"
                    onClick={() => navigate(`/stores/${storeId}/products/${product.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="edit-button"
                    onClick={() => navigate(`/stores/${storeId}/products/${product.id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(product.id, product.name)}
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

export default Products;

