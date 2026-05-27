import { Link } from 'react-router-dom';
import { FiArrowRight, FiStar } from 'react-icons/fi';
import { useproducts } from '../context/ProductContext';
import { GENRE_COLORS } from '../data/mockData';
import './Home.css';

const USE_CASES = [
  { name: 'Exercise', color: '#23c9b7' },
  { name: 'Heat', color: '#f97316' },
  { name: 'Travel', color: '#38bdf8' },
  { name: 'Wellness', color: '#22c55e' },
  { name: 'Recovery', color: '#a78bfa' },
  { name: 'Sleep', color: '#818cf8' },
  { name: 'Performance', color: '#06b6d4' },
];

const BENEFITS = [
  { value: '0g', label: 'Sugar', desc: 'No crash' },
  { value: '0', label: 'Calories', desc: 'Pure hydration' },
  { value: '4', label: 'Key Minerals', desc: 'Sodium, potassium, magnesium, zinc' },
];

const MINERALS = [
  { name: 'Sodium', amount: '800mg', desc: 'Fluid balance' },
  { name: 'Potassium', amount: '200mg', desc: 'Heart support' },
  { name: 'Magnesium', amount: '100mg', desc: 'Muscle recovery' },
  { name: 'Zinc', amount: '10mg', desc: 'Daily immunity' },
];

export default function Home() {
  const { products, loading } = useproducts();

  const heroProduct = products.find(p => p.isFeatured && p.image) || products.find(p => p.image);
  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="home-v2">

      {/* ── HERO ── */}
      <section className="hero-v2">
        <div className="hero-v2-bg">
          <div className="hero-v2-orb hero-orb-1" />
          <div className="hero-v2-orb hero-orb-2" />
          <div className="hero-grid-lines" />
        </div>

        <div className="hero-v2-content">
          <div className="hero-v2-eyebrow">
            <span className="eyebrow-dot" />
            Clean Hydration
          </div>

          <h1 className="hero-v2-title">
            Hydrate<br />
            <span className="hero-title-accent">without</span><br />
            the sugar.
          </h1>

          <p className="hero-v2-desc">
            Zero-sugar electrolyte sachets built around sodium, potassium, magnesium and zinc. For workouts, heat, travel and everyday life.
          </p>

          {/* Benefits */}
          <div className="hero-benefits">
            {BENEFITS.map(b => (
              <div key={b.label} className="benefit-item">
                <div className="benefit-value">{b.value}</div>
                <div className="benefit-label">{b.label}</div>
                <div className="benefit-desc">{b.desc}</div>
              </div>
            ))}
          </div>

          <div className="hero-v2-actions">
            <Link to="/store" className="btn btn-primary btn-lg hero-cta-btn">
              Shop Now <FiArrowRight size={16} />
            </Link>
            <Link to="/store?filter=free" className="btn btn-secondary hero-sample-btn">
              Free Samples
            </Link>
          </div>
        </div>

        {/* Product image */}
        {heroProduct && (
          <div className="hero-v2-visual">
            <div className="hero-product-card">
              <img src={heroProduct.image} alt={heroProduct.title} className="hero-product-img-v2" />
              <div className="hero-product-badge">
                <FiStar size={10} fill="currentColor" />
                {heroProduct.rating.toFixed(1)}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── FORMULA STRIP ── */}
      <section className="formula-strip-v2">
        {MINERALS.map((m, i) => (
          <div key={m.name} className="formula-item">
            <span className="formula-amount">{m.amount}</span>
            <span className="formula-name">{m.name}</span>
            <span className="formula-desc">{m.desc}</span>
            {i < MINERALS.length - 1 && <div className="formula-divider" />}
          </div>
        ))}
      </section>

      {/* ── USE CASES ── */}
      <section className="use-cases-section">
        <div className="section-label">Shop by use case</div>
        <div className="use-cases-scroll">
          {USE_CASES.map(({ name, color }) => (
            <Link
              key={name}
              to={`/store?genre=${name}`}
              className="use-case-chip"
              style={{ '--chip-color': color }}
            >
              {name}
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      {featuredProducts.length > 0 && (
        <section className="featured-section">
          <div className="featured-header">
            <h2 className="featured-title">Best Sellers</h2>
            <Link to="/store?filter=top" className="featured-more">
              See all <FiArrowRight size={13} />
            </Link>
          </div>

          <div className="featured-scroll">
            {featuredProducts.map(product => {
              const colors = GENRE_COLORS[product.genre] || ['#23c9b7', '#0d9488'];
              return (
                <Link key={product.id} to={`/product/${product.id}`} className="feat-card">
                  <div className="feat-card-img" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                    {product.image
                      ? <img src={product.image} alt={product.title} />
                      : <span className="feat-initial">{product.genre[0]}</span>
                    }
                    {product.isNew && <span className="feat-new">NEW</span>}
                  </div>
                  <div className="feat-card-info">
                    <span className="feat-genre">{product.genre}</span>
                    <span className="feat-name">{product.title}</span>
                    <div className="feat-bottom">
                      <span className="feat-price">
                        {product.price === 0 ? 'SAMPLE' : `$${product.price.toFixed(2)}`}
                      </span>
                      <span className="feat-rating">
                        <FiStar size={11} fill="currentColor" style={{ color: '#fbbf24' }} />
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── WHY HYDRADOSE ── */}
      <section className="why-section">
        <div className="why-inner">
          <div className="section-label">Why HydraDose</div>
          <h2 className="why-title">Replenish what<br />sweat takes out.</h2>

          <div className="why-grid">
            {[
              { title: 'Zero sugar', body: 'No spike, no crash. Clean hydration that tastes good.' },
              { title: 'Mineral-first', body: 'Built around sodium, potassium, magnesium, zinc.' },
              { title: 'Travel-ready', body: 'Single-serve sachets. Gym bag, carry-on, office drawer.' },
            ].map(({ title, body }) => (
              <div key={title} className="why-card">
                <h3 className="why-card-title">{title}</h3>
                <p className="why-card-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bottom-cta">
        <div className="bottom-cta-inner">
          <h2 className="bottom-cta-title">Ready to hydrate smarter?</h2>
          <p className="bottom-cta-sub">Browse all sachets and find your pack.</p>
          <div className="bottom-cta-btns">
            <Link to="/store" className="btn btn-primary btn-lg">Browse Store</Link>
            <Link to="/store?filter=top" className="btn btn-secondary btn-lg">Best Sellers</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
