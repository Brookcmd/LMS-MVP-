import React, { useState, useEffect } from 'react';
import { heroSlides } from '../../data/universityData';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

export function HeroSlider({ t, openModal }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  const slide = heroSlides[currentSlide];

  return (
    <section className="aau-hero-container" id="home">
      {/* Full-width image covering the section background */}
      <div 
        className="aau-hero-bg-media"
        style={{ backgroundImage: `url(${slide.image})` }}
      />

      {/* Split grid: Clear image view on left, blurred image overlay on right */}
      <div className="aau-hero-split-grid">
        {/* LEFT HALF — full-bleed image view with badge */}
        <div className="aau-hero-photo-column">
          <div className="aau-photo-badge">
            {slide.badgeText || "Sheba University College & Academy"}
          </div>
        </div>

        {/* RIGHT HALF — text column with blurred image background overlay */}
        <div className="aau-hero-text-column">
          <div 
            className="aau-hero-text-blurred-bg"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="aau-hero-text-overlay" />

          <div className="aau-hero-text-content">
            <span className="aau-hero-eyebrow">
              {slide.tagline}
            </span>

            <h1 className="aau-hero-title">
              {slide.title}
            </h1>

            <p className="aau-hero-desc">
              {slide.description}
            </p>

            <div className="aau-hero-btn-group">
              <button className="btn-aau-primary" onClick={() => openModal('applyModal')}>
                {(t.btnResearch || 'Research').replace('↗', '').trim()} <ArrowUpRight size={17} />
              </button>

              <a href="#academics" className="btn-aau-outline">
                {(t.btnPublications || 'Publications').replace('↗', '').trim()} <ArrowUpRight size={17} />
              </a>
            </div>

            {/* SLIDE INDICATORS AND CONTROLS */}
            <div className="aau-slide-controls">
              <button
                onClick={prevSlide}
                className="aau-control-btn"
                aria-label="Previous Slide"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="aau-slide-dots">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`aau-dot ${idx === currentSlide ? 'active' : ''}`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="aau-control-btn"
                aria-label="Next Slide"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
