import { useState, useEffect } from 'react';
import analyticsService from '../services/analyticsService';
import orderService from '../services/orderService';
import inventoryService from '../services/inventoryService';
import './Reports.css';

const Reports = ({ storeId }) => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    orderStatus: 'all',
    paymentStatus: 'all'
  });

  useEffect(() => {
    if (storeId) {
      generateReport();
    }
  }, [storeId, reportType, dateRange, filters]);

  const generateReport = async () => {
    try {
      setLoading(true);
      let result = null;

      switch (reportType) {
        case 'sales':
          result = await analyticsService.getSalesAnalytics(storeId, {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
            group_by: 'day'
          });
          if (result.success && result.data.analytics) {
            setReportData({
              type: 'sales',
              data: {
                time_series: result.data.analytics.time_series || []
              },
              summary: {
                total_revenue: result.data.analytics.overview?.total_revenue || 0,
                total_orders: result.data.analytics.overview?.total_orders || 0,
                average_order_value: result.data.analytics.overview?.average_order_value || 0
              }
            });
          }
          break;

        case 'orders':
          const ordersResult = await orderService.getStoreOrders(storeId);
          if (ordersResult.success) {
            let orders = ordersResult.data.orders || [];
            
            // Filter by date range
            orders = orders.filter(order => {
              const orderDate = new Date(order.created_at);
              const start = new Date(dateRange.startDate);
              const end = new Date(dateRange.endDate);
              end.setHours(23, 59, 59, 999);
              return orderDate >= start && orderDate <= end;
            });

            // Filter by order status
            if (filters.orderStatus !== 'all') {
              orders = orders.filter(order => order.status === filters.orderStatus);
            }

            // Filter by payment status
            if (filters.paymentStatus !== 'all') {
              orders = orders.filter(order => order.payment_status === filters.paymentStatus);
            }

            // Calculate summary
            const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
            const totalOrders = orders.length;
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            setReportData({
              type: 'orders',
              data: orders,
              summary: {
                total_revenue: totalRevenue,
                total_orders: totalOrders,
                average_order_value: avgOrderValue,
                by_status: orders.reduce((acc, order) => {
                  acc[order.status] = (acc[order.status] || 0) + 1;
                  return acc;
                }, {}),
                by_payment_status: orders.reduce((acc, order) => {
                  acc[order.payment_status] = (acc[order.payment_status] || 0) + 1;
                  return acc;
                }, {})
              }
            });
          }
          break;

        case 'inventory':
          const inventoryResult = await inventoryService.getInventorySummary(storeId);
          if (inventoryResult.success) {
            const lowStockResult = await inventoryService.getLowStockProducts(storeId);
            setReportData({
              type: 'inventory',
              data: inventoryResult.data,
              lowStock: lowStockResult.success ? lowStockResult.data.products || [] : []
            });
          }
          break;

        case 'traffic':
          // Calculate period from date range
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          // Calculate days difference, ensuring at least 1 day
          const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
          const trafficResult = await analyticsService.getTrafficAnalytics(storeId, {
            period: daysDiff,
            group_by: 'day'
          });
          if (trafficResult.success && trafficResult.data && trafficResult.data.analytics) {
            setReportData({
              type: 'traffic',
              data: {
                overview: trafficResult.data.analytics.overview || {},
                time_series: trafficResult.data.analytics.time_series || []
              }
            });
          } else if (trafficResult.success && !trafficResult.data) {
            // Handle case where API returns success but no data
            setReportData({
              type: 'traffic',
              data: {
                overview: {
                  total_views: 0,
                  unique_visitors: 0,
                  unique_sessions: 0,
                  average_views_per_session: 0
                },
                time_series: []
              }
            });
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      setReportData(null);
      // Show user-friendly error message
      if (error.response?.data?.error?.message) {
        alert(`Error: ${error.response.data.error.message}`);
      } else {
        alert('Failed to generate report. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = '';
    let filename = '';

    switch (reportData.type) {
      case 'sales':
        filename = `sales-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
        csvContent = 'Date,Revenue,Orders\n';
        if (reportData.data.time_series) {
          reportData.data.time_series.forEach(item => {
            csvContent += `${item.date},${item.revenue || 0},${item.orders || 0}\n`;
          });
        }
        break;

      case 'orders':
        filename = `orders-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
        csvContent = 'Order ID,Date,Customer,Status,Payment Status,Total Amount,Items\n';
        reportData.data.forEach(order => {
          const items = order.items?.map(item => `${item.product_name} (x${item.quantity})`).join('; ') || 'N/A';
          csvContent += `${order.id},${order.created_at},${order.customer_name || 'Guest'},${order.status},${order.payment_status},${order.total_amount},${items}\n`;
        });
        break;

      case 'inventory':
        filename = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
        csvContent = 'Product ID,Product Name,Current Stock,Low Stock Threshold,Status\n';
        if (reportData.lowStock && reportData.lowStock.length > 0) {
          reportData.lowStock.forEach(product => {
            csvContent += `${product.id},${product.name},${product.stock},${product.low_stock_threshold},Low Stock\n`;
          });
        }
        // Add summary stats
        csvContent += `\nSummary\n`;
        csvContent += `Total Products,${reportData.data.total_products || 0}\n`;
        csvContent += `Tracking Inventory,${reportData.data.tracking_inventory || 0}\n`;
        csvContent += `Total Quantity,${reportData.data.total_quantity || 0}\n`;
        csvContent += `Low Stock Items,${reportData.data.low_stock_count || 0}\n`;
        csvContent += `Out of Stock,${reportData.data.out_of_stock_count || 0}\n`;
        break;

      case 'traffic':
        filename = `traffic-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
        csvContent = 'Date,Views,Unique Visitors,Sessions\n';
        if (reportData.data.time_series && reportData.data.time_series.length > 0) {
          reportData.data.time_series.forEach(item => {
            csvContent += `${item.date},${item.views || 0},${item.unique_visitors || 0},${item.unique_sessions || 0}\n`;
          });
        } else {
          // Add summary row if no time series data
          csvContent += `Summary,${reportData.data.overview?.total_views || 0},${reportData.data.overview?.unique_visitors || 0},${reportData.data.overview?.unique_sessions || 0}\n`;
        }
        break;

      default:
        return;
    }

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="report-actions">
          {reportData && (
            <button className="export-btn" onClick={exportToCSV}>
              📥 Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="reports-controls">
        <div className="report-type-selector">
          <button
            className={reportType === 'sales' ? 'active' : ''}
            onClick={() => setReportType('sales')}
          >
            Sales Report
          </button>
          <button
            className={reportType === 'orders' ? 'active' : ''}
            onClick={() => setReportType('orders')}
          >
            Orders Report
          </button>
          <button
            className={reportType === 'inventory' ? 'active' : ''}
            onClick={() => setReportType('inventory')}
          >
            Inventory Report
          </button>
          <button
            className={reportType === 'traffic' ? 'active' : ''}
            onClick={() => setReportType('traffic')}
          >
            Traffic Report
          </button>
        </div>

        <div className="report-filters">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>

          {reportType === 'orders' && (
            <>
              <div className="filter-group">
                <label>Order Status</label>
                <select
                  value={filters.orderStatus}
                  onChange={(e) => setFilters({ ...filters, orderStatus: e.target.value })}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Payment Status</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="reports-loading">
          <p>Generating report...</p>
        </div>
      )}

      {!loading && reportData && (
        <div className="report-content">
          {/* Sales Report */}
          {reportData.type === 'sales' && reportData.summary && (
            <div className="report-section">
              <h3>Sales Summary</h3>
              <div className="summary-cards">
                <div className="summary-card">
                  <span className="summary-label">Total Revenue</span>
                  <span className="summary-value">
                    {formatCurrency(reportData.summary.total_revenue)}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Total Orders</span>
                  <span className="summary-value">{reportData.summary.total_orders}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Average Order Value</span>
                  <span className="summary-value">
                    {formatCurrency(reportData.summary.average_order_value)}
                  </span>
                </div>
              </div>

              {reportData.data.time_series && reportData.data.time_series.length > 0 ? (
                <div className="report-table-container">
                  <h4>Daily Sales Breakdown</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Revenue</th>
                        <th>Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.time_series.map((item, index) => (
                        <tr key={index}>
                          <td>{formatDate(item.date)}</td>
                          <td>{formatCurrency(item.revenue)}</td>
                          <td>{item.orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="reports-empty" style={{ marginTop: '20px', padding: '20px' }}>
                  <p>No sales data found for the selected date range.</p>
                </div>
              )}
            </div>
          )}

          {/* Orders Report */}
          {reportData.type === 'orders' && (
            <div className="report-section">
              <h3>Orders Summary</h3>
              <div className="summary-cards">
                <div className="summary-card">
                  <span className="summary-label">Total Revenue</span>
                  <span className="summary-value">
                    {formatCurrency(reportData.summary.total_revenue)}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Total Orders</span>
                  <span className="summary-value">{reportData.summary.total_orders}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Average Order Value</span>
                  <span className="summary-value">
                    {formatCurrency(reportData.summary.average_order_value)}
                  </span>
                </div>
              </div>

              {reportData.summary.by_status && (
                <div className="report-table-container">
                  <h4>Orders by Status</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.summary.by_status).map(([status, count]) => (
                        <tr key={status}>
                          <td className="status-cell">{status}</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {reportData.data.length > 0 ? (
                <div className="report-table-container">
                  <h4>Order Details</h4>
                  <div className="table-wrapper">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.data.slice(0, 50).map((order) => (
                          <tr key={order.id}>
                            <td>#{order.id.substring(0, 8)}</td>
                            <td>{formatDate(order.created_at)}</td>
                            <td>{order.customer_name || 'Guest'}</td>
                            <td>
                              <span className={`status-badge status-${order.status}`}>
                                {order.status}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge status-${order.payment_status}`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td>{formatCurrency(order.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {reportData.data.length > 50 && (
                    <p className="table-note">
                      Showing first 50 orders. Export CSV for complete data.
                    </p>
                  )}
                </div>
              ) : (
                <div className="reports-empty" style={{ marginTop: '20px', padding: '20px' }}>
                  <p>No orders found for the selected filters and date range.</p>
                </div>
              )}
            </div>
          )}

          {/* Inventory Report */}
          {reportData.type === 'inventory' && (
            <div className="report-section">
              <h3>Inventory Summary</h3>
              <div className="summary-cards">
                <div className="summary-card">
                  <span className="summary-label">Total Products</span>
                  <span className="summary-value">{reportData.data.total_products || 0}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Total Quantity</span>
                  <span className="summary-value">
                    {reportData.data.total_quantity?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Tracking Inventory</span>
                  <span className="summary-value">
                    {reportData.data.tracking_inventory || 0}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Low Stock Items</span>
                  <span className="summary-value warning">
                    {reportData.data.low_stock_count || 0}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Out of Stock</span>
                  <span className="summary-value warning">
                    {reportData.data.out_of_stock_count || 0}
                  </span>
                </div>
              </div>

              {reportData.lowStock && reportData.lowStock.length > 0 ? (
                <div className="report-table-container">
                  <h4>Low Stock Products</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Current Stock</th>
                        <th>Low Stock Threshold</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.lowStock.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td className="warning">{product.stock}</td>
                          <td>{product.low_stock_threshold}</td>
                          <td>
                            <span className="status-badge status-warning">Low Stock</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="reports-empty" style={{ marginTop: '20px', padding: '20px' }}>
                  <p>All products are well stocked. No low stock items to display.</p>
                </div>
              )}
            </div>
          )}

          {/* Traffic Report */}
          {reportData.type === 'traffic' && reportData.data.overview && (
            <div className="report-section">
              <h3>Traffic Summary</h3>
              <div className="summary-cards">
                <div className="summary-card">
                  <span className="summary-label">Total Views</span>
                  <span className="summary-value">
                    {reportData.data.overview.total_views?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Unique Visitors</span>
                  <span className="summary-value">
                    {reportData.data.overview.unique_visitors?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Avg Views/Session</span>
                  <span className="summary-value">
                    {reportData.data.overview.average_views_per_session?.toFixed(1) || '0.0'}
                  </span>
                </div>
              </div>

              {reportData.data.time_series && reportData.data.time_series.length > 0 ? (
                <div className="report-table-container">
                  <h4>Daily Traffic Breakdown</h4>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Views</th>
                        <th>Unique Visitors</th>
                        <th>Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.time_series.map((item, index) => (
                        <tr key={index}>
                          <td>{formatDate(item.date)}</td>
                          <td>{item.views?.toLocaleString() || 0}</td>
                          <td>{item.unique_visitors?.toLocaleString() || 0}</td>
                          <td>{item.unique_sessions?.toLocaleString() || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="reports-empty" style={{ marginTop: '20px', padding: '20px' }}>
                  <p>No traffic data found for the selected date range.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && !reportData && (
        <div className="reports-empty">
          <p>Select a report type and date range to generate a report.</p>
          <p className="reports-empty-hint">Reports will appear here once generated.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;

