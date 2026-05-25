import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGames } from '../context/GameContext';
import { gamesApi, reviewApi } from '../services/api';
import Icon from '../components/ui/Icon';
import { GENRE_COLORS, mockGames } from '../data/mockData';
import './GameDetail.css';

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-input">
      {[1,2,3,4,5].map(i => (
        <button
          key={i} type="button"
          className={`star-btn ${i <= (hover || value) ? 'active' : ''}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        ><Icon name="star" size={22} /></button>
      ))}
    </div>
  );
}

export default function GameDetail() {
  const { id } = useParams();
  const { games } = useGames();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, addToCart, isInCart, isOwned } = useAuth();
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [localReviews, setLocalReviews] = useState([]);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const loadGame = async () => {
      setLoading(true);
      setError('');
      setActionError('');

      try {
        const cached = games.find(g => String(g.id) === String(id))
          || mockGames.find(g => String(g.id) === String(id));
        const nextGame = cached || (await gamesApi.get(id)).game;
        let reviewData = { reviews: [] };

        try {
          reviewData = await gamesApi.reviews(id);
        } catch (_reviewError) {
          reviewData = { reviews: [] };
        }

        setGame(nextGame);
        setLocalReviews(reviewData.reviews || []);
      } catch (err) {
        const fallback = mockGames.find(g => String(g.id) === String(id));
        if (fallback) {
          setGame(fallback);
          setLocalReviews([]);
        } else {
          setError(err.message || 'Product not found');
        }
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [games, id]);

  if (loading) {
    return <div className="loading-screen"><div className="loader" /></div>;
  }

  if (!game || error) {
    return (
      <div className="gd-not-found">
        <h2>{error || 'Product not found'}</h2>
        <Link to="/store" className="btn btn-primary"><Icon name="arrow_back" size={16} /> Back to Store</Link>
      </div>
    );
  }

  const colors = GENRE_COLORS[game.genre] || ['#4da6ff','#1a6dcc'];
  const owned = isOwned(game.id);
  const inCart = isInCart(game.id);
  const avgRating = localReviews.length > 0
    ? (localReviews.reduce((s, r) => s + r.rating, 0) / localReviews.length).toFixed(1)
    : game.rating.toFixed(1);
  const reviewCount = localReviews.length || game.reviews;
  const screenshotImages = game.screenshots?.length ? game.screenshots : [];

  const handleAddToCart = async () => { if (user) await addToCart(game); };

  const handleDownload = async () => {
    setActionError('');
    try {
      await gamesApi.download(game.id, `${game.title.replace(/\s+/g, '-').toLowerCase()}.zip`);
    } catch (err) {
      setActionError(err.message || 'Unable to download game');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user || !reviewText.trim()) return;
    setActionError('');

    try {
      const data = await reviewApi.create({ gameId: game.id, rating: reviewRating, comment: reviewText });
      setLocalReviews(r => [data.review, ...r]);
      setReviewText('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setActionError(err.message || 'Unable to submit review');
    }
  };

  return (
    <div className="game-detail-page">
      {/* Hero Banner */}
      <div className="gd-hero" style={{ background: `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}11, transparent)` }}>
        <div className="gd-hero-art" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
          {game.image ? <img src={game.image} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} /> : <span className="gd-hero-initial">{game.genre[0]}</span>}
        </div>
        <div className="gd-hero-bg" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }} />
        <div className="gd-hero-content">
          <Link to="/store" className="gd-back"><Icon name="arrow_back" size={16} /> Back to Store</Link>
          <div className="gd-hero-info">
            <div className="gd-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
              {game.image ? <img src={game.image} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="gd-cover-initial">{game.genre[0]}</span>}
            </div>
            <div className="gd-hero-text">
              <div className="gd-genre-badge" style={{ color: colors[0] }}>{game.genre}</div>
              <h1 className="gd-title">{game.title}</h1>
              <div className="gd-meta">
                <span className="gd-meta-item"><Icon name="person" size={14} /> {game.developer}</span>
                <span className="gd-meta-item"><Icon name="calendar_today" size={14} /> {game.releaseDate}</span>
                <span className="gd-meta-item"><Icon name="star" size={14} style={{ color: '#f0a940' }} /> {avgRating} ({reviewCount} reviews)</span>
              </div>
              <div className="gd-tags">
                {game.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="gd-body">
        <div className="gd-main">
          {/* Screenshots */}
          <div className="gd-section panel">
            <h3>Product Details</h3>
            <p className="gd-description">{game.description}</p>
            {screenshotImages.length > 0 && (
              <div className="gd-screenshots">
                {screenshotImages.map((src, index) => (
                <button key={src} type="button" className="gd-screenshot" onClick={() => setPreviewImage(src)}>
                  <img src={src} alt={`${game.title} product preview ${index + 1}`} className="gd-screenshot-img" />
                  <span className="gd-screenshot-zoom"><Icon name="zoom_in" size={18} /></span>
                </button>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="gd-section panel">
            <h3>User Reviews <span className="review-count">({reviewCount})</span></h3>
            {actionError && <div className="auth-error" style={{ marginBottom: 12 }}>{actionError}</div>}
            
            {user && owned && !submitted && (
              <form className="review-form" onSubmit={handleReviewSubmit}>
                <div className="review-form-header">
                  <div className="user-avatar-sm">{user.name?.[0] || '?'}</div>
                  <span>{user.name}</span>
                </div>
                <StarInput value={reviewRating} onChange={setReviewRating} />
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={3}
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm">Submit Review</button>
              </form>
            )}
            {submitted && (
              <div className="review-success"><Icon name="check" size={16} /> Review submitted! Thank you.</div>
            )}
            {user && !owned && (
              <p className="review-note">Purchase this product to leave a review.</p>
            )}

            <div className="reviews-list">
              {localReviews.slice(0, 5).map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-head">
                    <div className="reviewer-avatar">{r.userName[0]}</div>
                    <div>
                      <div className="reviewer-name">{r.userName}</div>
                      <div className="review-date">{r.date}</div>
                    </div>
                    <div className="review-stars">
                      {[1,2,3,4,5].map(i => (
                        <Icon key={i} name="star" size={14} style={{ color: i <= r.rating ? 'var(--gold)' : 'var(--text-muted)', opacity: i <= r.rating ? 1 : 0.3 }} />
                      ))}
                    </div>
                  </div>
                  <p className="review-text">{r.text}</p>
                </div>
              ))}
              {localReviews.length === 0 && (
                <p className="no-reviews">No reviews yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="gd-sidebar">
          <div className="gd-buy-card panel">
            <div className="gd-price-display">
              {game.price === 0
                ? <span className="price-free-lg">SAMPLE</span>
                : <span className="gd-price">${game.price.toFixed(2)}</span>
              }
            </div>
            
            <div className="gd-actions">
              {owned ? (
                <button className="btn btn-success w-full" disabled>
                  <Icon name="shopping_bag" size={18} /> Purchased
                </button>
              ) : inCart ? (
                <Link to="/cart" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                  <Icon name="shopping_cart" size={18} /> View in Cart
                </Link>
              ) : game.price === 0 ? (
                <button className="btn btn-success w-full" onClick={handleAddToCart} disabled={!user}>
                  <Icon name="shopping_bag" size={18} /> Get Sample
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleAddToCart}
                    disabled={!user}
                  >
                    <Icon name="shopping_cart" size={18} /> Add to Cart
                  </button>
                  {!user && (
                    <Link to="/login" className="btn btn-secondary w-full" style={{ justifyContent: 'center', fontSize: 13 }}>
                      Sign in to shop
                    </Link>
                  )}
                </>
              )}
            </div>

            <div className="gd-details-list">
              <div className="gd-detail-row">
                <span><Icon name="sell" size={14} /> Health Goal</span>
                <strong>{game.genre}</strong>
              </div>
              <div className="gd-detail-row">
                <span><Icon name="person" size={14} /> Brand</span>
                <strong>{game.developer}</strong>
              </div>
              <div className="gd-detail-row">
                <span><Icon name="calendar_today" size={14} /> Listed</span>
                <strong>{game.releaseDate}</strong>
              </div>
              <div className="gd-detail-row">
                <span><Icon name="star" size={14} /> Rating</span>
                <strong>{avgRating} / 5</strong>
              </div>
              <div className="gd-detail-row">
                <span>Orders</span>
                <strong>{game.downloads.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewImage && (
        <div className="gd-preview-overlay" onClick={() => setPreviewImage(null)}>
          <div className="gd-preview-dialog" onClick={e => e.stopPropagation()}>
            <button type="button" className="gd-preview-close" onClick={() => setPreviewImage(null)} aria-label="Close preview">
              <Icon name="close" size={20} />
            </button>
            <img src={previewImage} alt={`${game.title} enlarged product preview`} className="gd-preview-img" />
          </div>
        </div>
      )}
    </div>
  );
}
