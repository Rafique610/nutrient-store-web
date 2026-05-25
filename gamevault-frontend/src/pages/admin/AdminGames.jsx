import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { adminApi } from '../../services/api';
import { GENRE_COLORS, GENRES } from '../../data/mockData';
import './AdminGames.css';

const DEFAULT_GAME = { title: '', genre: 'Vitamins', price: '', description: '', developer: '', tags: '' };

export default function AdminGames() {
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [games, setGames] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [editGame, setEditGame] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGame, setNewGame] = useState(DEFAULT_GAME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const genres = GENRES;

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await adminApi.games();
        setGames(data.games || []);
      } catch (err) {
        setError(err.message || 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  const filtered = games.filter(g => {
    const q = search.toLowerCase();
    return (!q || g.title.toLowerCase().includes(q) || g.developer.toLowerCase().includes(q)) && (!genreFilter || g.genre === genreFilter);
  }).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'downloads') return b.downloads - a.downloads;
    return 0;
  });

  const handleDelete = async (id) => {
    setError('');
    try {
      await adminApi.deleteGame(id);
      setGames(prev => prev.filter(g => g.id !== id));
      setDeleteId(null);
    } catch (err) {
      setError(err.message || 'Unable to delete product.');
    }
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await adminApi.createGame({
        title: newGame.title,
        category: newGame.genre,
        price: parseFloat(newGame.price) || 0,
        description: newGame.description || `${newGame.title} is available on NutriFactor.`,
        developer: newGame.developer || 'NutriFactor Wellness Lab',
        tags: newGame.tags || newGame.genre,
        status: 'published',
      });
      setGames(prev => [data.game, ...prev]);
      setNewGame(DEFAULT_GAME);
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || 'Unable to add product.');
    }
  };

  const handleEditGame = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await adminApi.updateGame(editGame.id, {
        title: editGame.title,
        category: editGame.genre,
        price: editGame.price,
        description: editGame.description,
        developer: editGame.developer,
        tags: Array.isArray(editGame.tags) ? editGame.tags.join(', ') : editGame.tags,
        status: editGame.status || 'published',
      });
      setGames(prev => prev.map(game => game.id === editGame.id ? data.game : game));
      setEditGame(null);
    } catch (err) {
      setError(err.message || 'Unable to update product.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header"><div><h1 className="admin-title">Product Management</h1><p className="admin-subtitle">{games.length} total products in catalog</p></div><button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Icon name="add" size={16} /> Add New Product</button></div>
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="ag-toolbar panel">
        <div className="ag-search-wrap"><Icon name="search" className="ag-search-icon" size={16} /><input className="ag-search" placeholder="Search by title or developer..." value={search} onChange={e => setSearch(e.target.value)} />{search && <button className="ag-search-clear" onClick={() => setSearch('')}><Icon name="close" size={14} /></button>}</div>
        <div className="ag-filters"><select className="ag-select" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}><option value="">All Goals</option>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select><select className="ag-select" value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="title">Sort: Title</option><option value="price">Sort: Price</option><option value="rating">Sort: Rating</option><option value="downloads">Sort: Orders</option></select></div>
        <span className="ag-count">{filtered.length} results</span>
      </div>
      <div className="ag-table-wrap panel">
        {loading ? <div className="loading-screen"><div className="loader" /></div> : (
          <table className="ag-table"><thead><tr><th>Product</th><th>Health Goal</th><th>Price</th><th>Rating</th><th>Orders</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{filtered.map(game => { const colors = GENRE_COLORS[game.genre] || ['#4da6ff','#1a6dcc']; return (
              <tr key={game.id}><td><div className="ag-game-cell"><div className="ag-game-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>{game.image ? <img src={game.image} alt={game.title} className="ag-game-cover-img" /> : game.genre[0]}</div><div><div className="ag-game-title">{game.title}</div><div className="ag-game-dev text-muted text-sm">{game.developer}</div></div></div></td>
                <td><span className="tag">{game.genre}</span></td>
                <td><span className={game.price === 0 ? 'text-green font-bold' : 'ag-price'}>{game.price === 0 ? 'SAMPLE' : `$${game.price.toFixed(2)}`}</span></td>
                <td><span className="ag-rating"><Icon name="star" size={14} className="star-icon" /> {game.rating.toFixed(1)}</span></td>
                <td><span className="ag-downloads">{game.downloads.toLocaleString()}</span></td>
                <td>{game.status === 'draft' ? <span className="badge badge-soft">Draft</span> : game.isNew ? <span className="badge badge-blue">New</span> : game.isFeatured ? <span className="badge badge-gold">Featured</span> : <span className="badge badge-soft">Active</span>}</td>
                <td><div className="ag-actions"><Link to={`/game/${game.id}`} className="ag-btn ag-btn-view" title="View"><Icon name="visibility" size={14} /></Link><button className="ag-btn ag-btn-edit" title="Edit" onClick={() => setEditGame({ ...game, tags: game.tags.join(', ') })}><Icon name="edit" size={14} /></button><button className="ag-btn ag-btn-delete" title="Delete" onClick={() => setDeleteId(game.id)}><Icon name="delete" size={14} /></button></div></td></tr>); })}</tbody></table>
        )}
        {filtered.length === 0 && !loading && <div className="ag-empty"><p>No products found. Try adjusting filters.</p></div>}
      </div>
      {deleteId && (<div className="modal-overlay" onClick={() => setDeleteId(null)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>Delete Product</h3></div><div className="modal-body"><p>Are you sure you want to delete <strong>{games.find(g => g.id === deleteId)?.title}</strong>? This cannot be undone.</p></div><div className="modal-footer"><button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button><button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button></div></div></div>)}
      {editGame && (<div className="modal-overlay" onClick={() => setEditGame(null)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3><Icon name="edit" size={18} /> Edit Product</h3><button className="btn btn-icon btn-secondary" onClick={() => setEditGame(null)}><Icon name="close" size={18} /></button></div><form onSubmit={handleEditGame}><div className="modal-body"><div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={editGame.title} onChange={e => setEditGame(p => ({ ...p, title: e.target.value }))} required /></div><div className="form-row"><div className="form-group"><label className="form-label">Health Goal *</label><select className="form-control" value={editGame.genre} onChange={e => setEditGame(p => ({ ...p, genre: e.target.value }))}>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select></div><div className="form-group"><label className="form-label">Price ($)</label><input className="form-control" type="number" min="0" step="0.01" value={editGame.price} onChange={e => setEditGame(p => ({ ...p, price: e.target.value }))} required /></div></div><div className="form-group"><label className="form-label">Brand</label><input className="form-control" value={editGame.developer} onChange={e => setEditGame(p => ({ ...p, developer: e.target.value }))} required /></div><div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={editGame.description || ''} onChange={e => setEditGame(p => ({ ...p, description: e.target.value }))} /></div><div className="form-group"><label className="form-label">Tags</label><input className="form-control" value={editGame.tags || ''} onChange={e => setEditGame(p => ({ ...p, tags: e.target.value }))} /></div><div className="form-group"><label className="form-label">Status</label><select className="form-control" value={editGame.status || 'published'} onChange={e => setEditGame(p => ({ ...p, status: e.target.value }))}><option value="published">Published</option><option value="draft">Draft</option></select></div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditGame(null)}>Cancel</button><button type="submit" className="btn btn-primary"><Icon name="check" size={16} /> Save Changes</button></div></form></div></div>)}
      {showAddModal && (<div className="modal-overlay" onClick={() => setShowAddModal(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3><Icon name="add" size={18} /> Add New Product</h3><button className="btn btn-icon btn-secondary" onClick={() => setShowAddModal(false)}><Icon name="close" size={18} /></button></div><form onSubmit={handleAddGame}><div className="modal-body"><div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={newGame.title} onChange={e => setNewGame(p => ({ ...p, title: e.target.value }))} placeholder="Product title" required /></div><div className="form-row"><div className="form-group"><label className="form-label">Health Goal *</label><select className="form-control" value={newGame.genre} onChange={e => setNewGame(p => ({ ...p, genre: e.target.value }))}>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select></div><div className="form-group"><label className="form-label">Price ($)</label><input className="form-control" type="number" min="0" step="0.01" value={newGame.price} onChange={e => setNewGame(p => ({ ...p, price: e.target.value }))} placeholder="0.00" required /></div></div><div className="form-group"><label className="form-label">Brand</label><input className="form-control" value={newGame.developer} onChange={e => setNewGame(p => ({ ...p, developer: e.target.value }))} placeholder="Brand name" required /></div><div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={newGame.description} onChange={e => setNewGame(p => ({ ...p, description: e.target.value }))} placeholder="Product description..." /></div><div className="form-group"><label className="form-label">Tags</label><input className="form-control" value={newGame.tags} onChange={e => setNewGame(p => ({ ...p, tags: e.target.value }))} placeholder="Vitamin C, Immunity" /></div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button><button type="submit" className="btn btn-primary"><Icon name="add" size={16} /> Add Product</button></div></form></div></div>)}
    </div>
  );
}
