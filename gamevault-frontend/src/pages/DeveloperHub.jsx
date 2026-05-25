import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGames } from '../context/GameContext';
import { gamesApi } from '../services/api';
import Icon from '../components/ui/Icon';
import { GENRE_COLORS, GENRES } from '../data/mockData';
import './DeveloperHub.css';

export default function DeveloperHub() {
  const { user } = useAuth();
  const { games, loading, addGame } = useGames();
  const studioName = user?.studio || 'Your Brand';
  const [myGames, setMyGames] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: '', genre: 'Vitamins', price: '', description: '', tags: '' });
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [screenshotFiles, setScreenshotFiles] = useState([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMyGames(games.filter(g => g.developer === studioName));
  }, [games, studioName]);

  const totalDownloads = myGames.reduce((s, g) => s + g.downloads, 0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const avgRating = myGames.length > 0 ? (myGames.reduce((s, g) => s + g.rating, 0) / myGames.length).toFixed(1) : '-';

  useEffect(() => {
    // Compute real revenue: sum of (price * totalSales) for this seller's products.
    const rev = myGames.reduce((s, g) => s + g.price * g.downloads, 0);
    setTotalRevenue(rev);
  }, [myGames]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.genre);
      formData.append('price', parseFloat(form.price) || 0);
      formData.append('description', form.description || `${form.title} is now available on NutriFactor.`);
      formData.append('tags', form.tags);
      formData.append('status', 'published');
      if (coverImageFile) formData.append('coverImage', coverImageFile);
      screenshotFiles.forEach(f => formData.append('screenshots', f));

      const data = await gamesApi.create(formData);

      setMyGames(prev => [data.game, ...prev]);
      addGame(data.game);
      setShowUpload(false);
      setSubmitted(true);
      setForm({ title: '', genre: 'Vitamins', price: '', description: '', tags: '' });
      setCoverImageFile(null);
      setCoverImagePreview('');
      setScreenshotFiles([]);
      setScreenshotPreviews([]);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError(err.message || 'Unable to publish product.');
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  };

  const handleScreenshotsChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setScreenshotFiles(files);
    setScreenshotPreviews(files.map(f => URL.createObjectURL(f)));
  };

  return (
    <div className="dev-hub-page">
      <div className="dev-hub-header">
        <div className="dev-hub-brand">
          <div className="dev-hub-icon"><Icon name="inventory_2" size={28} /></div>
          <div><h1 className="dev-hub-title">Seller Hub</h1><p className="dev-hub-subtitle">{studioName}</p></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}><Icon name="upload" size={16} /> Publish New Product</button>
      </div>
      {submitted && <div className="dev-success-banner"><Icon name="check" size={16} /> Product published successfully! It's now live in the store.</div>}
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="dev-stats-grid">
        <div className="dev-stat-card panel"><div className="dev-stat-icon" style={{ color: 'var(--accent)', background: 'rgba(47,143,91,0.12)' }}><Icon name="inventory_2" size={20} /></div><div><div className="dev-stat-value">{myGames.length}</div><div className="dev-stat-label">Published Products</div></div></div>
        <div className="dev-stat-card panel"><div className="dev-stat-icon" style={{ color: 'var(--green)', background: 'rgba(47,143,91,0.12)' }}><Icon name="shopping_bag" size={20} /></div><div><div className="dev-stat-value">{totalDownloads.toLocaleString()}</div><div className="dev-stat-label">Total Orders</div></div></div>
        <div className="dev-stat-card panel"><div className="dev-stat-icon" style={{ color: '#9b59b6', background: 'rgba(155,89,182,0.12)' }}><Icon name="attach_money" size={20} /></div><div><div className="dev-stat-value">${Math.round(totalRevenue).toLocaleString()}</div><div className="dev-stat-label">Est. Revenue</div></div></div>
        <div className="dev-stat-card panel"><div className="dev-stat-icon" style={{ color: '#f0a940', background: 'rgba(240,169,64,0.12)' }}><Icon name="star" size={20} /></div><div><div className="dev-stat-value">{avgRating}</div><div className="dev-stat-label">Avg. Rating</div></div></div>
      </div>
      <div className="dev-section-header"><h2><Icon name="inventory_2" size={20} /> My Products</h2></div>
      {loading ? (
        <div className="loading-screen"><div className="loader" /></div>
      ) : myGames.length === 0 ? (
        <div className="dev-empty panel"><Icon name="inventory_2" size={50} style={{ opacity: 0.3 }} /><h3>No products published yet</h3><p>Start building your catalog by publishing your first supplement.</p><button className="btn btn-primary" onClick={() => setShowUpload(true)}><Icon name="upload" size={16} /> Publish First Product</button></div>
      ) : (
        <div className="dev-games-grid">
          {myGames.map(game => {
            const colors = GENRE_COLORS[game.genre] || ['#4da6ff','#1a6dcc'];
            return (
              <div key={game.id} className="dev-game-card panel">
                <div className="dev-game-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                  {game.image ? (
                    <img src={game.image} alt={game.title} className="dev-game-img" />
                  ) : (
                    <span className="dev-cover-initial">{game.genre[0]}</span>
                  )}
                  {game.isNew && <span className="dev-new-badge">NEW</span>}
                </div>
                <div className="dev-game-info">
                  <div className="dev-game-title">{game.title}</div>
                  <div className="dev-game-meta"><span className="tag">{game.genre}</span><span className={game.price === 0 ? 'text-green font-bold text-sm' : 'text-sm font-bold'}>{game.price === 0 ? 'SAMPLE' : `$${game.price.toFixed(2)}`}</span></div>
                  <div className="dev-game-stats"><span className="dev-stat-pill"><Icon name="shopping_bag" size={12} /> {game.downloads.toLocaleString()}</span><span className="dev-stat-pill gold"><Icon name="star" size={12} /> {game.rating.toFixed(1)}</span><span className="dev-stat-pill">{game.reviews} reviews</span></div>
                </div>
                <div className="dev-game-actions"><Link to={`/game/${game.id}`} className="btn btn-secondary btn-sm"><Icon name="visibility" size={14} /> View</Link></div>
              </div>
            );
          })}
        </div>
      )}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal dev-upload-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3><Icon name="upload" size={18} /> Publish New Product</h3><button className="btn btn-icon btn-secondary" onClick={() => setShowUpload(false)}><Icon name="close" size={18} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Product Title *</label><input className="form-control" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Enter supplement name" required /></div>
                <div className="form-row"><div className="form-group"><label className="form-label">Health Goal *</label><select className="form-control" value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</select></div><div className="form-group"><label className="form-label">Price ($) *</label><input className="form-control" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0 = Sample" required /></div></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe product benefits and usage..." /></div>
                <div className="form-group"><label className="form-label">Tags (comma-separated)</label><input className="form-control" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="Vitamin C, Immunity, Daily Care..." /></div>
                <div className="form-group">
                  <label className="form-label">Cover Image</label>
                  <input className="form-control" type="file" accept="image/*" onChange={handleCoverChange} />
                  {coverImagePreview && <img src={coverImagePreview} alt="Cover preview" style={{ marginTop: 8, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }} />}
                </div>
                <div className="form-group">
                  <label className="form-label">Product Gallery (up to 5)</label>
                  <input className="form-control" type="file" accept="image/*" multiple onChange={handleScreenshotsChange} />
                  {screenshotPreviews.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {screenshotPreviews.map((src, i) => (
                        <img key={i} src={src} alt={`Product preview ${i + 1}`} style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6 }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button><button type="submit" className="btn btn-primary"><Icon name="check" size={16} /> Publish Product</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
