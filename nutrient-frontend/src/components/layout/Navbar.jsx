import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useproducts } from '../../context/ProductContext';
import Icon from '../ui/Icon';
import './Navbar.css';

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout, cartCount } = useAuth();
  const { products } = useproducts();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (q.trim().length > 1) {
      const results = products.filter(g =>
        g.title.toLowerCase().includes(q.toLowerCase()) ||
        g.genre.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 5);
      setSearchResults(results);
      setShowSearch(true);
    } else {
      setShowSearch(false);
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/store?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isDeveloper = user?.role === 'developer';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Left: Logo + hamburger */}
        <div className="navbar-left">
          <button className="btn btn-icon btn-secondary sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Icon name={sidebarOpen ? 'close' : 'menu'} size={20} />
          </button>
          <Link to={isAdmin ? '/admin' : '/'} className="navbar-brand">
            <Icon name="water_drop" className="brand-icon" />
            <span className="brand-text">HydraDose</span>
          </Link>
        </div>

        {/* Center: Nav links (desktop) */}
        {!isAdmin && (
          <div className="navbar-links">
            <Link to="/store" className={`nav-link ${location.pathname === '/store' ? 'active' : ''}`}>Store</Link>
            <Link to="/store?filter=new" className="nav-link">New Sachets</Link>
            <Link to="/store?filter=top" className="nav-link">Best Sellers</Link>
            {isDeveloper && <Link to="/developer" className="nav-link">Seller Hub</Link>}
          </div>
        )}

        {/* Search */}
        {!isAdmin && (
          <div className="navbar-search" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="search-box">
                <Icon name="search" size={16} />
                <input
                  type="text"
                  placeholder="Search sachets..."
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  className="search-input"
                />
              </div>
            </form>
            {showSearch && searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map(g => (
                  <Link
                    key={g.id}
                    to={`/product/${g.id}`}
                    className="search-result-item"
                    onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                  >
                    <div className="search-result-cover" style={{ background: `linear-gradient(135deg, ${getGenreColor(g.genre)})` }}>
                      {g.image ? (
                        <img src={g.image} alt={g.title} className="search-result-cover-img" />
                      ) : (
                        <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{g.genre[0]}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: 14 }}>{g.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.genre} • {g.price === 0 ? 'Sample' : `$${g.price}`}</div>
                    </div>
                  </Link>
                ))}
                <button className="search-see-all" onClick={handleSearchSubmit}>
                  See all results for "{searchQuery}"
                </button>
              </div>
            )}
          </div>
        )}

        {/* Right: Cart + User */}
        <div className="navbar-right">
          {user && !isAdmin && (
            <Link to="/cart" className="cart-btn">
              <Icon name="shopping_cart" size={18} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}

          {user ? (
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <div className="user-avatar">{user.name?.[0] || '?'}</div>
                <span className="user-name">{(user.name || 'User').split(' ')[0]}</span>
                <Icon name="expand_more" size={14} />
              </button>
              {userMenuOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-user-info">
                    <div className="dropdown-user-name">{user.name || 'HydraDose User'}</div>
                    <div className="dropdown-user-role badge badge-blue">{user.role}</div>
                  </div>
                  <div className="dropdown-divider" />
                  {isAdmin && <Link to="/admin" className="dropdown-item" onClick={() => setUserMenuOpen(false)}><Icon name="apps" size={16} /> Admin Dashboard</Link>}
                  {isDeveloper && <Link to="/developer" className="dropdown-item" onClick={() => setUserMenuOpen(false)}><Icon name="inventory_2" size={16} /> Seller Hub</Link>}
                  {!isAdmin && <Link to="/library" className="dropdown-item" onClick={() => setUserMenuOpen(false)}><Icon name="library_books" size={16} /> My Orders</Link>}
                  {!isAdmin && <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}><Icon name="person" size={16} /> Profile</Link>}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-item-danger" onClick={() => { logout(); navigate('/'); setUserMenuOpen(false); }}>
                    <Icon name="logout" size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function getGenreColor(genre) {
  const colors = {
    Exercise: '#23c9b7, #0d9488',
    Heat: '#f97316, #facc15',
    Travel: '#38bdf8, #2563eb',
    Wellness: '#22c55e, #84cc16',
    Recovery: '#a78bfa, #14b8a6',
    Sleep: '#818cf8, #312e81',
    Immunity: '#2dd4bf, #0f766e',
    Performance: '#06b6d4, #22c55e',
  };
  return colors[genre] || '#23c9b7, #0d9488';
}

