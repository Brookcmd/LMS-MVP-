import React, { useState } from 'react';
import { campusLifeSlides } from '../../data/universityData';
import { ChevronLeft, ChevronRight, ArrowRight, X, Plus } from 'lucide-react';

export function CampusLife({ t, openModal }) {
  const [slideIndex, setSlideIndex] = useState(0);

  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % campusLifeSlides.length);
  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + campusLifeSlides.length) % campusLifeSlides.length);

  const slide = campusLifeSlides[slideIndex];

  return (
    <section 
      className="aau-campus-life-section" 
      id="campus-life" 
      style={{ backgroundImage: `url(${slide.image})` }}
    >
      <div className="aau-campus-life-overlay" />

      {/* OVERSIZED OVERLAY TEXT ON RIGHT SIDE */}
      <div className="aau-oversized-text-overlay" aria-hidden="true">
        CAMPUS LIFE
      </div>

      <div className="container-wrapper" style={{ position: 'relative', zIndex: 3, height: '100%' }}>
        {/* TOP LEFT TAG LABEL */}
        <div className="aau-tag-top-left">
          EXPLORE LIFE AT SHEBA
        </div>

        <div className="aau-campus-life-main-row">
          {/* FLOATING WHITE CARD ON LEFT */}
          <div className="aau-floating-white-card">
            {/* CLOSE (X) ICON TOP-LEFT */}
            <button className="aau-card-close-btn" title="Close info">
              <X size={14} />
            </button>

            <span className="aau-card-red-category">
              {slide.category}
            </span>

            <h3 className="aau-card-bold-title">
              {slide.title}
            </h3>

            <p className="aau-card-short-desc">
              {slide.description}
            </p>

            <button className="aau-link-view-gallery" onClick={() => openModal('bioModal')}>
              View Gallery <ArrowRight size={15} />
            </button>

            {/* PLUS (+) BUTTON CENTER-RIGHT */}
            <button className="aau-card-plus-btn" onClick={() => openModal('applyModal')} title="Explore Details">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* BOTTOM CAROUSEL CONTROLS & DOTS */}
        <div className="aau-campus-life-controls-bottom">
          <div className="aau-slide-dots">
            {campusLifeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSlideIndex(idx)}
                className={`aau-dot ${idx === slideIndex ? 'active' : ''}`}
                aria-label={`Story ${idx + 1}`}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button className="aau-control-btn" onClick={prevSlide} aria-label="Previous story">
              <ChevronLeft size={18} />
            </button>
            <button className="aau-control-btn" onClick={nextSlide} aria-label="Next story">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
