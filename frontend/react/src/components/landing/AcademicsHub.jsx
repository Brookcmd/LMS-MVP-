import React, { useState } from 'react';
import { GraduationCap, Users, FileText, ChevronRight, Clock, Download, Mail } from 'lucide-react';
import { academicPrograms, facultyMembers, downloadsList } from '../../data/universityData';

export function AcademicsHub({ t, openModal, setSelectedProgram }) {
  const [hubTab, setHubTab] = useState('programs');
  const [programFilter, setProgramFilter] = useState('all');

  const filteredPrograms = programFilter === 'all' 
    ? academicPrograms 
    : academicPrograms.filter(prog => prog.category === programFilter);

  const handleProgramClick = (program) => {
    if (setSelectedProgram) {
      setSelectedProgram(program);
    }
    openModal('programModal');
  };

  const handleDownload = (item) => {
    alert(`Downloading official document: "${item.title}" (${item.fileSize} ${item.type})`);
  };

  return (
    <section id="academics" style={{ padding: '80px 6%', background: 'var(--bg-secondary)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <GraduationCap size={16} /> ACADEMIC & RESOURCE HUB
          </span>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--text-primary)', marginTop: '12px', fontWeight: 800 }}>
            Sheba Academic Ecosystem & Resources
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '12px auto 0 auto', fontSize: '1rem' }}>
            Explore accredited B.Sc/B.A degree programs, Sheba Academy (KG-12), TVET skills, academic leadership, and downloadable handbooks.
          </p>

          <div style={{
            display: 'inline-flex',
            gap: '6px',
            background: 'var(--bg-card)',
            padding: '6px',
            borderRadius: '40px',
            border: '1px solid var(--border-color)',
            marginTop: '28px',
            boxShadow: 'var(--shadow-subtle)',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setHubTab('programs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '30px',
                border: 'none',
                background: hubTab === 'programs' ? 'var(--navy-deep)' : 'transparent',
                color: hubTab === 'programs' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: hubTab === 'programs' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <GraduationCap size={18} style={{ color: hubTab === 'programs' ? 'var(--gold-main)' : 'inherit' }} />
              Academic Programs
            </button>

            <button
              onClick={() => setHubTab('faculty')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '30px',
                border: 'none',
                background: hubTab === 'faculty' ? 'var(--navy-deep)' : 'transparent',
                color: hubTab === 'faculty' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: hubTab === 'faculty' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Users size={18} style={{ color: hubTab === 'faculty' ? 'var(--gold-main)' : 'inherit' }} />
              Faculty & Leadership
            </button>

            <button
              onClick={() => setHubTab('downloads')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '30px',
                border: 'none',
                background: hubTab === 'downloads' ? 'var(--navy-deep)' : 'transparent',
                color: hubTab === 'downloads' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: hubTab === 'downloads' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FileText size={18} style={{ color: hubTab === 'downloads' ? 'var(--gold-main)' : 'inherit' }} />
              Official Downloads
            </button>
          </div>
        </div>

        {hubTab === 'programs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Programs' },
                { id: 'degrees', label: 'UG Degrees' },
                { id: 'academy', label: 'Sheba Academy (KG-12)' },
                { id: 'tvet', label: 'TVET Skill Certificates' },
                { id: 'postgraduate', label: 'Postgraduate (Master\'s)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProgramFilter(tab.id)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    border: programFilter === tab.id ? '1px solid var(--gold-main)' : '1px solid var(--border-color)',
                    background: programFilter === tab.id ? 'var(--gold-soft)' : 'var(--bg-card)',
                    color: programFilter === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: programFilter === tab.id ? 700 : 500,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '24px' }}>
              {filteredPrograms.map((program) => (
                <div
                  key={program.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-subtle)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span className="aau-badge-pill">
                        {program.categoryLabel}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {program.duration}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px', lineHeight: '1.35' }}>
                      {program.title}
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--navy-light)', fontWeight: 600, marginBottom: '12px' }}>
                      {program.department}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                      {program.description}
                    </p>
                  </div>

                  <div>
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px', display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleProgramClick(program)}
                        className="btn-institutional-outline"
                        style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem', justifyContent: 'center' }}
                      >
                        Curriculum & Details <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => openModal('applyModal')}
                        className="btn-institutional-gold"
                        style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hubTab === 'faculty' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {facultyMembers.map((member) => (
              <div
                key={member.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                  <img
                    src={member.image}
                    alt={member.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(7, 24, 45, 0.9), transparent)',
                    padding: '20px 16px 12px 16px'
                  }}>
                    <span style={{ color: 'var(--gold-main)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {member.department}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '4px' }}>
                      {member.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--navy-light)', fontWeight: 600, marginBottom: '12px' }}>
                      {member.role}
                    </p>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.55', marginBottom: '16px' }}>
                      {member.bio}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <a
                      href={`mailto:${member.email}`}
                      style={{ fontSize: '0.82rem', color: 'var(--navy-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    >
                      <Mail size={14} /> {member.email.split('@')[0]}
                    </a>
                    {member.name.includes('Surafel') && (
                      <button
                        onClick={() => openModal('bioModal')}
                        style={{
                          background: 'var(--navy-deep)',
                          color: 'var(--gold-main)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Full Bio
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hubTab === 'downloads' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {downloadsList.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  boxShadow: 'var(--shadow-subtle)'
                }}
              >
                <div style={{
                  background: 'var(--navy-deep)',
                  color: 'var(--gold-main)',
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: 800
                }}>
                  <FileText size={24} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-light)', textTransform: 'uppercase' }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: 'var(--gold-soft)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      {item.type} ({item.fileSize})
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
                    {item.description}
                  </p>

                  <button
                    onClick={() => handleDownload(item)}
                    className="btn-institutional-gold"
                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                  >
                    <Download size={14} /> Download Document
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
