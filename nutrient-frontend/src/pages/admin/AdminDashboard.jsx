import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { adminApi } from '../../services/api';
import { GENRE_COLORS } from '../../data/mockData';
import './AdminDashboard.css';

const emptyStats = {
  totalUsers: 0,
  totalproducts: 0,
  totalRevenue: 0,
  totalOrders: 0,
  activeproducts: 0,
  pendingApprovals: 0,
  pendingOrders: 0,
  lowStockCount: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [products, setproducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [statsData, productData, userData, orderData] = await Promise.all([
          adminApi.stats(),
          adminApi.products(),
          adminApi.users(),
          adminApi.orders({ limit: 12 }),
        ]);
        setStats({ ...emptyStats, ...statsData });
        setproducts(productData.products || []);
        setUsers(userData.users || []);
        setOrders(orderData.orders || []);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const topproducts = [...products].sort((a, b) => b.downloads - a.downloads).slice(0, 5);
  const lowStockProducts = products
    .filter((p) => p.inStock && Number(p.stock || 0) <= Number(p.lowStockThreshold || 5))
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 6);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1 className="admin-title">Dashboard</h1><p className="admin-subtitle">Platform overview and analytics</p></div>
        <div className="admin-header-actions"><Link to="/admin/products" className="btn btn-primary btn-sm"><Icon name="apps" size={16} /> Manage Products</Link></div>
      </div>
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="admin-stats-grid">
        <div className="admin-stat-card"><div className="stat-card-icon" style={{ background: 'rgba(240,169,64,0.15)', color: '#f0a940' }}><Icon name="receipt_long" size={22} /></div><div className="stat-card-body"><div className="stat-card-value">{stats.pendingOrders.toLocaleString()}</div><div className="stat-card-label">Pending Orders</div></div><div className="stat-card-trend up">New + Processing</div></div>
        <div className="admin-stat-card"><div className="stat-card-icon" style={{ background: 'rgba(224,85,85,0.12)', color: 'var(--red)' }}><Icon name="inventory_2" size={22} /></div><div className="stat-card-body"><div className="stat-card-value">{stats.lowStockCount.toLocaleString()}</div><div className="stat-card-label">Low Stock</div></div><div className="stat-card-trend up">Needs attention</div></div>
        <div className="admin-stat-card"><div className="stat-card-icon" style={{ background: 'rgba(35,201,183,0.16)', color: 'var(--accent)' }}><Icon name="apps" size={22} /></div><div className="stat-card-body"><div className="stat-card-value">{stats.totalproducts}</div><div className="stat-card-label">Total Products</div></div><div className="stat-card-trend up">{stats.pendingApprovals} drafts</div></div>
        <div className="admin-stat-card"><div className="stat-card-icon" style={{ background: 'rgba(155,89,182,0.15)', color: '#9b59b6' }}><Icon name="attach_money" size={22} /></div><div className="stat-card-body"><div className="stat-card-value">${stats.totalRevenue >= 1000 ? `${(stats.totalRevenue / 1000).toFixed(1)}K` : stats.totalRevenue.toFixed(2)}</div><div className="stat-card-label">Revenue</div></div><div className="stat-card-trend up">{stats.totalOrders.toLocaleString()} orders</div></div>
      </div>
      <div className="admin-content-grid">
        <div className="admin-panel">
          <div className="admin-panel-header"><h2><Icon name="receipt_long" size={18} /> Recent Orders</h2><Link to="/admin/orders" className="admin-panel-link">View All <Icon name="arrow_forward" size={14} /></Link></div>
          <div className="top-products-list">
            {orders.slice(0, 6).map((order) => (
              <div key={order.id} className="top-product-row">
                <span className="top-product-rank">{order.id.slice(-6).toUpperCase()}</span>
                <div className="top-product-cover" style={{ background: 'rgba(109,91,255,0.12)', color: 'var(--accent)' }}>
                  <Icon name="receipt_long" size={16} />
                </div>
                <div className="top-product-info">
                  <div className="top-product-title">{order.user?.name || 'Customer'}</div>
                  <div className="top-product-meta">
                    <span className="tag">{order.fulfillmentStatus || 'new'}</span>
                    <span className="text-muted text-sm">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</span>
                  </div>
                </div>
                <div className="top-product-stats">
                  <div className="top-product-price">${Number(order.totalAmount || 0).toFixed(2)}</div>
                  <div className="top-product-rating text-muted text-sm">{order.products?.length || 0} items</div>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-muted">No orders yet.</p>}
          </div>
        </div>
        <div className="admin-panel">
          <div className="admin-panel-header"><h2><Icon name="trending_up" size={18} /> Top Selling Products</h2><Link to="/admin/products" className="admin-panel-link">View All <Icon name="arrow_forward" size={14} /></Link></div>
          <div className="top-products-list">
            {topproducts.map((product, i) => {
              const colors = GENRE_COLORS[product.genre] || ['#23c9b7','#0d9488'];
              return (
                <div key={product.id} className="top-product-row">
                  <span className="top-product-rank">#{i + 1}</span>
                  <div className="top-product-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                    {product.image ? <img src={product.image} alt={product.title} className="top-product-cover-img" /> : product.genre[0]}
                  </div>
                  <div className="top-product-info"><div className="top-product-title">{product.title}</div><div className="top-product-meta"><span className="tag">{product.genre}</span><span className="text-muted text-sm">{product.downloads.toLocaleString()} orders</span></div></div>
                  <div className="top-product-stats"><div className="top-product-price">{product.price === 0 ? 'SAMPLE' : `$${product.price.toFixed(2)}`}</div><div className="top-product-rating text-gold text-sm"><Icon name="star" size={12} /> {product.rating}</div></div>
                </div>
              );
            })}
            {topproducts.length === 0 && <p className="text-muted">No products published yet.</p>}
          </div>
        </div>
        <div className="admin-right-col">
          <div className="admin-panel">
            <div className="admin-panel-header"><h2><Icon name="monitoring" size={18} /> Quick Actions</h2></div>
            <div className="quick-actions-grid">
              <Link to="/admin/products" className="quick-action-btn"><Icon name="apps" size={20} /><span>All Products</span></Link>
              <Link to="/admin/orders" className="quick-action-btn"><Icon name="receipt_long" size={20} /><span>Orders</span></Link>
              <Link to="/admin/products" className="quick-action-btn accent"><Icon name="inventory_2" size={20} /><span>Catalog</span></Link>
              <Link to="/store" className="quick-action-btn"><Icon name="bar_chart" size={20} /><span>View Store</span></Link>
            </div>
          </div>
          <div className="admin-panel">
            <div className="admin-panel-header"><h2><Icon name="inventory_2" size={18} /> Low Stock</h2><Link to="/admin/products" className="admin-panel-link">Open Products <Icon name="arrow_forward" size={14} /></Link></div>
            <div className="top-products-list">
              {lowStockProducts.map((product) => {
                const colors = GENRE_COLORS[product.genre] || ['#23c9b7','#0d9488'];
                return (
                  <div key={product.id} className="top-product-row">
                    <span className="top-product-rank">{Number(product.stock || 0)}</span>
                    <div className="top-product-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                      {product.image ? <img src={product.image} alt={product.title} className="top-product-cover-img" /> : product.genre[0]}
                    </div>
                    <div className="top-product-info">
                      <div className="top-product-title">{product.title}</div>
                      <div className="top-product-meta">
                        <span className="tag">{product.genre}</span>
                        <span className="text-muted text-sm">threshold {Number(product.lowStockThreshold || 5)}</span>
                      </div>
                    </div>
                    <div className="top-product-stats">
                      <div className="top-product-price">{product.price === 0 ? 'SAMPLE' : `$${product.price.toFixed(2)}`}</div>
                      <div className="top-product-rating text-gold text-sm">low</div>
                    </div>
                  </div>
                );
              })}
              {lowStockProducts.length === 0 && <p className="text-muted">No low stock items.</p>}
            </div>
          </div>
          <div className="admin-panel">
            <div className="admin-panel-header"><h2><Icon name="bar_chart" size={18} /> Use Case Breakdown</h2></div>
            <div className="genre-breakdown">
              {Object.entries(GENRE_COLORS).map(([genre, colors]) => {
                const count = products.filter(g => g.genre === genre).length;
                const pct = products.length ? Math.round((count / products.length) * 100) : 0;
                if (count === 0) return null;
                return (<div key={genre} className="genre-bar-row"><span className="genre-bar-label">{genre}</span><div className="genre-bar-track"><div className="genre-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})` }} /></div><span className="genre-bar-count">{count}</span></div>);
              })}
            </div>
          </div>
          <div className="admin-panel">
            <div className="admin-panel-header"><h2><Icon name="group" size={18} /> Recent Users</h2><Link to="/admin/users" className="admin-panel-link">View All <Icon name="arrow_forward" size={14} /></Link></div>
            <div className="recent-users-list">
              {users.slice(0, 5).map(u => (<div key={u.id} className="recent-user-row"><div className="recent-user-avatar">{u.name[0]}</div><div className="recent-user-info"><div className="recent-user-name">{u.name}</div><div className="recent-user-email text-muted text-sm">{u.email}</div></div><span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{u.role}</span></div>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

