import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const parentItems = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/messages', label: 'Messages', icon: 'chat' },
  { to: '/schedule', label: 'Schedule', icon: 'calendar_view_week' },
  { to: '/deadlines', label: 'Deadlines', icon: 'event' },
  { to: '/attendance', label: 'Attendance', icon: 'calendar_month' },
  { to: '/grades', label: 'Grades', icon: 'school' },
  { to: '/notifications', label: 'Alerts', icon: 'notifications' },
  { to: '/profile', label: 'Profile', icon: 'person' },
]

const teacherItems = [
  { to: '/teacher', label: 'Attendance', icon: 'checklist' },
  { to: '/messages', label: 'Messages', icon: 'chat' },
  { to: '/teacher/grades', label: 'Grades', icon: 'school' },
  { to: '/teacher/deadlines', label: 'Deadlines', icon: 'event' },
  { to: '/teacher/schedule', label: 'Schedule', icon: 'calendar_view_week' },
  { to: '/profile', label: 'Profile', icon: 'person' },
]

const studentItems = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/schedule', label: 'Schedule', icon: 'calendar_view_week' },
  { to: '/deadlines', label: 'Deadlines', icon: 'event' },
  { to: '/attendance', label: 'Attendance', icon: 'calendar_month' },
  { to: '/grades', label: 'Grades', icon: 'school' },
  { to: '/notifications', label: 'Alerts', icon: 'notifications' },
  { to: '/profile', label: 'Profile', icon: 'person' },
]

const defaultItems = [
  { to: '/profile', label: 'Profile', icon: 'person' },
]

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const items = user?.role === 'parent' ? parentItems : user?.role === 'teacher' ? teacherItems : user?.role === 'student' ? studentItems : defaultItems

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
