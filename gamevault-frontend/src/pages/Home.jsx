import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import GameCard from '../components/ui/GameCard';
import { useAuth } from '../context/AuthContext';
import { useGames } from '../context/GameContext';
import { GENRE_COLORS } from '../data/mockData';
import './Home.css';

function HeroCarousel({ featuredGames }) {
  const [current, setCurrent] = useState(0);
  const { user, addToCart, isInCart, isOwned } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (featuredGames.length === 0) return undefined;
    const timer = setInterval(() => setCurrent(c => (c + 1) % featuredGames.length), 5000);
    return () => clearInterval(timer);
  }, [featuredGames.length]);

  useEffect(() => {
    setCurrent(0);
  }, [featuredGames]);

  if (featuredGames.length === 0) {
    return (
      <div className="hero-carousel">
        <div className="hero-slide">
          <div className="hero-content">
            <div className="hero-left">
              <h1 className="hero-title">NutriFactor</h1>
              <p className="hero-desc">No supplements are published yet. Seed the backend or add a new product to fill the store.</p>
              <Link to="/store" className="btn btn-primary btn-lg">Browse Products</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const game = featuredGames[current];
  const colors = GENRE_COLORS[game.genre] || ['#4da6ff', '#1a6dcc'];
  const owned = isOwned(game.id);
  const inCart = isInCart(game.id);

  return (
    <div className="hero-carousel">
      <div className="hero-slide" style={{ background: `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}11, var(--bg))` }}>
        <div
          className="hero-bg-cover"
          style={game.image
            ? { backgroundImage: `linear-gradient(90deg, var(--bg), transparent), url(${game.image})` }
            : { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
        />

        <div className="hero-content">
          <div className="hero-left">
            {game.isNew && <div className="hero-badge-new"><Icon name="bolt" size={14} /> NEW FORMULA</div>}
            <h1 className="hero-title">{game.title}</h1>
            <div className="hero-meta">
              <span className="tag">{game.genre}</span>
              <div className="hero-rating">
                <Icon name="star" className="star-icon" size={16} />
                {game.rating} ({game.reviews.toLocaleString()} reviews)
              </div>
            </div>
            <p className="hero-desc">{game.description}</p>
            <div className="hero-actions">
              <div className="hero-price">
                {game.price === 0 ? <span className="price-free-lg">SAMPLE</span> : <span className="price-lg">${game.price}</span>}
              </div>
              <div className="hero-btns">
                {owned ? (
                  <Link to="/library" className="btn btn-success btn-lg"><Icon name="check" size={18} /> Purchased</Link>
                ) : inCart ? (
                  <Link to="/cart" className="btn btn-primary btn-lg"><Icon name="shopping_cart" size={18} /> View Cart</Link>
                ) : (
                  <button className="btn btn-primary btn-lg" onClick={async () => {
                    if (!user) { navigate('/login'); return; }
                    await addToCart(game);
                  }}>
                    <Icon name="shopping_cart" size={18} /> {game.price === 0 ? 'Get Sample' : 'Add to Cart'}
                  </button>
                )}
                <Link to={`/game/${game.id}`} className="btn btn-secondary btn-lg">View Details</Link>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-cover-frame" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
              {game.image ? (
                <img src={game.image} alt={game.title} className="hero-cover-img" />
              ) : (
                <span className="hero-cover-initial">{game.genre[0]}</span>
              )}
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="hero-indicators">
          {featuredGames.map((_, i) => (
            <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, iconName, linkTo, linkText }) {
  return (
    <div className="section-header">
      <h2 className="section-title"><Icon name={iconName} size={22} /> {title}</h2>
      {linkTo && <Link to={linkTo} className="section-more">{linkText} <Icon name="arrow_forward" size={14} /></Link>}
    </div>
  );
}

export default function Home() {
  const { games, loading, error } = useGames();
  const featuredGames = games.filter(g => g.isFeatured).length > 0 ? games.filter(g => g.isFeatured) : games.slice(0, 5);
  const newGames = games.filter(g => g.isNew).slice(0, 4);
  const topGames = [...games].sort((a, b) => b.downloads - a.downloads).slice(0, 4);
  const dailyCare = games.filter(g => ['Vitamins', 'Immunity', 'Digestive Health'].includes(g.genre)).slice(0, 4);

  if (loading) {
    return <div className="loading-screen"><div className="loader" /></div>;
  }

  return (
    <div className="home-page">
      {error && <div className="auth-error" style={{ margin: 24 }}>{error}</div>}
      <HeroCarousel featuredGames={featuredGames} />

      <div className="home-sections page-content">
        <section className="home-intro">
          <div>
            <span className="intro-eyebrow">Wellness made simple</span>
            <h2>Shop supplements for daily care, active lifestyles, and family wellness.</h2>
          </div>
          <p>Natural color, clean product cards, and pharmacy-style details now replace the gaming storefront while keeping your connected cart and backend flow.</p>
        </section>

        <section className="mb-6">
          <SectionHeader title="New Formulas" iconName="bolt" linkTo="/store?filter=new" linkText="See All" />
          {newGames.length > 0 ? (
            <div className="games-grid">
              {newGames.map(g => <GameCard key={g.id} game={g} />)}
            </div>
          ) : (
            <p className="text-muted" style={{ padding: '16px 0' }}>No new formulas yet. Check back soon!</p>
          )}
        </section>

        <section className="mb-6">
          <SectionHeader title="Top Sellers" iconName="trending_up" linkTo="/store?filter=top" linkText="See All" />
          <div className="games-grid">
            {topGames.map((g, i) => <GameCard key={g.id} game={g} rank={i + 1} />)}
          </div>
        </section>

        <section className="mb-6">
          <SectionHeader title="Daily Essentials" iconName="star" linkTo="/store" linkText="Shop All" />
          <div className="games-grid">
            {dailyCare.map(g => <GameCard key={g.id} game={g} />)}
          </div>
        </section>

        <section>
          <SectionHeader title="Shop by Health Goal" iconName="star" />
          <div className="genre-grid">
            {Object.entries(GENRE_COLORS).map(([genre, colors]) => (
              <Link key={genre} to={`/store?genre=${genre}`} className="genre-card" style={{ background: `linear-gradient(135deg, ${colors[0]}33, ${colors[1]}22)`, borderColor: `${colors[0]}44` }}>
                <div className="genre-card-icon" style={{ color: colors[0] }}>{genre[0]}</div>
                <span>{genre}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
