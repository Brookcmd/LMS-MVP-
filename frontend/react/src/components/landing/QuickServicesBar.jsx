import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export function QuickServicesBar({ t, openModal }) {
  const navigate = useNavigate();

  return (
    <section className="aau-quick-links-section">
      <div className="container-wrapper">
        <div className="aau-quick-links-row">
          <span className="aau-quick-links-label">QUICK LINKS :</span>

          <div className="aau-quick-buttons-wrap">
            <button
              onClick={() => openModal('portalModal')}
              className="btn-aau-quick-pill"
            >
              LIBRARY <ArrowUpRight size={14} />
            </button>

            <button
              onClick={() => openModal('portalModal')}
              className="btn-aau-quick-pill"
            >
              E-LEARNING <ArrowUpRight size={14} />
            </button>

            <a
              href="#campus-life"
              className="btn-aau-quick-pill"
            >
              CAMPUS LIFE <ArrowUpRight size={14} />
            </a>

            <button
              onClick={() => openModal('bioModal')}
              className="btn-aau-quick-pill"
            >
              ALUMNI <ArrowUpRight size={14} />
            </button>

            <a
              href="#faculty"
              className="btn-aau-quick-pill"
            >
              MEET OUR STAFF <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
