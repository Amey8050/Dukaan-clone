import './ScrollingAd.css';
// Import all SVG logos from assets
import govo from '../../assets/ad/govo.svg';
import healthxp from '../../assets/ad/healthxp.svg';
import styleup from '../../assets/ad/styleup.svg';
import truke from '../../assets/ad/truke.svg';
import uppercase from '../../assets/ad/uppercase.svg';
import vector from '../../assets/ad/vector.svg';
import vu from '../../assets/ad/vu.svg';
import whole from '../../assets/ad/whole.svg';
import wow from '../../assets/ad/wow.svg';

const ScrollingAd = () => {
  // Brand logos array - using all imported SVG logos
  const brandLogos = [
    { id: 1, src: govo, alt: 'Govo' },
    { id: 2, src: healthxp, alt: 'HealthXP' },
    { id: 3, src: styleup, alt: 'StyleUp' },
    { id: 4, src: truke, alt: 'Truke' },
    { id: 5, src: uppercase, alt: 'Upper Case' },
    { id: 6, src: vector, alt: 'Vector' },
    { id: 7, src: vu, alt: 'VU' },
    { id: 8, src: whole, alt: 'Whole' },
    { id: 9, src: wow, alt: 'WOW' }
  ];

  // Duplicate logos multiple times for seamless loop
  const duplicatedLogos = [...brandLogos, ...brandLogos, ...brandLogos, ...brandLogos];

  return (
    <div className="scrolling-ad-container">
      <div className="scrolling-ad-banner">
        <div className="scrolling-ad-wrapper">
          <div className="scrolling-ad-track">
            {duplicatedLogos.map((logo, index) => (
              <div key={`${logo.id}-${index}`} className="scrolling-ad-logo">
                <img 
                  src={logo.src} 
                  alt={logo.alt}
                  onError={(e) => {
                    // Fallback to placeholder if image doesn't exist
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="logo-placeholder">${logo.alt}</div>`;
                  }}
                />
              </div>
            ))}
            {/* Duplicate logos for seamless loop */}
            {duplicatedLogos.map((logo, index) => (
              <div key={`dup-${logo.id}-${index}`} className="scrolling-ad-logo">
                <img 
                  src={logo.src} 
                  alt={logo.alt}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="logo-placeholder">${logo.alt}</div>`;
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollingAd;

