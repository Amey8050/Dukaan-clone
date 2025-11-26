import './LandingEnterprise.css';

const featureColumns = [
  [
    '99.5% uptime SLA with active monitoring',
    'Under 1ms latency on storefront actions',
    'Returns & exchange workflows built-in'
  ],
  [
    'Controlled shipping & fulfilment rules',
    'Custom plugins and integrations',
    'Personalised storefront design support'
  ]
];

const LandingEnterprise = () => {
  return (
    <section className="landing-enterprise" aria-labelledby="enterprise-heading">
      <div className="enterprise-pattern" aria-hidden="true" />
      <div className="enterprise-container">
        <div className="enterprise-content">
          <h2 id="enterprise-heading">Scale your business with Dukaan Enterprise</h2>
          <p className="enterprise-subtitle">
            Unlock your brand’s online potential on Dukaan’s lightning fast infrastructure. Purpose-built for high-volume teams that need reliability, compliance and handcrafted support.
          </p>

          <div className="enterprise-features" role="list">
            {featureColumns.map((column, columnIndex) => (
              <div key={`column-${columnIndex}`} className="feature-column">
                {column.map((feature) => (
                  <div key={feature} className="feature-item" role="listitem">
                    <span className="feature-icon" aria-hidden="true">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <button className="enterprise-cta" aria-label="Learn more about Dukaan Enterprise">
            Learn more
          </button>
        </div>
      </div>

      <button className="chat-button" aria-label="Chat with Dukaan Enterprise team">
        ?
      </button>
    </section>
  );
};

export default LandingEnterprise;

