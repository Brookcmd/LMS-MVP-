import React from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Notifications from './pages/Notifications'
import TeacherAttendance from './pages/TeacherAttendance'
import ParentAttendance from './pages/ParentAttendance'
import ParentDashboard from './pages/ParentDashboard'

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
    <div className="container">
      <h2>Sign in</h2>
      <form onSubmit={submit} className="card">
        <label>
          School ID
          <input value={schoolId} onChange={e => setSchoolId(e.target.value)} placeholder="1" />
        </label>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@example.com" />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        </label>
        {error && <div className="error">{error}</div>}
        <div><button type="submit">Sign in</button></div>
      </form>
    </div>
  )
}

function AppContent(){
  const { user, logout } = useAuth()

  return (
    <>
      <div className="topbar container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <nav style={{display:'flex',gap:12}}>
          <Link to="/">Dashboard</Link>
          <Link to="/notifications">Notifications</Link>
          <Link to="/attendance">Attendance</Link>
          <Link to="/teacher">Teacher</Link>
        </nav>
        <div>
          {user ? (
            <button onClick={logout}>Sign out</button>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
        </div>
      </div>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/" element={<PrivateRoute><ParentDashboard/></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute roles={["parent"]}><Notifications/></PrivateRoute>} />
        <Route path="/attendance" element={<PrivateRoute roles={["parent"]}><ParentAttendance/></PrivateRoute>} />
        <Route path="/teacher" element={<PrivateRoute roles={["teacher"]}><TeacherAttendance/></PrivateRoute>} />
      </Routes>
    </>
  )
}

export default function App(){
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
