import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LandingHeader.css';

const LandingHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const actionButtons = user ? (
    <button
      className="btn-secondary"
      onClick={() => {
        navigate('/dashboard');
        closeMenu();
      }}
    >
      Dashboard
    </button>
  ) : (
    <>
      <Link to="/login" className="btn-link" onClick={closeMenu}>
        Sign in
      </Link>
      <button
        className="btn-primary"
        onClick={() => {
          navigate('/register');
          closeMenu();
        }}
      >
        Start free
      </button>
    </>
  );

  return (
    <header className="landing-header">
      <div className="landing-header-container">
        <div className="landing-logo">
          <Link to="/">Dukkan</Link>
        </div>

        <button
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="landing-nav"
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="landing-nav"
          className={`landing-nav ${menuOpen ? 'open' : ''}`}
        >
          <div className="nav-dropdown">
            <button className="nav-link" type="button">
              Products
            </button>
            <div className="dropdown-menu">
              <Link to="/themes" onClick={closeMenu}>
                Dukaan themes
              </Link>
              <Link to="/delivery" onClick={closeMenu}>
                Dukaan delivery
              </Link>
              <Link to="/plugins" onClick={closeMenu}>
                Dukaan plugins
              </Link>
              <Link to="/tools" onClick={closeMenu}>
                Business tools
              </Link>
            </div>
          </div>
          <div className="nav-dropdown">
            <button className="nav-link" type="button">
              Company
            </button>
            <div className="dropdown-menu">
              <Link to="/careers" onClick={closeMenu}>
                Careers
              </Link>
              <Link to="/about" onClick={closeMenu}>
                About
              </Link>
            </div>
          </div>
          <div className="nav-dropdown">
            <button className="nav-link" type="button">
              Resources
            </button>
            <div className="dropdown-menu">
              <Link to="/blog" onClick={closeMenu}>
                Blog
              </Link>
              <Link to="/community" onClick={closeMenu}>
                Community
              </Link>
              <Link to="/videos" onClick={closeMenu}>
                Videos
              </Link>
              <Link to="/help" onClick={closeMenu}>
                Help center
              </Link>
            </div>
          </div>
          <Link to="/pricing" className="nav-link" onClick={closeMenu}>
            Pricing
          </Link>

          <div className="nav-mobile-actions">{actionButtons}</div>
        </nav>

        <div className="landing-header-actions">{actionButtons}</div>
      </div>

      <div
        className={`mobile-nav-overlay ${menuOpen ? 'visible' : ''}`}
        onClick={closeMenu}
      />
    </header>
  );
};

export default LandingHeader;

