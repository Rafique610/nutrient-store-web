import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { adminApi } from '../../services/api';
import { GENRE_COLORS, GENRES } from '../../data/mockData';
import './AdminProducts.css';

const DEFAULT_product = { title: '', genre: 'Vitamins', price: '', description: '', developer: '', tags: '' };

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [products, setproducts] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [editproduct, setEditproduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newproduct, setNewproduct] = useState(DEFAULT_product);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const genres = GENRES;

  useEffect(() => {
    const loadproducts = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await adminApi.products();
        setproducts(data.products || []);
      } catch (err) {
        setError(err.message || 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    loadproducts();
  }, []);

  const filtered = products.filter(g => {
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
      await adminApi.deleteproduct(id);
      setproducts(prev => prev.filter(g => g.id !== id));
      setDeleteId(null);
    } catch (err) {
      setError(err.message || 'Unable to delete product.');
    }
  };

  const handleAddproduct = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await adminApi.createproduct({
        title: newproduct.title,
        category: newproduct.genre,
        price: parseFloat(newproduct.price) || 0,
        description: newproduct.description || `${newproduct.title} is available on HydraDose.`,
        developer: newproduct.developer || 'HydraDose Labs',
        tags: newproduct.tags || newproduct.genre,
        status: 'published',
      });
      setproducts(prev => [data.product, ...prev]);
      setNewproduct(DEFAULT_product);
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || 'Unable to add product.');
    }
  };

  const handleEditproduct = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await adminApi.updateproduct(editproduct.id, {
        title: editproduct.title,
        category: editproduct.genre,
        price: editproduct.price,
        description: editproduct.description,
        developer: editproduct.developer,
        tags: Array.isArray(editproduct.tags) ? editproduct.tags.join(', ') : editproduct.tags,
        status: editproduct.status || 'published',
      });
      setproducts(prev => prev.map(product => product.id === editproduct.id ? data.product : product));
      setEditproduct(null);
    } catch (err) {
      setError(err.message || 'Unable to update product.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header"><div><h1 className="admin-title">Product Management</h1><p className="admin-subtitle">{products.length} total products in catalog</p></div><button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Icon name="add" size={16} /> Add New Product</button></div>
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="ag-toolbar panel">
        <div className="ag-search-wrap"><Icon name="search" className="ag-search-icon" size={16} /><input className="ag-search" placeholder="Search by title or developer..." value={search} onChange={e => setSearch(e.target.value)} />{search && <button className="ag-search-clear" onClick={() => setSearch('')}><Icon name="close" size={14} /></button>}</div>
        <div className="ag-filters"><select className="ag-select" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}><option value="">All Goals</option>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select><select className="ag-select" value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="title">Sort: Title</option><option value="price">Sort: Price</option><option value="rating">Sort: Rating</option><option value="downloads">Sort: Orders</option></select></div>
        <span className="ag-count">{filtered.length} results</span>
      </div>
      <div className="ag-table-wrap panel">
        {loading ? <div className="loading-screen"><div className="loader" /></div> : (
          <table className="ag-table"><thead><tr><th>Sachet</th><th>Use Case</th><th>Price</th><th>Rating</th><th>Orders</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{filtered.map(product => { const colors = GENRE_COLORS[product.genre] || ['#23c9b7','#0d9488']; return (
              <tr key={product.id}><td><div className="ag-product-cell"><div className="ag-product-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>{product.image ? <img src={product.image} alt={product.title} className="ag-product-cover-img" /> : product.genre[0]}</div><div><div className="ag-product-title">{product.title}</div><div className="ag-product-dev text-muted text-sm">{product.developer}</div></div></div></td>
                <td><span className="tag">{product.genre}</span></td>
                <td><span className={product.price === 0 ? 'text-green font-bold' : 'ag-price'}>{product.price === 0 ? 'SAMPLE' : `$${product.price.toFixed(2)}`}</span></td>
                <td><span className="ag-rating"><Icon name="star" size={14} className="star-icon" /> {product.rating.toFixed(1)}</span></td>
                <td><span className="ag-downloads">{product.downloads.toLocaleString()}</span></td>
                <td>{product.status === 'draft' ? <span className="badge badge-soft">Draft</span> : product.isNew ? <span className="badge badge-blue">New</span> : product.isFeatured ? <span className="badge badge-gold">Featured</span> : <span className="badge badge-soft">Active</span>}</td>
                <td><div className="ag-actions"><Link to={`/product/${product.id}`} className="ag-btn ag-btn-view" title="View"><Icon name="visibility" size={14} /></Link><button className="ag-btn ag-btn-edit" title="Edit" onClick={() => setEditproduct({ ...product, tags: product.tags.join(', ') })}><Icon name="edit" size={14} /></button><button className="ag-btn ag-btn-delete" title="Delete" onClick={() => setDeleteId(product.id)}><Icon name="delete" size={14} /></button></div></td></tr>); })}</tbody></table>
        )}
        {filtered.length === 0 && !loading && <div className="ag-empty"><p>No products found. Try adjusting filters.</p></div>}
      </div>
      {deleteId && (<div className="modal-overlay" onClick={() => setDeleteId(null)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>Delete Product</h3></div><div className="modal-body"><p>Are you sure you want to delete <strong>{products.find(g => g.id === deleteId)?.title}</strong>? This cannot be undone.</p></div><div className="modal-footer"><button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button><button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button></div></div></div>)}
      {editproduct && (<div className="modal-overlay" onClick={() => setEditproduct(null)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3><Icon name="edit" size={18} /> Edit Sachet</h3><button className="btn btn-icon btn-secondary" onClick={() => setEditproduct(null)}><Icon name="close" size={18} /></button></div><form onSubmit={handleEditproduct}><div className="modal-body"><div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={editproduct.title} onChange={e => setEditproduct(p => ({ ...p, title: e.target.value }))} required /></div><div className="form-row"><div className="form-group"><label className="form-label">Use Case *</label><select className="form-control" value={editproduct.genre} onChange={e => setEditproduct(p => ({ ...p, genre: e.target.value }))}>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select></div><div className="form-group"><label className="form-label">Price ($)</label><input className="form-control" type="number" min="0" step="0.01" value={editproduct.price} onChange={e => setEditproduct(p => ({ ...p, price: e.target.value }))} required /></div></div><div className="form-group"><label className="form-label">Brand</label><input className="form-control" value={editproduct.developer} onChange={e => setEditproduct(p => ({ ...p, developer: e.target.value }))} required /></div><div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={editproduct.description || ''} onChange={e => setEditproduct(p => ({ ...p, description: e.target.value }))} /></div><div className="form-group"><label className="form-label">Tags</label><input className="form-control" value={editproduct.tags || ''} onChange={e => setEditproduct(p => ({ ...p, tags: e.target.value }))} /></div><div className="form-group"><label className="form-label">Status</label><select className="form-control" value={editproduct.status || 'published'} onChange={e => setEditproduct(p => ({ ...p, status: e.target.value }))}><option value="published">Published</option><option value="draft">Draft</option></select></div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditproduct(null)}>Cancel</button><button type="submit" className="btn btn-primary"><Icon name="check" size={16} /> Save Changes</button></div></form></div></div>)}
      {showAddModal && (<div className="modal-overlay" onClick={() => setShowAddModal(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3><Icon name="add" size={18} /> Add New Sachet</h3><button className="btn btn-icon btn-secondary" onClick={() => setShowAddModal(false)}><Icon name="close" size={18} /></button></div><form onSubmit={handleAddproduct}><div className="modal-body"><div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={newproduct.title} onChange={e => setNewproduct(p => ({ ...p, title: e.target.value }))} placeholder="Sachet title" required /></div><div className="form-row"><div className="form-group"><label className="form-label">Use Case *</label><select className="form-control" value={newproduct.genre} onChange={e => setNewproduct(p => ({ ...p, genre: e.target.value }))}>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select></div><div className="form-group"><label className="form-label">Price ($)</label><input className="form-control" type="number" min="0" step="0.01" value={newproduct.price} onChange={e => setNewproduct(p => ({ ...p, price: e.target.value }))} placeholder="0.00" required /></div></div><div className="form-group"><label className="form-label">Brand</label><input className="form-control" value={newproduct.developer} onChange={e => setNewproduct(p => ({ ...p, developer: e.target.value }))} placeholder="Brand name" required /></div><div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={newproduct.description} onChange={e => setNewproduct(p => ({ ...p, description: e.target.value }))} placeholder="Sachet description..." /></div><div className="form-group"><label className="form-label">Tags</label><input className="form-control" value={newproduct.tags} onChange={e => setNewproduct(p => ({ ...p, tags: e.target.value }))} placeholder="Sodium, Potassium, Zero Sugar" /></div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button><button type="submit" className="btn btn-primary"><Icon name="add" size={16} /> Add Sachet</button></div></form></div></div>)}
    </div>
  );
}

