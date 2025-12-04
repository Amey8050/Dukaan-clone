import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import orderService from '../services/orderService';
import { formatCurrency } from '../utils/currency';
import '../components/BackButton.css';
import './Orders.css';

const OrderDetail = () => {
  const { storeId: storeSlug, orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const result = await orderService.getOrder(orderId);
      if (result.success) {
        setOrder(result.data.order);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus, newPaymentStatus = null) => {
    try {
      setUpdating(true);
      const result = await orderService.updateOrderStatus(
        orderId,
        newStatus,
        newPaymentStatus
      );
      if (result.success) {
        loadOrder(); // Reload order
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="loading">Loading order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-container">
        <div className="error-message">{error || 'Order not found'}</div>
        <button className="back-button" onClick={() => navigate(`/stores/${storeSlug}/orders`)}>
            <button className="back-button" onClick={() => navigate(`/stores/${storeSlug}/orders`)}>
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="order-detail-container">
      <header className="order-detail-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate(`/stores/${storeSlug}/orders`)}
          >
            ← Back to Orders
          </button>
          <div>
            <h1>Order #{order.order_number}</h1>
            <p className="order-date">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
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

      <main className="order-detail-content">
        <div className="order-detail-layout">
          <div className="order-main">
            {/* Order Status */}
            <div className="order-status-section">
              <h2>Order Status</h2>
              <div className="status-controls">
                <div className="status-control-group">
                  <label>Order Status:</label>
                  <select
                    className="status-select"
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value, null)}
                    disabled={updating}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="status-control-group">
                  <label>Payment Status:</label>
                  <select
                    className="status-select"
                    value={order.payment_status}
                    onChange={(e) => handleStatusUpdate(null, e.target.value)}
                    disabled={updating}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="order-items-section">
              <h2>Order Items</h2>
              <div className="order-items-list">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="order-item-card">
                    <div className="item-image">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} />
                      ) : (
                        <div className="image-placeholder">No Image</div>
                      )}
                    </div>
                    <div className="item-details">
                      <h3>{item.product_name}</h3>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: {formatCurrency(item.price)} each</p>
                    </div>
                    <div className="item-total">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shipping_address && (
              <div className="address-section">
                <h2>Shipping Address</h2>
                <div className="address-block">
                  <p>{order.shipping_address.name}</p>
                  {order.shipping_address.email && <p>{order.shipping_address.email}</p>}
                  {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
                  <p>{order.shipping_address.street}</p>
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state}{' '}
                    {order.shipping_address.zip}
                  </p>
                  <p>{order.shipping_address.country}</p>
                </div>
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="notes-section">
                <h2>Order Notes</h2>
                <p>{order.notes}</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="order-summary-sidebar">
            <div className="summary-card">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {parseFloat(order.shipping_cost) > 0 && (
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>{formatCurrency(order.shipping_cost)}</span>
                </div>
              )}
              {parseFloat(order.tax) > 0 && (
                <div className="summary-row">
                  <span>Tax:</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              {parseFloat(order.discount) > 0 && (
                <div className="summary-row discount">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>

              <div className="order-info">
                <div className="info-row">
                  <span>Payment Method:</span>
                  <span>{order.payment_method || 'N/A'}</span>
                </div>
                {order.payment_id && (
                  <div className="info-row">
                    <span>Payment ID:</span>
                    <span className="payment-id">{order.payment_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetail;

