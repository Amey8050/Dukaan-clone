import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import inventoryService from '../services/inventoryService';
import storeService from '../services/storeService';
import '../components/BackButton.css';
import './Inventory.css';

const Inventory = () => {
  const { storeId } = useParams();
  const [summary, setSummary] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    quantity: '',
    reason: '',
    notes: '',
    change_type: 'adjustment'
  });
  const [adjusting, setAdjusting] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (storeId) {
      loadInventoryData();
    }
  }, [storeId]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const [summaryResult, lowStockResult] = await Promise.all([
        inventoryService.getInventorySummary(storeId),
        inventoryService.getLowStockProducts(storeId)
      ]);

      if (summaryResult.success) {
        setSummary(summaryResult.data);
      }
      if (lowStockResult.success) {
        setLowStockProducts(lowStockResult.data.products || []);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustInventory = (product) => {
    setSelectedProduct(product);
    setAdjustForm({
      quantity: product.inventory_quantity.toString(),
      reason: '',
      notes: '',
      change_type: 'adjustment'
    });
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setAdjusting(true);
      const result = await inventoryService.adjustInventory(selectedProduct.id, {
        quantity: parseInt(adjustForm.quantity),
        reason: adjustForm.reason,
        notes: adjustForm.notes,
        change_type: adjustForm.change_type
      });

      if (result.success) {
        setShowAdjustModal(false);
        setSelectedProduct(null);
        loadInventoryData(); // Reload data
        alert('Inventory updated successfully!');
      } else {
        alert('Failed to update inventory');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update inventory');
    } finally {
      setAdjusting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStockStatus = (quantity, threshold) => {
    if (quantity === 0) return { status: 'out', class: 'stock-out', label: 'Out of Stock' };
    if (quantity <= threshold) return { status: 'low', class: 'stock-low', label: 'Low Stock' };
    return { status: 'ok', class: 'stock-ok', label: 'In Stock' };
  };

  return (
    <div className="inventory-container">
      <header className="inventory-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate(`/stores/${storeId}/products`)}>
            ← Back to Products
          </button>
          <h1>Inventory Management</h1>
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

      <main className="inventory-content">
        {loading ? (
          <div className="loading">Loading inventory data...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="inventory-summary">
                <div className="summary-card">
                  <div className="summary-info">
                    <h3>{summary.total_products}</h3>
                    <p>Total Products</p>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-info">
                    <h3>{summary.tracking_inventory}</h3>
                    <p>Tracking Inventory</p>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-info">
                    <h3>{summary.total_quantity}</h3>
                    <p>Total Quantity</p>
                  </div>
                </div>
                <div className={`summary-card ${summary.low_stock_count > 0 ? 'alert' : ''}`}>
                  <div className="summary-info">
                    <h3>{summary.low_stock_count}</h3>
                    <p>Low Stock Items</p>
                  </div>
                </div>
                <div className={`summary-card ${summary.out_of_stock_count > 0 ? 'alert' : ''}`}>
                  <div className="summary-info">
                    <h3>{summary.out_of_stock_count}</h3>
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
                    const stockStatus = getStockStatus(
                      product.inventory_quantity,
                      product.low_stock_threshold
                    );
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
                            onClick={() => handleAdjustInventory(product)}
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

            {lowStockProducts.length === 0 && summary && summary.low_stock_count === 0 && (
              <div className="empty-state">
                <h2>All Good!</h2>
                <p>No low stock items. Your inventory is well-stocked.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Adjust Inventory Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adjust Inventory</h2>
              <button
                className="close-button"
                onClick={() => setShowAdjustModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="adjust-form">
              <div className="form-group">
                <label>Product</label>
                <input
                  type="text"
                  value={selectedProduct.name}
                  disabled
                  className="disabled-input"
                />
              </div>
              <div className="form-group">
                <label>Current Quantity</label>
                <input
                  type="text"
                  value={selectedProduct.inventory_quantity}
                  disabled
                  className="disabled-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="quantity">New Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="change_type">Change Type</label>
                <select
                  id="change_type"
                  value={adjustForm.change_type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, change_type: e.target.value })}
                >
                  <option value="adjustment">Manual Adjustment</option>
                  <option value="restock">Restock</option>
                  <option value="return">Return</option>
                  <option value="damaged">Damaged</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reason">Reason</label>
                <input
                  type="text"
                  id="reason"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="Reason for adjustment"
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Additional notes (optional)"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAdjustModal(false)}
                  disabled={adjusting}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-button" disabled={adjusting}>
                  {adjusting ? 'Updating...' : 'Update Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

