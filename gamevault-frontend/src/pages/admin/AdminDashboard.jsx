import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { adminApi } from '../../services/api';
import { GENRE_COLORS } from '../../data/mockData';
import './AdminDashboard.css';

const emptyStats = {
  totalUsers: 0,
  totalGames: 0,
  totalRevenue: 0,
  totalOrders: 0,
  activeGames: 0,
  pendingApprovals: 0,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [statsData, gameData, userData] = await Promise.all([
          adminApi.stats(),
          adminApi.games(),
          adminApi.users(),
        ]);
        setStats({ ...emptyStats, ...statsData });
        setGames(gameData.games || []);
        setUsers(userData.users || []);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const topGames = [...games].sort((a, b) => b.downloads - a.downloads).slice(0, 5);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div><h1 className="admin-title">Dashboard</h1><p className="admin-subtitle">Platform overview and analytics</p></div>
        <div className="admin-header-actions"><Link to="/admin/games" className="btn btn-primary btn-sm"><Icon name="apps" size={16} /> Manage Products</Link></div>
      </div>
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="admin-stats-grid">
        <div className="admin-stat-card"><div className="stat-card-icon" style={{ background: 'rgba(47,143,91,0.15)', color: 'var(--accent)' }}><Icon name="apps" size={22} /></div><div className="stat-card-body"><div className="stat-card-value">{stats.totalGames}</div><div className="stat-card-label">Total Products</div></div><div className="stat-card-trend up">+{stats.activeGames} active</div></div>
        <div className="admin-stat-card"><div className="stat-card-icon" style={{ background: 'rgba(76,175,118,0.15)', color: '#4caf76' }}><Icon name="group" size={22} /></div><div className="stat-card-body"><div className="stat-card-value">{stats.totalUsers.toLocaleString()}</div><div className="stat-card-label">Total Users</div></div><div className="stat-card-trend up">All roles</div></div>
        <div className="admin-stat-card"><div className="stat-card-icon" style={{ background: 'rgba(240,169,64,0.15)', color: '#f0a940' }}><Icon name="shopping_cart" size={22} /></div><div className="stat-card-body"><div className="stat-card-value">{stats.totalOrders.toLocaleString()}</div><div className="stat-card-label">Total Orders</div></div><div className="stat-card-trend up">All time</div></div>
        <div className="admin-stat-card"><div className="stat-card-icon" style={{ background: 'rgba(155,89,182,0.15)', color: '#9b59b6' }}><Icon name="attach_money" size={22} /></div><div className="stat-card-body"><div className="stat-card-value">${stats.totalRevenue >= 1000 ? `${(stats.totalRevenue / 1000).toFixed(1)}K` : stats.totalRevenue.toFixed(2)}</div><div className="stat-card-label">Total Revenue</div></div><div className="stat-card-trend up">{stats.pendingApprovals} drafts</div></div>
      </div>
      <div className="admin-content-grid">
        <div className="admin-panel">
          <div className="admin-panel-header"><h2><Icon name="trending_up" size={18} /> Top Selling Products</h2><Link to="/admin/games" className="admin-panel-link">View All <Icon name="arrow_forward" size={14} /></Link></div>
          <div className="top-games-list">
            {topGames.map((game, i) => {
              const colors = GENRE_COLORS[game.genre] || ['#4da6ff','#1a6dcc'];
              return (
                <div key={game.id} className="top-game-row">
                  <span className="top-game-rank">#{i + 1}</span>
                  <div className="top-game-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                    {game.image ? <img src={game.image} alt={game.title} className="top-game-cover-img" /> : game.genre[0]}
                  </div>
                  <div className="top-game-info"><div className="top-game-title">{game.title}</div><div className="top-game-meta"><span className="tag">{game.genre}</span><span className="text-muted text-sm">{game.downloads.toLocaleString()} orders</span></div></div>
                  <div className="top-game-stats"><div className="top-game-price">{game.price === 0 ? 'SAMPLE' : `$${game.price.toFixed(2)}`}</div><div className="top-game-rating text-gold text-sm"><Icon name="star" size={12} /> {game.rating}</div></div>
                </div>
              );
            })}
            {topGames.length === 0 && <p className="text-muted">No products published yet.</p>}
          </div>
        </div>
        <div className="admin-right-col">
          <div className="admin-panel">
            <div className="admin-panel-header"><h2><Icon name="monitoring" size={18} /> Quick Actions</h2></div>
            <div className="quick-actions-grid">
              <Link to="/admin/games" className="quick-action-btn"><Icon name="apps" size={20} /><span>All Products</span></Link>
              <Link to="/admin/users" className="quick-action-btn"><Icon name="group" size={20} /><span>Users</span></Link>
              <Link to="/admin/games" className="quick-action-btn accent"><Icon name="inventory_2" size={20} /><span>Add Product</span></Link>
              <Link to="/store" className="quick-action-btn"><Icon name="bar_chart" size={20} /><span>View Store</span></Link>
            </div>
          </div>
          <div className="admin-panel">
            <div className="admin-panel-header"><h2><Icon name="bar_chart" size={18} /> Health Goal Breakdown</h2></div>
            <div className="genre-breakdown">
              {Object.entries(GENRE_COLORS).map(([genre, colors]) => {
                const count = games.filter(g => g.genre === genre).length;
                const pct = games.length ? Math.round((count / games.length) * 100) : 0;
                if (count === 0) return null;
                return (<div key={genre} className="genre-bar-row"><span className="genre-bar-label">{genre}</span><div className="genre-bar-track"><div className="genre-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})` }} /></div><span className="genre-bar-count">{count}</span></div>);
              })}
            </div>
          </div>
          <div className="admin-panel">
            <div className="admin-panel-header"><h2><Icon name="group" size={18} /> Recent Users</h2><Link to="/admin/users" className="admin-panel-link">View All <Icon name="arrow_forward" size={14} /></Link></div>
            <div className="recent-users-list">
              {users.slice(0, 5).map(u => (<div key={u.id} className="recent-user-row"><div className="recent-user-avatar">{u.name[0]}</div><div className="recent-user-info"><div className="recent-user-name">{u.name}</div><div className="recent-user-email text-muted text-sm">{u.email}</div></div><span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'developer' ? 'badge-gold' : 'badge-blue'}`}>{u.role}</span></div>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
