import './LandingFooter.css';
import FooterHero from './FooterHero';
import FooterLinks from './FooterLinks';

const LandingFooter = () => {
  return (
    <footer className="landing-footer">
      <div className="footer-container">
        <FooterHero />
        <FooterLinks />
      </div>
    </footer>
  );
};

export default LandingFooter;

