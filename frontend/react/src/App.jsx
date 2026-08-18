import React from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { ToastContainer } from './components/Toast'
import Notifications from './pages/Notifications'
import TeacherAttendance from './pages/TeacherAttendance'
import ParentAttendance from './pages/ParentAttendance'
import ParentDashboard from './pages/ParentDashboard'
import StudentDashboard from './pages/StudentDashboard'
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
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminMaterials from './pages/admin/AdminMaterials'
import CourseMaterials from './pages/CourseMaterials'
import LandingPage from './pages/LandingPage'
import NotFound from './pages/NotFound'
import Messages from './pages/Messages'
import BottomNav from './components/BottomNav'
import logoDark from './assets/SUC_Logo_dark.png'
import logoLight from './assets/SUC_Logo_light.png'

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
  if (user?.role === 'student') return <StudentDashboard />

  return <ParentDashboard />
}

function Login() {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  async function submit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await login({ email, password })
      navigate(user?.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-visual-panel" aria-label="Sheba University College and Academy Overview">
        <div className="login-wordmark">
          <img src={logoDark} alt="" aria-hidden="true" />
          <span>Sheba University College</span>
        </div>

        <div className="login-visual-center">
          <span className="login-tag">Official Academic Portal</span>
          <h2>Empowering Academic Excellence & Student Success</h2>
          <p>
            Seamless digital learning management, real-time attendance tracking, grade analytics, and direct institutional communication.
          </p>

          <div className="login-badge-row">
            <span className="login-tag">Parent Portal</span>
            <span className="login-tag">Teacher Hub</span>
            <span className="login-tag">Student Console</span>
          </div>
        </div>

        <div className="login-visual-footer">
          © {new Date().getFullYear()} Sheba University College & Sheba Academy. All rights reserved.
        </div>
      </section>

      <section className="login-form-panel" aria-labelledby="login-title">
        <div className="login-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button 
              type="button" 
              className="icon-button" 
              onClick={() => navigate('/')} 
              title="Return to Public Homepage"
              style={{ width: '36px', height: '36px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            </button>
            <button 
              type="button" 
              className="icon-button" 
              onClick={toggleTheme} 
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ width: '36px', height: '36px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>

          <div className="login-card-head">
            <h1 id="login-title">Portal Sign In</h1>
            <p>Enter your institutional credentials to access your account</p>
          </div>

          {error && (
            <div className="login-error-banner" role="alert">
              <span className="material-symbols-outlined">report</span>
              <div>
                <strong>Authentication failed</strong>
                <p style={{ margin: '2px 0 0' }}>{error}</p>
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
                  placeholder="name@school.edu"
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
                    placeholder="••••••••"
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
              {submitting ? 'Signing in…' : 'Sign in to Portal'}
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
              Quick Demo Persona Fill
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-ghost" 
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => { setEmail('nathan.worku@student.sheba.edu'); setPassword('Student@123') }}
              >
                Student
              </button>
              <button 
                type="button" 
                className="btn-ghost" 
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => { setEmail('workuabebe@parent.com'); setPassword('Parent@123') }}
              >
                Parent
              </button>
              <button 
                type="button" 
                className="btn-ghost" 
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => { setEmail('alembekele@school.edu'); setPassword('Teacher@123') }}
              >
                Teacher
              </button>
              <button 
                type="button" 
                className="btn-ghost" 
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => { setEmail('admin@testschool.com'); setPassword('Admin@123') }}
              >
                Admin
              </button>
            </div>
          </div>

          <div className="login-links" aria-label="Account help">
            <button type="button" onClick={() => setError('Password reset is managed by school administrators. Please contact your campus IT desk.')}>
              Forgot password?
            </button>
            <span>
              Need access?{' '}
              <button type="button" onClick={() => setError('Student, teacher, and parent accounts are issued directly by the school registrar.')}>
                Contact Admin
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
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'
  const isLoginRoute = location.pathname === '/login'
  const isLandingRoute = location.pathname === '/' && !user

  const KNOWN_ROUTES = [
    '/',
    '/login',
    '/notifications',
    '/messages',
    '/materials',
    '/attendance',
    '/teacher',
    '/teacher/grades',
    '/teacher/deadlines',
    '/teacher/schedule',
    '/grades',
    '/deadlines',
    '/schedule',
    '/profile',
  ]
  const isKnownRoute = KNOWN_ROUTES.includes(location.pathname) || location.pathname.startsWith('/admin')
  const isNotFoundRoute = !isKnownRoute

  const roleLabels = {
    parent: 'Parent Portal',
    teacher: 'Teacher Hub',
    student: 'Student Console',
    admin: 'Admin Console',
  }

  return (
    <div className={`app-shell${isAdmin ? ' app-shell-admin' : ''}${isLoginRoute ? ' app-shell-login' : ''}${isLandingRoute ? ' app-shell-landing' : ''}${isNotFoundRoute ? ' app-shell-notfound' : ''}`}>
      {user && !isAdmin && !isNotFoundRoute && (
        <header className="topbar">
          <div className="brand" onClick={() => navigate('/')}>
            <img className="brand-logo" src={theme === 'dark' ? logoDark : logoLight} alt="" aria-hidden="true" />
            <div>
              <div className="brand-title">
                Sheba Estudent
                <span className="role-badge">{roleLabels[user.role] || user.role}</span>
              </div>
            </div>
          </div>
          <div className="actions">
            <button 
              className="icon-button" 
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              onClick={toggleTheme}
            >
              <span className="material-symbols-outlined">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            {(user.role === 'parent' || user.role === 'teacher' || user.role === 'student') && (
              <button className="icon-button" title="Notifications" onClick={() => navigate('/notifications')}>
                <span className="material-symbols-outlined">notifications</span>
              </button>
            )}
            <button 
              type="button" 
              className="icon-button" 
              title="My Account Profile" 
              onClick={() => navigate('/profile')}
              style={{ padding: '2px' }}
            >
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                <span className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </span>
              )}
            </button>
            <button className="icon-button" title="Sign out" onClick={logout}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>
      )}

      <main className={`content${isAdmin ? ' content-admin' : ''}${isLoginRoute ? ' content-login' : ''}${isLandingRoute ? ' content-landing' : ''}${isNotFoundRoute ? ' content-notfound' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={user ? <HomeRedirect /> : <LandingPage />} />
          <Route path="/notifications" element={<PrivateRoute roles={['parent', 'teacher', 'student']}><Notifications /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute roles={['parent', 'teacher']}><Messages /></PrivateRoute>} />
          <Route path="/materials" element={<PrivateRoute roles={['parent', 'teacher', 'student', 'admin']}><CourseMaterials /></PrivateRoute>} />
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
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="materials" element={<AdminMaterials />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="parents" element={<AdminParents />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="parent-links" element={<AdminParentLinks />} />
          </Route>
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {user && !isAdmin && !isNotFoundRoute && <BottomNav />}
      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
