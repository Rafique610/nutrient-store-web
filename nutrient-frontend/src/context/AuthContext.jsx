import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, normalizeUser, orderApi, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [purchasedProducts, setPurchasedProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const STORAGE_KEYS = useMemo(() => ({
    token: 'ns_token',
    user: 'ns_user',
    cart: 'ns_cart',
    purchasedProducts: 'ns_purchased_products',
    orders: 'ns_orders',
  }), []);

  const persistUser = (nextUser) => {
    if (nextUser) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  };

  const applyCart = (items) => {
    const normalized = items || [];
    setCartItems(normalized);
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(normalized));
  };

  const applyPurchasedProducts = (items) => {
    const normalized = items || [];
    setPurchasedProducts(normalized);
    localStorage.setItem(STORAGE_KEYS.purchasedProducts, JSON.stringify(normalized));
  };

  const loadAccountData = async () => {
    const [cartData, libraryData, orderData] = await Promise.allSettled([
      orderApi.getCart(),
      orderApi.library(),
      orderApi.list(),
    ]);

    if (cartData.status === 'fulfilled') applyCart(cartData.value.items || []);
    else applyCart([]);

    if (libraryData.status === 'fulfilled') applyPurchasedProducts(libraryData.value.products || []);
    else applyPurchasedProducts([]);

    if (orderData.status === 'fulfilled') {
      const nextOrders = orderData.value.orders || [];
      setOrders(nextOrders);
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(nextOrders));
    } else {
      setOrders([]);
      localStorage.removeItem(STORAGE_KEYS.orders);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      if (!localStorage.getItem(STORAGE_KEYS.token) && localStorage.getItem('gv_token')) {
        localStorage.setItem(STORAGE_KEYS.token, localStorage.getItem('gv_token'));
      }

      if (!localStorage.getItem(STORAGE_KEYS.user) && localStorage.getItem('gv_user')) {
        localStorage.setItem(STORAGE_KEYS.user, localStorage.getItem('gv_user'));
      }

      if (!localStorage.getItem(STORAGE_KEYS.cart) && localStorage.getItem('gv_cart')) {
        localStorage.setItem(STORAGE_KEYS.cart, localStorage.getItem('gv_cart'));
      }

      ['gv_token', 'gv_user', 'gv_cart', 'gv_library', 'gv_orders', 'ns_library'].forEach((key) => localStorage.removeItem(key));

      const savedToken = localStorage.getItem(STORAGE_KEYS.token);
      const savedUser = savedToken ? localStorage.getItem(STORAGE_KEYS.user) : null;

      if (!savedToken) {
        setAuthToken('');
        setUser(null);
        setCartItems([]);
        setPurchasedProducts([]);
        setOrders([]);
        persistUser(null);
        localStorage.removeItem(STORAGE_KEYS.cart);
        localStorage.removeItem(STORAGE_KEYS.purchasedProducts);
        localStorage.removeItem(STORAGE_KEYS.orders);
        setLoading(false);
        return;
      }

      if (savedUser) setUser(JSON.parse(savedUser));

      setAuthToken(savedToken);

      try {
        const data = await authApi.me();
        const normalizedUser = normalizeUser(data.user);
        setUser(normalizedUser);
        persistUser(normalizedUser);
        await loadAccountData();
      } catch (_err) {
        setAuthToken('');
        setUser(null);
        setCartItems([]);
        setPurchasedProducts([]);
        setOrders([]);
        persistUser(null);
        localStorage.removeItem(STORAGE_KEYS.cart);
        localStorage.removeItem(STORAGE_KEYS.purchasedProducts);
        localStorage.removeItem(STORAGE_KEYS.orders);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      setAuthToken(data.token);
      const normalizedUser = normalizeUser(data.user);
      setUser(normalizedUser);
      persistUser(normalizedUser);
      await loadAccountData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid email or password.' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authApi.register({ name, email, password });
      setAuthToken(data.token);
      const normalizedUser = normalizeUser(data.user);
      setUser(normalizedUser);
      persistUser(normalizedUser);
      applyCart([]);
      applyPurchasedProducts([]);
      setOrders([]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Unable to create account.' };
    }
  };

  const logout = () => {
    setAuthToken('');
    setUser(null);
    setCartItems([]);
    setPurchasedProducts([]);
    setOrders([]);
    persistUser(null);
    localStorage.removeItem(STORAGE_KEYS.cart);
    localStorage.removeItem(STORAGE_KEYS.purchasedProducts);
    localStorage.removeItem(STORAGE_KEYS.orders);
  };

  const refreshCart = async () => {
    const data = await orderApi.getCart();
    applyCart(data.items || []);
  };

  const refreshPurchasedProducts = async () => {
    const data = await orderApi.library();
    applyPurchasedProducts(data.products || []);
  };

  const refreshOrders = async () => {
    const data = await orderApi.list();
    const nextOrders = data.orders || [];
    setOrders(nextOrders);
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(nextOrders));
  };

  const addToCart = async (product) => {
    if (!user || !product) return false;
    if (cartItems.find((item) => item.id === product.id)) return false;

    try {
      const data = await orderApi.addToCart(product.id);
      applyCart(data.items || []);
      return true;
    } catch (_err) {
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const data = await orderApi.removeFromCart(productId);
      applyCart(data.items || []);
    } catch (_err) {
      const newCart = cartItems.filter((item) => item.id !== String(productId));
      applyCart(newCart);
    }
  };

  const clearCart = async () => {
    try {
      await orderApi.clearCart();
    } catch (_err) {
      // Local cleanup still keeps the UI honest if the session just expired.
    }
    applyCart([]);
  };

  const checkout = async (paymentMethod = 'mock') => {
    const data = await orderApi.checkout({ paymentMethod });
    applyCart([]);
    applyPurchasedProducts(data.library || []);
    await refreshOrders();
    return data.order;
  };

  const updateProfile = async (profile) => {
    const data = await authApi.updateProfile(profile);
    const normalizedUser = normalizeUser(data.user);
    setUser(normalizedUser);
    persistUser(normalizedUser);
    return normalizedUser;
  };

  const purchasedProductIds = useMemo(() => purchasedProducts.map((product) => product.id), [purchasedProducts]);
  const cartTotal = cartItems.reduce((sum, product) => sum + (product.price || 0), 0);
  const cartCount = cartItems.length;
  const isInCart = (id) => cartItems.some((product) => product.id === String(id));
  const isOwned = (id) => purchasedProductIds.includes(String(id));

  return (
    <AuthContext.Provider value={{
      user, loading, cartItems, purchasedProductIds, purchasedProducts, orders, cartTotal, cartCount,
      login, register, logout, addToCart, removeFromCart,
      clearCart, checkout, updateProfile, refreshCart,
      refreshPurchasedProducts, refreshOrders, isInCart, isOwned
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

