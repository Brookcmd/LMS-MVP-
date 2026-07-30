import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Notifications from './pages/Notifications'
import TeacherAttendance from './pages/TeacherAttendance'
import ParentAttendance from './pages/ParentAttendance'
import ParentDashboard from './pages/ParentDashboard'
import Profile from './pages/Profile'
import TeacherGrades from './pages/TeacherGrades'
import ParentGrades from './pages/ParentGrades'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminParents from './pages/admin/AdminParents'
import AdminClasses from './pages/admin/AdminClasses'
import AdminSubjects from './pages/admin/AdminSubjects'
import AdminParentLinks from './pages/admin/AdminParentLinks'
import BottomNav from './components/BottomNav'

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <div className="container"><p>Forbidden</p></div>
  return children
}

function HomeRedirect() {
  const { user } = useAuth()

  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />

  return <ParentDashboard />
}

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [schoolId, setSchoolId] = React.useState('1')
  const [error, setError] = React.useState(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  async function submit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await login({ email, password, schoolId })
      navigate(user?.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <header className="login-brand">
        <div className="login-brand-mark">
          <span className="material-symbols-outlined">school</span>
        </div>
        <div>
          <h1>Sheba Estudent</h1>
          <p>School Management Suite</p>
        </div>
      </header>

      <main className="login-card-wrap">
        <div className="login-card">
          <div className="login-card-accent" />
          <div className="login-card-head">
            <h2>Sign in</h2>
            <p>Enter your school ID, email, and password to access the portal.</p>
          </div>

          {error && (
            <div className="login-error-banner" role="alert">
              <span className="material-symbols-outlined">report</span>
              <div>
                <strong>Authentication failed</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form className="login-form" onSubmit={submit}>
            <label className="login-label">
              School ID
              <div className="login-input-wrap">
                <span className="material-symbols-outlined">hub</span>
                <input
                  value={schoolId}
                  onChange={(event) => setSchoolId(event.target.value)}
                  placeholder="1"
                  required
                />
              </div>
            </label>

            <label className="login-label">
              Email address
              <div className="login-input-wrap">
                <span className="material-symbols-outlined">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@school.edu"
                  required
                />
              </div>
            </label>

            <label className="login-label">
              Password
              <div className="login-input-wrap">
                <span className="material-symbols-outlined">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </label>

            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

function AppContent() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  return (
    <div className={`app-shell${isAdmin ? ' app-shell-admin' : ''}`}>
      {user && !isAdmin && (
        <header className="topbar">
          <div className="brand">
            <span className="material-symbols-outlined icon">school</span>
            <div>
              <div className="subtitle">Sheba Estudent</div>
            </div>
          </div>
          <div className="actions">
            {user.role === 'parent' && (
              <button className="icon-button" title="Notifications" onClick={() => navigate('/notifications')}>
                <span className="material-symbols-outlined">notifications</span>
              </button>
            )}
            <button className="icon-button" title="Sign out" onClick={logout}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>
      )}

      <main className={`content${isAdmin ? ' content-admin' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><HomeRedirect /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute roles={['parent']}><Notifications /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute roles={['parent']}><ParentAttendance /></PrivateRoute>} />
          <Route path="/teacher" element={<PrivateRoute roles={['teacher']}><TeacherAttendance /></PrivateRoute>} />
          <Route path="/teacher/grades" element={<PrivateRoute roles={['teacher']}><TeacherGrades /></PrivateRoute>} />
          <Route path="/grades" element={<PrivateRoute roles={['parent']}><ParentGrades /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminLayout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="parents" element={<AdminParents />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="parent-links" element={<AdminParentLinks />} />
          </Route>
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
        </Routes>
      </main>

      {user && !isAdmin && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
