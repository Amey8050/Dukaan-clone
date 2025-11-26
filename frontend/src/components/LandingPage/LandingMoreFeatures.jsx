import './LandingMoreFeatures.css';

const iconRenderers = {
  speed: () => (
    <svg viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="20" stroke="#f5a623" strokeWidth="4" fill="none" />
      <path d="M20 44c3-6 7-10 12-10s9 4 12 10" stroke="#f5a623" strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="32" y1="32" x2="35" y2="20" stroke="#f5a623" strokeWidth="4" strokeLinecap="round" />
      <line x1="8" y1="18" x2="18" y2="22" stroke="#f5a623" strokeWidth="3" strokeLinecap="round" />
      <line x1="8" y1="26" x2="18" y2="30" stroke="#f5a623" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  warehouse: () => (
    <svg viewBox="0 0 64 64">
      <path d="M8 26 L32 10 L56 26 V54 H8 Z" fill="none" stroke="#1f2937" strokeWidth="4" strokeLinejoin="round" />
      <rect x="16" y="34" width="12" height="12" fill="none" stroke="#1f2937" strokeWidth="3" />
      <rect x="36" y="34" width="12" height="12" fill="none" stroke="#1f2937" strokeWidth="3" />
      <rect x="16" y="22" width="32" height="8" fill="none" stroke="#1f2937" strokeWidth="3" />
    </svg>
  ),
  checkout: () => (
    <svg viewBox="0 0 64 64">
      <path d="M10 16 H20 L26 44 H50 L54 28 H24" fill="none" stroke="#22a06b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="50" r="4" fill="none" stroke="#22a06b" strokeWidth="3" />
      <circle cx="48" cy="50" r="4" fill="none" stroke="#22a06b" strokeWidth="3" />
      <path d="M34 24 L40 30 L52 14" stroke="#22a06b" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  ),
  staff: () => (
    <svg viewBox="0 0 64 64">
      <circle cx="22" cy="24" r="10" stroke="#10b981" strokeWidth="3" fill="none" />
      <circle cx="46" cy="24" r="10" stroke="#10b981" strokeWidth="3" fill="none" />
      <path d="M10 52c0-8 6-14 12-14h0c6 0 12 6 12 14" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M34 52c0-8 6-14 12-14h0c6 0 12 6 12 14" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  ),
  android: () => (
    <svg viewBox="0 0 64 64">
      <rect x="18" y="10" width="28" height="48" rx="8" fill="none" stroke="#2563eb" strokeWidth="3" />
      <circle cx="32" cy="50" r="4" fill="#2563eb" />
      <rect x="24" y="16" width="16" height="28" rx="4" fill="none" stroke="#2563eb" strokeWidth="2" />
      <rect x="27" y="20" width="10" height="10" rx="2" fill="#2563eb" opacity="0.3" />
    </svg>
  ),
  analytics: () => (
    <svg viewBox="0 0 64 64">
      <polyline points="12,44 24,28 36,38 52,18" fill="none" stroke="#2d9cdb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="52" x2="52" y2="52" stroke="#2d9cdb" strokeWidth="3" strokeLinecap="round" />
      <rect x="18" y="34" width="8" height="12" fill="#2d9cdb" opacity="0.3" />
      <rect x="30" y="42" width="8" height="4" fill="#2d9cdb" opacity="0.3" />
      <rect x="42" y="30" width="8" height="16" fill="#2d9cdb" opacity="0.3" />
      <path d="M44 14 L52 22 L44 22 Z" fill="#2d9cdb" opacity="0.8" />
    </svg>
  )
};

const LandingMoreFeatures = () => {
  const moreFeatures = [
    {
      title: 'Site Speed',
      description: 'Incredibly fast storefronts. Launch online and feel the speed instantly.',
      icon: 'speed'
    },
    {
      title: 'Multi-Warehouse',
      description: 'One store, multiple locations. Ship products from warehouses across India.',
      icon: 'warehouse'
    },
    {
      title: 'Optimised Checkouts',
      description: 'Offer seamless shopping experiences optimised to reduce abandonment rates.',
      icon: 'checkout'
    },
    {
      title: 'Staff Accounts',
      description: 'Add employees and teammates to help you grow while managing access.',
      icon: 'staff'
    },
    {
      title: 'Android App',
      description: 'Take your store mobile and build loyalty with a dedicated Android experience.',
      icon: 'android'
    },
    {
      title: 'Advanced Analytics',
      description: 'See sales, traffic, and product performance at a glance.',
      icon: 'analytics'
    }
  ];

  return (
    <section className="landing-more-features">
      <div className="more-features-container">
        <h2 className="more-features-title">
          E-commerce Simplified, Success Amplified
        </h2>
        <p className="more-features-subtitle">
          Empowering your online business growth with all the essential tools.
        </p>
        <div className="more-features-grid">
          {moreFeatures.map((feature, index) => (
            <div key={index} className="more-feature-card">
              <div className="feature-icon">{iconRenderers[feature.icon]?.()}</div>
              <h3 className="more-feature-title">{feature.title}</h3>
              <p className="more-feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingMoreFeatures;

