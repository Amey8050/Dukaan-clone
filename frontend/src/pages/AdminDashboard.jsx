import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import storeService from '../services/storeService';
import analyticsService from '../services/analyticsService';
import inventoryService from '../services/inventoryService';
import productService from '../services/productService';
import orderService from '../services/orderService';
import homepageService from '../services/homepageService';
import settingsService from '../services/settingsService';
import aiService from '../services/aiService';
import LazyImage from '../components/LazyImage';
import LoadingSpinner from '../components/LoadingSpinner';
import GoogleMap from '../components/GoogleMap';
import { formatCurrency } from '../utils/currency';

// Lazy load heavy components for faster initial load
const AnalyticsCharts = lazy(() => import('../components/AnalyticsCharts'));
const Reports = lazy(() => import('../components/Reports'));
const StoreInsights = lazy(() => import('../components/StoreInsights'));
import './AdminDashboard.css';
import '../pages/Product.css';
import '../pages/Orders.css';
import '../pages/Inventory.css';
import '../pages/StoreHomepage.css';

const AdminDashboard = () => {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [salesSummary, setSalesSummary] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [homepageData, setHomepageData] = useState(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsCategory, setSettingsCategory] = useState('general');
  const [storeSettings, setStoreSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  // Sidebar open on desktop by default, closed on tablets/mobiles for better responsiveness
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });
  const [settingsSidebarOpen, setSettingsSidebarOpen] = useState(false);
  const [newStaffMember, setNewStaffMember] = useState({
    name: '',
    email: '',
    role: 'Manager',
    permissions: ['orders', 'products']
  });
  const [staffFormMessage, setStaffFormMessage] = useState('');
  const [staffFormError, setStaffFormError] = useState('');

  const normalizeStaffList = (staffData) => {
    if (!staffData) return [];
    if (Array.isArray(staffData)) return staffData;
    if (typeof staffData === 'object') return Object.values(staffData);
    return [];
  };
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const staffList = normalizeStaffList(storeSettings.staff);

  const staffRoles = ['Admin', 'Manager', 'Support', 'Viewer'];
  const staffPermissionOptions = [
    { id: 'orders', label: 'Orders' },
    { id: 'products', label: 'Products' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'marketing', label: 'Marketing' }
  ];

  // Restore active tab from location state if coming back from another page
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
      // Clear the state to prevent restoring on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (storeId) {
      loadDashboardData();
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId && activeTab === 'products') {
      loadProducts();
    }
  }, [storeId, activeTab, productFilter]);

  useEffect(() => {
    if (storeId && activeTab === 'orders') {
      loadOrders();
    }
  }, [storeId, activeTab, orderStatusFilter]);

  useEffect(() => {
    if (storeId && activeTab === 'view-store') {
      loadHomepageData();
    }
  }, [storeId, activeTab]);

  useEffect(() => {
    if (storeId && activeTab === 'settings') {
      loadSettings();
    }
  }, [storeId, activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load store info first (needed for header)
      const storeResult = await storeService.getStore(storeId);
      if (storeResult.success) {
        setStore(storeResult.data.store);
      }

      // Load all other data in parallel for faster loading
      const [salesResult, trafficResult, inventoryResult, lowStockResult] = await Promise.allSettled([
        analyticsService.getSalesSummary(storeId, 30),
        analyticsService.getTrafficAnalytics(storeId, { period: 30 }),
        inventoryService.getInventorySummary(storeId),
        inventoryService.getLowStockProducts(storeId)
      ]);

      // Process results
      if (salesResult.status === 'fulfilled' && salesResult.value.success) {
        setSalesSummary(salesResult.value.data.summary);
      }

      if (trafficResult.status === 'fulfilled' && trafficResult.value.success) {
        setTrafficData(trafficResult.value.data.analytics);
      }

      if (inventoryResult.status === 'fulfilled' && inventoryResult.value.success) {
        setInventorySummary(inventoryResult.value.data);
      }

      if (lowStockResult.status === 'fulfilled' && lowStockResult.value.success) {
        setLowStockProducts(lowStockResult.value.data.products || []);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError('');
      const params = {};
      if (productFilter !== 'all') {
        params.status = productFilter;
      }
      const result = await productService.getProductsByStore(storeId, params);
      if (result.success) {
        setProducts(result.data.products);
      } else {
        setProductsError('Failed to load products');
      }
    } catch (err) {
      setProductsError(err.response?.data?.error?.message || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError('');
      const result = await orderService.getStoreOrders(storeId);
      if (result.success) {
        let filteredOrders = result.data.orders || [];
        if (orderStatusFilter !== 'all') {
          filteredOrders = filteredOrders.filter(order => order.status === orderStatusFilter);
        }
        setOrders(filteredOrders);
      } else {
        setOrdersError('Failed to load orders');
      }
    } catch (err) {
      setOrdersError(err.response?.data?.error?.message || 'Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadHomepageData = async () => {
    try {
      const result = await homepageService.getHomepageData(storeId);
      if (result.success) {
        setHomepageData(result.data);
      }
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    }
  };

  const handleProductDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const result = await productService.deleteProduct(productId);
      if (result.success) {
        alert(result.message || 'Product deleted successfully');
        loadProducts();
        loadDashboardData(); // Refresh summary
      } else {
        const errorMsg = result.error?.details || result.error?.message || 'Failed to delete product';
        alert(errorMsg);
      }
    } catch (err) {
      const errorData = err.response?.data?.error;
      let errorMessage = 'Failed to delete product';
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

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const result = await orderService.updateOrderStatus(orderId, newStatus, null);
      if (result.success) {
        loadOrders();
        loadDashboardData(); // Refresh summary
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update order status');
    }
  };

  const handleStaffPermissionToggle = (permission) => {
    setNewStaffMember((prev) => {
      const hasPermission = prev.permissions.includes(permission);
      return {
        ...prev,
        permissions: hasPermission
          ? prev.permissions.filter((perm) => perm !== permission)
          : [...prev.permissions, permission]
      };
    });
  };

  const handleAddStaffMember = () => {
    setStaffFormMessage('');
    setStaffFormError('');

    if (!newStaffMember.name.trim() || !newStaffMember.email.trim()) {
      setStaffFormError('Please provide both name and email for the staff member.');
      return;
    }

    const currentStaff = normalizeStaffList(storeSettings.staff);
    const emailExists = currentStaff.some(
      (member) => member.email.toLowerCase() === newStaffMember.email.trim().toLowerCase()
    );
    if (emailExists) {
      setStaffFormError('A staff member with this email already exists.');
      return;
    }

    const staffEntry = {
      id: Date.now(),
      name: newStaffMember.name.trim(),
      email: newStaffMember.email.trim().toLowerCase(),
      role: newStaffMember.role,
      permissions: [...newStaffMember.permissions]
    };

    setStoreSettings((prev) => {
      const normalized = normalizeStaffList(prev.staff);
      return {
        ...prev,
        staff: [...normalized, staffEntry]
      };
    });

    setNewStaffMember({
      name: '',
      email: '',
      role: 'Manager',
      permissions: ['orders', 'products']
    });
    setStaffFormMessage('Staff member added. Click "Save Staff Access" to confirm.');
  };

  const handleRemoveStaffMember = (id) => {
    setStoreSettings((prev) => {
      const normalized = normalizeStaffList(prev.staff);
      return {
        ...prev,
        staff: normalized.filter((member) => member.id !== id)
      };
    });
    setStaffFormMessage('Staff member removed. Click "Save Staff Access" to confirm.');
    setStaffFormError('');
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const result = await settingsService.getSettings(storeId);
      if (result.success) {
        const fetchedSettings = result.data.settings || {};
        setStoreSettings({
          ...fetchedSettings,
          staff: normalizeStaffList(fetchedSettings.staff)
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async (category, settingsData) => {
    try {
      setSavingSettings(true);
      const result = await settingsService.updateSettings(storeId, category, settingsData);
      if (result.success) {
        const updatedSettings = result.data.settings || {};
        setStoreSettings({
          ...updatedSettings,
          staff: normalizeStaffList(updatedSettings.staff)
        });
        alert('Settings saved successfully!');
      } else {
        alert(result.error?.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert(err.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleGenerateSEO = async () => {
    if (!store) {
      alert('Store information not loaded');
      return;
    }

    try {
      setGeneratingSEO(true);
      const result = await aiService.generateSEO({
        store_name: store.name,
        store_description: store.description || '',
        category: store.industry || ''
      });

      if (result.success && result.data) {
        const seoData = result.data;
        // Update storeSettings with generated SEO
        setStoreSettings({
          ...storeSettings,
          seo: {
            ...storeSettings.seo,
            meta_title: seoData.meta_title || '',
            meta_description: seoData.meta_description || '',
            meta_keywords: seoData.meta_keywords || (Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : '')
          }
        });
        alert('SEO generated successfully! Review and save when ready.');
      } else {
        alert(result.error?.message || 'Failed to generate SEO');
      }
    } catch (err) {
      console.error('Failed to generate SEO:', err);
      alert(err.response?.data?.error?.message || 'Failed to generate SEO');
    } finally {
      setGeneratingSEO(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'blue', onClick }) => (
    <div className={`stat-card stat-card-${color}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="admin-dashboard-container">
        <div className="error-message">{error || 'Store not found'}</div>
      </div>
    );
  }

  const handleSidebarNavClick = (tab) => {
    setActiveTab(tab);
    // On small screens (mobile/tablet), close the sidebar after selecting a tab
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        setSidebarOpen(false);
      }, 100); // Small delay to ensure tab change is visible
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <center>

          <h1>{store.name}</h1>
          </center>
          {/* <p className="store-slug">/{store.slug}</p> */}
        </div>

        <nav className="sidebar-nav">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => handleSidebarNavClick('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => handleSidebarNavClick('products')}
          >
            Products
          </button>
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => handleSidebarNavClick('orders')}
          >
            Orders
          </button>
          <button
            className={activeTab === 'inventory' ? 'active' : ''}
            onClick={() => handleSidebarNavClick('inventory')}
          >
            Inventory
          </button>
          <button
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => handleSidebarNavClick('analytics')}
          >
            Analytics
          </button>
          <button
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => handleSidebarNavClick('reports')}
          >
            Reports
          </button>
          <button
            className={activeTab === 'insights' ? 'active' : ''}
            onClick={() => handleSidebarNavClick('insights')}
          >
            Insights
          </button>
          <button
            className="view-store-external"
            onClick={() => {
              // Open store products page in a new tab
              const storeUrl = `${window.location.origin}/stores/${storeId}/products`;
              window.open(storeUrl, '_blank', 'noopener,noreferrer');
            }}
            title="Open store products in new tab"
          >
            View Store
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '8px', display: 'inline-block' }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => handleSidebarNavClick('settings')}
          >
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span>{user?.full_name || user?.email}</span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="dashboard-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          <h1>
            {activeTab === 'overview' && 'Overview'}
            {activeTab === 'products' && 'Products'}
            {activeTab === 'orders' && 'Orders'}
            {activeTab === 'inventory' && 'Inventory'}
            {activeTab === 'analytics' && 'Analytics'}
            {activeTab === 'reports' && 'Reports'}
            {activeTab === 'insights' && 'Insights'}
            {activeTab === 'view-store' && 'View Store'}
            {activeTab === 'settings' && (
              settingsCategory === 'general' ? 'General Settings' :
                settingsCategory === 'branding' ? 'Branding Settings' :
                  settingsCategory === 'details' ? 'Store Details' :
                    settingsCategory === 'domains' ? 'Domains' :
                      settingsCategory === 'staff' ? 'Staff Accounts' :
                        settingsCategory === 'notifications' ? 'Notifications' :
                          settingsCategory === 'payments' ? 'Payments' :
                            settingsCategory === 'checkout' ? 'Checkout' :
                              settingsCategory === 'warehouse' ? 'Warehouse' :
                                settingsCategory === 'delivery' ? 'Delivery' :
                                  settingsCategory === 'returns' ? 'Returns' :
                                    settingsCategory === 'tax' ? 'Tax' :
                                      settingsCategory === 'extra-charges' ? 'Extra Charges' :
                                        settingsCategory === 'seo' ? 'SEO' :
                                          settingsCategory === 'languages' ? 'Languages' :
                                            settingsCategory === 'support' ? 'Support & Social' :
                                              settingsCategory === 'policies' ? 'Policies' :
                                                settingsCategory === 'timings' ? 'Store Timings' :
                                                  'Settings'
            )}
          </h1>
        </header>

        {activeTab === 'overview' && (
          <div className="dashboard-content overview-content">
            {/* Stats Grid */}
            <div className="stats-grid">
              <StatCard
                title="Total Revenue"
                value={salesSummary ? formatCurrency(salesSummary.total_revenue) : formatCurrency(0)}
                subtitle={salesSummary ? `Last 30 days` : 'No data'}
                color="green"
                onClick={() => setActiveTab('analytics')}
              />
              <StatCard
                title="Total Orders"
                value={salesSummary ? salesSummary.total_orders : 0}
                subtitle={salesSummary ? `${salesSummary.delivered_orders} delivered` : 'No data'}
                color="blue"
                onClick={() => setActiveTab('orders')}
              />
              <StatCard
                title="Average Order Value"
                value={salesSummary ? formatCurrency(salesSummary.average_order_value) : formatCurrency(0)}
                subtitle={salesSummary ? `Per order` : 'No data'}
                color="purple"
              />
              <StatCard
                title="Conversion Rate"
                value={salesSummary ? `${salesSummary.conversion_rate.toFixed(1)}%` : '0%'}
                subtitle={salesSummary ? `Orders to views` : 'No data'}
                color="orange"
              />
            </div>

            {/* Traffic Stats */}
            {trafficData && (
              <div className="stats-grid">
                <StatCard
                  title="Total Views"
                  value={trafficData.overview.total_views}
                  subtitle={`${trafficData.overview.unique_visitors} unique visitors`}
                  color="blue"
                />
                <StatCard
                  title="Unique Sessions"
                  value={trafficData.overview.unique_sessions}
                  subtitle={`${trafficData.overview.average_views_per_session.toFixed(1)} avg views/session`}
                  color="purple"
                />
                <StatCard
                  title="Cart Conversion"
                  value={`${trafficData.conversion_rates.cart_conversion.toFixed(1)}%`}
                  subtitle="Views to cart"
                  color="green"
                />
                <StatCard
                  title="Purchase Conversion"
                  value={`${trafficData.conversion_rates.purchase_conversion.toFixed(1)}%`}
                  subtitle="Cart to purchase"
                  color="orange"
                />
              </div>
            )}

            {/* Inventory Alerts */}
            {inventorySummary && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Inventory Status</h2>
                  <button
                    className="view-all-button"
                    onClick={() => setActiveTab('inventory')}
                  >
                    View All →
                  </button>
                </div>
                <div className="stats-grid">
                  <StatCard
                    title="Total Products"
                    value={inventorySummary.total_products}
                    subtitle={`${inventorySummary.tracking_inventory} tracking inventory`}
                    color="blue"
                  />
                  <StatCard
                    title="Total Quantity"
                    value={inventorySummary.total_quantity}
                    subtitle="In stock"
                    color="green"
                  />
                  <StatCard
                    title="Low Stock Items"
                    value={inventorySummary.low_stock_count}
                    subtitle="Need attention"
                    color="orange"
                    onClick={() => setActiveTab('inventory')}
                  />
                  <StatCard
                    title="Out of Stock"
                    value={inventorySummary.out_of_stock_count}
                    subtitle="Restock needed"
                    color="red"
                    onClick={() => setActiveTab('inventory')}
                  />
                </div>
              </div>
            )}

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Low Stock Alerts</h2>
                  <button
                    className="view-all-button"
                    onClick={() => setActiveTab('inventory')}
                  >
                    View All →
                  </button>
                </div>
                <div className="alerts-list">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="alert-item">
                      <div className="alert-product">
                        {product.images && product.images.length > 0 && (
                          <img src={product.images[0]} alt={product.name} />
                        )}
                        <div>
                          <h4>{product.name}</h4>
                          {product.sku && <p className="sku">SKU: {product.sku}</p>}
                        </div>
                      </div>
                      <div className="alert-stock">
                        <span className={`stock-badge ${product.inventory_quantity === 0 ? 'out' : 'low'}`}>
                          {product.inventory_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                        <span className="stock-quantity">
                          {product.inventory_quantity} / {product.low_stock_threshold}
                        </span>
                      </div>
                      <button
                        className="action-button"
                        onClick={() => navigate(`/stores/${storeId}/products/${product.id}/edit`)}
                      >
                        Manage
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="dashboard-section">
              <h2>Quick Actions</h2>
              <div className="quick-actions">
                <button
                  className="action-card"
                  onClick={() => navigate(`/stores/${storeId}/products/create`, { state: { from: 'dashboard', tab: 'products' } })}
                >
                  <span>Add Product</span>
                </button>
                <button
                  className="action-card"
                  onClick={() => setActiveTab('orders')}
                >
                  <span>View Orders</span>
                </button>
                <button
                  className="action-card"
                  onClick={() => setActiveTab('inventory')}
                >
                  <span>Manage Inventory</span>
                </button>
                <button
                  className="action-card"
                  onClick={() => setActiveTab('view-store')}
                >
                  <span>View Store</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="dashboard-content analytics-content">
            <Suspense fallback={<LoadingSpinner />}>
              <AnalyticsCharts storeId={storeId} />
            </Suspense>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="dashboard-content reports-content">
            <Suspense fallback={<LoadingSpinner />}>
              <Reports storeId={storeId} />
            </Suspense>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="dashboard-content insights-content">
            <Suspense fallback={<LoadingSpinner />}>
              <StoreInsights storeId={storeId} />
            </Suspense>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="dashboard-content">
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Products</h2>
                <div className="section-header-actions">
                  <button
                    className="primary-button"
                    onClick={() => navigate(`/stores/${storeId}/products/create`, { state: { from: 'dashboard', tab: 'products' } })}
                  >
                    + Add Product
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => navigate(`/stores/${storeId}/products/bulk-upload`, { state: { from: 'dashboard', tab: 'products' } })}
                  >
                    Upload Bulk Product
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="filter-tabs">
                <button
                  className={productFilter === 'all' ? 'active' : ''}
                  onClick={() => setProductFilter('all')}
                >
                  All
                </button>
                <button
                  className={productFilter === 'active' ? 'active' : ''}
                  onClick={() => setProductFilter('active')}
                >
                  Active
                </button>
                <button
                  className={productFilter === 'draft' ? 'active' : ''}
                  onClick={() => setProductFilter('draft')}
                >
                  Draft
                </button>
                <button
                  className={productFilter === 'archived' ? 'active' : ''}
                  onClick={() => setProductFilter('archived')}
                >
                  Archived
                </button>
              </div>

              {productsLoading ? (
                <div className="loading">Loading products...</div>
              ) : productsError ? (
                <div className="error-message">{productsError}</div>
              ) : products.length === 0 ? (
                <div className="empty-state">
                  <h2>No products yet</h2>
                  <p>Add your first product to start selling!</p>
                  <button
                    className="primary-button"
                    onClick={() => navigate(`/stores/${storeId}/products/create`, { state: { from: 'dashboard', tab: 'products' } })}
                  >
                    Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="products-grid">
                  {products.map((product) => (
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
                          <span className={`status-badge ${product.status === 'active' ? 'status-active' :
                            product.status === 'draft' ? 'status-draft' :
                              'status-archived'
                            }`}>
                            {product.status}
                          </span>
                          {product.track_inventory && (
                            <span className={`inventory ${product.inventory_quantity === 0
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
                          View
                        </button>
                        <button
                          className="edit-button"
                          onClick={() => navigate(`/stores/${storeId}/products/${product.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleProductDelete(product.id, product.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="dashboard-content">
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Orders</h2>
              </div>

              {/* Filter Tabs */}
              <div className="filter-tabs">
                <button
                  className={orderStatusFilter === 'all' ? 'active' : ''}
                  onClick={() => setOrderStatusFilter('all')}
                >
                  All
                </button>
                <button
                  className={orderStatusFilter === 'pending' ? 'active' : ''}
                  onClick={() => setOrderStatusFilter('pending')}
                >
                  Pending
                </button>
                <button
                  className={orderStatusFilter === 'processing' ? 'active' : ''}
                  onClick={() => setOrderStatusFilter('processing')}
                >
                  Processing
                </button>
                <button
                  className={orderStatusFilter === 'shipped' ? 'active' : ''}
                  onClick={() => setOrderStatusFilter('shipped')}
                >
                  Shipped
                </button>
                <button
                  className={orderStatusFilter === 'delivered' ? 'active' : ''}
                  onClick={() => setOrderStatusFilter('delivered')}
                >
                  Delivered
                </button>
              </div>

              {ordersLoading ? (
                <div className="loading">Loading orders...</div>
              ) : ordersError ? (
                <div className="error-message">{ordersError}</div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <h2>No orders yet</h2>
                  <p>Orders will appear here when customers make purchases.</p>
                </div>
              ) : (
                <div className="orders-table-container">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="order-number">
                            <a
                              href={`#`}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/stores/${storeId}/orders/${order.id}`);
                              }}
                            >
                              {order.order_number}
                            </a>
                          </td>
                          <td>
                            {order.user ? (
                              <div>
                                <div>{order.user.full_name || order.user.email}</div>
                                {order.user.email && (
                                  <small>{order.user.email}</small>
                                )}
                              </div>
                            ) : (
                              <span className="guest-badge">Guest</span>
                            )}
                          </td>
                          <td>
                            {new Date(order.created_at).toLocaleDateString()}
                            <br />
                            <small>{new Date(order.created_at).toLocaleTimeString()}</small>
                          </td>
                          <td>
                            {order.order_items?.length || 0} item(s)
                          </td>
                          <td className="total-amount">
                            {formatCurrency(order.total)}
                          </td>
                          <td>
                            <select
                              className={`status-select ${order.status === 'pending' ? 'status-pending' :
                                order.status === 'processing' ? 'status-processing' :
                                  order.status === 'shipped' ? 'status-shipped' :
                                    order.status === 'delivered' ? 'status-delivered' :
                                      'status-cancelled'
                                }`}
                              value={order.status}
                              onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <span className={`payment-badge ${order.payment_status === 'paid' ? 'payment-paid' :
                              order.payment_status === 'pending' ? 'payment-pending' :
                                order.payment_status === 'failed' ? 'payment-failed' :
                                  'payment-refunded'
                              }`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="view-button"
                              onClick={() => navigate(`/stores/${storeId}/orders/${order.id}`)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="dashboard-content inventory-content">
            {/* Summary Cards */}
            {inventorySummary && (
              <div className="inventory-summary">
                <div className="summary-card">
                  <div className="summary-info">
                    <h3>{inventorySummary.total_products}</h3>
                    <p>Total Products</p>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-info">
                    <h3>{inventorySummary.tracking_inventory}</h3>
                    <p>Tracking Inventory</p>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-info">
                    <h3>{inventorySummary.total_quantity?.toLocaleString() || 0}</h3>
                    <p>Total Quantity</p>
                  </div>
                </div>
                <div className={`summary-card ${inventorySummary.low_stock_count > 0 ? 'alert' : ''}`}>
                  <div className="summary-info">
                    <h3>{inventorySummary.low_stock_count}</h3>
                    <p>Low Stock Items</p>
                  </div>
                </div>
                <div className={`summary-card ${inventorySummary.out_of_stock_count > 0 ? 'alert' : ''}`}>
                  <div className="summary-info">
                    <h3>{inventorySummary.out_of_stock_count}</h3>
                    <p>Out of Stock</p>
                  </div>
                </div>
              </div>
            )}

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <div className="low-stock-section">
                <div className="section-header">
                  <h2>Low Stock Alerts</h2>
                  <span className="alert-count">{lowStockProducts.length} items need attention</span>
                </div>
                <div className="low-stock-grid">
                  {lowStockProducts.map((product) => {
                    const stockStatus = product.inventory_quantity === 0
                      ? { status: 'out', class: 'stock-out', label: 'Out of Stock' }
                      : product.inventory_quantity <= (product.low_stock_threshold || 5)
                        ? { status: 'low', class: 'stock-low', label: 'Low Stock' }
                        : { status: 'ok', class: 'stock-ok', label: 'In Stock' };
                    return (
                      <div key={product.id} className={`low-stock-card ${stockStatus.class}`}>
                        <div className="product-image-container">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} />
                          ) : (
                            <div className="image-placeholder">No Image</div>
                          )}
                        </div>
                        <div className="product-info">
                          <h3>{product.name}</h3>
                          {product.sku && <p className="sku">SKU: {product.sku}</p>}
                          <div className="stock-info">
                            <span className={`stock-badge ${stockStatus.class}`}>
                              {stockStatus.label}
                            </span>
                            <span className="stock-quantity">
                              {product.inventory_quantity} / Threshold: {product.low_stock_threshold}
                            </span>
                          </div>
                        </div>
                        <div className="product-actions">
                          <button
                            className="adjust-button"
                            onClick={() => navigate(`/stores/${storeId}/products/${product.id}/edit`)}
                          >
                            Adjust Stock
                          </button>
                          <button
                            className="view-button"
                            onClick={() => navigate(`/stores/${storeId}/products/${product.id}/edit`)}
                          >
                            Edit Product
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {lowStockProducts.length === 0 && inventorySummary && inventorySummary.low_stock_count === 0 && (
              <div className="empty-state">
                <h2>All Good!</h2>
                <p>No low stock items. Your inventory is well-stocked.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'view-store' && homepageData && (
          <div className="dashboard-content">
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Store Preview</h2>
                <button
                  className="primary-button"
                  onClick={() => navigate(`/stores/${storeId}`)}
                >
                  Open in New Tab
                </button>
              </div>

              <div className="store-preview">
                {/* Store Header */}
                <header className="store-header">
                  {homepageData.store.banner_url && (
                    <div className="store-banner">
                      <LazyImage src={homepageData.store.banner_url} alt={homepageData.store.name} loading="lazy" />
                    </div>
                  )}
                  <div className="store-header-content">
                    {homepageData.store.logo_url && (
                      <LazyImage src={homepageData.store.logo_url} alt={homepageData.store.name} className="store-logo" loading="lazy" />
                    )}
                    <div className="store-info">
                      <h1>{homepageData.store.name}</h1>
                      {homepageData.store.description && (
                        <p className="store-description">{homepageData.store.description}</p>
                      )}
                    </div>
                  </div>
                </header>

                {/* Products Preview */}
                {homepageData.sections.featured && homepageData.sections.featured.length > 0 && (
                  <section className="homepage-section">
                    <h2>Featured Products</h2>
                    <div className="products-grid">
                      {homepageData.sections.featured.slice(0, 6).map((product) => (
                        <div key={product.id} className="product-card">
                          <div className="product-image-container">
                            {product.images && product.images.length > 0 ? (
                              <LazyImage src={product.images[0]} alt={product.name} loading="lazy" />
                            ) : (
                              <div className="product-image-placeholder">No Image</div>
                            )}
                            {product.featured && (
                              <span className="featured-badge">Featured</span>
                            )}
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="dashboard-content settings-content">
            {/* Settings Layout with Sidebar */}
            <div className="settings-layout">
              {/* Settings Sidebar Overlay for Mobile */}
              <div 
                className={`settings-sidebar-overlay ${settingsSidebarOpen ? 'active' : ''}`}
                onClick={() => setSettingsSidebarOpen(false)}
              ></div>
              
              {/* Settings Sidebar Toggle Button (Mobile Only) */}
              <button 
                className={`settings-sidebar-toggle ${settingsSidebarOpen ? 'open' : ''}`}
                onClick={() => setSettingsSidebarOpen(!settingsSidebarOpen)}
              >
                {settingsSidebarOpen ? 'Close Settings Menu' : 'Open Settings Menu'}
              </button>

              {/* Settings Sidebar */}
              <aside className={`settings-sidebar ${settingsSidebarOpen ? 'mobile-open' : ''}`}>
                <nav className="settings-nav">
                  <button
                    className={settingsCategory === 'general' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('general');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    General
                  </button>
                  <button
                    className={settingsCategory === 'branding' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('branding');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Branding
                  </button>

                  <button
                    className={settingsCategory === 'details' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('details');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Store Details
                  </button>

                  <button
                    className={settingsCategory === 'domains' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('domains');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Domains
                  </button>

                  <button
                    className={settingsCategory === 'staff' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('staff');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Staff Accounts
                  </button>

                  <button
                    className={settingsCategory === 'notifications' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('notifications');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Notifications
                  </button>

                  <button
                    className={settingsCategory === 'payments' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('payments');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Payments
                  </button>

                  <button
                    className={settingsCategory === 'checkout' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('checkout');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Checkout
                  </button>

                  <button
                    className={settingsCategory === 'warehouse' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('warehouse');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Warehouse
                  </button>

                  <button
                    className={settingsCategory === 'delivery' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('delivery');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Delivery
                  </button>

                  <button
                    className={settingsCategory === 'returns' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('returns');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Returns
                  </button>

                  <button
                    className={settingsCategory === 'tax' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('tax');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Tax
                  </button>

                  <button
                    className={settingsCategory === 'extra-charges' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('extra-charges');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Extra Charges
                  </button>

                  <button
                    className={settingsCategory === 'seo' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('seo');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    SEO
                  </button>

                  <button
                    className={settingsCategory === 'languages' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('languages');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Languages
                  </button>

                  <button
                    className={settingsCategory === 'support' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('support');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Support & Social
                  </button>

                  <button
                    className={settingsCategory === 'policies' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('policies');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Policies
                  </button>

                  <button
                    className={settingsCategory === 'timings' ? 'active' : ''}
                    onClick={() => {
                      setSettingsCategory('timings');
                      setSettingsSidebarOpen(false);
                    }}
                  >
                    Store Timings
                  </button>



                </nav>
              </aside>

              {/* Settings Main Content */}
              <main className="settings-main">
                {settingsCategory === 'general' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Store Name</label>
                          <input
                            type="text"
                            value={store?.name || ''}
                            disabled
                            className="disabled-input"
                            placeholder="Store Name"
                          />
                          <p className="form-hint">Store name cannot be changed</p>
                        </div>
                        <div className="form-group">
                          <label>Store Slug</label>
                          <div className="slug-input">
                            <span className="slug-prefix">/</span>
                            <input
                              type="text"
                              value={store?.slug || ''}
                              disabled
                              className="disabled-input"
                              placeholder="store-slug"
                            />
                          </div>
                          <p className="form-hint">Store URL slug cannot be changed</p>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Store Description</label>
                        <textarea
                          value={store?.description || ''}
                          disabled
                          className="disabled-input"
                          rows="4"
                          placeholder="Describe your store..."
                        />
                        <p className="form-hint">Description cannot be changed here</p>
                      </div>
                    </div>
                  </div>
                )}

                {settingsCategory === 'branding' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Store Logo</label>
                          {store?.logo_url ? (
                            <div className="image-preview">
                              <img src={store.logo_url} alt="Store Logo" />
                            </div>
                          ) : (
                            <div className="image-placeholder">No logo uploaded</div>
                          )}
                          <p className="form-hint">Upload logo from store creation page</p>
                        </div>
                        <div className="form-group">
                          <label>Store Banner</label>
                          {store?.banner_url ? (
                            <div className="image-preview banner-preview">
                              <img src={store.banner_url} alt="Store Banner" />
                            </div>
                          ) : (
                            <div className="image-placeholder banner-placeholder">No banner uploaded</div>
                          )}
                          <p className="form-hint">Upload banner from store creation page</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsCategory === 'details' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Store ID:</span>
                          <span className="info-value">{store?.id || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Created:</span>
                          <span className="info-value">
                            {store?.created_at ? new Date(store.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Last Updated:</span>
                          <span className="info-value">
                            {store?.updated_at ? new Date(store.updated_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="settings-divider"></div>

                      <h3>Store Location</h3>
                      <p className="settings-description">Add your store's location map by embedding a Google Maps code</p>

                      <div className="form-group">
                        <label>Embed Map Code</label>
                        <textarea
                          rows="8"
                          placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'
                          className="form-input"
                          defaultValue={storeSettings.location?.embed_map_code || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              location: { ...storeSettings.location, embed_map_code: e.target.value }
                            });
                          }}
                        />
                        <small>
                          Paste the embed code from Google Maps. 
                          <br />
                          To get the embed code: Go to Google Maps → Find your location → Click "Share" → Select "Embed a map" → Copy the iframe code
                        </small>
                      </div>

                      {storeSettings.location?.embed_map_code && (
                        <div className="form-group">
                          <label>Map Preview</label>
                          <div 
                            className="map-preview"
                            dangerouslySetInnerHTML={{ __html: storeSettings.location.embed_map_code }}
                          />
                        </div>
                      )}

                      <div className="settings-actions">
                        <button
                          className="primary-button"
                          onClick={() => {
                            console.log('Saving location settings:', storeSettings.location);
                            // Save location directly to settings.location (not under details category)
                            saveSettings('location', storeSettings.location || {});
                          }}
                          disabled={savingSettings}
                        >
                          {savingSettings ? 'Saving...' : 'Save Location'}
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() => navigate(`/stores`)}
                        >
                          Manage Stores
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() => navigate(`/stores/${storeId}`)}
                        >
                          View Public Store
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {settingsCategory === 'domains' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Custom Domain Settings</h3>
                      <div className="form-group">
                        <label>Custom Domain</label>
                        <input type="text" placeholder="example.com" className="form-input" />
                        <p className="form-hint">Connect your custom domain to your store</p>
                      </div>
                      <div className="form-group">
                        <label>SSL Certificate</label>
                        <div className="info-badge">Auto-configured with custom domain</div>
                      </div>
                      <button className="primary-button">Save Domain</button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'staff' && (
                  <div className="settings-section">
                    <div className="settings-form staff-settings">
                      <div className="section-header staff-header">
                        <div>
                          <h3>Staff Accounts</h3>
                          <p className="form-hint">Invite teammates to manage orders, products, analytics, and more.</p>
                        </div>
                        <div className="staff-actions-inline">
                          <span>{staffList.length} members</span>
                          <button
                            className="secondary-button"
                            onClick={() => saveSettings('staff', staffList)}
                            disabled={savingSettings}
                          >
                            {savingSettings ? 'Saving...' : 'Save Staff Access'}
                          </button>
                        </div>
                      </div>

                      {(staffFormError || staffFormMessage) && (
                        <div className={`staff-alert ${staffFormError ? 'error' : 'success'}`}>
                          {staffFormError || staffFormMessage}
                        </div>
                      )}

                      <div className="staff-form-grid">
                        <div className="form-group">
                          <label>Full Name</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Priya Sharma"
                            value={newStaffMember.name}
                            onChange={(e) =>
                              setNewStaffMember((prev) => ({ ...prev, name: e.target.value }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input
                            type="email"
                            className="form-input"
                            placeholder="staff@store.com"
                            value={newStaffMember.email}
                            onChange={(e) =>
                              setNewStaffMember((prev) => ({ ...prev, email: e.target.value }))
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Role</label>
                          <select
                            className="form-input"
                            value={newStaffMember.role}
                            onChange={(e) =>
                              setNewStaffMember((prev) => ({ ...prev, role: e.target.value }))
                            }
                          >
                            {staffRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="staff-permissions">
                        <p>Permissions</p>
                        <div className="permissions-chips">
                          {staffPermissionOptions.map((permission) => {
                            const active = newStaffMember.permissions.includes(permission.id);
                            return (
                              <button
                                key={permission.id}
                                type="button"
                                className={`permission-chip ${active ? 'active' : ''}`}
                                onClick={() => handleStaffPermissionToggle(permission.id)}
                              >
                                {permission.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="staff-form-actions">
                        <button className="primary-button" type="button" onClick={handleAddStaffMember}>
                          + Add Staff Member
                        </button>
                        <p className="form-hint">New members receive an invite email once you save changes.</p>
                      </div>

                      <div className="staff-list">
                        {staffList.length === 0 ? (
                          <div className="empty-state">
                            <p>No staff members added yet</p>
                            <p className="form-hint">Add staff members to help manage your store</p>
                          </div>
                        ) : (
                          staffList.map((member, index) => (
                            <div key={member.id || member.email || member.name || index} className="staff-card">
                              <div className="staff-avatar">
                                {(member.name || member.email || 'U')
                                  .split(' ')
                                  .map((part) => part?.[0]?.toUpperCase())
                                  .filter(Boolean)
                                  .join('')
                                  .slice(0, 2) || 'U'}
                              </div>
                              <div className="staff-details">
                                <h4>{member.name}</h4>
                                <p>{member.email}</p>
                                <span className="staff-role">{member.role}</span>
                                <div className="permissions-tags">
                                  {(member.permissions || []).map((perm) => {
                                    const label = staffPermissionOptions.find((p) => p.id === perm)?.label || perm;
                                    return (
                                      <span key={perm} className="permission-tag">
                                        {label}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="staff-card-actions">
                                <button
                                  className="ghost-button"
                                  type="button"
                                  onClick={() => handleRemoveStaffMember(member.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {staffList.length > 0 && (
                        <div className="staff-save-footer">
                          <button
                            className="primary-button"
                            onClick={() => saveSettings('staff', staffList)}
                            disabled={savingSettings}
                          >
                            {savingSettings ? 'Saving...' : 'Save Staff Access'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {settingsCategory === 'notifications' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Notification Preferences</h3>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.notifications?.email_orders !== false}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                notifications: { ...storeSettings.notifications, email_orders: e.target.checked }
                              });
                            }}
                          />
                          <span>Email notifications for new orders</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.notifications?.low_stock_alerts !== false}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                notifications: { ...storeSettings.notifications, low_stock_alerts: e.target.checked }
                              });
                            }}
                          />
                          <span>Low stock alerts</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.notifications?.marketing_emails === true}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                notifications: { ...storeSettings.notifications, marketing_emails: e.target.checked }
                              });
                            }}
                          />
                          <span>Marketing emails</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.notifications?.payment_notifications !== false}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                notifications: { ...storeSettings.notifications, payment_notifications: e.target.checked }
                              });
                            }}
                          />
                          <span>Payment notifications</span>
                        </label>
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('notifications', storeSettings.notifications || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'payments' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Payment Methods</h3>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.payments?.razorpay !== false}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                payments: { ...storeSettings.payments, razorpay: e.target.checked }
                              });
                            }}
                          />
                          <span>Razorpay</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.payments?.cash_on_delivery === true}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                payments: { ...storeSettings.payments, cash_on_delivery: e.target.checked }
                              });
                            }}
                          />
                          <span>Cash on Delivery</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.payments?.bank_transfer === true}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                payments: { ...storeSettings.payments, bank_transfer: e.target.checked }
                              });
                            }}
                          />
                          <span>Bank Transfer</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label>Razorpay API Key</label>
                        <input
                          type="password"
                          placeholder="Enter Razorpay API Key"
                          className="form-input"
                          defaultValue={storeSettings.payments?.razorpay_api_key || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              payments: { ...storeSettings.payments, razorpay_api_key: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('payments', storeSettings.payments || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Payment Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'checkout' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Checkout Settings</h3>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.checkout?.require_shipping !== false}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                checkout: { ...storeSettings.checkout, require_shipping: e.target.checked }
                              });
                            }}
                          />
                          <span>Require shipping address</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.checkout?.require_billing !== false}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                checkout: { ...storeSettings.checkout, require_billing: e.target.checked }
                              });
                            }}
                          />
                          <span>Require billing address</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.checkout?.allow_guest === true}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                checkout: { ...storeSettings.checkout, allow_guest: e.target.checked }
                              });
                            }}
                          />
                          <span>Allow guest checkout</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label>Checkout Page Title</label>
                        <input
                          type="text"
                          defaultValue={storeSettings.checkout?.page_title || 'Complete Your Order'}
                          className="form-input"
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              checkout: { ...storeSettings.checkout, page_title: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('checkout', storeSettings.checkout || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Checkout Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'warehouse' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Warehouse Settings</h3>
                      <div className="form-group">
                        <label>Warehouse Name</label>
                        <input
                          type="text"
                          placeholder="Main Warehouse"
                          className="form-input"
                          defaultValue={storeSettings.warehouse?.name || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              warehouse: { ...storeSettings.warehouse, name: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Warehouse Address</label>
                        <textarea
                          rows="4"
                          placeholder="Enter warehouse address"
                          className="form-input"
                          defaultValue={storeSettings.warehouse?.address || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              warehouse: { ...storeSettings.warehouse, address: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input
                          type="text"
                          placeholder="Warehouse manager name"
                          className="form-input"
                          defaultValue={storeSettings.warehouse?.contact_person || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              warehouse: { ...storeSettings.warehouse, contact_person: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Contact Phone</label>
                        <input
                          type="tel"
                          placeholder="+1234567890"
                          className="form-input"
                          defaultValue={storeSettings.warehouse?.contact_phone || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              warehouse: { ...storeSettings.warehouse, contact_phone: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('warehouse', storeSettings.warehouse || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Warehouse'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'delivery' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Delivery Settings</h3>
                      <div className="form-group">
                        <label>Default Shipping Method</label>
                        <select
                          className="form-input"
                          defaultValue={storeSettings.delivery?.shipping_method || 'Standard Shipping'}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              delivery: { ...storeSettings.delivery, shipping_method: e.target.value }
                            });
                          }}
                        >
                          <option>Standard Shipping</option>
                          <option>Express Shipping</option>
                          <option>Overnight Shipping</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Default Shipping Cost</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          className="form-input"
                          defaultValue={storeSettings.delivery?.shipping_cost || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              delivery: { ...storeSettings.delivery, shipping_cost: parseFloat(e.target.value) || 0 }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Free Shipping Threshold</label>
                        <input
                          type="number"
                          placeholder="50.00"
                          step="0.01"
                          className="form-input"
                          defaultValue={storeSettings.delivery?.free_shipping_threshold || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              delivery: { ...storeSettings.delivery, free_shipping_threshold: parseFloat(e.target.value) || 0 }
                            });
                          }}
                        />
                        <p className="form-hint">Free shipping for orders above this amount</p>
                      </div>
                      <div className="form-group">
                        <label>Estimated Delivery Days</label>
                        <input
                          type="number"
                          placeholder="5-7"
                          className="form-input"
                          defaultValue={storeSettings.delivery?.estimated_days || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              delivery: { ...storeSettings.delivery, estimated_days: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('delivery', storeSettings.delivery || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Delivery Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'returns' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Return & Refund Policy</h3>
                      <div className="form-group">
                        <label>Return Window (Days)</label>
                        <input
                          type="number"
                          placeholder="30"
                          className="form-input"
                          defaultValue={storeSettings.returns?.return_window || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              returns: { ...storeSettings.returns, return_window: parseInt(e.target.value) || 30 }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.returns?.allow_returns !== false}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                returns: { ...storeSettings.returns, allow_returns: e.target.checked }
                              });
                            }}
                          />
                          <span>Allow returns</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.returns?.allow_refunds !== false}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                returns: { ...storeSettings.returns, allow_refunds: e.target.checked }
                              });
                            }}
                          />
                          <span>Allow refunds</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label>Return Policy Description</label>
                        <textarea
                          rows="6"
                          placeholder="Describe your return and refund policy..."
                          className="form-input"
                          defaultValue={storeSettings.returns?.policy_description || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              returns: { ...storeSettings.returns, policy_description: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('returns', storeSettings.returns || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Return Policy'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'tax' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Tax Settings</h3>
                      <div className="form-group">
                        <label>Tax Rate (%)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          className="form-input"
                          defaultValue={storeSettings.tax?.tax_rate || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              tax: { ...storeSettings.tax, tax_rate: parseFloat(e.target.value) || 0 }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Tax Type</label>
                        <select
                          className="form-input"
                          defaultValue={storeSettings.tax?.tax_type || 'GST'}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              tax: { ...storeSettings.tax, tax_type: e.target.value }
                            });
                          }}
                        >
                          <option>GST</option>
                          <option>VAT</option>
                          <option>Sales Tax</option>
                          <option>None</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Tax ID Number</label>
                        <input
                          type="text"
                          placeholder="Enter tax ID"
                          className="form-input"
                          defaultValue={storeSettings.tax?.tax_id || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              tax: { ...storeSettings.tax, tax_id: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.tax?.include_in_price !== false}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                tax: { ...storeSettings.tax, include_in_price: e.target.checked }
                              });
                            }}
                          />
                          <span>Include tax in product prices</span>
                        </label>
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('tax', storeSettings.tax || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Tax Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'extra-charges' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Extra Charges</h3>
                      <div className="form-group">
                        <label>Service Charge (%)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          className="form-input"
                          defaultValue={storeSettings['extra-charges']?.service_charge || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              'extra-charges': { ...storeSettings['extra-charges'], service_charge: parseFloat(e.target.value) || 0 }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Processing Fee (Fixed)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          className="form-input"
                          defaultValue={storeSettings['extra-charges']?.processing_fee || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              'extra-charges': { ...storeSettings['extra-charges'], processing_fee: parseFloat(e.target.value) || 0 }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings['extra-charges']?.apply_service_charge === true}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                'extra-charges': { ...storeSettings['extra-charges'], apply_service_charge: e.target.checked }
                              });
                            }}
                          />
                          <span>Apply service charge</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings['extra-charges']?.apply_processing_fee === true}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                'extra-charges': { ...storeSettings['extra-charges'], apply_processing_fee: e.target.checked }
                              });
                            }}
                          />
                          <span>Apply processing fee</span>
                        </label>
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('extra-charges', storeSettings['extra-charges'] || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Extra Charges'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'seo' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3>SEO Settings</h3>
                        <button
                          className="secondary-button"
                          onClick={handleGenerateSEO}
                          disabled={generatingSEO || !store}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          {generatingSEO ? (
                            <>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                              </svg>
                              Generate with AI
                            </>
                          )}
                        </button>
                      </div>
                      <div className="form-group">
                        <label>Meta Title</label>
                        <input
                          type="text"
                          placeholder="Store Name - Best Products Online"
                          className="form-input"
                          value={storeSettings.seo?.meta_title || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              seo: { ...storeSettings.seo, meta_title: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Meta Description</label>
                        <textarea
                          rows="3"
                          placeholder="Describe your store for search engines..."
                          className="form-input"
                          value={storeSettings.seo?.meta_description || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              seo: { ...storeSettings.seo, meta_description: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Meta Keywords</label>
                        <input
                          type="text"
                          placeholder="ecommerce, online store, products"
                          className="form-input"
                          value={storeSettings.seo?.meta_keywords || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              seo: { ...storeSettings.seo, meta_keywords: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Google Analytics ID</label>
                        <input
                          type="text"
                          placeholder="UA-XXXXXXXXX-X"
                          className="form-input"
                          defaultValue={storeSettings.seo?.google_analytics_id || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              seo: { ...storeSettings.seo, google_analytics_id: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('seo', storeSettings.seo || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save SEO Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'languages' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Language Settings</h3>
                      <div className="form-group">
                        <label>Default Language</label>
                        <select
                          className="form-input"
                          defaultValue={storeSettings.languages?.default_language || 'English'}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              languages: { ...storeSettings.languages, default_language: e.target.value }
                            });
                          }}
                        >
                          <option>English</option>
                          <option>Hindi</option>
                          <option>Spanish</option>
                          <option>French</option>
                          <option>German</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Supported Languages</label>
                        <div className="checkbox-group">
                          {['English', 'Hindi', 'Spanish', 'French', 'German'].map(lang => (
                            <label key={lang} className="checkbox-label">
                              <input
                                type="checkbox"
                                defaultChecked={storeSettings.languages?.supported_languages?.includes(lang) || lang === 'English'}
                                onChange={(e) => {
                                  const supported = storeSettings.languages?.supported_languages || [];
                                  const updated = e.target.checked
                                    ? [...supported, lang]
                                    : supported.filter(l => l !== lang);
                                  setStoreSettings({
                                    ...storeSettings,
                                    languages: { ...storeSettings.languages, supported_languages: updated }
                                  });
                                }}
                              />
                              <span>{lang}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('languages', storeSettings.languages || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Language Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'support' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Support & Social Media</h3>
                      <div className="form-group">
                        <label>Support Email</label>
                        <input
                          type="email"
                          placeholder="support@example.com"
                          className="form-input"
                          defaultValue={storeSettings.support?.support_email || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              support: { ...storeSettings.support, support_email: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Support Phone</label>
                        <input
                          type="tel"
                          placeholder="+1234567890"
                          className="form-input"
                          defaultValue={storeSettings.support?.support_phone || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              support: { ...storeSettings.support, support_phone: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Facebook URL</label>
                        <input
                          type="url"
                          placeholder="https://facebook.com/yourstore"
                          className="form-input"
                          defaultValue={storeSettings.support?.facebook_url || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              support: { ...storeSettings.support, facebook_url: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Instagram URL</label>
                        <input
                          type="url"
                          placeholder="https://instagram.com/yourstore"
                          className="form-input"
                          defaultValue={storeSettings.support?.instagram_url || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              support: { ...storeSettings.support, instagram_url: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Twitter URL</label>
                        <input
                          type="url"
                          placeholder="https://twitter.com/yourstore"
                          className="form-input"
                          defaultValue={storeSettings.support?.twitter_url || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              support: { ...storeSettings.support, twitter_url: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('support', storeSettings.support || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Social Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'policies' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Store Policies</h3>
                      <div className="form-group">
                        <label>Privacy Policy</label>
                        <textarea
                          rows="8"
                          placeholder="Enter your privacy policy..."
                          className="form-input"
                          defaultValue={storeSettings.policies?.privacy_policy || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              policies: { ...storeSettings.policies, privacy_policy: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Terms of Service</label>
                        <textarea
                          rows="8"
                          placeholder="Enter your terms of service..."
                          className="form-input"
                          defaultValue={storeSettings.policies?.terms_of_service || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              policies: { ...storeSettings.policies, terms_of_service: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Shipping Policy</label>
                        <textarea
                          rows="6"
                          placeholder="Enter your shipping policy..."
                          className="form-input"
                          defaultValue={storeSettings.policies?.shipping_policy || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              policies: { ...storeSettings.policies, shipping_policy: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Refund Policy</label>
                        <textarea
                          rows="6"
                          placeholder="Enter your refund policy..."
                          className="form-input"
                          defaultValue={storeSettings.policies?.refund_policy || ''}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              policies: { ...storeSettings.policies, refund_policy: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('policies', storeSettings.policies || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Policies'}
                      </button>
                    </div>
                  </div>
                )}

                {settingsCategory === 'timings' && (
                  <div className="settings-section">
                    <div className="settings-form">
                      <h3>Store Timings</h3>
                      <div className="form-group">
                        <label>Store Timezone</label>
                        <select
                          className="form-input"
                          defaultValue={storeSettings.timings?.timezone || 'UTC'}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              timings: { ...storeSettings.timings, timezone: e.target.value }
                            });
                          }}
                        >
                          <option>UTC</option>
                          <option>IST (UTC+5:30)</option>
                          <option>EST (UTC-5)</option>
                          <option>PST (UTC-8)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            defaultChecked={storeSettings.timings?.open_24_7 === true}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                timings: { ...storeSettings.timings, open_24_7: e.target.checked }
                              });
                            }}
                          />
                          <span>Store is open 24/7</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label>Opening Time</label>
                        <input
                          type="time"
                          defaultValue={storeSettings.timings?.opening_time || '09:00'}
                          className="form-input"
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              timings: { ...storeSettings.timings, opening_time: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Closing Time</label>
                        <input
                          type="time"
                          defaultValue={storeSettings.timings?.closing_time || '18:00'}
                          className="form-input"
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              timings: { ...storeSettings.timings, closing_time: e.target.value }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Days Open</label>
                        <div className="checkbox-group">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <label key={day} className="checkbox-label">
                              <input
                                type="checkbox"
                                defaultChecked={storeSettings.timings?.days_open?.includes(day) || day !== 'Sunday'}
                                onChange={(e) => {
                                  const daysOpen = storeSettings.timings?.days_open || [];
                                  const updated = e.target.checked
                                    ? [...daysOpen, day]
                                    : daysOpen.filter(d => d !== day);
                                  setStoreSettings({
                                    ...storeSettings,
                                    timings: { ...storeSettings.timings, days_open: updated }
                                  });
                                }}
                              />
                              <span>{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <button
                        className="primary-button"
                        onClick={() => saveSettings('timings', storeSettings.timings || {})}
                        disabled={savingSettings}
                      >
                        {savingSettings ? 'Saving...' : 'Save Store Timings'}
                      </button>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

