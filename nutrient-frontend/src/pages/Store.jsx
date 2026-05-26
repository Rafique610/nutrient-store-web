import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiX, FiSliders } from 'react-icons/fi';
import ProductCard from '../components/ui/ProductCard';
import { GENRES } from '../data/mockData';
import { useproducts } from '../context/ProductContext';
import './Store.css';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export default function Store() {
  const { products: catalog, loading, error } = useproducts();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const [search, setSearch] = useState(params.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(params.get('genre') || '');
  const [sort, setSort] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [showFreeOnly, setShowFreeOnly] = useState(params.get('filter') === 'free');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filter = params.get('filter');
  const genreFromUrl = params.get('genre') || '';
  const searchFromUrl = params.get('q') || '';

  useEffect(() => {
    setSelectedGenre(genreFromUrl);
    setSearch(searchFromUrl);
    setShowFreeOnly(filter === 'free');
  }, [genreFromUrl, searchFromUrl, filter]);

  const maxPrice = useMemo(() => {
    if (!catalog.length) return 200;
    const highest = catalog.reduce((max, g) => g.price > max ? g.price : max, 0);
    return Math.max(200, Math.ceil(highest / 10) * 10);
  }, [catalog]);

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    const nextParams = new URLSearchParams(location.search);

    if (genre) nextParams.set('genre', genre);
    else nextParams.delete('genre');

    nextParams.delete('filter');
    navigate(nextParams.toString() ? `/store?${nextParams.toString()}` : '/store');
  };

  const filtered = useMemo(() => {
    let products = [...catalog];

    // Apply quick filters from URL
    if (filter === 'new') products = products.filter(g => g.isNew);
    else if (filter === 'top') products = [...products].sort((a, b) => b.downloads - a.downloads);
    else if (filter === 'free') products = products.filter(g => g.isFree);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.genre.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Genre
    if (selectedGenre) products = products.filter(g => g.genre === selectedGenre);

    // Price — only apply when not using a quick filter
    if (!filter) {
      if (showFreeOnly) {
        products = products.filter(g => g.price === 0);
      } else {
        products = products.filter(g => g.price >= priceRange[0] && g.price <= priceRange[1]);
      }
    }

    // Sort
    switch (sort) {
      case 'rating': products.sort((a, b) => b.rating - a.rating); break;
      case 'newest': products.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)); break;
      case 'price_asc': products.sort((a, b) => a.price - b.price); break;
      case 'price_desc': products.sort((a, b) => b.price - a.price); break;
      case 'popular': products.sort((a, b) => b.downloads - a.downloads); break;
      default: products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return products;
  }, [catalog, search, selectedGenre, sort, priceRange, showFreeOnly, filter]);

  const pageTitle = filter === 'new' ? 'New Sachets'
    : filter === 'top' ? 'Best Sellers'
    : filter === 'free' ? 'Samples'
    : selectedGenre ? `${selectedGenre} Sachets`
    : 'Browse Sachets';

  const activeFiltersCount = [
    search, selectedGenre, showFreeOnly,
    priceRange[0] > 0 || priceRange[1] < maxPrice
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setSelectedGenre('');
    setShowFreeOnly(false);
    setPriceRange([0, maxPrice]);
    navigate('/store');
  };

  return (
    <div className="store-page">
      {/* Top bar */}
      <div className="store-topbar">
        <div className="store-topbar-left">
          <h1 className="store-title">{pageTitle}</h1>
          <span className="store-count">{filtered.length} sachets</span>
        </div>
        <div className="store-topbar-right">
          <div className="store-search-wrap">
            <FiSearch className="store-search-icon" />
            <input
              className="store-search"
              placeholder="Search sachets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="store-search-clear" onClick={() => setSearch('')}>
                <FiX size={14} />
              </button>
            )}
          </div>
          <select className="store-sort" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button className="store-filter-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FiSliders size={16} />
            Filters
            {activeFiltersCount > 0 && <span className="filter-badge-count">{activeFiltersCount}</span>}
          </button>
        </div>
      </div>

      <div className="store-layout">
        {/* Sidebar filters */}
        <aside className={`store-filters ${sidebarOpen ? 'open' : ''}`}>
          <div className="filter-section-header">
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <button className="clear-filters-btn" onClick={clearFilters}>Clear all</button>
            )}
          </div>

          {/* Genres */}
          <div className="filter-section">
            <div className="filter-label">Use Case</div>
            <button
              className={`genre-pill ${!selectedGenre ? 'active' : ''}`}
              onClick={() => handleGenreChange('')}
            >All</button>
            {GENRES.map(g => (
              <button
                key={g}
                className={`genre-pill ${selectedGenre === g ? 'active' : ''}`}
                onClick={() => handleGenreChange(selectedGenre === g ? '' : g)}
              >{g}</button>
            ))}
          </div>

          {/* Price */}
          <div className="filter-section">
            <div className="filter-label">Price</div>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showFreeOnly}
                onChange={e => setShowFreeOnly(e.target.checked)}
              />
              <span>Samples only</span>
            </label>
            {!showFreeOnly && (
              <div className="price-range">
                <div className="price-range-labels">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
                <input
                  type="range" min="0" max={maxPrice} step="1"
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], +e.target.value])}
                  className="range-slider"
                />
              </div>
            )}
          </div>

          {/* Quick filters */}
          <div className="filter-section">
            <div className="filter-label">Quick Filters</div>
            <button className={`quick-filter ${filter === 'new' ? 'active' : ''}`} onClick={() => navigate('/store?filter=new')}>New Sachets</button>
            <button className={`quick-filter ${filter === 'top' ? 'active' : ''}`} onClick={() => navigate('/store?filter=top')}>Best Sellers</button>
            <button className={`quick-filter ${filter === 'free' ? 'active' : ''}`} onClick={() => navigate('/store?filter=free')}>Samples</button>
          </div>
        </aside>

        {/* products grid */}
        <div className="store-content">
          {loading ? (
            <div className="loading-screen"><div className="loader" /></div>
          ) : error ? (
            <div className="store-empty">
              <h3>Unable to load sachets</h3>
              <p>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="store-empty">
              <span className="store-empty-icon">🔍</span>
              <h3>No sachets found</h3>
              <p>Try adjusting your filters or search query.</p>
              <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className="store-grid">
              {filtered.map((g, i) => (
                <ProductCard key={g.id} product={g} rank={sort === 'popular' || filter === 'top' ? i + 1 : null} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
