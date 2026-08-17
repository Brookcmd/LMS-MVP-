import React from 'react'
import { useToast } from '../context/ToastContext'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (!toasts || toasts.length === 0) return null

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  }

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-card toast-${t.type}`} role="status">
          <span className="material-symbols-outlined toast-icon">
            {iconMap[t.type] || 'info'}
          </span>
          <p className="toast-message">{t.message}</p>
          <button 
            type="button" 
            className="toast-close" 
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}
