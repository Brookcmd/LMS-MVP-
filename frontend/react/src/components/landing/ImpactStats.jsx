import React from 'react';
import { ArrowUpRight, Users, Trophy, GraduationCap, Award, MessageSquare, Megaphone, ArrowRight } from 'lucide-react';

export function ImpactStats({ t, openModal }) {
  return (
    <section className="aau-stats-section" id="stats">
      <div className="container-wrapper">
        {/* AAU SIGNATURE DUAL ACCENT TITLE WITH TOP RIGHT UTILITY ICONS & VIEW ALL */}
        <div className="aau-section-header-row">
          <div className="aau-section-header">
            <span className="aau-eyebrow-small">Statistics</span>
            <h2 className="aau-title-heading">{t.statsHeading || 'Our Impact in Numbers'}</h2>
            <div className="aau-dual-line">
              <span className="line-red" />
              <span className="line-blue" />
            </div>
          </div>

          <div className="aau-stats-header-actions">
            <a href="#about" className="aau-link-arrow" onClick={() => openModal('bioModal')}>
              View all <ArrowRight size={15} />
            </a>

            <div className="aau-circle-icons-group">
              <button 
                className="aau-circle-icon-btn btn-navy"
                onClick={() => openModal('portalModal')}
                title="Support & Chat"
              >
                <MessageSquare size={16} />
              </button>

              <button 
                className="aau-circle-icon-btn btn-red"
                onClick={() => openModal('applyModal')}
                title="Announcements"
              >
                <Megaphone size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* AAU CONNECTED 4-CARD BOX */}
        <div className="aau-stats-box">
          {/* CARD 1: DARK NAVY NOTABLE ALUMNI CARD */}
          <div className="aau-stat-card card-dark-blue">
            <div className="aau-stat-icon-wrap">
              <Users size={32} />
            </div>
            <h3 className="aau-alumni-title">SUC Notable Alumni</h3>
            <p className="aau-alumni-desc">
              Our institution has produced 25,000+ notable alumni leading across Ethiopia & globally.
            </p>
            <button
              onClick={() => openModal('bioModal')}
              className="btn-aau-white-pill"
            >
              View List <ArrowUpRight size={14} />
            </button>
          </div>

          {/* CARD 2: #1 RANKING */}
          <div className="aau-stat-card">
            <div className="aau-stat-icon-sm">
              <Trophy size={22} style={{ color: 'var(--navy-primary)' }} />
            </div>
            <div className="aau-stat-big-num">#1</div>
            <h4 className="aau-stat-card-title">
              Top Private University College in Tigray
            </h4>
            <p className="aau-stat-card-foot">
              Pioneering ICT, Business & Health Sciences
            </p>
          </div>

          {/* CARD 3: 25 K+ ALL TIME GRADUATES */}
          <div className="aau-stat-card">
            <div className="aau-stat-icon-sm">
              <GraduationCap size={22} style={{ color: 'var(--navy-primary)' }} />
            </div>
            <div className="aau-stat-big-num">25 K+</div>
            <h4 className="aau-stat-card-title">
              All Time Graduates
            </h4>
            <p className="aau-stat-card-foot">
              More than 25,000+ Alumni & Academy Graduates
            </p>
          </div>

          {/* CARD 4: 12 K+ LEADERS IN RESEARCH */}
          <div className="aau-stat-card">
            <div className="aau-stat-icon-sm">
              <Award size={22} style={{ color: 'var(--navy-primary)' }} />
            </div>
            <div className="aau-stat-big-num">12 K+</div>
            <h4 className="aau-stat-card-title">
              Leaders in Research & STEM
            </h4>
            <p className="aau-stat-card-foot">
              500+ Scholarly Projects & Innovation Labs
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
