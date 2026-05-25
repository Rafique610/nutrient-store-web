import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, normalizeUser, orderApi, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [libraryGames, setLibraryGames] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const persistUser = (nextUser) => {
    if (nextUser) localStorage.setItem('gv_user', JSON.stringify(nextUser));
    else localStorage.removeItem('gv_user');
  };

  const applyCart = (items) => {
    const normalized = items || [];
    setCart(normalized);
    localStorage.setItem('gv_cart', JSON.stringify(normalized));
  };

  const applyLibrary = (items) => {
    const normalized = items || [];
    setLibraryGames(normalized);
    localStorage.setItem('gv_library', JSON.stringify(normalized.map((game) => game.id)));
  };

  const loadAccountData = async () => {
    const [cartData, libraryData, orderData] = await Promise.all([
      orderApi.getCart(),
      orderApi.library(),
      orderApi.list(),
    ]);

    applyCart(cartData.items || []);
    applyLibrary(libraryData.games || []);
    setOrders(orderData.orders || []);
  };

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('gv_token');
      const savedUser = localStorage.getItem('gv_user');

      if (savedUser) setUser(JSON.parse(savedUser));
      if (!savedToken) {
        setLoading(false);
        return;
      }

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
        setCart([]);
        setLibraryGames([]);
        setOrders([]);
        localStorage.removeItem('gv_user');
        localStorage.removeItem('gv_cart');
        localStorage.removeItem('gv_library');
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

  const register = async (name, email, password, role) => {
    try {
      const data = await authApi.register({ name, email, password, role });
      setAuthToken(data.token);
      const normalizedUser = normalizeUser(data.user);
      setUser(normalizedUser);
      persistUser(normalizedUser);
      applyCart([]);
      applyLibrary([]);
      setOrders([]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Unable to create account.' };
    }
  };

  const logout = () => {
    setAuthToken('');
    setUser(null);
    setCart([]);
    setLibraryGames([]);
    setOrders([]);
    persistUser(null);
    localStorage.removeItem('gv_cart');
    localStorage.removeItem('gv_library');
  };

  const refreshCart = async () => {
    const data = await orderApi.getCart();
    applyCart(data.items || []);
  };

  const refreshLibrary = async () => {
    const data = await orderApi.library();
    applyLibrary(data.games || []);
  };

  const refreshOrders = async () => {
    const data = await orderApi.list();
    setOrders(data.orders || []);
  };

  const addToCart = async (game) => {
    if (!user || !game) return false;
    if (cart.find((item) => item.id === game.id)) return false;
    if (libraryGames.some((item) => item.id === game.id)) return false;

    try {
      const data = await orderApi.addToCart(game.id);
      applyCart(data.items || []);
      return true;
    } catch (_err) {
      return false;
    }
  };

  const removeFromCart = async (gameId) => {
    try {
      const data = await orderApi.removeFromCart(gameId);
      applyCart(data.items || []);
    } catch (_err) {
      const newCart = cart.filter((item) => item.id !== String(gameId));
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

  const purchaseGames = async (_gameIds, paymentMethod = 'mock') => {
    const data = await orderApi.checkout({ paymentMethod });
    applyCart([]);
    applyLibrary(data.library || []);
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

  const library = useMemo(() => libraryGames.map((game) => game.id), [libraryGames]);
  const cartTotal = cart.reduce((sum, game) => sum + (game.price || 0), 0);
  const cartCount = cart.length;
  const isInCart = (id) => cart.some((game) => game.id === String(id));
  const isOwned = (id) => library.includes(String(id));

  return (
    <AuthContext.Provider value={{
      user, loading, cart, library, libraryGames, orders, cartTotal, cartCount,
      login, register, logout, addToCart, removeFromCart,
      clearCart, purchaseGames, updateProfile, refreshCart,
      refreshLibrary, refreshOrders, isInCart, isOwned
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
