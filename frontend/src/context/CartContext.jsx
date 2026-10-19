import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/* eslint-disable react-refresh/only-export-components */
const CartContext = createContext(null);
const storageKey = 'recordia_cart';

const readCart = () => {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  const persist = useCallback((nextItems) => {
    setItems(nextItems);
    localStorage.setItem(storageKey, JSON.stringify(nextItems));
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
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
  }, [items, persist]);

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

  const clearCart = useCallback(() => persist([]), [persist]);
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
