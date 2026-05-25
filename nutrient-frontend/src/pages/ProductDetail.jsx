import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { productsApi, reviewApi } from '../services/api';
import Icon from '../components/ui/Icon';
import { GENRE_COLORS, mockproducts } from '../data/mockData';
import './ProductDetail.css';

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

export default function ProductDetail() {
  const { id } = useParams();
  const { products } = useProducts();
  const [product, setproduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, addToCart, isInCart, isOwned } = useAuth();
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [localReviews, setLocalReviews] = useState([]);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const loadproduct = async () => {
      setLoading(true);
      setError('');
      setActionError('');

      try {
        const apiUrl = String(import.meta.env.VITE_API_URL || '');
        const allowMockFallback = !apiUrl || apiUrl.includes('localhost');
        const cached = products.find(g => String(g.id) === String(id))
          || (allowMockFallback ? mockproducts.find(g => String(g.id) === String(id)) : null);
        const nextproduct = cached || (await productsApi.get(id)).product;
        let reviewData = { reviews: [] };

        try {
          reviewData = await productsApi.reviews(id);
        } catch (_reviewError) {
          reviewData = { reviews: [] };
        }

        setproduct(nextproduct);
        setLocalReviews(reviewData.reviews || []);
      } catch (err) {
        const apiUrl = String(import.meta.env.VITE_API_URL || '');
        const allowMockFallback = !apiUrl || apiUrl.includes('localhost');
        const fallback = allowMockFallback ? mockproducts.find(g => String(g.id) === String(id)) : null;
        if (fallback) {
          setproduct(fallback);
          setLocalReviews([]);
        } else {
          setError(err.message || 'Product not found');
        }
      } finally {
        setLoading(false);
      }
    };

    loadproduct();
  }, [products, id]);

  if (loading) {
    return <div className="loading-screen"><div className="loader" /></div>;
  }

  if (!product || error) {
    return (
      <div className="gd-not-found">
        <h2>{error || 'Product not found'}</h2>
        <Link to="/store" className="btn btn-primary"><Icon name="arrow_back" size={16} /> Back to Store</Link>
      </div>
    );
  }

  const colors = GENRE_COLORS[product.genre] || ['#4da6ff','#1a6dcc'];
  const owned = isOwned(product.id);
  const inCart = isInCart(product.id);
  const avgRating = localReviews.length > 0
    ? (localReviews.reduce((s, r) => s + r.rating, 0) / localReviews.length).toFixed(1)
    : product.rating.toFixed(1);
  const reviewCount = localReviews.length || product.reviews;

  const handleAddToCart = async () => { if (user) await addToCart(product); };

  const handleDownload = async () => {
    setActionError('');
    try {
      await productsApi.download(product.id, `${product.title.replace(/\s+/g, '-').toLowerCase()}.zip`);
    } catch (err) {
      setActionError(err.message || 'Unable to download attachment');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user || !reviewText.trim()) return;
    setActionError('');

    try {
      const data = await reviewApi.create({ productId: product.id, rating: reviewRating, comment: reviewText });
      setLocalReviews(r => [data.review, ...r]);
      setReviewText('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setActionError(err.message || 'Unable to submit review');
    }
  };

  return (
    <div className="product-detail-page">
      {/* Hero Banner */}
      <div className="gd-hero" style={{ background: `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}11, transparent)` }}>
        <div className="gd-hero-art" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
          {product.image ? <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} /> : <span className="gd-hero-initial">{product.genre[0]}</span>}
        </div>
        <div className="gd-hero-bg" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }} />
        <div className="gd-hero-content">
          <Link to="/store" className="gd-back"><Icon name="arrow_back" size={16} /> Back to Store</Link>
          <div className="gd-hero-info">
            <div className="gd-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
              {product.image ? <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="gd-cover-initial">{product.genre[0]}</span>}
            </div>
            <div className="gd-hero-text">
              <div className="gd-genre-badge" style={{ color: colors[0] }}>{product.genre}</div>
              <h1 className="gd-title">{product.title}</h1>
              <div className="gd-meta">
                <span className="gd-meta-item"><Icon name="person" size={14} /> {product.developer}</span>
                <span className="gd-meta-item"><Icon name="calendar_today" size={14} /> {product.releaseDate}</span>
                <span className="gd-meta-item"><Icon name="star" size={14} style={{ color: '#f0a940' }} /> {avgRating} ({reviewCount} reviews)</span>
              </div>
              <div className="gd-tags">
                {product.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="gd-body">
        <div className="gd-main">
          {/* Details */}
          <div className="gd-section panel">
            <h3>Product Details</h3>
            <p className="gd-description">{product.description}</p>
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
              {product.price === 0
                ? <span className="price-free-lg">SAMPLE</span>
                : <span className="gd-price">${product.price.toFixed(2)}</span>
              }
            </div>
            
            <div className="gd-actions">
              {inCart ? (
                <Link to="/cart" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
                  <Icon name="shopping_cart" size={18} /> View in Cart
                </Link>
              ) : product.price === 0 ? (
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
                <strong>{product.genre}</strong>
              </div>
              <div className="gd-detail-row">
                <span><Icon name="person" size={14} /> Brand</span>
                <strong>{product.developer}</strong>
              </div>
              <div className="gd-detail-row">
                <span><Icon name="calendar_today" size={14} /> Listed</span>
                <strong>{product.releaseDate}</strong>
              </div>
              <div className="gd-detail-row">
                <span><Icon name="star" size={14} /> Rating</span>
                <strong>{avgRating} / 5</strong>
              </div>
              <div className="gd-detail-row">
                <span>Orders</span>
                <strong>{product.downloads.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

