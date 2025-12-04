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

/**
 * Calculate shipping cost based on cart subtotal
 * Free shipping for orders over ₹500, otherwise ₹110
 * @param {number|string} subtotal - The cart subtotal amount
 * @returns {number} Shipping cost (0 if subtotal >= 500, otherwise 110)
 */
export const calculateShipping = (subtotal) => {
  const numSubtotal = typeof subtotal === 'string' ? parseFloat(subtotal) : subtotal;
  
  if (isNaN(numSubtotal) || numSubtotal <= 0) {
    return 110; // Default shipping for empty/invalid cart
  }
  
  // Free shipping for orders ₹500 and above
  if (numSubtotal >= 500) {
    return 0;
  }
  
  // ₹110 shipping for orders under ₹500
  return 110;
};

