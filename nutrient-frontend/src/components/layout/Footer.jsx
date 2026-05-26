import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Icon name="water_drop" className="footer-brand-icon" />
          <span className="footer-brand-name">HydraDose</span>
          <p className="footer-tagline">Zero-sugar electrolyte sachets for everyday hydration.</p>
          <div className="footer-socials">
            <a href="#" aria-label="GitHub"><Icon name="code" size={16} /></a>
            <a href="#" aria-label="Twitter"><Icon name="tag" size={16} /></a>
            <a href="#" aria-label="Instagram"><Icon name="photo_camera" size={16} /></a>
            <a href="#" aria-label="Email"><Icon name="mail" size={16} /></a>
          </div>
        </div>

        <div className="footer-links-group">
          <h4>Store</h4>
          <Link to="/store">Browse Sachets</Link>
          <Link to="/store?filter=new">New Sachets</Link>
          <Link to="/store?filter=top">Best Sellers</Link>
          <Link to="/store?filter=free">Samples</Link>
        </div>

        <div className="footer-links-group">
          <h4>Account</h4>
          <Link to="/login">Sign In</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/library">My Orders</Link>
          <Link to="/profile">Profile Settings</Link>
        </div>

        <div className="footer-links-group">
          <h4>Info</h4>
          <Link to="#">About Us</Link>
          <Link to="#">Privacy Policy</Link>
          <Link to="#">Terms of Service</Link>
          <Link to="#">Contact Support</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} HydraDose. All rights reserved. Built for educational purposes.</p>
        <p className="footer-bottom-links">
          <Link to="#">Privacy</Link>
          <Link to="#">Terms</Link>
          <Link to="#">Cookies</Link>
        </p>
      </div>
    </footer>
  );
}
