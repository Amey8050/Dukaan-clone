import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import orderService from '../services/orderService';
import useStoreBySlug from '../hooks/useStoreBySlug';
import { formatCurrency } from '../utils/currency';
import '../components/BackButton.css';
import './Orders.css';

const Orders = () => {
  const { storeId: storeSlug } = useParams();
  const {
    storeId,
    store: resolvedStore,
    loading: storeLookupLoading,
    error: storeLookupError
  } = useStoreBySlug(storeSlug);
  const [orders, setOrders] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (storeId) {
      loadOrders();
    }
  }, [storeId, statusFilter]);

  useEffect(() => {
    if (resolvedStore) {
      setStore(resolvedStore);
    }
  }, [resolvedStore]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const result = await orderService.getStoreOrders(storeId);
      if (result.success) {
        let filteredOrders = result.data.orders || [];
        
        // Apply status filter
        if (statusFilter !== 'all') {
          filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
        }
        
        setOrders(filteredOrders);
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const result = await orderService.updateOrderStatus(orderId, newStatus, null);
      if (result.success) {
        loadOrders(); // Reload orders
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update order status');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (storeLookupLoading || !storeId) {
    return (
      <div className="orders-container">
        <div className="loading">Loading store...</div>
      </div>
    );
  }

  if (storeLookupError) {
    return (
      <div className="orders-container">
        <div className="error-message">{storeLookupError}</div>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const getPaymentStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'payment-paid';
      case 'pending':
        return 'payment-pending';
      case 'failed':
        return 'payment-failed';
      case 'refunded':
        return 'payment-refunded';
      default:
        return '';
    }
  };

  return (
    <div className="orders-container">
      <header className="orders-header">
        <div className="header-left">
        <button className="back-button" onClick={() => navigate(`/stores/${storeSlug}/products`)}>
            ← Back to Products
          </button>
          <div>
            <h1>Orders - {store?.name}</h1>
          </div>
        </div>
        <div className="header-actions">
          <div className="user-info">
            <span>{user?.full_name || user?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="orders-content">
        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={statusFilter === 'all' ? 'active' : ''}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={statusFilter === 'pending' ? 'active' : ''}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button
            className={statusFilter === 'processing' ? 'active' : ''}
            onClick={() => setStatusFilter('processing')}
          >
            Processing
          </button>
          <button
            className={statusFilter === 'shipped' ? 'active' : ''}
            onClick={() => setStatusFilter('shipped')}
          >
            Shipped
          </button>
          <button
            className={statusFilter === 'delivered' ? 'active' : ''}
            onClick={() => setStatusFilter('delivered')}
          >
            Delivered
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
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
                          navigate(`/stores/${storeSlug}/orders/${order.id}`);
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
                        className={`status-select ${getStatusBadgeClass(order.status)}`}
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      <span className={`payment-badge ${getPaymentStatusBadgeClass(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() => navigate(`/stores/${storeSlug}/orders/${order.id}`)}
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
      </main>
    </div>
  );
};

export default Orders;

