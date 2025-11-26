import { useNavigate } from 'react-router-dom';
import './LandingHero.css';

const LandingHero = () => {
  const navigate = useNavigate();

  return (
    <section className="landing-hero">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-left">
            <h1 className="hero-title">
              Your Global Commerce Partner, Engineered for Peak Performance
            </h1>
            <p className="hero-subtitle">
              Launch your eye-catching online store with ease, attract and convert more customers than ever before.
            </p>
            <button 
              className="hero-cta"
              onClick={() => navigate('/register')}
            >
              Get started
            </button>
            <div className="hero-app-stores">
              <p className="hero-note">Also available on</p>
              <div className="app-store-icons">
                <div className="app-store-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.75 15.25 4.39 7.59 9.04 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span>App Store</span>
                </div>
                <div className="app-store-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L6.05,21.34L14.54,12.85L20.16,10.81M6.05,2.66L20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L6.05,21.34L14.54,12.85L6.05,2.66Z"/>
                  </svg>
                  <span>Google Play</span>
                </div>
              </div>
            </div>
            <div className="hero-social">
              <a href="#" className="social-icon" aria-label="WhatsApp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
              <a href="#" className="social-icon" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="social-icon" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="hero-right">
            <div className="mockup-container">
              <div className="mockup-card mockup-1">
                <div className="mockup-header">
                  <div className="mockup-store-name">Oxford</div>
                  <div className="mockup-nav-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
                <div className="mockup-content">
                  <div className="product-item">
                    <div className="product-image" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}></div>
                    <div className="product-info">
                      <div className="product-name">Summer T-Shirt</div>
                      <div className="product-price">₹599</div>
                    </div>
                  </div>
                  <div className="product-item">
                    <div className="product-image" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}></div>
                    <div className="product-info">
                      <div className="product-name">Cotton Shorts</div>
                      <div className="product-price">₹899</div>
                    </div>
                  </div>
                  <div className="product-item">
                    <div className="product-image" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}></div>
                    <div className="product-info">
                      <div className="product-name">Beach Hat</div>
                      <div className="product-price">₹399</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mockup-card mockup-2">
                <div className="mockup-header">
                  <div className="mockup-title">Analytics</div>
                </div>
                <div className="mockup-content">
                  <div className="analytics-metric">
                    <div className="metric-label">Sales</div>
                    <div className="metric-value">₹54,244</div>
                  </div>
                  <div className="analytics-metric">
                    <div className="metric-label">Store Views</div>
                    <div className="metric-value">67,912</div>
                  </div>
                  <div className="chart-container">
                    <div className="chart-bar" style={{height: '60%'}}></div>
                    <div className="chart-bar" style={{height: '80%'}}></div>
                    <div className="chart-bar" style={{height: '45%'}}></div>
                    <div className="chart-bar" style={{height: '90%'}}></div>
                    <div className="chart-bar" style={{height: '70%'}}></div>
                    <div className="chart-bar" style={{height: '55%'}}></div>
                  </div>
                </div>
              </div>

              <div className="mockup-card mockup-3">
                <div className="mockup-header">
                  <div className="mockup-title">Orders</div>
                </div>
                <div className="mockup-content">
                  <div className="order-item">
                    <div className="order-avatar" style={{background: '#667eea'}}>JD</div>
                    <div className="order-details">
                      <div className="order-number">#ORD-1234</div>
                      <div className="order-time">2 hours ago</div>
                    </div>
                    <div className="order-status status-paid">PAID</div>
                  </div>
                  <div className="order-item">
                    <div className="order-avatar" style={{background: '#f5576c'}}>SM</div>
                    <div className="order-details">
                      <div className="order-number">#ORD-1235</div>
                      <div className="order-time">5 hours ago</div>
                    </div>
                    <div className="order-status status-cod">COD</div>
                  </div>
                  <div className="order-item">
                    <div className="order-avatar" style={{background: '#4facfe'}}>RK</div>
                    <div className="order-details">
                      <div className="order-number">#ORD-1236</div>
                      <div className="order-time">1 day ago</div>
                    </div>
                    <div className="order-status status-paid">PAID</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;

