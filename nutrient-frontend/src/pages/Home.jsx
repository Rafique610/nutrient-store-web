import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import ProductCard from '../components/ui/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useproducts } from '../context/ProductContext';
import { GENRE_COLORS } from '../data/mockData';
import './Home.css';

function HeroCarousel({ featuredproducts }) {
  const [current, setCurrent] = useState(0);
  const { user, addToCart, isInCart, isOwned } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (featuredproducts.length === 0) return undefined;
    const timer = setInterval(() => setCurrent(c => (c + 1) % featuredproducts.length), 5000);
    return () => clearInterval(timer);
  }, [featuredproducts.length]);

  useEffect(() => {
    setCurrent(0);
  }, [featuredproducts]);

  if (featuredproducts.length === 0) {
    return (
      <div className="hero-carousel">
        <div className="hero-slide">
          <div className="hero-content">
            <div className="hero-left">
              <span className="hero-kicker">Zero sugar electrolyte sachets</span>
              <h1 className="hero-title">Clean hydration, packed for real life.</h1>
              <p className="hero-desc">No sachets are published yet. Seed the backend or add a new product to fill the store.</p>
              <Link to="/store" className="btn btn-primary btn-lg">Browse Sachets</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const product = featuredproducts[current];
  const colors = GENRE_COLORS[product.genre] || ['#23c9b7', '#0d9488'];
  const owned = isOwned(product.id);
  const inCart = isInCart(product.id);

  return (
    <div className="hero-carousel">
      <div className="hero-slide">
        <div className="hero-grid-texture" />
        <div className="hero-glow" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }} />

        <div className="hero-content">
          <div className="hero-left">
            {product.isNew && <div className="hero-badge-new"><Icon name="bolt" size={14} /> NEW DROP</div>}
            <span className="hero-kicker">Electrolyte drink mix</span>
            <h1 className="hero-title">Hydration sachets without the sugar crash.</h1>
            <div className="hero-meta">
              <span className="tag">{product.genre}</span>
              <div className="hero-rating">
                <Icon name="star" className="star-icon" size={16} />
                {product.rating} ({product.reviews.toLocaleString()} reviews)
              </div>
            </div>
            <p className="hero-desc">{product.description}</p>
            <div className="formula-strip">
              <span>Sodium</span>
              <strong>800mg</strong>
              <span>Potassium</span>
              <strong>200mg</strong>
              <span>Sugar</span>
              <strong>0g</strong>
            </div>
            <div className="hero-actions">
              <div className="hero-price">
                {product.price === 0 ? <span className="price-free-lg">SAMPLE</span> : <span className="price-lg">${product.price}</span>}
              </div>
              <div className="hero-btns">
                {inCart ? (
                  <Link to="/cart" className="btn btn-primary btn-lg"><Icon name="shopping_cart" size={18} /> View Cart</Link>
                ) : (
                  <button className="btn btn-primary btn-lg" onClick={async () => {
                    if (!user) { navigate('/login'); return; }
                    await addToCart(product);
                  }}>
                    <Icon name="shopping_cart" size={18} /> {product.price === 0 ? 'Get Sample' : owned ? 'Buy Again' : 'Add to Cart'}
                  </button>
                )}
                <Link to={`/product/${product.id}`} className="btn btn-secondary btn-lg">View Sachet</Link>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-cover-frame" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
              {product.image ? (
                <img src={product.image} alt={product.title} className="hero-cover-img" />
              ) : (
                <span className="hero-cover-initial">{product.genre[0]}</span>
              )}
            </div>
          </div>
        </div>

        <div className="hero-indicators">
          {featuredproducts.map((_, i) => (
            <button key={i} aria-label={`Show featured sachet ${i + 1}`} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} />
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
  const { products, loading, error } = useproducts();
  const featuredproducts = products.filter(g => g.isFeatured).length > 0 ? products.filter(g => g.isFeatured) : products.slice(0, 5);
  const newproducts = products.filter(g => g.isNew).slice(0, 4);
  const topproducts = [...products].sort((a, b) => b.downloads - a.downloads).slice(0, 4);
  const dailyHydration = products.filter(g => ['Wellness', 'Heat', 'Travel', 'Exercise'].includes(g.genre)).slice(0, 4);

  if (loading) {
    return <div className="loading-screen"><div className="loader" /></div>;
  }

  return (
    <div className="home-page">
      {error && <div className="auth-error" style={{ margin: 24 }}>{error}</div>}
      <HeroCarousel featuredproducts={featuredproducts} />

      <div className="home-sections page-content">
        <section className="home-intro">
          <div>
            <span className="intro-eyebrow">Hydration, redesigned</span>
            <h2>Zero-sugar electrolyte sachets for heat, training, travel, and daily wellness.</h2>
          </div>
          <p>Each pack is built around clean mineral support, fast mixing, and a premium dark interface inspired by modern portfolio design rather than a clinical shelf.</p>
        </section>

        <section className="formula-panel">
          <div className="formula-copy">
            <span className="intro-eyebrow">Core formula</span>
            <h2>Replenish what sweat takes out.</h2>
            <p>Designed around sodium, potassium, magnesium, and zinc so customers immediately understand why the sachets exist.</p>
          </div>
          <div className="formula-grid">
            <div><strong>Sodium</strong><span>Fluid balance after sweat.</span></div>
            <div><strong>Magnesium</strong><span>Muscle function and recovery.</span></div>
            <div><strong>Potassium</strong><span>Nerve and heart support.</span></div>
            <div><strong>Zinc</strong><span>Daily immune support.</span></div>
          </div>
        </section>

        <section className="mb-6">
          <SectionHeader title="New Sachet Drops" iconName="bolt" linkTo="/store?filter=new" linkText="See All" />
          {newproducts.length > 0 ? (
            <div className="products-grid">
              {newproducts.map(g => <ProductCard key={g.id} product={g} />)}
            </div>
          ) : (
            <p className="text-muted" style={{ padding: '16px 0' }}>No new sachets yet. Check back soon!</p>
          )}
        </section>

        <section className="mb-6">
          <SectionHeader title="Top Hydration Packs" iconName="trending_up" linkTo="/store?filter=top" linkText="See All" />
          <div className="products-grid">
            {topproducts.map((g, i) => <ProductCard key={g.id} product={g} rank={i + 1} />)}
          </div>
        </section>

        <section className="mb-6">
          <SectionHeader title="Daily Hydration" iconName="star" linkTo="/store" linkText="Shop All" />
          <div className="products-grid">
            {dailyHydration.map(g => <ProductCard key={g.id} product={g} />)}
          </div>
        </section>

        <section>
          <SectionHeader title="Shop by Use Case" iconName="water_drop" />
          <div className="genre-grid">
            {Object.entries(GENRE_COLORS).map(([genre, colors]) => (
              <Link key={genre} to={`/store?genre=${genre}`} className="genre-card" style={{ background: `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}12)`, borderColor: `${colors[0]}55` }}>
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
