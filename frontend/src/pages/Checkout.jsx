import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import useStoreBySlug from '../hooks/useStoreBySlug';
import orderService from '../services/orderService';
import { formatCurrency, calculateShipping } from '../utils/currency';
import '../components/BackButton.css';
import './Checkout.css';

const Checkout = () => {
  const { storeId: storeSlug } = useParams();
  const {
    storeId,
    loading: storeLookupLoading,
    error: storeLookupError
  } = useStoreBySlug(storeSlug);
  const { cart, loadCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shipping_address: {
      name: user?.full_name || '',
      email: user?.email || '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
    billing_address: {
      same_as_shipping: true,
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
    payment_method: 'card',
    card_details: {
      card_number: '',
      card_name: '',
      expiry_date: '',
      cvv: '',
    },
    upi_id: '',
    notes: '',
    tax: 0,
    shipping_cost: 0,
    discount: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (storeId) {
      loadCart(storeId);
    }
  }, [storeId]);

  useEffect(() => {
    // Pre-fill user data if logged in
    if (user) {
      setFormData((prev) => ({
        ...prev,
        shipping_address: {
          ...prev.shipping_address,
          name: user.full_name || user.email || '',
          email: user.email || '',
        },
      }));
    }
  }, [user]);

  // Auto-calculate shipping cost when cart changes
  useEffect(() => {
    if (cart && cart.subtotal !== undefined) {
      const shipping = calculateShipping(cart.subtotal);
      setFormData((prev) => ({
        ...prev,
        shipping_cost: shipping,
      }));
    }
  }, [cart]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      shipping_address: {
        ...formData.shipping_address,
        [name]: value,
      },
    });
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    if (name === 'same_as_shipping') {
      setFormData({
        ...formData,
        billing_address: {
          ...formData.billing_address,
          same_as_shipping: e.target.checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        billing_address: {
          ...formData.billing_address,
          [name]: value,
        },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!cart || !cart.items || cart.items.length === 0) {
        setError('Your cart is empty');
        setLoading(false);
        return;
      }

      // Prepare billing address
      const billingAddress = formData.billing_address.same_as_shipping
        ? formData.shipping_address
        : formData.billing_address;

      // Validate payment details based on payment method
      if (formData.payment_method === 'card') {
        if (!formData.card_details.card_number || !formData.card_details.card_name || 
            !formData.card_details.expiry_date || !formData.card_details.cvv) {
          setError('Please fill in all card details');
          setLoading(false);
          return;
        }
      } else if (formData.payment_method === 'upi') {
        if (!formData.upi_id || !formData.upi_id.includes('@')) {
          setError('Please enter a valid UPI ID');
          setLoading(false);
          return;
        }
      }

      const orderData = {
        store_id: storeId,
        shipping_address: formData.shipping_address,
        billing_address: billingAddress,
        payment_method: formData.payment_method,
        payment_details: formData.payment_method === 'card' 
          ? formData.card_details 
          : formData.payment_method === 'upi' 
          ? { upi_id: formData.upi_id }
          : null,
        notes: formData.notes || null,
        tax: formData.tax,
        shipping_cost: formData.shipping_cost,
        discount: formData.discount,
      };

      const result = await orderService.createOrder(orderData);

      if (result.success) {
        // Redirect to order confirmation page
        navigate(`/stores/${storeSlug}/orders/${result.data.order.id}/confirmation`);
      } else {
        setError(result.error?.message || 'Failed to create order');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (storeLookupLoading || !storeId) {
    return (
      <div className="checkout-container">
        <div className="loading">Loading store...</div>
      </div>
    );
  }

  if (storeLookupError) {
    return (
      <div className="checkout-container">
        <div className="error-message">{storeLookupError}</div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="checkout-container">
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some products before checkout</p>
          <button
            className="shop-button"
            onClick={() => navigate(`/stores/${storeSlug}/products`)}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <header className="checkout-header">
        <button className="back-button" onClick={() => navigate(`/stores/${storeSlug}/cart`)}>
          ← Back to Cart
        </button>
        <h1>Checkout</h1>
      </header>

      <main className="checkout-content">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="checkout-layout">
            <div className="checkout-form">
              {/* Shipping Address */}
              <div className="form-section">
                <h2>Shipping Address</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shipping_name">Full Name *</label>
                    <input
                      type="text"
                      id="shipping_name"
                      name="name"
                      value={formData.shipping_address.name}
                      onChange={handleShippingChange}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="shipping_email">Email *</label>
                    <input
                      type="email"
                      id="shipping_email"
                      name="email"
                      value={formData.shipping_address.email}
                      onChange={handleShippingChange}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shipping_phone">Phone *</label>
                    <input
                      type="tel"
                      id="shipping_phone"
                      name="phone"
                      value={formData.shipping_address.phone}
                      onChange={handleShippingChange}
                      required
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="shipping_street">Street Address *</label>
                  <input
                    type="text"
                    id="shipping_street"
                    name="street"
                    value={formData.shipping_address.street}
                    onChange={handleShippingChange}
                    required
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shipping_city">City *</label>
                    <input
                      type="text"
                      id="shipping_city"
                      name="city"
                      value={formData.shipping_address.city}
                      onChange={handleShippingChange}
                      required
                      placeholder="New York"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="shipping_state">State/Province *</label>
                    <input
                      type="text"
                      id="shipping_state"
                      name="state"
                      value={formData.shipping_address.state}
                      onChange={handleShippingChange}
                      required
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shipping_zip">ZIP/Postal Code *</label>
                    <input
                      type="text"
                      id="shipping_zip"
                      name="zip"
                      value={formData.shipping_address.zip}
                      onChange={handleShippingChange}
                      required
                      placeholder="10001"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="shipping_country">Country *</label>
                    <input
                      type="text"
                      id="shipping_country"
                      name="country"
                      value={formData.shipping_address.country}
                      onChange={handleShippingChange}
                      required
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="form-section">
                <h2>Billing Address</h2>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="same_as_shipping"
                      checked={formData.billing_address.same_as_shipping}
                      onChange={handleBillingChange}
                    />
                    Same as shipping address
                  </label>
                </div>

                {!formData.billing_address.same_as_shipping && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="billing_name">Full Name *</label>
                        <input
                          type="text"
                          id="billing_name"
                          name="name"
                          value={formData.billing_address.name}
                          onChange={handleBillingChange}
                          required={!formData.billing_address.same_as_shipping}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="billing_email">Email *</label>
                        <input
                          type="email"
                          id="billing_email"
                          name="email"
                          value={formData.billing_address.email}
                          onChange={handleBillingChange}
                          required={!formData.billing_address.same_as_shipping}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="billing_street">Street Address *</label>
                      <input
                        type="text"
                        id="billing_street"
                        name="street"
                        value={formData.billing_address.street}
                        onChange={handleBillingChange}
                        required={!formData.billing_address.same_as_shipping}
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="billing_city">City *</label>
                        <input
                          type="text"
                          id="billing_city"
                          name="city"
                          value={formData.billing_address.city}
                          onChange={handleBillingChange}
                          required={!formData.billing_address.same_as_shipping}
                          placeholder="New York"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="billing_state">State/Province *</label>
                        <input
                          type="text"
                          id="billing_state"
                          name="state"
                          value={formData.billing_address.state}
                          onChange={handleBillingChange}
                          required={!formData.billing_address.same_as_shipping}
                          placeholder="NY"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="billing_zip">ZIP/Postal Code *</label>
                        <input
                          type="text"
                          id="billing_zip"
                          name="zip"
                          value={formData.billing_address.zip}
                          onChange={handleBillingChange}
                          required={!formData.billing_address.same_as_shipping}
                          placeholder="10001"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="billing_country">Country *</label>
                        <input
                          type="text"
                          id="billing_country"
                          name="country"
                          value={formData.billing_address.country}
                          onChange={handleBillingChange}
                          required={!formData.billing_address.same_as_shipping}
                          placeholder="United States"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Method */}
              <div className="form-section">
                <h2>Payment Method</h2>
                
                {/* Payment Method Selection */}
                <div className="payment-methods">
                  <div 
                    className={`payment-method-option ${formData.payment_method === 'card' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, payment_method: 'card' })}
                  >
                    <div className="payment-icon">💳</div>
                    <div className="payment-info">
                      <h3>Card Payment</h3>
                      <p>Credit/Debit Card</p>
                    </div>
                    <div className="payment-radio">
                      <input
                        type="radio"
                        name="payment_method"
                        value="card"
                        checked={formData.payment_method === 'card'}
                        onChange={() => setFormData({ ...formData, payment_method: 'card' })}
                      />
                    </div>
                  </div>

                  <div 
                    className={`payment-method-option ${formData.payment_method === 'upi' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, payment_method: 'upi' })}
                  >
                    <div className="payment-icon">📱</div>
                    <div className="payment-info">
                      <h3>UPI Payment</h3>
                      <p>Pay via UPI</p>
                    </div>
                    <div className="payment-radio">
                      <input
                        type="radio"
                        name="payment_method"
                        value="upi"
                        checked={formData.payment_method === 'upi'}
                        onChange={() => setFormData({ ...formData, payment_method: 'upi' })}
                      />
                    </div>
                  </div>

                  <div 
                    className={`payment-method-option ${formData.payment_method === 'cod' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, payment_method: 'cod' })}
                  >
                    <div className="payment-icon">💰</div>
                    <div className="payment-info">
                      <h3>Cash on Delivery</h3>
                      <p>Pay when you receive</p>
                    </div>
                    <div className="payment-radio">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={formData.payment_method === 'cod'}
                        onChange={() => setFormData({ ...formData, payment_method: 'cod' })}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Payment Details */}
                {formData.payment_method === 'card' && (
                  <div className="payment-details">
                    <h3>Card Details</h3>
                    <div className="form-group">
                      <label htmlFor="card_number">Card Number *</label>
                      <input
                        type="text"
                        id="card_number"
                        name="card_number"
                        value={formData.card_details.card_number}
                        onChange={(e) => setFormData({
                          ...formData,
                          card_details: { ...formData.card_details, card_number: e.target.value }
                        })}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="card_name">Cardholder Name *</label>
                      <input
                        type="text"
                        id="card_name"
                        name="card_name"
                        value={formData.card_details.card_name}
                        onChange={(e) => setFormData({
                          ...formData,
                          card_details: { ...formData.card_details, card_name: e.target.value }
                        })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="expiry_date">Expiry Date *</label>
                        <input
                          type="text"
                          id="expiry_date"
                          name="expiry_date"
                          value={formData.card_details.expiry_date}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setFormData({
                              ...formData,
                              card_details: { ...formData.card_details, expiry_date: value }
                            });
                          }}
                          placeholder="MM/YY"
                          maxLength="5"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="cvv">CVV *</label>
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          value={formData.card_details.cvv}
                          onChange={(e) => setFormData({
                            ...formData,
                            card_details: { ...formData.card_details, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }
                          })}
                          placeholder="123"
                          maxLength="3"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Payment Details */}
                {formData.payment_method === 'upi' && (
                  <div className="payment-details">
                    <h3>UPI Details</h3>
                    <div className="form-group">
                      <label htmlFor="upi_id">UPI ID *</label>
                      <input
                        type="text"
                        id="upi_id"
                        name="upi_id"
                        value={formData.upi_id}
                        onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                        placeholder="yourname@paytm / yourname@phonepe / yourname@ybl"
                        required
                      />
                      <p className="form-hint">Enter your UPI ID (e.g., yourname@paytm, yourname@phonepe)</p>
                    </div>
                  </div>
                )}

                {/* COD Message */}
                {formData.payment_method === 'cod' && (
                  <div className="payment-details cod-info">
                    <div className="info-box">
                      <p>💰 You can pay in cash when your order is delivered.</p>
                      <p>Please keep the exact amount ready for the delivery person.</p>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="notes">Order Notes (Optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Special instructions for your order..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <div className="summary-card">
                <h2>Order Summary</h2>
                <div className="order-items">
                  {cart.items.map((item) => (
                    <div key={item.id} className="summary-item">
                      <div className="item-info">
                        <span className="item-name">{item.product?.name || 'Product'}</span>
                        <span className="item-quantity">Qty: {item.quantity}</span>
                      </div>
                      <span className="item-price">
                        {formatCurrency(parseFloat(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>
                    {formData.shipping_cost === 0 ? 'Free' : formatCurrency(formData.shipping_cost)}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Tax:</span>
                  <span>{formatCurrency(formData.tax)}</span>
                </div>
                {formData.discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount:</span>
                    <span>-{formatCurrency(formData.discount)}</span>
                  </div>
                )}

                <div className="summary-divider"></div>

                <div className="summary-row total">
                  <span>Total:</span>
                  <span>
                    {formatCurrency(
                      parseFloat(cart.subtotal) +
                      formData.tax +
                      formData.shipping_cost -
                      formData.discount
                    )}
                  </span>
                </div>

                <button type="submit" className="place-order-button" disabled={loading}>
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Checkout;

