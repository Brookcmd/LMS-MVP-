import React from 'react'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Profile() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  if (!user) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Profile information is not available. Please sign in again.</p>
        </div>
      </div>
    )
  }

  const roleDisplay = {
    parent: 'Parent / Guardian',
    teacher: 'Faculty / Teacher',
    student: 'Student Member',
    admin: 'Administrator',
  }[user.role] || user.role

  return (
    <div className="container">
      <div className="section-header">
        <div>
          <span className="subtitle">Official Account</span>
          <h1 className="title">User Profile</h1>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div className="avatar" style={{ width: '60px', height: '60px', fontSize: '24px', background: 'var(--navy-surface)', color: 'var(--navy-primary)', fontWeight: '700' }}>
            {(user.name || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.3rem', color: 'var(--text-heading)' }}>
              {user.name || user.email}
            </h2>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <span className="status-pill present">{roleDisplay}</span>
              <span className="chip">Campus ID #{user.schoolId || '12'}</span>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '0' }}>
          <div className="stat-card">
            <span>Email Address</span>
            <strong style={{ fontSize: '1.05rem', wordBreak: 'break-all', marginTop: '4px' }}>{user.email}</strong>
          </div>
          <div className="stat-card">
            <span>Institutional Role</span>
            <strong style={{ fontSize: '1.05rem', marginTop: '4px' }}>{roleDisplay}</strong>
          </div>
          <div className="stat-card">
            <span>School Reference</span>
            <strong style={{ fontSize: '1.05rem', marginTop: '4px' }}>Sheba University College</strong>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-headline)', fontSize: '1.1rem', color: 'var(--text-heading)' }}>
          Interface Preferences
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Visual Theme</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              Currently set to {theme === 'dark' ? 'Dark Mode (Institutional Navy)' : 'Light Mode (Clean Slate)'}
            </span>
          </div>
          <button type="button" className="btn-secondary" onClick={toggleTheme}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            {theme === 'dark' ? 'Use Light Theme' : 'Use Dark Theme'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button type="button" className="btn-danger" onClick={logout} style={{ minWidth: '140px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          Sign Out of Account
        </button>
      </div>
    </div>
  )
}
