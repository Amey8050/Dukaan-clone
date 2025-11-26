import './LandingPlugins.css';
import facebookPixel from '../../assets/plugins/facebook-pixel.svg';
import privy from '../../assets/plugins/privy.svg';
import clarity from '../../assets/plugins/clarity.svg';
import googleAnalytics from '../../assets/plugins/google-analytics.svg';
import tag from '../../assets/plugins/tag.svg';
import mailchimp from '../../assets/plugins/mailchimp.svg';
import gumroad from '../../assets/plugins/gumroad.svg';
import creativeSuite from '../../assets/plugins/creative-suite.svg';
import shopify from '../../assets/plugins/shopify.svg';
import purpleShield from '../../assets/plugins/purple-shield.svg';
import trustedBadges from '../../assets/plugins/trusted-badges.svg';
import amazon from '../../assets/plugins/amazon.svg';
import googleAds from '../../assets/plugins/google-ads.svg';
import zapier from '../../assets/plugins/zapier.svg';
import segment from '../../assets/plugins/segment.svg';

const plugins = [
  { name: 'Facebook Pixel', icon: facebookPixel },
  { name: 'Privy', icon: privy },
  { name: 'Microsoft Clarity', icon: clarity },
  { name: 'Google Analytics', icon: googleAnalytics },
  { name: 'Tag Manager', icon: tag },
  { name: 'Mailchimp', icon: mailchimp },
  { name: 'Gumroad', icon: gumroad },
  { name: 'Creative Suite', icon: creativeSuite },
  { name: 'Shopify', icon: shopify },
  { name: 'Purple Shield', icon: purpleShield },
  { name: 'Trusted Badges', icon: trustedBadges },
  { name: 'Amazon', icon: amazon },
  { name: 'Google Ads', icon: googleAds },
  { name: 'Zapier', icon: zapier },
  { name: 'Segment', icon: segment }
];

const LandingPlugins = () => {
  return (
    <section className="landing-plugins">
      <div className="plugins-container">
        <h2 className="plugins-title">
          Enhance your site's functionality with plugins
        </h2>
        <p className="plugins-description">
          Choose from over 40+ plugins. Be it tracking analytics, managing shipments to building email lists. There's a plugin for everything.
        </p>
        <div className="plugins-row-wrapper">
          <div className="plugins-row">
            {plugins.concat(plugins).map((plugin, index) => (
              <div key={`${plugin.name}-${index}`} className="plugin-card">
                <img src={plugin.icon} alt={`${plugin.name} icon`} loading="lazy" />
                <span>{plugin.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="plugins-cta">
          <button className="btn-outline">Take a look</button>
        </div>
      </div>
    </section>
  );
};

export default LandingPlugins;

