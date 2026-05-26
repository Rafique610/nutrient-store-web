import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../ui/Icon';
import './Sidebar.css';

const GENRES = [
  { name: 'Exercise' },
  { name: 'Heat' },
  { name: 'Travel' },
  { name: 'Wellness' },
  { name: 'Performance' },
];

export default function Sidebar({ open }) {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDev = user?.role === 'developer';

  const isActive = (path) => {
    const [pathname, search] = path.split('?');
    if (search) {
      // For links with query params, match both pathname and the specific query param
      return location.pathname === pathname && location.search.includes(search);
    }
    if (pathname === '/store') {
      // "All Products" is only active when on /store with no filter param
      return location.pathname === '/store' && !location.search.includes('filter=');
    }
    return location.pathname === pathname || (pathname !== '/' && location.pathname.startsWith(pathname));
  };

  const NavItem = ({ to, icon, label }) => (
    <Link to={to} className={`sidebar-item ${isActive(to) ? 'active' : ''}`}>
      <Icon name={icon} className="sidebar-item-icon" size={18} />
      <span>{label}</span>
    </Link>
  );

  if (isAdmin) {
    return (
      <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
        <div className="sidebar-section">
          <div className="sidebar-heading">OVERVIEW</div>
          <NavItem to="/admin" icon="pie_chart" label="Dashboard" />
          <NavItem to="/admin/users" icon="group" label="Users" />
          <NavItem to="/admin/products" icon="apps" label="All Products" />
        </div>
        <div className="sidebar-section">
          <div className="sidebar-heading">MANAGEMENT</div>
          <NavItem to="/admin" icon="bar_chart" label="Analytics" />
        </div>
      </aside>
    );
  }

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-section">
        <div className="sidebar-heading">DISCOVER</div>
        <NavItem to="/" icon="home" label="Home" />
        <NavItem to="/store" icon="apps" label="All Sachets" />
        <NavItem to="/store?filter=new" icon="bolt" label="New Sachets" />
        <NavItem to="/store?filter=top" icon="trending_up" label="Best Sellers" />
        <NavItem to="/store?filter=free" icon="sell" label="Samples" />
      </div>

      {user && (
        <div className="sidebar-section">
          <div className="sidebar-heading">MY ACCOUNT</div>
          <NavItem to="/library" icon="library_books" label="My Orders" />
          <NavItem to="/cart" icon="shopping_cart" label="Cart" />
          {isDev && <NavItem to="/developer" icon="inventory_2" label="Seller Hub" />}
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-heading">USE CASES</div>
        {GENRES.map(g => (
          <Link key={g.name} to={`/store?genre=${g.name}`} className={`sidebar-item ${location.search.includes(g.name) ? 'active' : ''}`}>
            <Icon name="water_drop" size={16} style={{ opacity: 0.6 }} />
            <span>{g.name}</span>
          </Link>
        ))}
        <Link to="/store?filter=all-genres" className="sidebar-item sidebar-more">
          <span>Browse All Uses <Icon name="arrow_forward" size={14} /></span>
        </Link>
      </div>
    </aside>
  );
}

