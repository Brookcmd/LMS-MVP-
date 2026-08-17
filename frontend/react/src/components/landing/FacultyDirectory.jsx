import React from 'react';
import { Users, Mail } from 'lucide-react';
import { facultyMembers } from '../../data/universityData';

export function FacultyDirectory({ openModal }) {
  return (
    <section id="faculty" style={{ padding: '80px 6%', background: 'var(--bg-secondary)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} /> ACADEMIC LEADERSHIP & FACULTY
          </span>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--text-primary)', marginTop: '12px', fontWeight: 800 }}>
            Our Distinguished Deans & Educators
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '12px auto 0 auto', fontSize: '1rem' }}>
            Led by founder Surafel Berhe Woldu, our experienced academic faculty brings high research standards, clinical expertise, and dedication to youth education in Mekelle and Tigray.
          </p>
        </div>

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
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
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
                  background: 'linear-gradient(to top, rgba(10, 25, 47, 0.9), transparent)',
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
      </div>
    </section>
  );
}
