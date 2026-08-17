import React from 'react';
import { Download, FileText } from 'lucide-react';
import { downloadsList } from '../../data/universityData';

export function DownloadsCenter() {
  const handleDownload = (item) => {
    alert(`Downloading official document: "${item.title}" (${item.fileSize} ${item.type})`);
  };

  return (
    <section id="downloads" style={{ padding: '80px 6%', background: 'var(--bg-card)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} /> DOCUMENTS & RESOURCES
          </span>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--text-primary)', marginTop: '12px', fontWeight: 800 }}>
            Official Downloads & Student Resources
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '12px auto 0 auto', fontSize: '1rem' }}>
            Access official academic calendars, application forms, student handbooks, and Sheba Academy enrollment prospectuses in PDF format.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {downloadsList.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                transition: 'all 0.2s ease'
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
                justify: 'center',
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
                  <span style={{ fontSize: '0.75rem', background: 'var(--gold-soft)', color: 'var(--navy-deep)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
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
      </div>
    </section>
  );
}
