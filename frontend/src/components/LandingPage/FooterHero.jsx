import './FooterHero.css';
import logoIcon from '../../assets/fav.png';

const FooterHero = () => {
  return (
    <div className="footer-hero">
      <div className="footer-hero-container">
        <div className="footer-hero-logo">
          <img src={logoIcon} alt="Dukaan" className="logo-image" />
        </div>
        <div className="footer-hero-content">
          <h2 className="footer-hero-title">Start selling online.</h2>
          <p className="footer-hero-subtitle">
            Take your business online with Dukaan. Get your free online store in 30 seconds.
          </p>
          <button className="footer-hero-button" type="button">
            Get started
          </button>
        </div>
      </div>
    </div>
  );
};

export default FooterHero;
