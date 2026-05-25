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
              <h1 className="hero-title">NutriFactor</h1>
              <p className="hero-desc">No supplements are published yet. Seed the backend or add a new product to fill the store.</p>
              <Link to="/store" className="btn btn-primary btn-lg">Browse Products</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const product = featuredproducts[current];
  const colors = GENRE_COLORS[product.genre] || ['#4da6ff', '#1a6dcc'];
  const owned = isOwned(product.id);
  const inCart = isInCart(product.id);

  return (
    <div className="hero-carousel">
      <div className="hero-slide" style={{ background: `linear-gradient(135deg, ${colors[0]}22, ${colors[1]}11, var(--bg))` }}>
        <div
          className="hero-bg-cover"
          style={product.image
            ? { backgroundImage: `linear-gradient(90deg, var(--bg), transparent), url(${product.image})` }
            : { background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
        />

        <div className="hero-content">
          <div className="hero-left">
            {product.isNew && <div className="hero-badge-new"><Icon name="bolt" size={14} /> NEW FORMULA</div>}
            <h1 className="hero-title">{product.title}</h1>
            <div className="hero-meta">
              <span className="tag">{product.genre}</span>
              <div className="hero-rating">
                <Icon name="star" className="star-icon" size={16} />
                {product.rating} ({product.reviews.toLocaleString()} reviews)
              </div>
            </div>
            <p className="hero-desc">{product.description}</p>
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
                <Link to={`/product/${product.id}`} className="btn btn-secondary btn-lg">View Details</Link>
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

        {/* Indicators */}
        <div className="hero-indicators">
          {featuredproducts.map((_, i) => (
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
  const { products, loading, error } = useproducts();
  const featuredproducts = products.filter(g => g.isFeatured).length > 0 ? products.filter(g => g.isFeatured) : products.slice(0, 5);
  const newproducts = products.filter(g => g.isNew).slice(0, 4);
  const topproducts = [...products].sort((a, b) => b.downloads - a.downloads).slice(0, 4);
  const dailyCare = products.filter(g => ['Vitamins', 'Immunity', 'Digestive Health'].includes(g.genre)).slice(0, 4);

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
            <span className="intro-eyebrow">Wellness made simple</span>
            <h2>Shop supplements for daily care, active lifestyles, and family wellness.</h2>
          </div>
          <p>Natural color, clean product cards, and pharmacy-style details now replace the gaming storefront while keeping your connected cart and backend flow.</p>
        </section>

        <section className="mb-6">
          <SectionHeader title="New Formulas" iconName="bolt" linkTo="/store?filter=new" linkText="See All" />
          {newproducts.length > 0 ? (
            <div className="products-grid">
              {newproducts.map(g => <ProductCard key={g.id} product={g} />)}
            </div>
          ) : (
            <p className="text-muted" style={{ padding: '16px 0' }}>No new formulas yet. Check back soon!</p>
          )}
        </section>

        <section className="mb-6">
          <SectionHeader title="Top Sellers" iconName="trending_up" linkTo="/store?filter=top" linkText="See All" />
          <div className="products-grid">
            {topproducts.map((g, i) => <ProductCard key={g.id} product={g} rank={i + 1} />)}
          </div>
        </section>

        <section className="mb-6">
          <SectionHeader title="Daily Essentials" iconName="star" linkTo="/store" linkText="Shop All" />
          <div className="products-grid">
            {dailyCare.map(g => <ProductCard key={g.id} product={g} />)}
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


