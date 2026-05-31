import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useproducts } from '../../context/ProductContext';
import Icon from '../ui/Icon';
import './Navbar.css';

export default function Navbar() {
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

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Left: (spacing) */}
        <div className="nav-spacer" />

        {/* Center: Logo (centered on mobile, left on desktop) */}
        <Link to={isAdmin ? '/admin' : '/'} className="navbar-brand">
          <svg className="brand-icon" viewBox="0 0 32 32" width="24" height="24">
            <path fill="currentColor" d="M16 2C16 2 12 8 12 14C12 18.4 14 21 16 21C18 21 20 18.4 20 14C20 8 16 2 16 2Z" />
            <circle cx="16" cy="26" r="2" fill="currentColor" opacity="0.6" />
          </svg>
          <span className="brand-text">HydraDose</span>
        </Link>

        {/* Center: Nav links (desktop only) */}
        {!isAdmin && (
          <div className="navbar-links">
            <Link to="/store" className={`nav-link ${location.pathname === '/store' ? 'active' : ''}`}>Store</Link>
            <Link to="/store?filter=new" className="nav-link">New</Link>
            <Link to="/store?filter=top" className="nav-link">Best Sellers</Link>
          </div>
        )}

        {/* Search (desktop only) */}
        {!isAdmin && (
          <div className="navbar-search" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="search-box">
                <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
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
                  See all results
                </button>
              </div>
            )}
          </div>
        )}

        {/* Right: Cart + User */}
        <div className="navbar-right">
          {!isAdmin && (
            <Link to="/cart" className="nav-icon-btn" title="Shopping cart">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" strokeWidth="1.5"/>
              </svg>
              {user && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}

          {user ? (
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} title={user.name || 'User menu'}>
                <div className="user-avatar">{user.name?.[0] || '?'}</div>
              </button>
              {userMenuOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-user-info">
                    <div className="dropdown-user-name">{user.name || 'HydraDose User'}</div>
                    <div className="dropdown-user-role">{user.role}</div>
                  </div>
                  <div className="dropdown-divider" />
                  {isAdmin && <Link to="/admin" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>Admin Dashboard</Link>}
                  {!isAdmin && <Link to="/library" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>My Orders</Link>}
                  {!isAdmin && <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>Profile</Link>}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-item-danger" onClick={() => { logout(); navigate('/'); setUserMenuOpen(false); }}>
                    Sign Out
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

        {/* Right: (spacing) */}
        <div className="nav-spacer" />
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
