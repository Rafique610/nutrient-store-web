import { Link } from 'react-router-dom';
import { FiArrowRight, FiStar, FiCheck } from 'react-icons/fi';
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
  { value: '4', label: 'Key Minerals', desc: 'Complete blend' },
];

const MINERALS = [
  { name: 'Sodium', amount: '800mg', desc: 'Fluid balance' },
  { name: 'Potassium', amount: '200mg', desc: 'Heart support' },
  { name: 'Magnesium', amount: '100mg', desc: 'Muscle recovery' },
  { name: 'Zinc', amount: '10mg', desc: 'Daily immunity' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Marathon Runner', text: 'Finally a hydration product that doesn\'t taste like sugar water. Game changer for long runs.', rating: 5 },
  { name: 'James T.', role: 'Fitness Coach', text: 'My clients love these. Clean ingredients, effective hydration. Recommend to everyone.', rating: 5 },
  { name: 'Lisa K.', role: 'Travel Blogger', text: 'Lightweight, portable, and actually tastes good. Perfect for hiking trips.', rating: 5 },
];

const FEATURES = [
  { title: 'No Artificial Sweeteners', desc: 'Sweetened naturally. No aftertaste, no compromise.' },
  { title: 'Single-Serve Sachets', desc: 'Grab one, mix in water, go. Perfect portioning every time.' },
  { title: 'Clinically Formulated', desc: 'Electrolyte ratios matched to your body\'s needs during activity.' },
  { title: 'Vegan & Non-GMO', desc: 'Clean ingredients you can feel good about.' },
];

const FAQS = [
  { q: 'When should I drink HydraDose?', a: 'Before, during, or after any physical activity. Also great for everyday hydration.' },
  { q: 'How much sodium is in each sachet?', a: '800mg—optimal for electrolyte balance during intense exercise.' },
  { q: 'Can I use it every day?', a: 'Absolutely. Our formula is safe for daily use and everyday hydration.' },
  { q: 'How long does one sachet last?', a: 'One sachet makes 16oz of hydration drink. Most people consume it during or after activity.' },
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
            <span className="hero-title-accent">smarter.</span>
          </h1>

          <p className="hero-v2-desc">
            Zero-sugar electrolyte sachets. Packed with sodium, potassium, magnesium, and zinc. Trusted by athletes, loved by everyone.
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
            <Link to="/store?filter=new" className="btn btn-secondary hero-sample-btn">
              View Products
            </Link>
          </div>

          <div className="hero-trust">
            <span className="trust-icon">✓</span>
            <span>100% money-back guarantee. No questions asked.</span>
          </div>
        </div>

        {/* Hero visual - smaller */}
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

      {/* ── FEATURES ── */}
      <section className="features-section">
        <div className="features-inner">
          <div className="section-label">Why athletes choose HydraDose</div>
          <h2 className="features-title">Engineered for performance</h2>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon"><FiCheck size={24} /></div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      {featuredProducts.length > 0 && (
        <section className="featured-section">
          <div className="featured-header">
            <div>
              <div className="section-label">Best sellers</div>
              <h2 className="featured-title">Top-rated flavors</h2>
            </div>
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

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials-section">
        <div className="testimonials-inner">
          <div className="section-label">Real results</div>
          <h2 className="testimonials-title">Loved by athletes worldwide</h2>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, j) => (
                    <FiStar key={j} size={14} fill="#fbbf24" color="#fbbf24" />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">98%</div>
            <div className="stat-label">Would Recommend</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">4.8★</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">10M+</div>
            <div className="stat-label">Sachets Sold</div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="faq-section">
        <div className="faq-inner">
          <div className="section-label">Questions?</div>
          <h2 className="faq-title">Frequently asked</h2>
          <div className="faq-grid">
            {FAQS.map((item, i) => (
              <div key={i} className="faq-item">
                <div className="faq-question">{item.q}</div>
                <div className="faq-answer">{item.a}</div>
              </div>
            ))}
          </div>
          <div className="faq-cta">
            <p>Still have questions?</p>
            <a href="#" className="btn btn-secondary">Contact us</a>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="newsletter-section">
        <div className="newsletter-inner">
          <h2 className="newsletter-title">Stay hydrated. Stay updated.</h2>
          <p className="newsletter-sub">Get tips, new flavors, and exclusive offers delivered to your inbox.</p>
          <form className="newsletter-form" onSubmit={e => { e.preventDefault(); alert('Thanks for signing up!'); }}>
            <input type="email" placeholder="your@email.com" required className="newsletter-input" />
            <button type="submit" className="btn btn-primary">Subscribe</button>
          </form>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bottom-cta">
        <div className="bottom-cta-inner">
          <h2 className="bottom-cta-title">Ready to upgrade your hydration?</h2>
          <p className="bottom-cta-sub">Join thousands of athletes who trust HydraDose for clean, effective hydration.</p>
          <div className="bottom-cta-btns">
            <Link to="/store" className="btn btn-primary btn-lg">Shop Now</Link>
            <Link to="/store?filter=top" className="btn btn-secondary btn-lg">Best Sellers</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
