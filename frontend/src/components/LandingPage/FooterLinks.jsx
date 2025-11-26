import { Link } from 'react-router-dom';
import './FooterLinks.css';
import logoIcon from '../../assets/fav.png';

const FooterLinks = () => {
  return (
    <>
      <footer className="footer-links-section">
        <div className="footer-links-container">
          <div className="footer-logo-section">
            <div className="footer-logo-box">
              <img src={logoIcon} alt="Dukaan logo" className="footer-logo-icon" />
            </div>
            <span className="footer-logo-text">
              dukaan<span className="reg-mark">®</span>
            </span>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <h3 className="footer-column-title">Business tools</h3>
              <Link to="/dukaan-pc">Dukaan for PC</Link>
              <Link to="/delivery">Dukaan delivery</Link>
              <Link to="/plugins">Dukaan plugins</Link>
              <Link to="/themes">Dukaan themes</Link>
              <Link to="/enterprise">Dukaan enterprise</Link>
            </div>

            <div className="footer-column">
              <h3 className="footer-column-title">Awards '22</h3>
              <Link to="/help">Help center</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/banned">Banned items</Link>
            </div>

            <div className="footer-column">
              <h3 className="footer-column-title">About</h3>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/faq">FAQ's</Link>
            </div>

            <div className="footer-column">
              <h3 className="footer-column-title">Jobs</h3>
              <Link to="/branding">Branding</Link>
              <Link to="/press">Press inquiry</Link>
              <Link to="/bug-bounty">Bug bounty</Link>
            </div>

            <div className="footer-column">
              <h3 className="footer-column-title">Facebook</h3>
              <Link to="/twitter">Twitter</Link>
              <Link to="/linkedin">Linkedin</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            Growthpond Technology Pvt Ltd. All rights reserved, 2025.
          </p>
          <p className="footer-made-in">
            Made in INDIA
          </p>
        </div>
      </footer>

      <button className="footer-chat-button" aria-label="Chat support" type="button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </>
  );
};

export default FooterLinks;
