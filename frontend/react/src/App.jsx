import React from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Notifications from './pages/Notifications'
import TeacherAttendance from './pages/TeacherAttendance'
import ParentAttendance from './pages/ParentAttendance'
import ParentDashboard from './pages/ParentDashboard'
import Profile from './pages/Profile'
import TeacherGrades from './pages/TeacherGrades'
import ParentGrades from './pages/ParentGrades'
import TeacherDeadlines from './pages/TeacherDeadlines'
import ParentDeadlines from './pages/ParentDeadlines'
import TeacherSchedule from './pages/TeacherSchedule'
import ParentSchedule from './pages/ParentSchedule'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminParents from './pages/admin/AdminParents'
import AdminClasses from './pages/admin/AdminClasses'
import AdminSchedule from './pages/admin/AdminSchedule'
import AdminSubjects from './pages/admin/AdminSubjects'
import AdminParentLinks from './pages/admin/AdminParentLinks'
import LandingPage from './pages/LandingPage'
import Messages from './pages/Messages'
import BottomNav from './components/BottomNav'
import logo from './assets/sheba-logo.png'

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
  const [schoolId] = React.useState('12')
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
      <section className="login-visual-panel" aria-label="Sheba Estudent learning illustration">
        <div className="login-wordmark">
          <img src={logo} alt="" aria-hidden="true" />
          <span>Sheba Estudent</span>
        </div>
        <div className="login-stars" aria-hidden="true">
          {Array.from({ length: 22 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
        <div className="login-space-art" aria-hidden="true">
          <div className="login-earth">
            <span className="continent continent-one" />
            <span className="continent continent-two" />
            <span className="continent continent-three" />
            <span className="continent continent-four" />
          </div>
          <div className="login-formula formula-y">y?</div>
          <div className="login-formula formula-v">v ~= sqrt(GM/r)</div>
          <div className="login-satellite">
            <span className="satellite-body" />
            <span className="satellite-wing wing-left" />
            <span className="satellite-wing wing-right" />
            <span className="satellite-signal" />
          </div>
        </div>
        <p className="login-tagline">The smarter way to manage school learning.</p>
      </section>

      <section className="login-form-panel" aria-labelledby="login-title">
        <div className="login-card">
          <div className="login-card-head">
            <h1 id="login-title">Log In</h1>
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
            <fieldset>
              <legend className="sr-only">Account details</legend>

              <label className="login-label" htmlFor="login-email">
                <span>Email address</span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@school.edu"
                  required
                />
              </label>

              <label className="login-label" htmlFor="login-password">
                <span>Password</span>
                <div className="login-password-field">
                  <input
                    id="login-password"
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
            </fieldset>

            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="login-links" aria-label="Account help">
            <button type="button" onClick={() => setError('Password reset is not available yet. Please contact your school admin.')}>
              Reset password
            </button>
            <span>
              New user?{' '}
              <button type="button" onClick={() => setError('New accounts are created by your school admin.')}>
                Sign up
              </button>
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

function AppContent() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'
  const isLoginRoute = location.pathname === '/login'
  const isLandingRoute = location.pathname === '/' && !user

  return (
    <div className={`app-shell${isAdmin ? ' app-shell-admin' : ''}${isLoginRoute ? ' app-shell-login' : ''}${isLandingRoute ? ' app-shell-landing' : ''}`}>
      {user && !isAdmin && (
        <header className="topbar">
          <div className="brand">
            <img className="brand-logo" src={logo} alt="" aria-hidden="true" />
            <div>
              <div className="subtitle">Sheba Estudent</div>
            </div>
          </div>
          <div className="actions">
            {(user.role === 'parent' || user.role === 'teacher' || user.role === 'student') && (
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

      <main className={`content${isAdmin ? ' content-admin' : ''}${isLoginRoute ? ' content-login' : ''}${isLandingRoute ? ' content-landing' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={user ? <HomeRedirect /> : <LandingPage />} />
          <Route path="/notifications" element={<PrivateRoute roles={['parent', 'teacher', 'student']}><Notifications /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute roles={['parent', 'teacher']}><Messages /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute roles={['parent', 'student']}><ParentAttendance /></PrivateRoute>} />
          <Route path="/teacher" element={<PrivateRoute roles={['teacher']}><TeacherAttendance /></PrivateRoute>} />
          <Route path="/teacher/grades" element={<PrivateRoute roles={['teacher']}><TeacherGrades /></PrivateRoute>} />
          <Route path="/teacher/deadlines" element={<PrivateRoute roles={['teacher']}><TeacherDeadlines /></PrivateRoute>} />
          <Route path="/teacher/schedule" element={<PrivateRoute roles={['teacher']}><TeacherSchedule /></PrivateRoute>} />
          <Route path="/grades" element={<PrivateRoute roles={['parent', 'student']}><ParentGrades /></PrivateRoute>} />
          <Route path="/deadlines" element={<PrivateRoute roles={['parent', 'student']}><ParentDeadlines /></PrivateRoute>} />
          <Route path="/schedule" element={<PrivateRoute roles={['parent', 'student']}><ParentSchedule /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminLayout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="parents" element={<AdminParents />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="parent-links" element={<AdminParentLinks />} />
          </Route>
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
