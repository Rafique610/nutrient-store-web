import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from './Icon';
import { GENRE_COLORS } from '../../data/mockData';
import './ProductCard.css';

function StarRating({ rating }) {
  return (
    <div className="card-stars">
      {[1,2,3,4,5].map(i => (
        <Icon key={i} name="star" className={i <= Math.round(rating) ? 'star filled' : 'star'} size={14} />
      ))}
      <span className="card-rating-num">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ProductCard({ product, rank }) {
  const { user, addToCart, isInCart, isOwned } = useAuth();
  const [adding, setAdding] = useState(false);
  const colors = GENRE_COLORS[product.genre] || ['#4da6ff', '#1a6dcc'];
  const owned = isOwned(product.id);
  const inCart = isInCart(product.id);

  const handleCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || adding) return;
    setAdding(true);
    await addToCart(product);
    setAdding(false);
  };

  return (
    <div className={`product-card ${owned ? 'product-card-owned' : ''}`}>
      {/* Cover area */}
      <Link to={`/product/${product.id}`} className="product-card-cover-link">
        <div className="product-card-cover" style={{
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
        }}>
          {product.image ? (
            <img src={product.image} alt={product.title} className="product-card-img" />
          ) : (
            <div className="cover-pattern">
              <span className="cover-genre-initial">{product.genre[0]}</span>
            </div>
          )}

          {/* Badges */}
          <div className="card-badges">
            {rank && <span className="card-rank">#{rank}</span>}
            {product.isNew && !rank && <span className="card-badge badge-new">NEW</span>}
            {product.isFree && <span className="card-badge badge-free">SAMPLE</span>}
            {owned && <span className="card-badge badge-owned"><Icon name="check" size={10} /> BOUGHT</span>}
          </div>

          {/* Hover overlay */}
          <div className="card-hover-overlay">
            <Link to={`/product/${product.id}`} className="btn btn-secondary btn-sm">
              <Icon name="visibility" size={14} /> View
            </Link>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="product-card-info">
        <div className="product-card-genre">{product.genre}</div>
        <Link to={`/product/${product.id}`} className="product-card-title">{product.title}</Link>
        <StarRating rating={product.rating} />
        <div className="product-card-meta">
          <div className="product-card-price">
            {product.price === 0 ? (
              <span className="price-free">SAMPLE</span>
            ) : (
              <span className="price-value">${product.price.toFixed(2)}</span>
            )}
          </div>
          <div className="product-card-actions">
            {owned ? (
              <button className="btn-cart btn-cart-owned" disabled>
                <Icon name="check" size={14} /> Bought
              </button>
            ) : inCart ? (
              <button className="btn-cart btn-cart-in-cart" disabled>
                <Icon name="check" size={14} /> In Cart
              </button>
            ) : product.price === 0 ? (
              <Link to={`/product/${product.id}`} className="btn-cart btn-cart-free">
                Get Sample
              </Link>
            ) : user ? (
              <button className="btn-cart btn-cart-add" onClick={handleCart} disabled={adding}>
                {adding ? <span className="spinner" /> : <Icon name="shopping_cart" size={14} />}
              </button>
            ) : (
              <Link to="/login" className="btn-cart btn-cart-add">
                <Icon name="shopping_cart" size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


