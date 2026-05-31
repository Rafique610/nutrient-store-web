import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import { adminApi } from '../../services/api';
import './AdminProducts.css';
import './AdminOrders.css';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
};

const formatTimelineTitle = (event) => {
  if (!event) return '';
  if (event.type === 'created') return 'Order Created';
  if (event.type === 'status_changed') return 'Status Changed';
  if (event.type === 'note') return 'Note';
  return event.type || 'Event';
};

export default function AdminOrders() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [actionError, setActionError] = useState('');

  const drawerOpen = Boolean(id);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.orders({
        search: search || undefined,
        fulfillmentStatus: statusFilter || undefined,
      });
      setOrders(data.orders || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadOrders();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) {
        setSelected(null);
        setNoteText('');
        setActionError('');
        return;
      }
      setDetailLoading(true);
      setActionError('');
      try {
        const data = await adminApi.order(id);
        setSelected(data.order);
      } catch (err) {
        setActionError(err.message || 'Unable to load order.');
      } finally {
        setDetailLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  const pendingCount = useMemo(
    () => orders.filter((o) => ['new', 'processing'].includes(o.fulfillmentStatus)).length,
    [orders]
  );

  const recent = useMemo(() => orders.slice(0, 5), [orders]);

  const updateStatus = async (nextStatus) => {
    if (!selected) return;
    setActionError('');
    try {
      const data = await adminApi.updateOrderStatus(selected.id, nextStatus);
      setSelected(data.order);
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, fulfillmentStatus: nextStatus } : o)));
    } catch (err) {
      setActionError(err.message || 'Unable to update order status.');
    }
  };

  const submitNote = async (e) => {
    e.preventDefault();
    if (!selected) return;
    const message = noteText.trim();
    if (!message) return;
    setActionError('');
    try {
      const data = await adminApi.addOrderNote(selected.id, message);
      setSelected(data.order);
      setNoteText('');
    } catch (err) {
      setActionError(err.message || 'Unable to add note.');
    }
  };

  const closeDrawer = () => navigate('/admin/orders');

  return (
    <div className="admin-page admin-orders-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Orders</h1>
          <p className="admin-subtitle">Operations-first view with status workflow and timelines</p>
        </div>
        <div className="admin-header-actions">
          <Link to="/admin/products" className="btn btn-secondary btn-sm">
            <Icon name="inventory_2" size={16} /> Catalog
          </Link>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-content-grid admin-orders-grid">
        <div className="admin-panel admin-orders-left">
          <div className="orders-kpi-row">
            <div className="orders-kpi">
              <div className="orders-kpi-label">Pending Orders</div>
              <div className="orders-kpi-value">{pendingCount}</div>
              <div className="orders-kpi-meta">New + Processing</div>
            </div>
            <div className="orders-kpi">
              <div className="orders-kpi-label">Total Orders</div>
              <div className="orders-kpi-value">{pagination?.total ?? orders.length}</div>
              <div className="orders-kpi-meta">Current results</div>
            </div>
            <div className="orders-kpi orders-kpi-muted">
              <div className="orders-kpi-label">Recent</div>
              <div className="orders-kpi-value">{recent.length}</div>
              <div className="orders-kpi-meta">Last loaded</div>
            </div>
          </div>

          <div className="ag-toolbar panel">
            <div className="ag-search-wrap">
              <Icon name="search" className="ag-search-icon" size={16} />
              <input
                className="ag-search"
                placeholder="Search by order id, customer name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="ag-search-clear" onClick={() => setSearch('')}>
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
            <div className="ag-filters">
              <select className="ag-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="ag-count">{orders.length} results</span>
          </div>

          <div className="ag-table-wrap panel">
            {loading ? (
              <div className="loading-screen"><div className="loader" /></div>
            ) : (
              <table className="ag-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className={order.id === id ? 'is-selected' : ''}>
                      <td>
                        <div className="orders-id">
                          <div className="orders-id-main">{order.id.slice(-8).toUpperCase()}</div>
                          <div className="text-muted text-sm">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</div>
                        </div>
                      </td>
                      <td>
                        <div className="orders-customer">
                          <div className="orders-customer-name">{order.user?.name || 'Customer'}</div>
                          <div className="text-muted text-sm">{order.user?.email || ''}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-soft orders-status orders-status-${order.fulfillmentStatus || 'new'}`}>
                          {STATUS_OPTIONS.find((s) => s.value === order.fulfillmentStatus)?.label || 'New'}
                        </span>
                      </td>
                      <td className="orders-total">{formatMoney(order.totalAmount)}</td>
                      <td className="text-right">
                        <Link to={`/admin/orders/${order.id}`} className="ag-btn ag-btn-view" title="Open">
                          <Icon name="arrow_forward" size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {orders.length === 0 && !loading && <div className="ag-empty"><p>No orders found.</p></div>}
          </div>
        </div>

        <div className={`admin-orders-drawer ${drawerOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
          <div className="admin-orders-drawer-header">
            <div>
              <div className="drawer-title">Order Detail</div>
              <div className="drawer-subtitle">{selected ? selected.id : '—'}</div>
            </div>
            <button className="btn btn-icon btn-secondary" onClick={closeDrawer} aria-label="Close order drawer">
              <Icon name="close" size={18} />
            </button>
          </div>

          {detailLoading ? (
            <div className="loading-screen"><div className="loader" /></div>
          ) : (
            <div className="admin-orders-drawer-body">
              {actionError && <div className="auth-error" style={{ marginBottom: 12 }}>{actionError}</div>}

              {!selected ? (
                <div className="orders-empty-detail">
                  <p className="text-muted">Select an order to view details.</p>
                </div>
              ) : (
                <>
                  <div className="orders-detail-grid">
                    <div className="orders-detail-card">
                      <div className="label">Customer</div>
                      <div className="orders-detail-strong">{selected.user?.name || 'Customer'}</div>
                      <div className="text-muted text-sm">{selected.user?.email || ''}</div>
                    </div>
                    <div className="orders-detail-card">
                      <div className="label">Total</div>
                      <div className="orders-detail-strong">{formatMoney(selected.totalAmount)}</div>
                      <div className="text-muted text-sm">{selected.products?.length || 0} items</div>
                    </div>
                  </div>

                  <div className="orders-detail-section">
                    <div className="label">Fulfillment Status</div>
                    <select
                      className="form-control"
                      value={selected.fulfillmentStatus || 'new'}
                      onChange={(e) => updateStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="orders-detail-section">
                    <div className="label">Shipping Address</div>
                    <div className="orders-address">
                      <div className="orders-address-line">{selected.shippingAddress?.fullName || ''}</div>
                      <div className="orders-address-line text-muted text-sm">{selected.shippingAddress?.phone || ''}</div>
                      <div className="orders-address-line">{selected.shippingAddress?.addressLine1 || ''}</div>
                      {selected.shippingAddress?.addressLine2 && <div className="orders-address-line">{selected.shippingAddress.addressLine2}</div>}
                      <div className="orders-address-line">
                        {[selected.shippingAddress?.city, selected.shippingAddress?.state, selected.shippingAddress?.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                      {selected.shippingAddress?.country && <div className="orders-address-line">{selected.shippingAddress.country}</div>}
                    </div>
                  </div>

                  <div className="orders-detail-section">
                    <div className="label">Customer Notes</div>
                    <div className="orders-notes text-sm">{selected.customerNotes || <span className="text-muted">No notes</span>}</div>
                  </div>

                  <div className="orders-detail-section">
                    <div className="label">Add Admin Note</div>
                    <form onSubmit={submitNote} className="orders-note-form">
                      <input
                        className="form-control"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="e.g. Customer requested delivery after 5 PM"
                      />
                      <button className="btn btn-primary btn-sm" type="submit" disabled={!noteText.trim()}>
                        Add
                      </button>
                    </form>
                  </div>

                  <div className="orders-detail-section">
                    <div className="label">Timeline</div>
                    <div className="orders-timeline">
                      {(selected.timeline || [])
                        .slice()
                        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                        .map((event, index) => (
                          <div key={`${event.createdAt || index}-${index}`} className="orders-timeline-item">
                            <div className="orders-timeline-dot" />
                            <div className="orders-timeline-content">
                              <div className="orders-timeline-top">
                                <span className="orders-timeline-title">{formatTimelineTitle(event)}</span>
                                <span className="orders-timeline-time text-muted text-sm">
                                  {event.createdAt ? new Date(event.createdAt).toLocaleString() : ''}
                                </span>
                              </div>
                              <div className="orders-timeline-message">{event.message}</div>
                              {event.actor?.name && <div className="orders-timeline-actor text-muted text-sm">by {event.actor.name}</div>}
                            </div>
                          </div>
                        ))}
                      {(!selected.timeline || selected.timeline.length === 0) && <div className="text-muted text-sm">No events yet.</div>}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {drawerOpen && <div className="admin-orders-backdrop" onClick={closeDrawer} />}
      </div>
    </div>
  );
}

