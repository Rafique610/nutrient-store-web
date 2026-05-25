import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import Icon from '../components/ui/Icon';
import { useState } from 'react';
import './Library.css';

export default function Library() {
  const { orders, addToCart } = useAuth();
  const { products } = useProducts();
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [addingKey, setAddingKey] = useState('');

  const totalItems = useMemo(() => (orders || []).reduce((sum, order) => sum + (order.products?.length || 0), 0), [orders]);

  const productIndex = useMemo(() => {
    const index = new Map();
    (products || []).forEach((product) => {
      index.set(String(product.id), product);
    });
    return index;
  }, [products]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders || [];

    return (orders || []).filter((order) =>
      (order.products || []).some((item) =>
        String(item.title || '').toLowerCase().includes(q)
      )
    );
  }, [orders, search]);

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  };

  const getProductForItem = (item) => {
    const id = String(item.product || '');
    if (!id) return null;
    return productIndex.get(id) || { id, title: item.title, price: item.price };
  };

  const handleBuyAgain = async (item, key) => {
    setActionError('');
    const product = getProductForItem(item);
    if (!product) return;
    setAddingKey(key);
    try {
      await addToCart(product);
    } catch (_err) {
      setActionError('Unable to add item to cart');
    } finally {
      setAddingKey('');
    }
  };

  const handleReorderAll = async (order) => {
    setActionError('');
    const items = order?.products || [];
    setAddingKey(order.id);
    try {
      for (const item of items) {
        const product = getProductForItem(item);
        if (product) {
          await addToCart(product);
        }
      }
    } catch (_err) {
      setActionError('Unable to reorder all items');
    } finally {
      setAddingKey('');
    }
  };

  return (
    <div className="library-page">
      <div className="library-header">
        <div>
          <h1 className="page-title"><Icon name="library_books" size={24} /> My Orders</h1>
          <p className="text-muted">{(orders || []).length} order{(orders || []).length !== 1 ? 's' : ''} • {totalItems} item{totalItems !== 1 ? 's' : ''}</p>
        </div>
        {(orders || []).length > 0 && (
          <div className="lib-search-wrap">
            <Icon name="search" className="lib-search-icon" size={16} />
            <input className="lib-search" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}
      </div>
      {actionError && <div className="auth-error" style={{ marginBottom: 16 }}>{actionError}</div>}
      {(orders || []).length === 0 ? (
        <div className="library-empty panel">
          <Icon name="library_books" size={60} className="lib-empty-icon" />
          <h2>Your order history is empty</h2>
          <p>Purchase supplements from the store to start your wellness shelf.</p>
          <Link to="/store" className="btn btn-primary">Browse Store</Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="library-empty panel">
          <p>No products match your search.</p>
          <button className="btn btn-secondary" onClick={() => setSearch('')}>Clear Search</button>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div key={order.id} className="order-card panel">
              <div className="order-head">
                <div>
                  <div className="order-title">Order #{String(order.id).slice(-6).toUpperCase()}</div>
                  <div className="order-meta text-muted text-sm">{formatDate(order.createdAt)} • {(order.products || []).length} item{(order.products || []).length !== 1 ? 's' : ''}</div>
                </div>
                <div className="order-total">${Number(order.totalAmount || 0).toFixed(2)}</div>
              </div>

              <div className="order-items">
                {(order.products || []).map((item) => {
                  const product = getProductForItem(item);
                  const key = `${order.id}:${item.product}`;
                  return (
                    <div key={key} className="order-item">
                      <Link to={`/product/${item.product}`} className="order-item-left">
                        <div className="order-item-thumb">
                          {product?.image ? (
                            <img src={product.image} alt={item.title} />
                          ) : (
                            <span>{String(item.title || '?').slice(0, 1)}</span>
                          )}
                        </div>
                        <div className="order-item-info">
                          <div className="order-item-name">{item.title}</div>
                          <div className="text-muted text-sm">${Number(item.price || 0).toFixed(2)}</div>
                        </div>
                      </Link>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleBuyAgain(item, key)}
                        disabled={addingKey === key}
                      >
                        {addingKey === key ? 'Adding...' : 'Buy Again'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="order-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleReorderAll(order)}
                  disabled={addingKey === order.id}
                >
                  {addingKey === order.id ? 'Adding...' : 'Reorder All'}
                </button>
                <Link to="/cart" className="btn btn-secondary btn-sm">Open Cart</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

