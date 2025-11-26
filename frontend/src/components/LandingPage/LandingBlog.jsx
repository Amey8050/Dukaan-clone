import './LandingBlog.css';
import blogGuideImg from '../../assets/digital-product.svg';
import blogPressImg from '../../assets/dukaan-dimensions.jpg';
import blogSellImg from '../../assets/sell-antiques-online.jpg';

const blogPosts = [
  {
    category: 'GUIDES',
    title: '10 Best AI Tools for Businesses in 2025',
    image: blogGuideImg
  },
  {
    category: 'PRESS',
    title: 'Dukaan Dimensions 2022 – A Retrospective on the Growth Enabled by Dukaan',
    image: blogPressImg
  },
  {
    category: 'SELL ONLINE',
    title: 'How to Sell Antiques Online the Right Way – Detailed 8 Step Guide',
    image: blogSellImg
  }
];

const LandingBlog = () => {
  return (
    <section className="landing-blog" aria-labelledby="blog-heading">
      <div className="blog-container">
        <div className="blog-heading">
          <h2 id="blog-heading">
            <span>Grow your online store.</span>
            <span>Learn the tips and tricks from experts.</span>
          </h2>
        </div>

        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article key={post.title} className="blog-card">
              <div className="blog-card-image">
                <img src={post.image} alt={post.title} loading="lazy" />
              </div>
              <p className="blog-card-category">{post.category}</p>
              <h3 className="blog-card-title">{post.title}</h3>
            </article>
          ))}
        </div>

        <div className="blog-cta">
          <button className="btn-view-all" type="button">
            View all
          </button>
        </div>
      </div>
    </section>
  );
};

export default LandingBlog;

