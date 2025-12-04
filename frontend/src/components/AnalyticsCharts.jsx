import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import analyticsService from '../services/analyticsService';
import { formatCurrency as formatCurrencyUtil } from '../utils/currency';
import './AnalyticsCharts.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

const AnalyticsCharts = ({ storeId }) => {
  const [salesData, setSalesData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [productViews, setProductViews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    if (storeId) {
      loadAnalyticsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, period]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Load all analytics in parallel for faster loading
      const [salesResult, trafficResult, productViewsResult] = await Promise.allSettled([
        analyticsService.getSalesAnalytics(storeId, {
          period: period,
          group_by: 'day'
        }),
        analyticsService.getTrafficAnalytics(storeId, {
          period: period,
          group_by: 'day'
        }),
        analyticsService.getProductViewAnalytics(storeId, {
          period: period,
          limit: 10
        })
      ]);

      // Process sales data
      if (salesResult.status === 'fulfilled' && salesResult.value.success) {
        setSalesData(salesResult.value.data.analytics || salesResult.value.data);
      }

      // Process traffic data
      if (trafficResult.status === 'fulfilled' && trafficResult.value.success) {
        setTrafficData(trafficResult.value.data.analytics || trafficResult.value.data);
      }

      // Process product views
      if (productViewsResult.status === 'fulfilled' && productViewsResult.value.success) {
        setProductViews(productViewsResult.value.data);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="charts-loading">Loading charts...</div>;
  }

  // Prepare data for charts
  const revenueChartData = (salesData?.time_series || salesData?.analytics?.time_series || []).map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(item.revenue || 0),
    orders: item.orders || 0
  }));

  const trafficChartData = (trafficData?.time_series || trafficData?.analytics?.time_series || []).map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: item.views || 0,
    visitors: item.unique_visitors || 0,
    sessions: item.unique_sessions || 0
  }));

  const eventTypes = trafficData?.event_types || trafficData?.analytics?.event_types || {};
  const eventTypesData = [
    { name: 'Page Views', value: eventTypes.page_view || 0 },
    { name: 'Product Views', value: eventTypes.product_view || 0 },
    { name: 'Add to Cart', value: eventTypes.add_to_cart || 0 },
    { name: 'Purchases', value: eventTypes.purchase || 0 },
    { name: 'Searches', value: eventTypes.search || 0 }
  ].filter(item => item.value > 0);

  const topProductsData = productViews?.products?.slice(0, 5).map(product => ({
    name: product.product_name.length > 20 
      ? product.product_name.substring(0, 20) + '...' 
      : product.product_name,
    views: product.views || 0
  })) || [];

  // Check if we have any data at all
  const salesSummary = salesData?.summary || salesData?.analytics?.overview || salesData?.overview;
  const trafficOverview = trafficData?.overview || trafficData?.analytics?.overview;
  const conversionRates = trafficData?.conversion_rates || trafficData?.analytics?.conversion_rates;
  
  const hasAnyData = 
    revenueChartData.length > 0 || 
    trafficChartData.length > 0 || 
    eventTypesData.length > 0 || 
    topProductsData.length > 0 ||
    salesSummary ||
    trafficOverview;

  const formatCurrency = (value, options = {}) => {
    if (value === null || value === undefined) {
      return formatCurrencyUtil(0);
    }
    if (options.compact) {
      const numValue = Number(value);
      if (numValue >= 100000) {
        return formatCurrencyUtil(numValue / 100000, false) + 'L';
      } else if (numValue >= 1000) {
        return formatCurrencyUtil(numValue / 1000, false) + 'K';
      }
      return formatCurrencyUtil(numValue, false);
    }
    return formatCurrencyUtil(value);
  };

  const formatNumber = (value, options = {}) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: options.decimals ?? 0,
      notation: options.compact ? 'compact' : 'standard'
    }).format(Number(value || 0));

  const formatPercent = (value) =>
    `${Number(value || 0).toFixed(1)}%`;

  const highlightMetrics = [];

  if (salesSummary) {
    highlightMetrics.push(
      {
        label: 'Revenue',
        value: formatCurrency(salesSummary.total_revenue, { compact: true }),
        helper: `${period}-day total`,
        delta: salesSummary.growth_rate,
        accent: 'violet'
      },
      {
        label: 'Orders',
        value: formatNumber(salesSummary.total_orders),
        helper: 'Orders processed',
        accent: 'indigo'
      },
      {
        label: 'Avg. order value',
        value: formatCurrency(salesSummary.average_order_value),
        helper: 'Per delivered order',
        accent: 'blue'
      }
    );
  }

  if (trafficOverview) {
    highlightMetrics.push(
      {
        label: 'Total views',
        value: formatNumber(trafficOverview.total_views, { compact: true }),
        helper: 'Store impressions',
        accent: 'teal'
      },
      {
        label: 'Unique visitors',
        value: formatNumber(trafficOverview.unique_visitors),
        helper: 'People reached',
        accent: 'emerald'
      },
      {
        label: 'Avg. views/session',
        value: formatNumber(trafficOverview.average_views_per_session, { decimals: 1 }),
        helper: 'Engagement depth',
        accent: 'amber'
      }
    );
  }

  const effectiveConversion =
    conversionRates?.purchase_conversion ??
    conversionRates?.overall_conversion ??
    salesSummary?.conversion_rate;

  if (effectiveConversion !== undefined) {
    highlightMetrics.push({
      label: 'Purchase conversion',
      value: formatPercent(effectiveConversion),
      helper: 'Views → purchases',
      accent: 'rose'
    });
  }

  const bestRevenueDay =
    revenueChartData.length > 0
      ? revenueChartData.reduce(
          (best, item) => (item.revenue > best.revenue ? item : best),
          revenueChartData[0]
        )
      : null;

  const bestTrafficDay =
    trafficChartData.length > 0
      ? trafficChartData.reduce(
          (best, item) => (item.views > best.views ? item : best),
          trafficChartData[0]
        )
      : null;

  const insights = [];

  if (salesSummary?.growth_rate > 5) {
    insights.push({
      title: 'Revenue trending up',
      detail: `Sales climbed ${salesSummary.growth_rate.toFixed(1)}% vs the previous window. Keep inventory stocked to ride the momentum.`,
      tone: 'positive'
    });
  } else if (salesSummary?.growth_rate < -5) {
    insights.push({
      title: 'Revenue slowdown detected',
      detail: `Revenue dipped ${Math.abs(salesSummary.growth_rate).toFixed(1)}%. Refresh promotions or review pricing to spark activity.`,
      tone: 'warning'
    });
  }

  if (effectiveConversion !== undefined) {
    if (effectiveConversion >= 3) {
      insights.push({
        title: 'Healthy buyer conversion',
        detail: `Roughly ${effectiveConversion.toFixed(1)}% of engaged shoppers complete a purchase—stronger than most new stores.`,
        tone: 'positive'
      });
    } else {
      insights.push({
        title: 'Boost checkout conversion',
        detail: `Only ${effectiveConversion.toFixed(1)}% of engaged visitors purchase. Simplify checkout or add trust markers to recover carts.`,
        tone: 'warning'
      });
    }
  }

  if (bestRevenueDay) {
    insights.push({
      title: 'Best sales day',
      detail: `${bestRevenueDay.date} brought in ${formatCurrency(bestRevenueDay.revenue)} from ${bestRevenueDay.orders} orders. Mirror the campaigns you ran that day.`,
      tone: 'info'
    });
  }

  if (bestTrafficDay && bestTrafficDay.views > 0) {
    insights.push({
      title: 'Peak traffic spike',
      detail: `${bestTrafficDay.date} delivered ${formatNumber(bestTrafficDay.views)} views. Consider retargeting those visitors.`,
      tone: 'info'
    });
  }

  if (eventTypes.product_view > 0 && eventTypes.add_to_cart === 0) {
    insights.push({
      title: 'Views are not converting',
      detail: 'Customers are browsing but not adding to cart. Double-check product imagery, price anchoring, and featured benefits.',
      tone: 'warning'
    });
  }

  if (insights.length === 0 && hasAnyData) {
    insights.push({
      title: 'Analytics ready',
      detail: 'Great job collecting traffic and order signals. Use the charts below to decide which channels to scale next.',
      tone: 'info'
    });
  }

  return (
    <div className="analytics-charts-container">
      <div className="charts-header">
        <div className="period-selector">
          <button
            className={period === '7' ? 'active' : ''}
            onClick={() => setPeriod('7')}
          >
            7 Days
          </button>
          <button
            className={period === '30' ? 'active' : ''}
            onClick={() => setPeriod('30')}
          >
            30 Days
          </button>
          <button
            className={period === '90' ? 'active' : ''}
            onClick={() => setPeriod('90')}
          >
            90 Days
          </button>
        </div>
      </div>

      {!hasAnyData ? (
        <div className="analytics-empty-state">
          <h3>No Analytics Data Yet</h3>
          <p>
            Analytics data will appear here once you start receiving orders and traffic.
            <br />
            <br />
            <strong>To see analytics:</strong>
          </p>
          <ul className="empty-state-list">
            <li>Add products to your store</li>
            <li>Get customers to make purchases</li>
            <li>Track page views and product views</li>
            <li>Monitor cart additions and conversions</li>
          </ul>
          <p className="empty-state-note">
            Analytics events are automatically tracked when customers interact with your store.
          </p>
        </div>
      ) : (
        <>
          {highlightMetrics.length > 0 && (
            <div className="analytics-highlight-grid">
              {highlightMetrics.slice(0, 4).map((metric, index) => (
                <div key={index} className={`highlight-card accent-${metric.accent || 'indigo'}`}>
                  <div className="highlight-label">{metric.label}</div>
                  <div className="highlight-value">{metric.value}</div>
                  <div className="highlight-helper">{metric.helper}</div>
                  {metric.delta !== undefined && !Number.isNaN(metric.delta) && (
                    <span className={`delta-pill ${metric.delta >= 0 ? 'up' : 'down'}`}>
                      {metric.delta >= 0 ? '+' : ''}
                      {metric.delta.toFixed(1)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {insights.length > 0 && (
            <div className="analytics-insights-panel">
              <div className="insights-header">
                <div>
                  <p>Smart takeaways</p>
                  <h3>What the numbers are saying</h3>
                </div>
                <span className="insight-cap">{period}-day window</span>
              </div>
              <div className="insights-list">
                {insights.slice(0, 3).map((insight, index) => (
                  <div key={index} className={`insight-card tone-${insight.tone || 'info'}`}>
                    <h4>{insight.title}</h4>
                    <p>{insight.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="charts-grid">
        {/* Revenue Trend Chart */}
        {revenueChartData.length > 0 && (
          <div className="chart-card">
            <h3>Revenue & Orders Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#667eea"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#764ba2"
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Traffic Chart */}
        {trafficChartData.length > 0 && (
          <div className="chart-card">
            <h3>Traffic Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trafficChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#667eea" name="Views" />
                <Bar dataKey="visitors" fill="#764ba2" name="Visitors" />
                <Bar dataKey="sessions" fill="#f093fb" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Event Types Pie Chart */}
        {eventTypesData.length > 0 && (
          <div className="chart-card">
            <h3>Event Types Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Products Chart */}
        {topProductsData.length > 0 && (
          <div className="chart-card">
            <h3>Top Viewed Products</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="views" fill="#43e97b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Conversion Funnel */}
        {conversionRates && (
          <div className="chart-card">
            <h3>Conversion Rates</h3>
            <div className="conversion-funnel">
              <div className="funnel-item">
                <div className="funnel-label">Product Views</div>
                <div className="funnel-bar" style={{ width: '100%', backgroundColor: '#667eea' }}>
                  {eventTypes.product_view || 0}
                </div>
              </div>
              <div className="funnel-item">
                <div className="funnel-label">
                  Add to Cart ({conversionRates.cart_conversion?.toFixed(1) || 0}%)
                </div>
                <div
                  className="funnel-bar"
                  style={{
                    width: `${conversionRates.cart_conversion || 0}%`,
                    backgroundColor: '#764ba2'
                  }}
                >
                  {eventTypes.add_to_cart || 0}
                </div>
              </div>
              <div className="funnel-item">
                <div className="funnel-label">
                  Purchases ({conversionRates.purchase_conversion?.toFixed(1) || 0}%)
                </div>
                <div
                  className="funnel-bar"
                  style={{
                    width: `${conversionRates.purchase_conversion || 0}%`,
                    backgroundColor: '#43e97b'
                  }}
                >
                  {eventTypes.purchase || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {(salesSummary || trafficOverview) && (
          <div className="chart-card summary-stats">
            <h3>Summary Statistics</h3>
            <div className="stats-grid">
              {salesSummary && (
                <>
                  <div className="stat-item">
                    <span className="stat-label">Total Revenue</span>
                    <span className="stat-value">
                      {formatCurrency(salesSummary.total_revenue || 0)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Orders</span>
                    <span className="stat-value">{salesSummary.total_orders || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Avg Order Value</span>
                    <span className="stat-value">
                      {formatCurrency(salesSummary.average_order_value || 0)}
                    </span>
                  </div>
                </>
              )}
              {trafficOverview && (
                <>
                  <div className="stat-item">
                    <span className="stat-label">Total Views</span>
                    <span className="stat-value">{trafficOverview.total_views || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unique Visitors</span>
                    <span className="stat-value">{trafficOverview.unique_visitors || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Avg Views/Session</span>
                    <span className="stat-value">
                      {trafficOverview.average_views_per_session?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsCharts;

