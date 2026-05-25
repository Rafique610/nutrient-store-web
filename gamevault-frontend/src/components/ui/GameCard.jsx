import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from './Icon';
import { GENRE_COLORS } from '../../data/mockData';
import './GameCard.css';

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

export default function GameCard({ game, rank }) {
  const { user, addToCart, isInCart, isOwned } = useAuth();
  const [adding, setAdding] = useState(false);
  const colors = GENRE_COLORS[game.genre] || ['#4da6ff', '#1a6dcc'];
  const owned = isOwned(game.id);
  const inCart = isInCart(game.id);

  const handleCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || adding) return;
    setAdding(true);
    await addToCart(game);
    setAdding(false);
  };

  return (
    <div className={`game-card ${owned ? 'game-card-owned' : ''}`}>
      {/* Cover area */}
      <Link to={`/game/${game.id}`} className="game-card-cover-link">
        <div className="game-card-cover" style={{
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
        }}>
          {game.image ? (
            <img src={game.image} alt={game.title} className="game-card-img" />
          ) : (
            <div className="cover-pattern">
              <span className="cover-genre-initial">{game.genre[0]}</span>
            </div>
          )}

          {/* Badges */}
          <div className="card-badges">
            {rank && <span className="card-rank">#{rank}</span>}
            {game.isNew && !rank && <span className="card-badge badge-new">NEW</span>}
            {game.isFree && <span className="card-badge badge-free">SAMPLE</span>}
            {owned && <span className="card-badge badge-owned"><Icon name="check" size={10} /> BOUGHT</span>}
          </div>

          {/* Hover overlay */}
          <div className="card-hover-overlay">
            <Link to={`/game/${game.id}`} className="btn btn-secondary btn-sm">
              <Icon name="visibility" size={14} /> View
            </Link>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="game-card-info">
        <div className="game-card-genre">{game.genre}</div>
        <Link to={`/game/${game.id}`} className="game-card-title">{game.title}</Link>
        <StarRating rating={game.rating} />
        <div className="game-card-meta">
          <div className="game-card-price">
            {game.price === 0 ? (
              <span className="price-free">SAMPLE</span>
            ) : (
              <span className="price-value">${game.price.toFixed(2)}</span>
            )}
          </div>
          <div className="game-card-actions">
            {owned ? (
              <button className="btn-cart btn-cart-owned" disabled>
                <Icon name="check" size={14} /> Bought
              </button>
            ) : inCart ? (
              <button className="btn-cart btn-cart-in-cart" disabled>
                <Icon name="check" size={14} /> In Cart
              </button>
            ) : game.price === 0 ? (
              <Link to={`/game/${game.id}`} className="btn-cart btn-cart-free">
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
