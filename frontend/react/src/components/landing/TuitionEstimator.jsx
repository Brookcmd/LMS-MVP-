import React, { useState } from 'react';
import { academicPrograms } from '../../data/universityData';
import { CheckCircle2, Send, ArrowRight } from 'lucide-react';

export function TuitionEstimator({ t, openModal }) {
  const [level, setLevel] = useState('bsc');
  const [credits, setCredits] = useState(18);
  const [branch, setBranch] = useState('honor');
  const [modality, setModality] = useState('regular');
  const [activeFacultyFilter, setActiveFacultyFilter] = useState('all');

  const getRatePerCredit = () => {
    switch (level) {
      case 'academy': return 450;
      case 'tvet': return 350;
      case 'bsc': return 520;
      case 'msc': return 850;
      default: return 520;
    }
  };

  const getBranchMultiplier = () => {
    switch (branch) {
      case 'honor': return 1.0;
      case 'tele': return 1.0;
      case 'axum': return 0.95;
      default: return 1.0;
    }
  };

  const calculatedTuition = Math.round(credits * getRatePerCredit() * getBranchMultiplier());

  const filteredPrograms = activeFacultyFilter === 'all' 
    ? academicPrograms 
    : academicPrograms.filter(p => p.category.toLowerCase().includes(activeFacultyFilter.toLowerCase()));

  return (
    <section className="section-editorial bg-secondary" id="academics-estimator">
      <div className="container-wrapper">
        <div className="section-header-center">
          <span className="eyebrow">Academic Admissions Tool</span>
          <h2 className="section-title">{t.tuitionTitle}</h2>
          <p className="section-desc">{t.tuitionSubtitle}</p>
        </div>

        <div id="tuition-calc" className="estimator-layout" style={{ marginBottom: '80px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-main)', marginBottom: '24px' }}>
              Select Program & Study Details
            </h3>

            <div className="form-group">
              <label className="form-label">1. Program & Study Level</label>
              <select className="form-control" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="academy">Sheba Academy Honor Adi-Ha (KG - High School)</option>
                <option value="tvet">TVET Level 1 - 4 Diploma</option>
                <option value="bsc">Undergraduate B.Sc / B.A Degree (Regular / Extension)</option>
                <option value="msc">Postgraduate M.Sc / MBA Degree</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">2. Study Branch & Campus</label>
              <select className="form-control" value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="honor">Honor Adi-Ha Campus (Mekelle)</option>
                <option value="tele">Mekelle Tele Main Campus</option>
                <option value="axum">Axum Regional Campus</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">3. Credit Hours ({credits} hrs)</label>
                <input 
                  type="range" 
                  min="10" 
                  max="24" 
                  value={credits} 
                  onChange={(e) => setCredits(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--navy-main)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Modality</label>
                <select className="form-control" value={modality} onChange={(e) => setModality(e.target.value)}>
                  <option value="regular">Regular Day</option>
                  <option value="extension">Extension Evening</option>
                  <option value="weekend">Weekend Distance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="estimator-display-box">
            <div>
              <span className="eyebrow" style={{ color: 'var(--gold-main)', marginBottom: '4px' }}>
                ESTIMATED TUITION
              </span>
              <div className="estimator-amount">
                ETB {calculatedTuition.toLocaleString()}
              </div>
              <div style={{ color: '#CBD5E1', fontSize: '0.88rem', marginBottom: '24px' }}>
                per academic semester ({credits} credit hours)
              </div>

              <ul style={{ listStyle: 'none', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--gold-main)' }} /> Institutional Merit Scholarships Available
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--gold-main)' }} /> Flexible Installment Payment Plan
                </li>
              </ul>
            </div>

            <button 
              className="btn-institutional-gold" 
              onClick={() => openModal('applyModal')}
              style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}
            >
              <Send size={16} /> Request Admission
            </button>
          </div>
        </div>

        <div>
          <div className="section-header-center" style={{ marginBottom: '30px' }}>
            <span className="eyebrow">Academic Offerings</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy-main)' }}>
              Faculties & Degree Programs
            </h3>
          </div>

          <div className="editorial-tab-bar" style={{ borderBottom: 'none', marginBottom: '40px' }}>
            {['all', 'Informatics', 'Health', 'Business', 'Academy'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFacultyFilter(filter)}
                className={`editorial-tab-btn ${activeFacultyFilter === filter ? 'active' : ''}`}
              >
                {filter === 'all' ? 'All Programs' : filter}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredPrograms.map((prog) => (
              <div 
                key={prog.id}
                style={{
                  background: 'var(--bg-white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-card)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-main)', textTransform: 'uppercase' }}>
                    {prog.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {prog.degree}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-main)', marginBottom: '8px' }}>
                  {prog.title}
                </h4>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5', flex: 1 }}>
                  {prog.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {prog.duration}
                  </span>
                  <button 
                    onClick={() => openModal('applyModal')}
                    style={{ background: 'none', border: 'none', color: 'var(--navy-main)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Apply <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
