import React, { useState } from 'react';
import { partnersList } from '../../data/universityData';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export function Partners({ t, openModal }) {
  const [activePartnerIndex, setActivePartnerIndex] = useState(0);

  const nextPartner = () => setActivePartnerIndex((prev) => (prev + 1) % partnersList.length);
  const prevPartner = () => setActivePartnerIndex((prev) => (prev - 1 + partnersList.length) % partnersList.length);

  const activePartner = partnersList[activePartnerIndex] || partnersList[0];

  return (
    <section className="aau-partners-section bg-light-gray" id="partners">
      <div className="container-wrapper">
        {/* <div className="aau-section-header" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="aau-eyebrow-small">Academic Cooperation</span>
          <h2 className="aau-title-heading">{t.partnersTitle || 'FEATURED PARTNERS'}</h2>
          <p className="section-desc" style={{ marginBottom: '16px', textAlign: 'center' }}>
            {t.partnersSubtitle || 'Empowering education through regional, national, and global academic partnerships.'}
          </p>
          <div className="aau-dual-line" style={{ margin: '0 auto' }}>
            <span className="line-red" />
            <span className="line-blue" />
          </div>
        </div>


        <div className="aau-partner-single-card">
          <div className="aau-partner-circle-logo">
            {activePartner.logoText || activePartner.name.substring(0, 3).toUpperCase()}
          </div>

          <h3 className="aau-partner-name-bold">
            {activePartner.name}
          </h3>

          <span className="aau-partner-category-tag">
            {activePartner.category}
          </span>

          <p className="aau-partner-short-desc">
            "{t.partnerQuote || 'Transforming human capital through quality education and visionary leadership.'}"
          </p>

          <button 
            className="aau-link-arrow" 
            onClick={() => alert(`Partner detail: ${activePartner.name}`)}
            style={{ margin: '16px auto 0 auto' }}
          >
            View all <ArrowRight size={15} />
          </button>
        </div>


        <div className="aau-partner-controls-row">
          <button className="aau-control-btn" onClick={prevPartner} aria-label="Previous partner">
            <ChevronLeft size={18} />
          </button>

          <div className="aau-slide-dots">
            {partnersList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActivePartnerIndex(idx)}
                className={`aau-dot ${idx === activePartnerIndex ? 'active' : ''}`}
                aria-label={`Partner ${idx + 1}`}
              />
            ))}
          </div>

          <button className="aau-control-btn" onClick={nextPartner} aria-label="Next partner">
            <ChevronRight size={18} />
          </button>
        </div>*/}
      </div>
    </section>
  );
}
