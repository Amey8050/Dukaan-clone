import { useEffect, useMemo, useRef, useState } from 'react';
import './LandingTestimonials.css';

const testimonials = [
  {
    brand: 'Lemonade',
    headline: '“Substantial rise in our business metrics!”',
    text: 'Within 10 days of going live, we saw a 27% increase in website traffic, 25% CAC improvement, and a 52% jump in daily revenue.',
    person: 'Sambuddha Bhattacharya',
    title: 'Founder & CEO, Lemonade'
  },
  {
    brand: 'BuzzBee',
    headline: '“A true game changer for our team”',
    text: 'We replaced a patchwork of tools with Dukaan. Launching new campaigns now takes hours instead of weeks, and conversions are up.',
    person: 'Ananya Iyer',
    title: 'Head of Digital, BuzzBee'
  },
  {
    brand: 'Wow Skin Science',
    headline: '“Streamlined checkout, happier customers”',
    text: 'Customers get a lightning fast experience and we get actionable analytics. It strengthened our promise of premium service.',
    person: 'Sudeep Bansal',
    title: 'VP Growth, WOW Skin Science'
  },
  {
    brand: 'Uppercase',
    headline: '“Migrated in days, scaled in weeks”',
    text: 'The Dukaan team helped us migrate and automate operations. Order accuracy improved and repeat purchases grew 18%.',
    person: 'Rahul Shah',
    title: 'COO, Uppercase'
  },
  {
    brand: 'Truke',
    headline: '“Best infrastructure for fast drops”',
    text: 'Drops sell out in minutes, so reliability matters. Dukaan’s stack handled every spike without hiccups.',
    person: 'Ishita Desai',
    title: 'Commerce Lead, Truke'
  },
  {
    brand: 'Jain Shikanji',
    headline: '“30x orders after Shark Tank India”',
    text: 'Their team helped us navigate the surge in demand with robust tooling, fulfilment workflows, and support.',
    person: 'Anubhav Jain',
    title: 'Co-founder, Jain Shikanji'
  }
];

const AUTOPLAY_DELAY = 7000;

const LandingTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(2);
  const autoplayRef = useRef();
  const touchStartX = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setSlidesToShow(window.innerWidth <= 768 ? 1 : 2);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    autoplayRef.current = setInterval(() => {
      handleNext();
    }, AUTOPLAY_DELAY);

    return () => {
      clearInterval(autoplayRef.current);
    };
  });

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + slidesToShow) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - slidesToShow;
      return newIndex < 0 ? testimonials.length + newIndex : newIndex;
    });
  };

  const visibleSlides = useMemo(() => {
    return Array.from({ length: slidesToShow }, (_, i) => {
      const index = (currentIndex + i) % testimonials.length;
      return testimonials[index];
    });
  }, [currentIndex, slidesToShow]);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const diff = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  return (
    <section className="landing-testimonials">
      <div className="testimonials-container">
        <div className="testimonials-heading">
          <h2>Hear from teams building on Dukaan</h2>
          <p>
            From fast-moving D2C brands to enterprise marketplaces, leading teams trust Duke’s modern commerce stack.
          </p>
        </div>

        <div className="testimonials-carousel">
          <button
            className="carousel-control prev"
            onClick={handlePrev}
            aria-label="Show previous testimonials"
          >
            ‹
          </button>

          <div
            className="carousel-track"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {visibleSlides.map((slide, idx) => (
              <article key={`${slide.brand}-${idx}`} className="testimonial-card">
                <div className="testimonial-logo">
                  <span>{slide.brand}</span>
                </div>
                <h3>{slide.headline}</h3>
                <p>{slide.text}</p>
                <div className="testimonial-footer">
                  <div className="avatar">
                    <span>{slide.person.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                  </div>
                  <div>
                    <strong>{slide.person}</strong>
                    <span>{slide.title}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            className="carousel-control next"
            onClick={handleNext}
            aria-label="Show next testimonials"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;

