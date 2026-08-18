import React from 'react'
import { GRADE_BANDS } from '../utils/gradeBands'

export default function GradeBandTabs({ activeBand = 'all', onSelectBand, counts = {} }) {
  return (
    <div className="grade-band-tabs" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '4px',
      marginBottom: '16px',
    }}>
      {GRADE_BANDS.map((band) => {
        const isActive = activeBand === band.id
        const count = counts[band.id]

        return (
          <button
            key={band.id}
            type="button"
            onClick={() => onSelectBand(band.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: isActive ? '1.5px solid var(--navy-primary, #0f2744)' : '1px solid var(--border-color, #e2e8f0)',
              background: isActive ? 'var(--navy-primary, #0f2744)' : 'var(--bg-surface, #ffffff)',
              color: isActive ? '#ffffff' : 'var(--text-primary, #0f172a)',
              fontSize: '0.85rem',
              fontWeight: isActive ? '600' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 2px 6px rgba(15, 39, 68, 0.15)' : 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: isActive ? '#93C5FD' : 'inherit' }}>
              {band.icon}
            </span>
            <span>{band.shortLabel || band.label}</span>
            {count !== undefined && (
              <span style={{
                fontSize: '0.75rem',
                padding: '2px 6px',
                borderRadius: '10px',
                background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--bg-primary, #f1f5f9)',
                color: isActive ? '#ffffff' : 'var(--text-secondary, #64748b)',
                fontWeight: '600',
              }}>
                {count.toLocaleString()}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
