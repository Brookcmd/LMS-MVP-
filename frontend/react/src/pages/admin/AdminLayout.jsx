import React, { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import logoDark from '../../assets/SUC_Logo_dark.png'

const NAV_ITEMS = [
  { to: '/admin', end: true, icon: 'dashboard', label: 'Dashboard' },
  { to: '/admin/analytics', icon: 'analytics', label: 'Analytics' },
  { to: '/admin/classes', icon: 'school', label: 'Classes' },
  { to: '/admin/schedule', icon: 'calendar_view_week', label: 'Schedule' },
  { to: '/admin/students', icon: 'person', label: 'Students' },
  { to: '/admin/teachers', icon: 'group', label: 'Teachers' },
  { to: '/admin/parents', icon: 'family_restroom', label: 'Parents' },
  { to: '/admin/subjects', icon: 'book', label: 'Subjects' },
  { to: '/admin/parent-links', icon: 'link', label: 'Parent Links' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const adminName = user?.name || user?.email || 'Admin User'

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  function handleSearch(event) {
    event.preventDefault()
    const query = search.trim().toLowerCase()
    if (!query) return

    if (query.includes('analytic') || query.includes('trend') || query.includes('chart') || query.includes('metric') || query.includes('stat')) {
      navigate('/admin/analytics')
    } else if (query.includes('student')) navigate('/admin/students')
    else if (query.includes('teacher')) navigate('/admin/teachers')
    else if (query.includes('parent')) navigate('/admin/parents')
    else if (query.includes('schedule') || query.includes('timetable')) navigate('/admin/schedule')
    else if (query.includes('class')) navigate('/admin/classes')
    else if (query.includes('subject') || query.includes('assignment')) navigate('/admin/subjects')
    else navigate('/admin/students')
  }

  return (
    <div className="admin-shell">
      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div 
          className="admin-drawer-backdrop" 
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside className={`admin-sidebar ${drawerOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <img src={logoDark} alt="" aria-hidden="true" />
          </div>
          <div>
            <h1>Sheba Estudent</h1>
            <p>Admin Portal</p>
          </div>
          {drawerOpen && (
            <button 
              type="button" 
              className="admin-icon-btn" 
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation menu"
              style={{ marginLeft: 'auto', color: '#CBD5E1' }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              onClick={() => setDrawerOpen(false)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-ghost-button" onClick={logout}>
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              type="button" 
              className="admin-mobile-menu-btn" 
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <form className="admin-search-box" onSubmit={handleSearch}>
              <span className="material-symbols-outlined">search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students, teachers, classes..."
              />
            </form>
          </div>

          <div className="admin-topbar-actions">
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
            <div className="admin-user-pill">
              <div>
                <strong>{adminName}</strong>
                <span>Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-page">
          <Outlet context={{ searchQuery: search.trim().toLowerCase() }} />
        </main>
      </div>
    </div>
  )
}
