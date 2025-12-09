import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import productService from '../services/productService';
import homepageService from '../services/homepageService';
import useStoreBySlug from '../hooks/useStoreBySlug';
import { formatCurrency } from '../utils/currency';
import LazyImage from '../components/LazyImage';
import '../components/BackButton.css';
import './Product.css';

const Products = () => {
  const { storeId: storeSlug } = useParams();
  const [searchParams] = useSearchParams();
  const {
    storeId,
    store: resolvedStore,
    loading: storeLookupLoading,
    error: storeLookupError
  } = useStoreBySlug(storeSlug);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, draft, archived
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'products'
  const [totalProductCount, setTotalProductCount] = useState(0); // Total products in store
  const [categoryProductCount, setCategoryProductCount] = useState(null); // Products in selected category
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Get category from URL query params
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategoryId(categoryParam);
      setViewMode('products');
    } else {
      setSelectedCategoryId(null);
      setViewMode('categories');
    }

    // Get search term from URL query params
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
      setViewMode('products');
    }
  }, [searchParams]);

  useEffect(() => {
    if (storeId) {
      if (selectedCategoryId) {
        loadProducts();
      } else {
        loadCategories();
      }
    }
  }, [storeId, selectedCategoryId]);

  useEffect(() => {
    if (storeId && viewMode === 'categories') {
      loadCategories();
    }
  }, [storeId, viewMode]);

  useEffect(() => {
    if (resolvedStore) {
      setStore(resolvedStore);
    }
  }, [resolvedStore]);

  const loadCategories = async () => {
    if (!storeId) return;
    try {
      setCategoriesLoading(true);
      const result = await homepageService.getHomepageData(storeId);
      if (result.success && result.data?.sections?.categories) {
        setCategories(result.data.sections.categories);
      }
      // Also fetch total product count when loading categories
      const productsResult = await productService.getProductsByStore(storeId, { status: 'all', limit: 1 });
      if (productsResult.success && productsResult.data.totalCount !== undefined) {
        setTotalProductCount(productsResult.data.totalCount);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      // Pass category_id if selected, and status='all' to get all products
      const params = selectedCategoryId ? { category_id: selectedCategoryId, status: 'all' } : { status: 'all' };
      const result = await productService.getProductsByStore(storeId, params);
      if (result.success) {
        setProducts(result.data.products);
        // Update total and category counts from backend response
        if (result.data.totalCount !== undefined) {
          setTotalProductCount(result.data.totalCount);
        }
        if (result.data.categoryCount !== undefined && result.data.categoryCount !== null) {
          setCategoryProductCount(result.data.categoryCount);
        } else {
          setCategoryProductCount(null);
        }
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setViewMode('products');
    navigate(`/stores/${storeSlug}/products?category=${categoryId}`);
  };

  const handleViewAllCategories = () => {
    setSelectedCategoryId(null);
    setViewMode('categories');
    navigate(`/stores/${storeSlug}/products`);
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

  const handleDeleteAll = async () => {
    if (!storeId) {
      alert('Store not loaded');
      return;
    }

    // Double confirmation for safety
    const confirmMessage = `⚠️ WARNING: This will delete ALL ${productStats.total} product(s) in this store!\n\nThis action CANNOT be undone.\n\nAre you absolutely sure?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Second confirmation
    const secondConfirm = window.prompt(
      `Type "DELETE ALL" to confirm deletion of all products:`
    );

    if (secondConfirm !== 'DELETE ALL') {
      alert('Deletion cancelled. You must type "DELETE ALL" exactly to confirm.');
      return;
    }

    try {
      setLoading(true);
      const result = await productService.deleteAllProducts(storeId);
      
      if (result.success) {
        alert(result.message || `Successfully deleted all products!`);
        loadProducts(); // Reload products list
      } else {
        alert(result.error?.message || 'Failed to delete all products');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 
                          err.message || 
                          'Failed to delete all products';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
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
      // Use totalProductCount from backend when available, otherwise fallback to products.length
      total: selectedCategoryId && categoryProductCount !== null 
        ? categoryProductCount 
        : (totalProductCount > 0 ? totalProductCount : products.length),
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
  }, [products, totalProductCount, categoryProductCount, selectedCategoryId]);

  const displayedProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filteredProducts = products.filter((product) => {
      const matchesFilter = filter === 'all' ? true : product.status === filter;
      const matchesSearch =
        !normalizedSearch ||
        product.name?.toLowerCase().includes(normalizedSearch) ||
        product.short_description?.toLowerCase().includes(normalizedSearch) ||
        (product.category && product.category.name?.toLowerCase().includes(normalizedSearch));

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

  // Group products by category
  const productsByCategory = useMemo(() => {
    if (!displayedProducts || displayedProducts.length === 0) return {};
    if (selectedCategoryId || searchTerm.trim().length > 0) {
      // If a category is selected or searching, don't group - show as flat list
      return null;
    }

    const grouped = {};
    displayedProducts.forEach((product) => {
      const categoryId = product.category_id || 'uncategorized';
      
      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          category: product.category || { id: 'uncategorized', name: 'Uncategorized' },
          products: []
        };
      }
      grouped[categoryId].products.push(product);
    });

    return grouped;
  }, [displayedProducts, selectedCategoryId, searchTerm]);

  if (storeLookupLoading || !storeId) {
    return (
      <div className="products-container">
        <div className="loading">Loading store...</div>
      </div>
    );
  }

  if (storeLookupError) {
    return (
      <div className="products-container">
        <div className="error-message">{storeLookupError}</div>
      </div>
    );
  }

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
          </div>
        </div>
        <div className="header-actions">
          {/* Bulk Upload button commented out - available in dashboard instead */}
          {/* <button
            className="create-product-button"
            onClick={() => navigate(`/stores/${storeSlug}/products/bulk-upload`)}
            style={{ marginRight: 'var(--spacing-md)' }}
          >
            📊 Bulk Upload
          </button> */}
          {/* Add Product button commented out */}
          {/* <button
            className="create-product-button"
            onClick={() => navigate(`/stores/${storeSlug}/products/create`)}
          >
            + Add Product
          </button> */}
          {/* Inventory button commented out */}
          {/* <button
            className="inventory-button pill-button"
            onClick={() => navigate(`/stores/${storeSlug}/inventory`)}
          >
            Inventory
          </button> */}
          <button
            className="orders-button pill-button"
            onClick={() => navigate(`/stores/${storeSlug}/orders`)}
          >
            Orders
          </button>
          <button
            className="location-button pill-button"
            onClick={() => navigate(`/stores/${storeSlug}/location`)}
            title="View Store Location"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '6px' }}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Location
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
              {store?.industry && <span>{store.industry}</span>}
              <span>{productStats.total} items</span>
            </div>
            <div className="store-hero-actions">
              <button
                className="ghost-button"
                onClick={() => navigate(`/stores/${storeSlug}/dashboard`)}
              >
                View dashboard
              </button>
              <button
                className="ghost-button"
                onClick={() => navigate(`/stores/${storeSlug}/products/create`)}
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
            {productStats.total > 0 && (
              <button
                className="delete-all-button"
                onClick={handleDeleteAll}
                disabled={loading}
                title="Delete all products in this store"
              >
                🗑️ Delete All Products
              </button>
            )}
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

        {/* Show Categories View */}
        {viewMode === 'categories' && (
          <>
            {selectedCategoryId && (
              <div style={{ marginBottom: '24px' }}>
                <button
                  className="ghost-button"
                  onClick={handleViewAllCategories}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  ← Back to Categories
                </button>
              </div>
            )}
            {categoriesLoading ? (
              <div className="loading">Loading categories...</div>
            ) : categories.length > 0 ? (
              <section className="categories-view-section">
                <h2 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 700 }}>
                  Browse by Category
                </h2>
                <div className="categories-grid-view">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="category-square-card"
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <div className="category-square-image">
                        {category.image_url ? (
                          <LazyImage src={category.image_url} alt={category.name} />
                        ) : (
                          <div className="category-square-placeholder">
                            <span>{category.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="category-square-content">
                        <h3>{category.name}</h3>
                        <p>{category.product_count || 0} {category.product_count === 1 ? 'product' : 'products'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="empty-state">
                <h2>No categories yet</h2>
                <p>Categories will appear here once products are added.</p>
              </div>
            )}
          </>
        )}

        {/* Filter Tabs */}
        {viewMode === 'products' && (
          <>
            {selectedCategoryId && (
              <div style={{ marginBottom: '24px' }}>
                <button
                  className="ghost-button"
                  onClick={handleViewAllCategories}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  ← Back to Categories
                </button>
              </div>
            )}
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
                  onClick={() => navigate(`/stores/${storeSlug}/products/create`)}
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
        ) : selectedCategoryId || !productsByCategory || Object.keys(productsByCategory).length === 0 ? (
          // Show flat grid when a specific category is selected or when searching
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
                  {product.category && (
                    <span className="product-category">{product.category.name}</span>
                  )}
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
                    onClick={() => navigate(`/stores/${storeSlug}/products/${product.id}`)}
                  >
                    View Details
                  </button>
                  <button
                    className="edit-button"
                    onClick={() => navigate(`/stores/${storeSlug}/products/${product.id}/edit`)}
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
        ) : (
          // Show products organized by category sections
          <div className="products-by-category">
            {Object.values(productsByCategory).map((categoryData) => (
              <div key={categoryData.category.id} className="category-section">
                <div className="category-section-header">
                  <h2 className="category-title">{categoryData.category.name}</h2>
                  <span className="category-count">({categoryData.products.length} products)</span>
                </div>
                <div className="products-grid">
                  {categoryData.products.map((product) => (
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
                        {product.category && (
                          <span className="product-category">{product.category.name}</span>
                        )}
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
                          onClick={() => navigate(`/stores/${storeSlug}/products/${product.id}`)}
                        >
                          View Details
                        </button>
                        <button
                          className="edit-button"
                          onClick={() => navigate(`/stores/${storeSlug}/products/${product.id}/edit`)}
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
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
};

export default Products;

