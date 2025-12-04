import './LandingFeatures.css';
import launchImg from '../../assets/launch.svg';
import scaleFasterImg from '../../assets/scale-faster.svg';
import manageBetterImg from '../../assets/manage-better.svg';

const LandingFeatures = () => {
  const features = [
    {
      title: 'Launch Fast',
      items: [
        'Fully responsive e-commerce website & mobile app',
        'Loads 6X faster than existing solutions',
        'Upload/import products and inventory in bulk',
        'Integrate payment gateways',
        'Easily customizable themes'
      ],
      illustration: 'left',
      gradient: 'lavender',
      image: launchImg
    },
    {
      title: 'Scale Faster',
      items: [
        'Guaranteed 99.5% uptime for your store - We keep you open for business',
        '60+ third party plugins',
        'Marketing tools and discounts to drive repeat orders',
        'Add staff accounts, assign different roles',
        'Unlimited transactions, minimal transaction fees'
      ],
      illustration: 'right',
      gradient: 'blue',
      image: scaleFasterImg
    },
    {
      title: 'Manage Better',
      items: [
        'Order tracking, invoicing and order reports',
        'Bulk edit product prices, variants, inventory',
        'Manage global deliveries',
        'In-depth business analytics',
        'Automate all tax calculations'
      ],
      illustration: 'left',
      gradient: 'green',
      image: manageBetterImg
    }
  ];

  return (
    <section className="landing-features">
      <div className="features-container">
        <h2 className="features-title">
          Whether you're a startup or an established business, here's why Dukkan is your best choice
        </h2>
        <div className="features-list">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-section ${feature.illustration === 'right' ? 'reverse' : ''}`}
            >
              <div className="feature-illustration">
                <div className={`illustration-card ${feature.gradient}-gradient`}>
                  <img src={feature.image} alt={feature.title} className="illustration-image" />
                </div>
              </div>
              
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <ul className="feature-list">
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="feature-item">
                      <span className="sparkle-icon">✦</span>
                      <span style={{ color: '#000000' }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;

