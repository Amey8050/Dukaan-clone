import './LandingThemes.css';
import tinkerPreview from '../../assets/themes/tinker.webp';
import ursaPreview from '../../assets/themes/ursa.png';
import enigmaPreview from '../../assets/themes/enigma.png';

const themes = [
  {
    name: 'Tinker',
    image: tinkerPreview,
    description: 'Minimalist electronics storefront with hero imagery and curated grids.'
  },
  {
    name: 'Ursa',
    image: ursaPreview,
    description: 'Dark photography equipment layout with brand logos and promo sections.'
  },
  {
    name: 'Enigma',
    image: enigmaPreview,
    description: 'Clean digital bookstore featuring curated collections and CTAs.'
  }
];

const LandingThemes = () => {
  return (
    <section className="landing-themes">
      <div className="themes-container">
        <h2 className="themes-title">
          Kickstart your online store with these themes
        </h2>
        <div className="themes-grid">
          {themes.map((theme) => (
            <div key={theme.name} className="theme-card">
              <div className="theme-preview">
                <img src={theme.image} alt={`${theme.name} theme preview`} loading="lazy" />
              </div>
              <div className="theme-info">
                <h3 className="theme-name">{theme.name}</h3>
                <p className="theme-description">{theme.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingThemes;

