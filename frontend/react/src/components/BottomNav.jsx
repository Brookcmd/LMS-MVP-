import { Link, useLocation } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/attendance', label: 'Events', icon: 'calendar_month' },
  { to: '/notifications', label: 'Alerts', icon: 'notifications' },
  { to: '/profile', label: 'Profile', icon: 'person' },
]

export default function BottomNav() {
  const location = useLocation()
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
