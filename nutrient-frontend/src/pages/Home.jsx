import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import { GENRE_COLORS } from '../data/mockData';
import './Home.css';

function MarketingHero() {
  return (
    <div className="hero-carousel">
      <div className="hero-slide">
        <div className="hero-grid-texture" />
        <div className="hero-glow" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }} />

        <div className="hero-content">
          <div className="hero-left">
            <span className="hero-kicker">HydraDose Electrolytes</span>
            <h1 className="hero-title">Clean hydration for training, heat, and travel.</h1>
            <p className="hero-desc">Zero sugar electrolyte sachets with a modern, premium feel. Built for everyday wellness and high-performance routines.</p>
            <div className="formula-strip">
              <span>Sodium</span>
              <strong>800mg</strong>
              <span>Potassium</span>
              <strong>200mg</strong>
              <span>Sugar</span>
              <strong>0g</strong>
            </div>
            <div className="hero-actions">
              <div className="hero-btns">
                <Link to="/store" className="btn btn-primary btn-lg"><Icon name="shopping_cart" size={18} /> Shop Now</Link>
                <a href="#why" className="btn btn-secondary btn-lg">How it works</a>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-cover-frame" style={{ background: 'linear-gradient(135deg, rgba(109,91,255,0.80), rgba(34,211,238,0.55))' }}>
              <Icon name="water_drop" size={120} style={{ color: 'rgba(255,255,255,0.20)' }} />
            </div>
          </div>
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
  return (
    <div className="home-page">
      <MarketingHero />

      <div className="home-sections page-content" id="why">
        <section className="home-intro">
          <div>
            <span className="intro-eyebrow">Hydration, redesigned</span>
            <h2>Zero-sugar electrolyte sachets for heat, training, travel, and daily wellness.</h2>
          </div>
          <p>Built around essential minerals and a clean formula so customers understand the purpose instantly. No clutter on the home page — products stay in the Store tab.</p>
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
          <SectionHeader title="Why HydraDose" iconName="bolt" />
          <div className="grid-3 home-benefits">
            <div className="panel">
              <div className="home-benefit-title">Zero sugar</div>
              <p className="text-muted">Hydration support without sweeteners that spike and crash. Clean taste, fast mix.</p>
            </div>
            <div className="panel">
              <div className="home-benefit-title">Mineral-first</div>
              <p className="text-muted">Designed around sodium, potassium, magnesium, and zinc for real-world use cases.</p>
            </div>
            <div className="panel">
              <div className="home-benefit-title">Travel-ready</div>
              <p className="text-muted">Single-serve sachets you can carry anywhere — gym bag, office, or flights.</p>
            </div>
          </div>
        </section>

        <section className="mb-6 panel home-cta">
          <div>
            <div className="home-cta-title">Ready to pick your pack?</div>
            <p className="text-muted">Browse all sachets, filter by use case, and reorder anytime.</p>
          </div>
          <div className="home-cta-actions">
            <Link to="/store" className="btn btn-primary btn-lg">Browse Store</Link>
            <Link to="/store?filter=top" className="btn btn-secondary btn-lg">Best Sellers</Link>
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
