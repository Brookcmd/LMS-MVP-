import React from 'react'

export default function AdminModal({ open, title, subtitle, onClose, children, wide }) {
  if (!open) return null

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className={`admin-modal${wide ? ' admin-modal-wide' : ''}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
      >
        <div className="admin-modal-head">
          <div>
            <h3 id="admin-modal-title">{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  )
}
