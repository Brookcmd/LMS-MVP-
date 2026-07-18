import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const parentItems = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/attendance', label: 'Attendance', icon: 'calendar_month' },
  { to: '/notifications', label: 'Alerts', icon: 'notifications' },
  { to: '/profile', label: 'Profile', icon: 'person' },
]

const teacherItems = [
  { to: '/teacher', label: 'Attendance', icon: 'checklist' },
  { to: '/profile', label: 'Profile', icon: 'person' },
]

const defaultItems = [
  { to: '/profile', label: 'Profile', icon: 'person' },
]

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const items = user?.role === 'parent' ? parentItems : user?.role === 'teacher' ? teacherItems : defaultItems

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <Link key={item.to} to={item.to} className={location.pathname === item.to ? 'active' : ''}>
          <span className="material-symbols-outlined">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
