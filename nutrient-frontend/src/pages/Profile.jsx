import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/ui/Icon';
import './Profile.css';

export default function Profile() {
  const { user, purchasedProducts, orders, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const ownedproducts = purchasedProducts;

  useEffect(() => {
    setName(user?.name || '');
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await updateProfile({ name });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Unable to save profile.');
    }
  };

  const roleColors = { admin: 'badge-red', customer: 'badge-blue' };

  return (
    <div className="profile-page">
      <div className="profile-layout">
        <div className="profile-card panel">
          <div className="profile-avatar">{user?.name?.[0] || '?'}</div>
          <div className="profile-info">
            {editing ? (
              <form onSubmit={handleSave} className="profile-edit-form">
                <input value={name} onChange={e => setName(e.target.value)} className="profile-name-input" required />
                <div className="profile-edit-btns">
                  <button type="submit" className="btn btn-primary btn-sm"><Icon name="check" size={14} /> Save</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="profile-name-row">
                <h2>{name}</h2>
                <button className="profile-edit-btn" onClick={() => setEditing(true)}><Icon name="edit" size={14} /></button>
              </div>
            )}
            {error && <p className="profile-saved" style={{ color: 'var(--danger)' }}>{error}</p>}
            {saved && <p className="profile-saved"><Icon name="check" size={14} /> Profile saved</p>}
            <span className={`badge ${roleColors[user?.role] || 'badge-blue'}`}>{user?.role}</span>
          </div>
          <div className="profile-details">
            <div className="profile-detail">
              <Icon name="mail" className="profile-detail-icon" size={16} />
              <div><span className="detail-label">Email</span><span className="detail-value">{user?.email}</span></div>
            </div>
            <div className="profile-detail">
              <Icon name="person" className="profile-detail-icon" size={16} />
              <div><span className="detail-label">Member Since</span><span className="detail-value">{user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}</span></div>
            </div>
            <div className="profile-detail">
              <Icon name="library_books" className="profile-detail-icon" size={16} />
              <div><span className="detail-label">Products Ordered</span><span className="detail-value">{ownedproducts.length}</span></div>
            </div>
          </div>
        </div>
        <div className="profile-right">
          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-icon"><Icon name="water_drop" size={28} /></div>
              <div className="stat-value">{ownedproducts.length}</div>
              <div className="stat-label">Products Ordered</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Icon name="shopping_cart" size={28} /></div>
              <div className="stat-value">{orders.length}</div>
              <div className="stat-label">Purchases</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Icon name="star" size={28} /></div>
              <div className="stat-value">{ownedproducts.length > 0 ? (ownedproducts.reduce((s, g) => s + g.rating, 0) / ownedproducts.length).toFixed(1) : '-'}</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>
          {ownedproducts.length > 0 && (
            <div className="panel">
              <h3 className="profile-section-title"><Icon name="library_books" size={18} /> Recent Products</h3>
              <div className="profile-products">
                {ownedproducts.slice(0, 4).map(g => (
                  <div key={g.id} className="profile-product-row">
                    <div className="profile-product-dot" style={{ background: 'var(--accent)' }} />
                    <span className="profile-product-name">{g.title}</span>
                    <span className="profile-product-genre text-muted text-sm">{g.genre}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {orders.length > 0 && (
            <div className="panel">
              <h3 className="profile-section-title"><Icon name="shopping_bag" size={18} /> Purchase History</h3>
              {orders.map(o => (
                <div key={o.id} className="order-row">
                  <div>
                    <div className="order-name">{o.products?.map(g => g.title).join(', ') || 'Product purchase'}</div>
                    <div className="order-date text-muted text-sm">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''} - {o.paymentMethod}</div>
                  </div>
                  <span className="order-price">${Number(o.totalAmount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

