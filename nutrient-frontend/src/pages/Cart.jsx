import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/ui/Icon';
import { GENRE_COLORS } from '../data/mockData';
import './Cart.css';

export default function Cart() {
  const { cartItems, removeFromCart, cartTotal } = useAuth();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <h1 className="cart-title">Shopping Cart</h1>
        <div className="cart-empty">
          <Icon name="shopping_cart" size={60} className="cart-empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Find electrolyte sachets for your daily hydration routine.</p>
          <Link to="/store" className="btn btn-primary">Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-title">Shopping Cart <span className="cart-count">({cartItems.length})</span></h1>

      <div className="cart-layout">
        <div className="cart-items">
          {cartItems.map(product => {
            const colors = GENRE_COLORS[product.genre] || ['#23c9b7','#0d9488'];
            return (
              <div key={product.id} className="cart-item panel">
                <div className="cart-item-cover" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="cart-item-img" />
                  ) : (
                    <span className="cart-cover-initial">{product.genre[0]}</span>
                  )}
                </div>
                <div className="cart-item-info">
                  <Link to={`/product/${product.id}`} className="cart-item-title">{product.title}</Link>
                  <div className="cart-item-meta">
                    <span className="tag">{product.genre}</span>
                    <span className="text-muted text-sm">by {product.developer}</span>
                  </div>
                </div>
                <div className="cart-item-right">
                  <span className="cart-item-price">
                    {product.price === 0 ? 'SAMPLE' : `$${product.price.toFixed(2)}`}
                  </span>
                  <button
                    className="cart-remove-btn"
                    onClick={() => removeFromCart(product.id)}
                    title="Remove"
                  >
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cart-summary panel">
          <h2>Order Summary</h2>
          <div className="summary-lines">
            {cartItems.map(g => (
              <div key={g.id} className="summary-line">
                <span className="summary-product-name">{g.title}</span>
                <span>{g.price === 0 ? 'SAMPLE' : `$${g.price.toFixed(2)}`}</span>
              </div>
            ))}
            <div className="summary-divider" />
            <div className="summary-total">
              <span>Total</span>
              <span className="summary-total-price">${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="btn btn-primary checkout-btn"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout <Icon name="arrow_forward" size={16} />
          </button>

          <Link to="/store" className="btn btn-secondary continue-btn">
            <Icon name="sell" size={14} /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

