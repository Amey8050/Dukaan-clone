import LandingHeader from './LandingHeader';
import LandingHero from './LandingHero';
import ScrollingAd from './ScrollingAd';
import LandingFeatures from './LandingFeatures';
import LandingMoreFeatures from './LandingMoreFeatures';
import LandingThemes from './LandingThemes';
import LandingPlugins from './LandingPlugins';
import LandingTestimonials from './LandingTestimonials';
import LandingEnterprise from './LandingEnterprise';
import LandingBlog from './LandingBlog';
import LandingFooter from './LandingFooter';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <LandingHeader />
      <LandingHero />
      <ScrollingAd />
      <LandingFeatures />
      <LandingMoreFeatures />
      <LandingThemes />
      <LandingPlugins />
      <LandingTestimonials />
      <LandingEnterprise />
      <LandingBlog />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;

