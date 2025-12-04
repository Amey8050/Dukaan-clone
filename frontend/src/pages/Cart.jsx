import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import useStoreBySlug from '../hooks/useStoreBySlug';
import { formatCurrency, calculateShipping } from '../utils/currency';
import '../components/BackButton.css';
import './Cart.css';

const Cart = () => {
  const { storeId: storeSlug } = useParams();
  const {
    storeId,
    loading: storeLookupLoading,
    error: storeLookupError
  } = useStoreBySlug(storeSlug);
  const { cart, loading, error, updateQuantity, removeFromCart, clearCart, loadCart } = useCart();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (storeId) {
      loadCart(storeId);
    }
  }, [storeId]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId);
    } else {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemove = async (itemId) => {
    if (window.confirm('Remove this item from cart?')) {
      await removeFromCart(itemId);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Clear all items from cart?')) {
      await clearCart(storeId);
    }
  };

  const handleCheckout = () => {
    navigate(`/stores/${storeSlug}/checkout`);
  };

  if (storeLookupLoading || !storeId) {
    return (
      <div className="cart-container">
        <div className="loading">Loading store...</div>
      </div>
    );
  }

  if (storeLookupError) {
    return (
      <div className="cart-container">
        <div className="error-message">{storeLookupError}</div>
      </div>
    );
  }

  if (loading && !cart) {
    return (
      <div className="cart-container">
        <div className="loading">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <header className="cart-header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate(`/stores/${storeSlug}`)}>
            <span className="back-icon">←</span>
            <span>Continue Shopping</span>
          </button>
          <h1>Shopping Cart</h1>
          {isAuthenticated && (
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="cart-content">
        {error && <div className="error-message">{error}</div>}

        {!cart || !cart.items || cart.items.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <button
              className="shop-button"
              onClick={() => navigate(`/stores/${storeSlug}`)}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              <div className="cart-items-header">
                <h2>Cart Items ({cart.item_count})</h2>
                <button className="clear-cart-button" onClick={handleClearCart}>
                  Clear Cart
                </button>
              </div>

              {cart.items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    {item.product?.images && item.product.images.length > 0 ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <span>📦</span>
                      </div>
                    )}
                  </div>

                  <div className="item-info">
                    <div className="item-details">
                      <h3>{item.product?.name || 'Product'}</h3>
                      <p className="item-price">{formatCurrency(item.price)} each</p>
                    </div>

                    <div className="item-actions">
                      <div className="item-quantity">
                        <label>Quantity</label>
                        <div className="quantity-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={loading || item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                            }
                            min="1"
                            disabled={loading}
                            className="quantity-input"
                          />
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={loading}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="item-total">
                        <span className="total-label">Item Total</span>
                        <span className="total-amount">
                          {formatCurrency(parseFloat(item.price) * item.quantity)}
                        </span>
                      </div>

                      <button
                        className="remove-button"
                        onClick={() => handleRemove(item.id)}
                        disabled={loading}
                        aria-label="Remove item"
                      >
                        <span className="remove-icon">🗑️</span>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-card">
                <h2>Order Summary</h2>
                <div className="summary-content">
                  <div className="summary-row">
                    <span className="summary-label">Items ({cart.total_items})</span>
                    <span className="summary-value">{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Subtotal</span>
                    <span className="summary-value">{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Shipping</span>
                    <span className="summary-value">
                      {(() => {
                        const shipping = calculateShipping(cart.subtotal);
                        return shipping === 0 ? 'Free' : formatCurrency(shipping);
                      })()}
                    </span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row total-row">
                    <span className="summary-label">Total</span>
                    <span className="summary-value total-value">
                      {formatCurrency(parseFloat(cart.subtotal) + calculateShipping(cart.subtotal))}
                    </span>
                  </div>
                </div>
                <button
                  className="checkout-button"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  <span>Proceed to Checkout</span>
                  <span className="checkout-arrow">→</span>
                </button>
                <p className="summary-note">
                  {parseFloat(cart.subtotal) >= 500 
                    ? '🎉 You qualify for free shipping!'
                    : `Add ₹${(500 - parseFloat(cart.subtotal)).toFixed(2)} more for free shipping`}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;

