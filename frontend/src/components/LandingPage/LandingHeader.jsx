import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LandingHeader.css';

const LandingHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const closeMenu = () => setMenuOpen(false);
  
  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // Debug: Log user role
  useEffect(() => {
    if (user) {
      console.log('User in header:', user);
      console.log('User role:', user.role);
    }
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const actionButtons = user ? (
    <>
      {/* Always show admin button for logged-in users - will be protected by route */}
      <button
        className="btn-admin"
        onClick={() => {
          navigate('/admin');
          closeMenu();
        }}
        title={user.role === 'admin' ? 'Admin Panel' : 'Admin Panel (Access Denied)'}
      >
        Admin
      </button>
      <button
        className="btn-secondary"
        onClick={() => {
          navigate('/dashboard');
          closeMenu();
        }}
      >
        Dashboard
      </button>
    </>
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
            <button 
              className={`nav-link ${openDropdown === 'products' ? 'open' : ''}`} 
              type="button"
              onClick={() => toggleDropdown('products')}
            >
              Products
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="dropdown-arrow"
                style={{ 
                  transform: openDropdown === 'products' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className={`dropdown-menu ${openDropdown === 'products' ? 'open' : ''}`}>
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
            <button 
              className={`nav-link ${openDropdown === 'company' ? 'open' : ''}`} 
              type="button"
              onClick={() => toggleDropdown('company')}
            >
              Company
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="dropdown-arrow"
                style={{ 
                  transform: openDropdown === 'company' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className={`dropdown-menu ${openDropdown === 'company' ? 'open' : ''}`}>
              <Link to="/careers" onClick={closeMenu}>
                Careers
              </Link>
              <Link to="/about" onClick={closeMenu}>
                About
              </Link>
            </div>
          </div>
          <div className="nav-dropdown">
            <button 
              className={`nav-link ${openDropdown === 'resources' ? 'open' : ''}`} 
              type="button"
              onClick={() => toggleDropdown('resources')}
            >
              Resources
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="dropdown-arrow"
                style={{ 
                  transform: openDropdown === 'resources' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className={`dropdown-menu ${openDropdown === 'resources' ? 'open' : ''}`}>
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

