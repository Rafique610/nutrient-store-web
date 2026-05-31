import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/ui/Icon';
import { GENRE_COLORS } from '../data/mockData';
import './Checkout.css';

export default function Checkout() {
  const { cartItems, cartTotal, checkout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [payMethod, setPayMethod] = useState('card');
  const [cardNum, setCardNum] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [customerNotes, setCustomerNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  if (cartItems.length === 0 && step !== 3) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <h2>Your cart is empty</h2>
          <Link to="/store" className="btn btn-primary">Browse Store</Link>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    setError('');
    setProcessing(true);
    try {
      const required = ['fullName', 'phone', 'addressLine1', 'city'];
      const missing = required.find((key) => !String(shippingAddress[key] || '').trim());
      if (missing) {
        setProcessing(false);
        setError(`Shipping address ${missing} is required.`);
        return;
      }

      await checkout(payMethod, { shippingAddress, customerNotes });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Unable to complete checkout.');
    } finally {
      setProcessing(false);
    }
  };

  if (step === 3) {
    return (
      <div className="checkout-page">
        <div className="checkout-success">
          <div className="success-icon"><Icon name="check" size={36} /></div>
          <h1>Purchase Successful!</h1>
          <p>Your products have been added to your orders.</p>
          <div className="success-actions">
            <Link to="/library" className="btn btn-primary">View Orders</Link>
            <Link to="/store" className="btn btn-secondary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <Link to="/cart" className="gd-back"><Icon name="arrow_back" size={16} /> Back to Cart</Link>
        <h1>Checkout</h1>
      </div>

      <div className="checkout-layout">
        {/* Form */}
        <div className="checkout-form-area">
          <div className="checkout-section panel">
            <h2 className="section-heading"><Icon name="local_shipping" size={20} /> Shipping</h2>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={shippingAddress.fullName} onChange={(e) => setShippingAddress((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-control" value={shippingAddress.phone} onChange={(e) => setShippingAddress((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input className="form-control" value={shippingAddress.city} onChange={(e) => setShippingAddress((p) => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address Line 1 *</label>
              <input className="form-control" value={shippingAddress.addressLine1} onChange={(e) => setShippingAddress((p) => ({ ...p, addressLine1: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Address Line 2</label>
              <input className="form-control" value={shippingAddress.addressLine2} onChange={(e) => setShippingAddress((p) => ({ ...p, addressLine2: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-control" value={shippingAddress.state} onChange={(e) => setShippingAddress((p) => ({ ...p, state: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input className="form-control" value={shippingAddress.postalCode} onChange={(e) => setShippingAddress((p) => ({ ...p, postalCode: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-control" value={shippingAddress.country} onChange={(e) => setShippingAddress((p) => ({ ...p, country: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Customer Notes</label>
              <textarea className="form-control" rows={3} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Call before delivery, deliver after 5 PM, etc." />
            </div>
          </div>
          <div className="checkout-section panel">
            <h2 className="section-heading"><Icon name="credit_card" size={20} /> Payment Method</h2>
            <div className="pay-methods">
              {['card', 'paypal', 'wallet'].map(m => (
                <label key={m} className={`pay-method ${payMethod === m ? 'active' : ''}`}>
                  <input type="radio" name="pay" value={m} checked={payMethod === m} onChange={() => setPayMethod(m)} />
                  <span className="pay-icon">
                    <Icon name={m === 'card' ? 'credit_card' : m === 'paypal' ? 'account_balance' : 'account_balance_wallet'} size={24} />
                  </span>
                  <span>{m === 'card' ? 'Credit/Debit Card' : m === 'paypal' ? 'PayPal' : 'Wallet'}</span>
                </label>
              ))}
            </div>

            {payMethod === 'card' && (
              <div className="card-fields">
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    className="form-control"
                    placeholder="4242 4242 4242 4242"
                    value={cardNum}
                    onChange={e => setCardNum(e.target.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19))}
                    maxLength={19}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Expiry</label>
                    <input className="form-control" placeholder="MM/YY" maxLength={5} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input className="form-control" placeholder="---" maxLength={4} type="password" />
                  </div>
                </div>
              </div>
            )}

            {payMethod === 'paypal' && (
              <div className="mock-notice">
                <Icon name="lock" size={14} /> This is a demo. No real PayPal connection.
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="checkout-summary">
          <div className="panel">
            <h2>Order Summary</h2>
            {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}
            <div className="co-items">
              {cartItems.map(g => {
                const colors = GENRE_COLORS[g.genre] || ['#23c9b7','#0d9488'];
                return (
                  <div key={g.id} className="co-item">
                    <div className="co-item-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                      {g.image ? (
                        <img src={g.image} alt={g.title} className="co-item-img" />
                      ) : (
                        g.genre[0]
                      )}
                    </div>
                    <span className="co-item-name">{g.title}</span>
                    <span className="co-item-price">{g.price === 0 ? 'SAMPLE' : `$${g.price.toFixed(2)}`}</span>
                  </div>
                );
              })}
            </div>

            <div className="co-total">
              <span>Total</span>
              <span className="co-total-price">${cartTotal.toFixed(2)}</span>
            </div>

            <div className="mock-notice">
              <Icon name="lock" size={14} /> Demo mode — no real payment will be charged.
            </div>

            <button
              className="btn btn-primary checkout-confirm-btn"
              onClick={handlePurchase}
              disabled={processing}
            >
              {processing ? (
                <><span className="spinner" /> Processing...</>
              ) : (
                <><Icon name="check" size={18} /> Confirm Purchase — ${cartTotal.toFixed(2)}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

