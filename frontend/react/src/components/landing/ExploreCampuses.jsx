import React, { useState } from 'react';
import { campusesList } from '../../data/universityData';
import { MapPin, ArrowUpRight, ChevronRight, ChevronLeft } from 'lucide-react';

export function ExploreCampuses({ t, openModal }) {
  const [selectedCampusIndex, setSelectedCampusIndex] = useState(0);

  const nextCampus = () => setSelectedCampusIndex((prev) => (prev + 1) % campusesList.length);
  const prevCampus = () => setSelectedCampusIndex((prev) => (prev - 1 + campusesList.length) % campusesList.length);

  const activeCampus = campusesList[selectedCampusIndex] || campusesList[0];

  return (
    <section className="aau-campuses-banner-section" id="campuses">
      <div className="container-wrapper">
        <div className="aau-section-header" style={{ marginBottom: '32px' }}>
          <span className="aau-eyebrow-small" style={{ color: 'var(--red-accent-light)' }}>Campuses</span>
          <h2 className="aau-title-heading" style={{ color: '#FFFFFF' }}>{t.exploreCampusesTitle || 'Explore our Campuses'}</h2>
          <div className="aau-dual-line">
            <span className="line-red" />
            <span className="line-blue" style={{ backgroundColor: '#FFFFFF' }} />
          </div>
        </div>

        <div className="aau-campuses-split">
          {/* LEFT COLUMN: ACTIVE CAMPUS TEXT & CTA */}
          <div className="aau-campus-text-side">
            <h3 className="aau-campus-name-red">
              {activeCampus.name.toUpperCase()}
            </h3>

            <p className="aau-campus-desc-white">
              {activeCampus.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#CBD5E1', marginBottom: '28px' }}>
              <MapPin size={16} style={{ color: 'var(--red-accent)' }} />
              {activeCampus.location}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                className="btn-aau-outline" 
                onClick={() => openModal('bioModal')}
                style={{ color: '#FFFFFF', borderColor: '#FFFFFF' }}
              >
                Explore this Campus <ArrowUpRight size={16} />
              </button>

              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button className="aau-control-btn" onClick={prevCampus} aria-label="Previous Campus">
                  <ChevronLeft size={18} />
                </button>
                <button className="aau-control-btn" onClick={nextCampus} aria-label="Next Campus">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CAMPUS CARDS PREVIEW */}
          <div className="aau-campus-cards-side">
            {campusesList.map((campus, idx) => (
              <div 
                key={campus.id} 
                className={`aau-campus-card-preview ${idx === selectedCampusIndex ? 'active' : ''}`}
                onClick={() => setSelectedCampusIndex(idx)}
              >
                <img src={campus.image} alt={campus.name} className="aau-campus-card-img" />
                <div className="aau-campus-card-info">
                  <span className="aau-campus-tag">{campus.tag}</span>
                  <h4 className="aau-campus-title-sm">{campus.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
