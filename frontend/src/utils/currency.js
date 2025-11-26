/**
 * Currency formatting utility
 * Formats numbers as Indian Rupees (₹)
 */

/**
 * Format a number as currency in Indian Rupees
 * @param {number|string} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: true)
 * @returns {string} Formatted currency string (e.g., "₹1,234.56" or "₹1,235")
 */
export const formatCurrency = (amount, showDecimals = true) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '₹0.00';
  }

  if (showDecimals) {
    return `₹${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  } else {
    return `₹${Math.round(numAmount).toLocaleString('en-IN')}`;
  }
};

/**
 * Format a number as currency without symbol (just the formatted number)
 * @param {number|string} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: true)
 * @returns {string} Formatted number string (e.g., "1,234.56" or "1,235")
 */
export const formatAmount = (amount, showDecimals = true) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0.00';
  }

  if (showDecimals) {
    return numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } else {
    return Math.round(numAmount).toLocaleString('en-IN');
  }
};

/**
 * Get currency symbol
 * @returns {string} Currency symbol (₹)
 */
export const getCurrencySymbol = () => '₹';

