import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import { formatCurrency } from '../utils/currency';
import '../components/BackButton.css';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const { storeId: storeSlug, orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  if (loading) {
    return (
      <div className="confirmation-container">
        <div className="loading">Loading order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="confirmation-container">
        <div className="error-message">{error || 'Order not found'}</div>
        <button className="back-button" onClick={() => navigate(`/stores/${storeSlug}/products`)}>
          Back to Store
        </button>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <h1>Order Confirmed!</h1>
        <p className="order-number">Order #{order.order_number}</p>
        <p className="confirmation-message">
          Thank you for your order! We've received your order and will process it shortly.
        </p>

        <div className="order-details">
          <div className="detail-section">
            <h3>Order Summary</h3>
            <div className="order-items-list">
              {order.order_items?.map((item) => (
                <div key={item.id} className="order-item-row">
                  <div className="item-info">
                    <span className="item-name">{item.product_name}</span>
                    <span className="item-quantity">Quantity: {item.quantity}</span>
                  </div>
                  <span className="item-total">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {parseFloat(order.shipping_cost) > 0 && (
                <div className="total-row">
                  <span>Shipping:</span>
                  <span>{formatCurrency(order.shipping_cost)}</span>
                </div>
              )}
              {parseFloat(order.tax) > 0 && (
                <div className="total-row">
                  <span>Tax:</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              {parseFloat(order.discount) > 0 && (
                <div className="total-row discount">
                  <span>Discount:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="total-row final-total">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Shipping Address</h3>
            <div className="address-block">
              {order.shipping_address && (
                <>
                  <p>{order.shipping_address.name}</p>
                  {order.shipping_address.email && <p>{order.shipping_address.email}</p>}
                  {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
                  <p>{order.shipping_address.street}</p>
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state}{' '}
                    {order.shipping_address.zip}
                  </p>
                  <p>{order.shipping_address.country}</p>
                </>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3>Order Status</h3>
            <div className="status-info">
              <div className="status-badge">
                <span className="status-label">Order Status:</span>
                <span className={`status-value ${order.status}`}>{order.status}</span>
              </div>
              <div className="status-badge">
                <span className="status-label">Payment Status:</span>
                <span className={`status-value ${order.payment_status}`}>
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <button
            className="view-orders-button"
            onClick={() => navigate(`/stores/${storeSlug}/products`)}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;

