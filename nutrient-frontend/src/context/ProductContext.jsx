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
      setError('');
      setProducts(mockproducts);
      return mockproducts;
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
    products: products, // fallback alias
    loading,
    error,
    refreshProducts,
    refreshproducts: refreshProducts, // fallback alias
    addProduct,
    addproduct: addProduct, // fallback alias
    updateProduct,
    updateproduct: updateProduct, // fallback alias
    removeProduct,
    removeproduct: removeProduct, // fallback alias
  }), [products, loading, error, refreshProducts, addProduct, updateProduct, removeProduct]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export const useProducts = () => useContext(ProductContext);

// Fallback exports for gradual refactoring
export { ProductProvider as productProvider, useProducts as useproducts };

