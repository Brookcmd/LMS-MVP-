import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../context/ThemeContext'
import logoDark from '../assets/SUC_Logo_dark.png'
import logoLight from '../assets/SUC_Logo_light.png'

export default function NotFound() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  function getHomeDestination() {
    if (!user) return '/'
    if (user.role === 'admin') return '/admin'
    return '/'
  }

  return (
    <div className="notfound-shell">
      <div className="notfound-topbar">
        <div className="notfound-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={theme === 'dark' ? logoDark : logoLight} alt="Sheba University College" />
          <span>Sheba University College</span>
        </div>
        <button 
          type="button" 
          className="icon-button" 
          onClick={toggleTheme} 
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span className="material-symbols-outlined">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>

      <div className="notfound-content">
        <div className="notfound-card">
          <div className="notfound-badge">
            <span className="material-symbols-outlined">error_outline</span>
            Error 404
          </div>

          <h1 className="notfound-code">404</h1>
          <h2 className="notfound-title">Page Not Found</h2>
          <p className="notfound-desc">
            The page or institutional resource you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <div className="notfound-actions">
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => navigate(getHomeDestination())}
            >
              <span className="material-symbols-outlined">home</span>
              {user ? 'Return to Portal' : 'Return to Homepage'}
            </button>

            {!user && (
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigate('/login')}
              >
                <span className="material-symbols-outlined">login</span>
                Sign In
              </button>
            )}

            <button 
              type="button" 
              className="btn-ghost" 
              onClick={() => window.history.back()}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Go Back
            </button>
          </div>
        </div>
      </div>

      <footer className="notfound-footer">
        © {new Date().getFullYear()} Sheba University College & Sheba Academy LMS. All rights reserved.
      </footer>
    </div>
  )
}
