import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import predictionService from '../services/predictionService';
import promoService from '../services/promoService';
import pricingService from '../services/pricingService';
import inventoryService from '../services/inventoryService';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';
import './StoreInsights.css';

const StoreInsights = ({ storeId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState({
    salesPredictions: null,
    promoSuggestions: null,
    pricingStrategy: null,
    inventoryAlerts: null,
    performanceMetrics: null
  });

  useEffect(() => {
    if (storeId) {
      loadInsights();
    }
  }, [storeId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all insights in parallel
      const [
        salesPredictionResult,
        promoSuggestionsResult,
        pricingStrategyResult,
        inventorySummaryResult,
        salesSummaryResult,
        trafficResult
      ] = await Promise.allSettled([
        predictionService.getSalesPredictions(storeId, { period: 30 }),
        promoService.getPromoSuggestions(storeId),
        pricingService.getPricingStrategy(storeId),
        inventoryService.getInventorySummary(storeId),
        analyticsService.getSalesSummary(storeId, 30),
        analyticsService.getTrafficAnalytics(storeId, { period: 30 })
      ]);

      // Log results for debugging
      console.log('Insights API Results:', {
        salesPrediction: {
          status: salesPredictionResult.status,
          success: salesPredictionResult.status === 'fulfilled' ? salesPredictionResult.value.success : null,
          data: salesPredictionResult.status === 'fulfilled' ? salesPredictionResult.value.data : null,
          error: salesPredictionResult.status === 'rejected' ? salesPredictionResult.reason : null
        },
        promoSuggestions: {
          status: promoSuggestionsResult.status,
          success: promoSuggestionsResult.status === 'fulfilled' ? promoSuggestionsResult.value.success : null,
          error: promoSuggestionsResult.status === 'rejected' ? promoSuggestionsResult.reason : null
        },
        pricingStrategy: {
          status: pricingStrategyResult.status,
          success: pricingStrategyResult.status === 'fulfilled' ? pricingStrategyResult.value.success : null,
          error: pricingStrategyResult.status === 'rejected' ? pricingStrategyResult.reason : null
        },
        inventorySummary: {
          status: inventorySummaryResult.status,
          success: inventorySummaryResult.status === 'fulfilled' ? inventorySummaryResult.value.success : null,
          error: inventorySummaryResult.status === 'rejected' ? inventorySummaryResult.reason : null
        },
        salesSummary: {
          status: salesSummaryResult.status,
          success: salesSummaryResult.status === 'fulfilled' ? salesSummaryResult.value.success : null,
          error: salesSummaryResult.status === 'rejected' ? salesSummaryResult.reason : null
        },
        traffic: {
          status: trafficResult.status,
          success: trafficResult.status === 'fulfilled' ? trafficResult.value.success : null,
          error: trafficResult.status === 'rejected' ? trafficResult.reason : null
        }
      });

      setInsights({
        salesPredictions: salesPredictionResult.status === 'fulfilled' && salesPredictionResult.value.success
          ? salesPredictionResult.value.data
          : null,
        promoSuggestions: promoSuggestionsResult.status === 'fulfilled' && promoSuggestionsResult.value.success
          ? promoSuggestionsResult.value.data
          : null,
        pricingStrategy: pricingStrategyResult.status === 'fulfilled' && pricingStrategyResult.value.success
          ? pricingStrategyResult.value.data
          : null,
        inventoryAlerts: inventorySummaryResult.status === 'fulfilled' && inventorySummaryResult.value.success
          ? inventorySummaryResult.value.data
          : null,
        performanceMetrics: {
          sales: salesSummaryResult.status === 'fulfilled' && salesSummaryResult.value.success
            ? salesSummaryResult.value.data.summary
            : null,
          traffic: trafficResult.status === 'fulfilled' && trafficResult.value.success
            ? trafficResult.value.data.analytics
            : null
        }
      });
    } catch (error) {
      console.error('Failed to load insights:', error);
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount);
  };

  const getInsightPriority = (insight) => {
    if (!insight || typeof insight !== 'object') return 'low';
    if (insight.priority === 'high') return 'high';
    if (insight.priority === 'medium') return 'medium';
    return 'low';
  };

  // Check if any insights are available
  const hasAnyInsights = 
    insights.performanceMetrics?.sales || 
    insights.performanceMetrics?.traffic ||
    insights.salesPredictions ||
    insights.promoSuggestions ||
    insights.pricingStrategy ||
    insights.inventoryAlerts;

  if (loading) {
    return (
      <div className="insights-loading">
        <p>Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="store-insights-container">
      <div className="insights-header">
        <button className="refresh-btn" onClick={loadInsights}>
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="insights-error">
          <p>{error}</p>
        </div>
      )}

      {!hasAnyInsights && !loading && (
        <div className="insights-empty-state">
          <h3>No Insights Available Yet</h3>
          <p>
            Insights will appear here once you have:
          </p>
          <ul>
            <li>Created products and received orders</li>
            <li>Generated sales and traffic data</li>
            <li>Set up inventory tracking</li>
          </ul>
          <div className="empty-actions">
            <button
              className="action-card"
              onClick={() => navigate(`/stores/${storeId}/products/create`)}
            >
              <span className="action-label">Add Your First Product</span>
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics Overview - Always show if we have any data */}
      {(insights.performanceMetrics?.sales || insights.performanceMetrics?.traffic) && (
        <div className="insights-section">
          <h3>Performance Overview</h3>
          <div className="metrics-grid">
            {insights.performanceMetrics.sales ? (
              <>
                <div className="metric-card">
                  <span className="metric-label">Revenue (30 days)</span>
                  <span className="metric-value">
                    {formatCurrency(insights.performanceMetrics.sales.total_revenue || 0)}
                  </span>
                  {insights.performanceMetrics.sales.growth_rate !== undefined && (
                    <span className={`metric-change ${insights.performanceMetrics.sales.growth_rate >= 0 ? 'positive' : 'negative'}`}>
                      {insights.performanceMetrics.sales.growth_rate >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(insights.performanceMetrics.sales.growth_rate || 0).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="metric-card">
                  <span className="metric-label">Orders</span>
                  <span className="metric-value">
                    {insights.performanceMetrics.sales.total_orders || 0}
                  </span>
                  <span className="metric-subtitle">
                    Avg: {formatCurrency(insights.performanceMetrics.sales.average_order_value || 0)}
                  </span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Conversion Rate</span>
                  <span className="metric-value">
                    {(insights.performanceMetrics.sales.conversion_rate || 0).toFixed(1)}%
                  </span>
                  <span className="metric-subtitle">Views to Orders</span>
                </div>
              </>
            ) : (
              <div className="metric-card">
                <span className="metric-label">No Sales Data</span>
                <span className="metric-value">$0.00</span>
                <span className="metric-subtitle">Start selling to see insights</span>
              </div>
            )}
            {insights.performanceMetrics.traffic ? (
              <div className="metric-card">
                <span className="metric-label">Traffic</span>
                <span className="metric-value">
                  {(insights.performanceMetrics.traffic.overview?.total_views || 0).toLocaleString()}
                </span>
                <span className="metric-subtitle">
                  {insights.performanceMetrics.traffic.overview?.unique_visitors || 0} unique visitors
                </span>
              </div>
            ) : (
              <div className="metric-card">
                <span className="metric-label">No Traffic Data</span>
                <span className="metric-value">0</span>
                <span className="metric-subtitle">Share your store to get visitors</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sales Predictions */}
      {insights.salesPredictions && insights.salesPredictions.predictions && (
        <div className="insights-section">
          <h3>Sales Predictions</h3>
          <div className="prediction-cards">
            <div className="prediction-card">
              <div className="prediction-header">
                <span className="prediction-label">Next 7 Days</span>
              </div>
              <div className="prediction-value">
                {formatCurrency(insights.salesPredictions.predictions.next_7_days?.predicted_revenue || 0)}
              </div>
              <div className="prediction-details">
                Expected {insights.salesPredictions.predictions.next_7_days?.predicted_orders || 0} orders
              </div>
              {insights.salesPredictions.predictions.next_7_days?.confidence && (
                <div className="prediction-confidence">
                  Confidence: {insights.salesPredictions.predictions.next_7_days.confidence}%
                </div>
              )}
            </div>
            <div className="prediction-card">
              <div className="prediction-header">
                <span className="prediction-label">Next 30 Days</span>
              </div>
              <div className="prediction-value">
                {formatCurrency(insights.salesPredictions.predictions.next_30_days?.predicted_revenue || 0)}
              </div>
              <div className="prediction-details">
                Expected {insights.salesPredictions.predictions.next_30_days?.predicted_orders || 0} orders
              </div>
              {insights.salesPredictions.predictions.next_30_days?.confidence && (
                <div className="prediction-confidence">
                  Confidence: {insights.salesPredictions.predictions.next_30_days.confidence}%
                </div>
              )}
            </div>
          </div>
          {insights.salesPredictions.predictions.recommendations && 
           Array.isArray(insights.salesPredictions.predictions.recommendations) && 
           insights.salesPredictions.predictions.recommendations.length > 0 && (
            <div className="recommendations-box">
              <h4>AI Recommendations</h4>
              <ul>
                {insights.salesPredictions.predictions.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Promotional Suggestions */}
      {insights.promoSuggestions && 
       insights.promoSuggestions.suggestions && 
       Array.isArray(insights.promoSuggestions.suggestions) && 
       insights.promoSuggestions.suggestions.length > 0 && (
        <div className="insights-section">
          <h3>Promotional Opportunities</h3>
          <div className="suggestions-grid">
            {insights.promoSuggestions.suggestions.slice(0, 6).map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-card priority-${getInsightPriority(suggestion)}`}
              >
                <div className="suggestion-header">
                  <span className="suggestion-type">{suggestion.type || 'Promotion'}</span>
                  <span className={`priority-badge priority-${getInsightPriority(suggestion)}`}>
                    {suggestion.priority || 'medium'}
                  </span>
                </div>
                <h4>{suggestion.title || 'Promotional Opportunity'}</h4>
                <p>{suggestion.description || 'No description available'}</p>
                {suggestion.products && Array.isArray(suggestion.products) && suggestion.products.length > 0 && (
                  <div className="suggestion-products">
                    <strong>Products:</strong> {suggestion.products.map(p => p.name || p).join(', ')}
                  </div>
                )}
                {suggestion.expected_impact && (
                  <div className="suggestion-impact">
                    Expected Impact: {suggestion.expected_impact}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Strategy Insights */}
      {insights.pricingStrategy && insights.pricingStrategy.analysis && (
        <div className="insights-section">
          <h3>Pricing Strategy Analysis</h3>
          <div className="strategy-cards">
            <div className="strategy-card">
              <h4>Current Strategy</h4>
              <p>{insights.pricingStrategy.analysis.current_strategy || 'Standard pricing'}</p>
            </div>
            {insights.pricingStrategy.analysis.recommendations && 
             Array.isArray(insights.pricingStrategy.analysis.recommendations) && 
             insights.pricingStrategy.analysis.recommendations.length > 0 && (
              <div className="strategy-card">
                <h4>Recommendations</h4>
                <ul>
                  {insights.pricingStrategy.analysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            {insights.pricingStrategy.analysis.opportunities && 
             Array.isArray(insights.pricingStrategy.analysis.opportunities) && 
             insights.pricingStrategy.analysis.opportunities.length > 0 && (
              <div className="strategy-card">
                <h4>Opportunities</h4>
                <ul>
                  {insights.pricingStrategy.analysis.opportunities.map((opp, index) => (
                    <li key={index}>{opp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventory Alerts */}
      {insights.inventoryAlerts ? (
        <div className="insights-section">
          <h3>Inventory Alerts</h3>
          <div className="alert-cards">
            {insights.inventoryAlerts.low_stock_count > 0 && (
              <div className="alert-card alert-warning">
                <div className="alert-content">
                  <h4>Low Stock Items</h4>
                  <p>{insights.inventoryAlerts.low_stock_count} products need restocking</p>
                  <button
                    className="alert-action"
                    onClick={() => navigate(`/stores/${storeId}/inventory`)}
                  >
                    View Inventory →
                  </button>
                </div>
              </div>
            )}
            {insights.inventoryAlerts.out_of_stock_count > 0 && (
              <div className="alert-card alert-danger">
                <div className="alert-content">
                  <h4>Out of Stock</h4>
                  <p>{insights.inventoryAlerts.out_of_stock_count} products are out of stock</p>
                  <button
                    className="alert-action"
                    onClick={() => navigate(`/stores/${storeId}/inventory`)}
                  >
                    View Inventory →
                  </button>
                </div>
              </div>
            )}
            {(insights.inventoryAlerts.low_stock_count === 0 && insights.inventoryAlerts.out_of_stock_count === 0) && (
              <div className="alert-card alert-success">
                <div className="alert-content">
                  <h4>Inventory Status</h4>
                  <p>All products are well-stocked</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="insights-section">
          <h3>Inventory Alerts</h3>
          <div className="alert-cards">
            <div className="alert-card alert-success">
              <div className="alert-content">
                <h4>No Inventory Data</h4>
                <p>Add products with inventory tracking to see alerts</p>
                <button
                  className="alert-action"
                  onClick={() => navigate(`/stores/${storeId}/products/create`)}
                >
                  Add Product →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="insights-section">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button
            className="action-card"
            onClick={() => navigate(`/stores/${storeId}/products/create`)}
          >
            <span className="action-label">Add Product</span>
          </button>
          <button
            className="action-card"
            onClick={() => navigate(`/stores/${storeId}/orders`)}
          >
            <span className="action-label">View Orders</span>
          </button>
          <button
            className="action-card"
            onClick={() => navigate(`/stores/${storeId}/dashboard?tab=reports`)}
          >
            <span className="action-label">Generate Report</span>
          </button>
          <button
            className="action-card"
            onClick={() => navigate(`/stores/${storeId}/dashboard?tab=analytics`)}
          >
            <span className="action-label">View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreInsights;

