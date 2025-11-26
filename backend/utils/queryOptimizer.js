// Database query optimization utilities

/**
 * Optimize Supabase query by adding select only needed fields
 * @param {Object} query - Supabase query object
 * @param {Array} fields - Array of field names to select
 * @returns {Object} Optimized query
 */
const selectFields = (query, fields) => {
  if (fields && fields.length > 0) {
    return query.select(fields.join(', '));
  }
  return query;
};

/**
 * Add pagination to query
 * @param {Object} query - Supabase query object
 * @param {Number} page - Page number (1-indexed)
 * @param {Number} limit - Items per page
 * @returns {Object} Query with pagination
 */
const addPagination = (query, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return query.range(offset, offset + limit - 1);
};

/**
 * Add date range filter to query
 * @param {Object} query - Supabase query object
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {String} dateField - Date field name (default: 'created_at')
 * @returns {Object} Query with date range filter
 */
const addDateRange = (query, startDate, endDate, dateField = 'created_at') => {
  if (startDate) {
    query = query.gte(dateField, startDate.toISOString());
  }
  if (endDate) {
    query = query.lte(dateField, endDate.toISOString());
  }
  return query;
};

/**
 * Batch queries to avoid N+1 problem
 * @param {Array} ids - Array of IDs
 * @param {Function} queryFn - Function that takes an array of IDs and returns a query
 * @param {Number} batchSize - Size of each batch (default: 100)
 * @returns {Promise<Array>} Combined results
 */
const batchQuery = async (ids, queryFn, batchSize = 100) => {
  const results = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await queryFn(batch);
    results.push(...(batchResults || []));
  }
  return results;
};

/**
 * Cache query result
 * @param {String} key - Cache key
 * @param {Function} queryFn - Function that returns a promise
 * @param {Number} ttl - Time to live in seconds (default: 300)
 * @returns {Promise} Cached or fresh result
 */
const cacheQuery = async (key, queryFn, ttl = 300) => {
  const { cache } = require('./cache');
  const cached = cache.get(key);
  
  if (cached) {
    return cached;
  }
  
  const result = await queryFn();
  cache.set(key, result, ttl);
  return result;
};

module.exports = {
  selectFields,
  addPagination,
  addDateRange,
  batchQuery,
  cacheQuery
};

