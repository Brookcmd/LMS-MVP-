import React from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Notifications from './pages/Notifications'
import TeacherAttendance from './pages/TeacherAttendance'
import ParentAttendance from './pages/ParentAttendance'
import ParentDashboard from './pages/ParentDashboard'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <div className="container"><p>Forbidden</p></div>
  return children
}

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [schoolId, setSchoolId] = React.useState('1')
  const [error, setError] = React.useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    try {
      await login({ email, password, schoolId })
      navigate('/')
    } catch (err) {
      setError(err?.message ?? 'Login failed')
    }
  }

  return (
    <div className="container" style={{ paddingTop: 60 }}>
      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <div className="section-header">
          <div>
            <span className="subtitle">Welcome back</span>
            <h1 className="title">Sign in to RollCall</h1>
          </div>
        </div>
        <div className="section">
          <label className="input-label">
            School ID
            <input className="input-field" value={schoolId} onChange={e => setSchoolId(e.target.value)} placeholder="1" />
          </label>
          <label className="input-label">
            Email
            <input className="input-field" value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@example.com" />
          </label>
          <label className="input-label">
            Password
            <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          </label>
          {error && <div className="error" style={{ color: '#ba1a1a', marginBottom: 12 }}>{error}</div>}
          <button className="btn-primary" type="submit" style={{ width: '100%', marginTop: 8 }} onClick={submit}>Sign in</button>
        </div>
      </div>
    </div>
  )
}

function AppContent(){
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="app-shell">
      {user && (
        <header className="topbar">
          <div className="brand">
            <span className="material-symbols-outlined icon">school</span>
            <div>
              <div className="subtitle">RollCall</div>
            </div>
          </div>
          <div className="actions">
            <button className="icon-button" title="Search">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button className="icon-button" title="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="icon-button" title="Sign out" onClick={logout}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>
      )}

      <main className="content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><ParentDashboard /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute roles={["parent"]}><Notifications /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute roles={["parent"]}><ParentAttendance /></PrivateRoute>} />
          <Route path="/teacher" element={<PrivateRoute roles={["teacher"]}><TeacherAttendance /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
      </main>

      {user && <BottomNav />}
    </div>
  )
}

export default function App(){
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
