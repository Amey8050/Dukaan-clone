import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import adminService from '../services/adminService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/currency';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Overview data
  const [overview, setOverview] = useState(null);

  // Users data
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPagination, setUsersPagination] = useState({ total: 0, totalPages: 0 });

  // Stores data
  const [stores, setStores] = useState([]);
  const [storesPage, setStoresPage] = useState(1);
  const [storesSearch, setStoresSearch] = useState('');
  const [storesPagination, setStoresPagination] = useState({ total: 0, totalPages: 0 });

  // Orders data
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersStatus, setOrdersStatus] = useState('all');
  const [ordersPagination, setOrdersPagination] = useState({ total: 0, totalPages: 0 });

  // Products data
  const [products, setProducts] = useState([]);
  const [productsPage, setProductsPage] = useState(1);
  const [productsSearch, setProductsSearch] = useState('');
  const [productsPagination, setProductsPagination] = useState({ total: 0, totalPages: 0 });

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await adminService.getOverview();
      if (result.success) {
        setOverview(result.data.overview);
      } else {
        setError(result.error?.message || 'Failed to load overview');
      }
    } catch (err) {
      console.error('Error loading overview:', err);
      setError(err.response?.data?.error?.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  // Load users when page/search changes (tab change handled above)
  useEffect(() => {
    if (activeTab === 'users' && user && user.role === 'admin') {
      loadUsers();
    }
  }, [usersPage, usersSearch]);

  // Load stores when page/search changes
  useEffect(() => {
    if (activeTab === 'stores' && user && user.role === 'admin') {
      loadStores();
    }
  }, [storesPage, storesSearch]);

  // Load orders when page/status changes
  useEffect(() => {
    if (activeTab === 'orders' && user && user.role === 'admin') {
      loadOrders();
    }
  }, [ordersPage, ordersStatus]);

  // Load products when page/search changes
  useEffect(() => {
    if (activeTab === 'products' && user && user.role === 'admin') {
      loadProducts();
    }
  }, [productsPage, productsSearch]);


  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await adminService.getUsers(usersPage, 20, usersSearch);
      if (result.success) {
        setUsers(result.data.users);
        setUsersPagination(result.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      setLoading(true);
      const result = await adminService.getStores(storesPage, 20, storesSearch);
      if (result.success) {
        setStores(result.data.stores);
        setStoresPagination(result.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const result = await adminService.getOrders(ordersPage, 20, ordersStatus);
      if (result.success) {
        setOrders(result.data.orders);
        setOrdersPagination(result.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await adminService.getProducts(productsPage, 20, productsSearch);
      if (result.success) {
        setProducts(result.data.products);
        setProductsPagination(result.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  // Load data when tab changes or component mounts
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    if (activeTab === 'overview') {
      loadOverview();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'stores') {
      loadStores();
    } else if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'products') {
      loadProducts();
    }
  }, [activeTab, user]);

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const result = await adminService.updateUserRole(userId, newRole);
      if (result.success) {
        loadUsers(); // Reload users
        alert('User role updated successfully');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update user role');
    }
  };

  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    try {
      const result = await adminService.toggleStoreStatus(storeId, !currentStatus);
      if (result.success) {
        loadStores(); // Reload stores
        alert(`Store ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update store status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const result = await adminService.deleteUser(userId);
      if (result.success) {
        loadUsers(); // Reload users
        alert('User deleted successfully');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      return;
    }
    try {
      const result = await adminService.deleteStore(storeId);
      if (result.success) {
        loadStores(); // Reload stores
        alert('Store deleted successfully');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete store');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user || user.role !== 'admin') {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-panel-container">
      <header className="admin-panel-header">
        <div className="header-left">
          <h1>Admin Panel</h1>
          <p className="welcome-text">Welcome, {user?.full_name || user?.email}</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Dashboard
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-panel-content">
        <nav className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`admin-tab ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => setActiveTab('stores')}
          >
            Stores
          </button>
          <button
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
        </nav>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        <main className="admin-main-content">
          {activeTab === 'overview' && (
            <>
              {loading ? (
                <LoadingSpinner />
              ) : overview ? (
                <div className="overview-section">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h3>Total Users</h3>
                      <p className="stat-value">{overview.totalUsers || 0}</p>
                      <span className="stat-label">{overview.recentUsers || 0} new this week</span>
                    </div>
                    <div className="stat-card">
                      <h3>Total Stores</h3>
                      <p className="stat-value">{overview.totalStores || 0}</p>
                      <span className="stat-label">{overview.activeStores || 0} active</span>
                    </div>
                    <div className="stat-card">
                      <h3>Total Products</h3>
                      <p className="stat-value">{overview.totalProducts || 0}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Total Orders</h3>
                      <p className="stat-value">{overview.totalOrders || 0}</p>
                    </div>
                    <div className="stat-card">
                      <h3>Total Revenue</h3>
                      <p className="stat-value">{formatCurrency(overview.totalRevenue || 0)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No overview data available. Try refreshing the page.</p>
                  <button onClick={loadOverview} className="btn-secondary">
                    Reload
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === 'users' && (
            <div className="admin-table-section">
              <div className="table-header">
                <h2>Users Management</h2>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={usersSearch}
                  onChange={(e) => {
                    setUsersSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  className="search-input"
                />
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userItem) => (
                        <tr key={userItem.id}>
                          <td>{userItem.email}</td>
                          <td>{userItem.full_name || 'N/A'}</td>
                          <td>
                            <select
                              value={userItem.role}
                              onChange={(e) => handleUpdateUserRole(userItem.id, e.target.value)}
                              className="role-select"
                            >
                              <option value="user">User</option>
                              <option value="store_owner">Store Owner</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>{new Date(userItem.created_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="btn-delete"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usersPagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                        disabled={usersPage === 1}
                      >
                        Previous
                      </button>
                      <span>Page {usersPage} of {usersPagination.totalPages}</span>
                      <button
                        onClick={() => setUsersPage(p => Math.min(usersPagination.totalPages, p + 1))}
                        disabled={usersPage === usersPagination.totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'stores' && (
            <div className="admin-table-section">
              <div className="table-header">
                <h2>Stores Management</h2>
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={storesSearch}
                  onChange={(e) => {
                    setStoresSearch(e.target.value);
                    setStoresPage(1);
                  }}
                  className="search-input"
                />
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Owner</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((store) => (
                        <tr key={store.id}>
                          <td>{store.name}</td>
                          <td>{store.slug}</td>
                          <td>{store.owner?.email || 'N/A'}</td>
                          <td>
                            <span className={`status-badge ${store.is_active ? 'active' : 'inactive'}`}>
                              {store.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{new Date(store.created_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => handleToggleStoreStatus(store.id, store.is_active)}
                              className={`btn-toggle ${store.is_active ? 'deactivate' : 'activate'}`}
                            >
                              {store.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteStore(store.id)}
                              className="btn-delete"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {storesPagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => setStoresPage(p => Math.max(1, p - 1))}
                        disabled={storesPage === 1}
                      >
                        Previous
                      </button>
                      <span>Page {storesPage} of {storesPagination.totalPages}</span>
                      <button
                        onClick={() => setStoresPage(p => Math.min(storesPagination.totalPages, p + 1))}
                        disabled={storesPage === storesPagination.totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="admin-table-section">
              <div className="table-header">
                <h2>Orders Management</h2>
                <select
                  value={ordersStatus}
                  onChange={(e) => {
                    setOrdersStatus(e.target.value);
                    setOrdersPage(1);
                  }}
                  className="status-filter"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Store</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.id.substring(0, 8)}...</td>
                          <td>{order.store?.name || 'N/A'}</td>
                          <td>{order.customer?.email || order.customer?.full_name || 'Guest'}</td>
                          <td>{formatCurrency(order.total_amount)}</td>
                          <td>
                            <span className={`status-badge ${order.status}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {ordersPagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                        disabled={ordersPage === 1}
                      >
                        Previous
                      </button>
                      <span>Page {ordersPage} of {ordersPagination.totalPages}</span>
                      <button
                        onClick={() => setOrdersPage(p => Math.min(ordersPagination.totalPages, p + 1))}
                        disabled={ordersPage === ordersPagination.totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="admin-table-section">
              <div className="table-header">
                <h2>Products Management</h2>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productsSearch}
                  onChange={(e) => {
                    setProductsSearch(e.target.value);
                    setProductsPage(1);
                  }}
                  className="search-input"
                />
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Store</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Stock</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.store?.name || 'N/A'}</td>
                          <td>{formatCurrency(product.price)}</td>
                          <td>
                            <span className={`status-badge ${product.status}`}>
                              {product.status}
                            </span>
                          </td>
                          <td>{product.inventory_quantity || 0}</td>
                          <td>{new Date(product.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {productsPagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => setProductsPage(p => Math.max(1, p - 1))}
                        disabled={productsPage === 1}
                      >
                        Previous
                      </button>
                      <span>Page {productsPage} of {productsPagination.totalPages}</span>
                      <button
                        onClick={() => setProductsPage(p => Math.min(productsPagination.totalPages, p + 1))}
                        disabled={productsPage === productsPagination.totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;

