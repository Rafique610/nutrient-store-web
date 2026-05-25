import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { productsApi } from '../services/api';
import { mockproducts } from '../data/mockData';

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await productsApi.list({ limit: 100, sort: 'featured' });
      setProducts(data.products || []);
      return data.products || [];
    } catch (err) {
      const apiUrl = String(import.meta.env.VITE_API_URL || '');
      const allowMockFallback = !apiUrl || apiUrl.includes('localhost');
      if (allowMockFallback) {
        setError('');
        setProducts(mockproducts);
        return mockproducts;
      }

      setError(err?.message || 'Unable to load products');
      setProducts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const addProduct = useCallback((product) => {
    setProducts((current) => [product, ...current.filter((item) => item.id !== product.id)]);
  }, []);

  const updateProduct = useCallback((product) => {
    setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
  }, []);

  const removeProduct = useCallback((id) => {
    setProducts((current) => current.filter((item) => item.id !== String(id)));
  }, []);

  const value = useMemo(() => ({
    products,
    loading,
    error,
    refreshProducts,
    refreshproducts: refreshProducts,
    addProduct,
    addproduct: addProduct,
    updateProduct,
    updateproduct: updateProduct,
    removeProduct,
    removeproduct: removeProduct,
  }), [products, loading, error, refreshProducts, addProduct, updateProduct, removeProduct]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export const useProducts = () => useContext(ProductContext);

export { ProductProvider as productProvider, useProducts as useproducts };

