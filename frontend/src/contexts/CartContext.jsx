import { createContext, useContext, useState, useEffect } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStoreId, setCurrentStoreId] = useState(null);
  const { isAuthenticated } = useAuth();

  // Load cart for a store
  const loadCart = async (storeId) => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      setError(null);
      setCurrentStoreId(storeId);
      const response = await cartService.getCart(storeId);
      if (response.success) {
        setCart(response.data.cart);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError(err.response?.data?.error?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (storeId, productId, quantity = 1, variantId = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.addToCart({
        store_id: storeId,
        product_id: productId,
        quantity,
        variant_id: variantId,
      });

      if (response.success) {
        // Reload cart
        await loadCart(storeId);
        return { success: true };
      } else {
        setError(response.error?.message || 'Failed to add to cart');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to add to cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateQuantity = async (itemId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.updateCartItem(itemId, quantity);

      if (response.success) {
        // Reload cart
        if (currentStoreId) {
          await loadCart(currentStoreId);
        }
        return { success: true };
      } else {
        setError(response.error?.message || 'Failed to update cart');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to update cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.removeFromCart(itemId);

      if (response.success) {
        // Reload cart
        if (currentStoreId) {
          await loadCart(currentStoreId);
        }
        return { success: true };
      } else {
        setError(response.error?.message || 'Failed to remove from cart');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to remove from cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async (storeId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.clearCart(storeId);

      if (response.success) {
        setCart(null);
        return { success: true };
      } else {
        setError(response.error?.message || 'Failed to clear cart');
        return { success: false, error: response.error?.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to clear cart';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    error,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    itemCount: cart?.total_items || 0,
    subtotal: cart?.subtotal || '0.00',
    clearError: () => setError(null),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

