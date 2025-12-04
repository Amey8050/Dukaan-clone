import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from '../components/LandingPage/LandingHeader';
import LandingFooter from '../components/LandingPage/LandingFooter';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [countdown, setCountdown] = useState({ days: 5, hours: 9, minutes: 52, seconds: 38 });
  const [openFaq, setOpenFaq] = useState(null);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const pricingPlans = {
    monthly: [
      {
        name: 'Free',
        price: '0',
        originalPrice: null,
        description: 'Perfect for getting started',
        features: [
          'Single store',
          'Up to 50 products',
          'Basic themes',
          'Mobile responsive store',
          'Email support',
          'SSL Certificate',
          'Payment gateway integration'
        ],
        popular: false,
        cta: 'Get started'
      },
      {
        name: 'Basic',
        price: '499',
        originalPrice: null,
        description: 'For growing businesses',
        features: [
          'Up to 3 stores',
          'Unlimited products',
          'Premium themes',
          'Custom domain',
          'Advanced analytics',
          'Inventory management',
          'Order management',
          'Email & Chat support',
          'SSL Certificate',
          'Payment gateway integration'
        ],
        popular: true,
        cta: 'Start free trial'
      },
      {
        name: 'Professional',
        price: '999',
        originalPrice: null,
        description: 'For established businesses',
        features: [
          'Unlimited stores',
          'Unlimited products',
          'All premium themes',
          'Custom domain',
          'Advanced analytics & reports',
          'Inventory management',
          'Order management',
          'Bulk product upload',
          'AI-powered features',
          'Priority support',
          'SSL Certificate',
          'Multiple payment gateways'
        ],
        popular: false,
        cta: 'Start free trial'
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        originalPrice: null,
        description: 'For large-scale operations',
        features: [
          'Unlimited everything',
          'Custom development',
          'Dedicated account manager',
          'API access',
          'White-label options',
          'Advanced security',
          'Custom integrations',
          '24/7 priority support',
          'SLA guarantee'
        ],
        popular: false,
        cta: 'Contact sales'
      }
    ],
    yearly: [
      {
        name: 'Free',
        price: '0',
        originalPrice: null,
        description: 'Perfect for getting started',
        features: [
          'Single store',
          'Up to 50 products',
          'Basic themes',
          'Mobile responsive store',
          'Email support',
          'SSL Certificate',
          'Payment gateway integration'
        ],
        popular: false,
        cta: 'Get started'
      },
      {
        name: 'Basic',
        price: '4,788',
        originalPrice: '5,988',
        description: 'For growing businesses',
        features: [
          'Up to 3 stores',
          'Unlimited products',
          'Premium themes',
          'Custom domain',
          'Advanced analytics',
          'Inventory management',
          'Order management',
          'Email & Chat support',
          'SSL Certificate',
          'Payment gateway integration'
        ],
        popular: true,
        cta: 'Start free trial'
      },
      {
        name: 'Professional',
        price: '9,588',
        originalPrice: '11,988',
        description: 'For established businesses',
        features: [
          'Unlimited stores',
          'Unlimited products',
          'All premium themes',
          'Custom domain',
          'Advanced analytics & reports',
          'Inventory management',
          'Order management',
          'Bulk product upload',
          'AI-powered features',
          'Priority support',
          'SSL Certificate',
          'Multiple payment gateways'
        ],
        popular: false,
        cta: 'Start free trial'
      },
      {
        name: 'Enterprise',
        price: 'Custom',
        originalPrice: null,
        description: 'For large-scale operations',
        features: [
          'Unlimited everything',
          'Custom development',
          'Dedicated account manager',
          'API access',
          'White-label options',
          'Advanced security',
          'Custom integrations',
          '24/7 priority support',
          'SLA guarantee'
        ],
        popular: false,
        cta: 'Contact sales'
      }
    ]
  };

  const testimonials = [
    {
      quote: "Substantial rise in our business metrics!",
      author: "Sambuddha Bhattacharya",
      role: "Founder & CEO, Lemonade",
      company: "Lemonade",
      details: "Mindblown by our experience with Dukkan! Within 10 days of going live, we've seen a 27% increase in website traffic, 25% CAC improvement, and an instant 52% daily revenue growth."
    },
    {
      quote: "A true game changer!",
      author: "Vishu Tyagi and Pratyush Raj",
      role: "Owner, Emo Bois of India",
      company: "Emo bois",
      details: "It's been a really smooth experience with Dukkan. We were deciding between Shopify and Dukkan. We thought through a lot and Dukkan seemed the smoothest for our selling experience considering we were setting up our store for the first time."
    },
    {
      quote: "Ecommerce tech for amazing experience!",
      author: "Sudeep Bansal",
      role: "VP of Growth of WOW Skin Science",
      company: "Wow",
      details: "Dukkan has greatly enhanced our customers' shopping experience. We now offer a faster & more streamlined checkout, user-friendly interfaces and advanced features. Dukkan has strengthened our commitment to providing exceptional experiences to our customers."
    },
    {
      quote: "30x orders after Shark Tank India!",
      author: "Anubhav Jain",
      role: "Co-Founder & CEO, Jain Shikanji",
      company: "Jain shikanji",
      details: "Dukkan's team helped us navigate post Shark Tank India and is always very prompt and pro-active. I love how easy their interface is. My experience selling through Dukkan has been seamless and great!"
    }
  ];

  const faqs = [
    {
      question: "What type of businesses can benefit from Dukkan?",
      answer: "Dukkan is perfect for any business looking to sell online - from small startups to established enterprises. Whether you're selling products, services, or digital goods, Dukkan provides all the tools you need to create and manage a successful online store."
    },
    {
      question: "How customizable is my store on Dukkan?",
      answer: "Dukkan offers extensive customization options including multiple themes, custom branding, product layouts, and more. You can customize colors, fonts, layouts, and even add custom CSS for complete control over your store's appearance."
    },
    {
      question: "I'm migrating from Shopify/WooCommerce. What can I expect with Dukkan?",
      answer: "Dukkan offers a seamless migration process with tools to import your products, customers, and order history. Our team can help you migrate smoothly with minimal downtime, and you'll benefit from faster performance and lower costs."
    },
    {
      question: "Do all plans come with access to Dukkan on Web, Android, and iOS?",
      answer: "Yes! All plans include access to our web platform, Android app, and iOS app. You can manage your store from anywhere, anytime, using any device."
    },
    {
      question: "Can I use my own custom domain with any plan?",
      answer: "Yes, you can use your custom domain with all paid plans (Basic, Professional, and Enterprise). The Free plan includes a subdomain, but you can upgrade anytime to use your own domain."
    },
    {
      question: "Is there a transaction fee with the paid plans?",
      answer: "No! Unlike many other platforms, Dukkan does not charge any transaction fees on paid plans. You only pay the monthly/annual subscription fee. Payment gateway charges apply separately as per your chosen payment provider."
    },
    {
      question: "How does Shipping / Logistics work on Dukkan?",
      answer: "Dukkan integrates with multiple shipping partners and logistics providers. You can set up shipping zones, rates, and rules. We also offer Dukkan Delivery for hassle-free pan-India shipping at competitive rates."
    },
    {
      question: "What payment gateways are supported on Dukkan?",
      answer: "Dukkan supports all major payment gateways including Razorpay, Stripe, PayPal, and more. You can integrate multiple payment methods to give your customers flexible payment options."
    },
    {
      question: "Can I manage my inventory on Dukkan?",
      answer: "Absolutely! Dukkan includes comprehensive inventory management features including stock tracking, low stock alerts, bulk updates, inventory history, and automated stock management to keep your inventory organized."
    },
    {
      question: "What are Dukkan plugins & themes?",
      answer: "Dukkan plugins add extra functionality to your store like marketing tools, analytics, integrations, and more. Themes control the visual appearance and layout of your store. We offer a variety of both free and premium options to customize your store."
    }
  ];

  const plans = pricingPlans[billingCycle];

  return (
    <div className="pricing-page">
      <LandingHeader />
      
      {/* Sale Banner */}
      <div className="pricing-sale-banner">
        <div className="sale-banner-content">
          <div className="sale-badge">Independence Day Sale!</div>
          <h2>Get up to 80% OFF on all subscription plans.</h2>
          <button className="sale-cta-btn" onClick={() => navigate('/register')}>
            Avail now
          </button>
        </div>
        <div className="countdown-timer">
          <div className="countdown-item">
            <span className="countdown-value">{String(countdown.days).padStart(2, '0')}</span>
            <span className="countdown-label">Days</span>
          </div>
          <span className="countdown-separator">:</span>
          <div className="countdown-item">
            <span className="countdown-value">{String(countdown.hours).padStart(2, '0')}</span>
            <span className="countdown-label">Hours</span>
          </div>
          <span className="countdown-separator">:</span>
          <div className="countdown-item">
            <span className="countdown-value">{String(countdown.minutes).padStart(2, '0')}</span>
            <span className="countdown-label">Minutes</span>
          </div>
          <span className="countdown-separator">:</span>
          <div className="countdown-item">
            <span className="countdown-value">{String(countdown.seconds).padStart(2, '0')}</span>
            <span className="countdown-label">Seconds</span>
          </div>
        </div>
      </div>

      {/* Main Pricing Section */}
      <section className="pricing-main-section">
        <div className="pricing-container">
          <h1 className="pricing-title">Choose your success path with Dukkan's flexible pricing</h1>
          
          {/* Billing Toggle */}
          <div className="billing-toggle">
            <button
              className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <span className="discount-badge">(UPTO 60% OFF)</span>
            </button>
          </div>

          {/* Features Badge */}
          <div className="pricing-features-badge">
            <div className="feature-badge">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 0L12.2451 6.90983H19.5106L13.6327 11.1803L15.8779 18.0902L10 13.8197L4.12215 18.0902L6.36729 11.1803L0.489435 6.90983H7.75486L10 0Z" fill="currentColor"/>
              </svg>
              <span>SSL Secure Payments</span>
            </div>
            <div className="feature-badge">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M10 6V10L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Blazing Fast</span>
            </div>
            <div className="feature-badge">
              <span>Accepted Payments</span>
              <div className="payment-icons">
                <span>Visa</span>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="pricing-cards">
            {plans.map((plan, index) => (
              <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  {plan.price === 'Custom' ? (
                    <span className="custom-price">Custom</span>
                  ) : (
                    <>
                      <span className="currency">₹</span>
                      <span className="amount">{plan.price}</span>
                      {plan.originalPrice && (
                        <span className="original-price">₹{plan.originalPrice}</span>
                      )}
                      <span className="period">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </>
                  )}
                </div>
                <p className="plan-description">{plan.description}</p>
                <button
                  className={`plan-cta-btn ${plan.popular ? 'primary' : 'secondary'}`}
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      // Handle contact sales
                      window.open('mailto:sales@dukkan.com?subject=Enterprise Plan Inquiry');
                    } else {
                      navigate('/register');
                    }
                  }}
                >
                  {plan.cta}
                </button>
                <ul className="plan-features">
                  {plan.features.map((feature, idx) => (
                    <li key={idx}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="pricing-testimonials">
        <div className="testimonials-container">
          <h2 className="testimonials-title">Hear from our satisfied customers</h2>
          <p className="testimonials-subtitle">From beginners to enterprise brands, everyone loves Dukkan!</p>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-logo">{testimonial.company.charAt(0)}</div>
                <h4 className="testimonial-quote">"{testimonial.quote}"</h4>
                <p className="testimonial-details">{testimonial.details}</p>
                <div className="testimonial-author">
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="pricing-faqs">
        <div className="faqs-container">
          <h2 className="faqs-title">FAQs</h2>
          <div className="faqs-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className={`faq-question ${openFaq === index ? 'open' : ''}`}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  {faq.question}
                  <svg
                    className={`faq-icon ${openFaq === index ? 'open' : ''}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d={openFaq === index ? "M5 10H15" : "M10 5V15M5 10H15"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pricing-cta-section">
        <div className="cta-container">
          <h2>Chase your dreams. Start your online store.</h2>
          <p>Take your business online with Dukkan. Get your free online store in 30 seconds.</p>
          <button className="cta-button" onClick={() => navigate('/register')}>
            Get started
          </button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Pricing;

