import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/ui/Icon';
import { useState } from 'react';
import { GENRE_COLORS } from '../data/mockData';
import './Library.css';

export default function Library() {
  const { libraryproducts } = useAuth();
  const [search, setSearch] = useState('');
  const ownedproducts = libraryproducts;
  const filtered = ownedproducts.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.genre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="library-page">
      <div className="library-header">
        <div>
          <h1 className="page-title"><Icon name="library_books" size={24} /> My Orders</h1>
          <p className="text-muted">{ownedproducts.length} product{ownedproducts.length !== 1 ? 's' : ''} in your order history</p>
        </div>
        {ownedproducts.length > 0 && (
          <div className="lib-search-wrap">
            <Icon name="search" className="lib-search-icon" size={16} />
            <input className="lib-search" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}
      </div>
      {ownedproducts.length === 0 ? (
        <div className="library-empty panel">
          <Icon name="library_books" size={60} className="lib-empty-icon" />
          <h2>Your order history is empty</h2>
          <p>Purchase supplements from the store to start your wellness shelf.</p>
          <Link to="/store" className="btn btn-primary">Browse Store</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="library-empty panel">
          <p>No products match your search.</p>
          <button className="btn btn-secondary" onClick={() => setSearch('')}>Clear Search</button>
        </div>
      ) : (
        <div className="library-grid">
          {filtered.map(product => {
            const colors = GENRE_COLORS[product.genre] || ['#4da6ff','#1a6dcc'];
            return (
              <div key={product.id} className="lib-card panel">
                <div className="lib-card-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="lib-card-img" />
                  ) : (
                    <span className="lib-cover-initial">{product.genre[0]}</span>
                  )}
                  <div className="lib-card-overlay">
                    <Link to={`/product/${product.id}`} className="lib-play-btn"><Icon name="visibility" size={16} /> View Details</Link>
                  </div>
                </div>
                <div className="lib-card-info">
                  <Link to={`/product/${product.id}`} className="lib-card-title">{product.title}</Link>
                  <div className="lib-card-meta">
                    <span className="tag">{product.genre}</span>
                    <span className="lib-rating"><Icon name="star" size={12} /> {product.rating.toFixed(1)}</span>
                  </div>
                  <div className="lib-card-dev text-muted text-sm">{product.developer}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

