import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { cartActions } from '../store';
import { useAuth } from './AuthContext';
import { useSnackbar } from './SnackbarContext';

/* eslint-disable react-refresh/only-export-components */
const CartContext = createContext(null);
const storageKey = 'recordia_cart';

export function CartProvider({ children }) {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const { user, loading: authLoading } = useAuth();
  const { showError } = useSnackbar();

  const persist = useCallback((nextItems) => {
    dispatch(cartActions.replaceItems(nextItems));
    localStorage.setItem(storageKey, JSON.stringify(nextItems));
  }, [dispatch]);

  useEffect(() => {
    if (!authLoading && !user && items.length > 0) {
      // Auth resolution can invalidate cart state loaded before identity was known.
      persist([]);
    }
  }, [authLoading, items.length, persist, user]);

  const addToCart = useCallback((product, quantity = 1) => {
    if (!user) {
      showError('Please log in or register before adding items to your cart.');
      return false;
    }
    if (user.role === 'admin') {
      showError('Admin accounts cannot add items to the customer cart.');
      return false;
    }
    const existing = items.find((item) => item.product === product._id);
    const nextQuantity = Math.min(
      product.stocks,
      (existing?.quantity || 0) + Number(quantity),
    );
    const nextItems = existing
      ? items.map((item) => item.product === product._id
        ? { ...item, quantity: nextQuantity, stocks: product.stocks }
        : item)
      : [...items, {
        product: product._id,
        name: product.album_title,
        price: product.price,
        image: product.images?.[0]?.url || '',
        stocks: product.stocks,
        quantity: Math.min(product.stocks, Number(quantity)),
      }];
    persist(nextItems.filter((item) => item.quantity > 0));
    return true;
  }, [items, persist, showError, user]);

  const removeFromCart = useCallback((productId) => persist(items.filter((item) => item.product !== productId)), [items, persist]);

  const removeItems = useCallback((productIds) => {
    const ids = new Set(productIds);
    persist(items.filter((item) => !ids.has(item.product)));
  }, [items, persist]);

  const changeQuantity = useCallback((productId, quantity) => {
    const item = items.find((entry) => entry.product === productId);
    if (!item) return;
    const nextQuantity = Math.max(1, Math.min(Number(quantity), item.stocks));
    persist(items.map((entry) => entry.product === productId
      ? { ...entry, quantity: nextQuantity }
      : entry));
  }, [items, persist]);

  const clearCart = useCallback(() => {
    dispatch(cartActions.clearItems());
    localStorage.removeItem(storageKey);
  }, [dispatch]);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(() => ({
    items,
    itemCount,
    itemsPrice,
    addToCart,
    removeFromCart,
    removeItems,
    changeQuantity,
    clearCart,
  }), [items, itemCount, itemsPrice, addToCart, removeFromCart, removeItems, changeQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

export { useCart };
