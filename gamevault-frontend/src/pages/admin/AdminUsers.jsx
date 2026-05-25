import { useEffect, useState } from 'react';
import Icon from '../../components/ui/Icon';
import { adminApi } from '../../services/api';
import './AdminUsers.css';

const ROLES = ['customer', 'developer', 'admin'];
const ROLE_BADGE = { admin: 'badge-red', developer: 'badge-gold', customer: 'badge-blue' };
const EMPTY_USER = { name: '', email: '', password: '', role: 'customer' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await adminApi.users();
        setUsers(data.users || []);
      } catch (err) {
        setError(err.message || 'Unable to load users.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && (!roleFilter || u.role === roleFilter);
  });

  const handleDelete = async (id) => {
    setError('');
    try {
      await adminApi.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeleteId(null);
    } catch (err) {
      setError(err.message || 'Unable to delete user.');
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await adminApi.updateUser(editUser.id, editUser);
      setUsers(prev => prev.map(u => u.id === editUser.id ? data.user : u));
      setEditUser(null);
    } catch (err) {
      setError(err.message || 'Unable to update user.');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await adminApi.createUser(newUser);
      setUsers(prev => [data.user, ...prev]);
      setNewUser(EMPTY_USER);
      setShowAddModal(false);
    } catch (err) {
      setError(err.message || 'Unable to add user.');
    }
  };

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r).length;
    return acc;
  }, {});

  return (
    <div className="admin-page">
      <div className="admin-page-header"><div><h1 className="admin-title">User Management</h1><p className="admin-subtitle">{users.length} total users registered</p></div><button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Icon name="person_add" size={16} /> Add User</button></div>
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="au-role-stats">
        <div className={`au-role-card ${!roleFilter ? 'active' : ''}`} onClick={() => setRoleFilter('')}><span className="au-role-count">{users.length}</span><span className="au-role-label">All Users</span></div>
        {ROLES.map(r => (<div key={r} className={`au-role-card ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(roleFilter === r ? '' : r)}><span className="au-role-count">{roleCounts[r] || 0}</span><span className="au-role-label">{r.charAt(0).toUpperCase() + r.slice(1)}s</span></div>))}
      </div>
      <div className="ag-toolbar panel"><div className="ag-search-wrap"><Icon name="search" className="ag-search-icon" size={16} /><input className="ag-search" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />{search && <button className="ag-search-clear" onClick={() => setSearch('')}><Icon name="close" size={14} /></button>}</div><span className="ag-count">{filtered.length} users</span></div>
      {loading ? <div className="loading-screen"><div className="loader" /></div> : (
        <div className="au-users-grid">
          {filtered.map(user => (<div key={user.id} className="au-user-card panel"><div className="au-user-avatar">{user.name[0]}</div><div className="au-user-info"><div className="au-user-name">{user.name}</div><div className="au-user-email"><Icon name="mail" size={12} /> {user.email}</div>{user.studio && <div className="au-user-studio text-muted text-sm">{user.studio}</div>}<div className="au-user-meta"><span className={`badge ${ROLE_BADGE[user.role]}`}>{user.role}</span><span className="au-join-date text-sm text-muted">Joined {user.joinDate ? new Date(user.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span></div></div><div className="au-user-actions"><button className="ag-btn ag-btn-edit" onClick={() => setEditUser({ ...user })} title="Edit"><Icon name="edit" size={14} /></button><button className="ag-btn ag-btn-delete" onClick={() => setDeleteId(user.id)} title="Delete"><Icon name="delete" size={14} /></button></div></div>))}
          {filtered.length === 0 && <div className="au-empty"><Icon name="person" size={40} style={{ opacity: 0.3 }} /><p>No users found.</p></div>}
        </div>
      )}
      {deleteId && (<div className="modal-overlay" onClick={() => setDeleteId(null)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3>Delete User</h3></div><div className="modal-body"><p>Are you sure you want to delete <strong>{users.find(u => u.id === deleteId)?.name}</strong>?</p></div><div className="modal-footer"><button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button><button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button></div></div></div>)}
      {editUser && (<div className="modal-overlay" onClick={() => setEditUser(null)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3><Icon name="edit" size={18} /> Edit User</h3><button className="btn btn-icon btn-secondary" onClick={() => setEditUser(null)}><Icon name="close" size={18} /></button></div><form onSubmit={handleEditSave}><div className="modal-body"><div className="form-group"><label className="form-label">Full Name</label><input className="form-control" value={editUser.name} onChange={e => setEditUser(p => ({ ...p, name: e.target.value }))} required /></div><div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={editUser.email} onChange={e => setEditUser(p => ({ ...p, email: e.target.value }))} required /></div><div className="form-group"><label className="form-label">Role</label><select className="form-control" value={editUser.role} onChange={e => setEditUser(p => ({ ...p, role: e.target.value }))}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button><button type="submit" className="btn btn-primary"><Icon name="check" size={16} /> Save Changes</button></div></form></div></div>)}
      {showAddModal && (<div className="modal-overlay" onClick={() => setShowAddModal(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h3><Icon name="person_add" size={18} /> Add New User</h3><button className="btn btn-icon btn-secondary" onClick={() => setShowAddModal(false)}><Icon name="close" size={18} /></button></div><form onSubmit={handleAddUser}><div className="modal-body"><div className="form-group"><label className="form-label">Full Name *</label><input className="form-control" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Full name" required /></div><div className="form-group"><label className="form-label">Email *</label><input className="form-control" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" required /></div><div className="form-group"><label className="form-label">Temporary Password *</label><input className="form-control" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="At least 6 characters" required /></div><div className="form-group"><label className="form-label">Role</label><select className="form-control" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button><button type="submit" className="btn btn-primary"><Icon name="person_add" size={16} /> Add User</button></div></form></div></div>)}
    </div>
  );
}
