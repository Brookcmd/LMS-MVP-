import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

const NAV_ITEMS = [
  { to: '/admin', end: true, icon: 'dashboard', label: 'Dashboard' },
  { to: '/admin/classes', icon: 'school', label: 'Classes' },
  { to: '/admin/students', icon: 'person', label: 'Students' },
  { to: '/admin/teachers', icon: 'group', label: 'Teachers' },
  { to: '/admin/parents', icon: 'family_restroom', label: 'Parents' },
  { to: '/admin/subjects', icon: 'book', label: 'Subjects' },
  { to: '/admin/parent-links', icon: 'link', label: 'Parent Links' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = React.useState('')
  const adminName = user?.name || user?.email || 'Admin User'

  function handleSearch(event) {
    event.preventDefault()
    const query = search.trim().toLowerCase()
    if (!query) return

    if (query.includes('student')) navigate('/admin/students')
    else if (query.includes('teacher')) navigate('/admin/teachers')
    else if (query.includes('parent')) navigate('/admin/parents')
    else if (query.includes('class')) navigate('/admin/classes')
    else if (query.includes('subject') || query.includes('assignment')) navigate('/admin/subjects')
    else navigate('/admin/students')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <h1>Sheba Estudent</h1>
            <p>Admin Portal</p>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
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
          <form className="admin-search-box" onSubmit={handleSearch}>
            <span className="material-symbols-outlined">search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students, teachers, classes..."
            />
          </form>
          <div className="admin-topbar-actions">
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
