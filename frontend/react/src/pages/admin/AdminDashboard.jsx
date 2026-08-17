import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listClasses, listStudents, listSubjects, listTeachers, listParents } from '../../api/apiClient'
import { StatsSkeleton } from '../../components/SkeletonLoader'

function StatCard({ title, value, accent, icon }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-head">
        <div className={`admin-stat-icon ${accent}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div className="admin-stat-body">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ classes: 0, students: 0, teachers: 0, subjects: 0, parents: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [classes, students, teachers, subjects, parents] = await Promise.all([
          listClasses().catch(() => []),
          listStudents().catch(() => []),
          listTeachers().catch(() => []),
          listSubjects().catch(() => []),
          listParents().catch(() => []),
        ])

        if (!active) return
        setStats({
          classes: classes?.length ?? 0,
          students: students?.length ?? 0,
          teachers: teachers?.length ?? 0,
          subjects: subjects?.length ?? 0,
          parents: parents?.length ?? 0,
        })
      } catch (err) {
        if (active) setError(err?.message ?? 'Unable to load dashboard data')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  return (
    <div>
      <section className="academic-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="academic-hero-top">
          <span className="academic-hero-kicker">Sheba University College • Institutional Registrar</span>
          <span className="academic-hero-date">Campus Super Admin</span>
        </div>
        <h1 className="academic-hero-title">
          Administrative Command Center
        </h1>
        <p className="academic-hero-subtitle">
          Manage classes, faculty assignments, student rosters, timetable schedules, and parent records from one centralized portal.
        </p>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <StatsSkeleton count={4} />
      ) : (
        <>
          <div className="admin-stats-grid">
            <StatCard title="Active Classes" value={stats.classes} accent="accent-blue" icon="school" />
            <StatCard title="Enrolled Students" value={stats.students} accent="accent-green" icon="person" />
            <StatCard title="Faculty Teachers" value={stats.teachers} accent="accent-indigo" icon="group" />
            <StatCard title="Registered Parents" value={stats.parents} accent="accent-purple" icon="family_restroom" />
            <StatCard title="Curriculum Subjects" value={stats.subjects} accent="accent-blue" icon="menu_book" />
          </div>

          {/* Quick Navigation Panels */}
          <section className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span className="subtitle">School Management</span>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.2rem', color: 'var(--text-heading)' }}>
                  Administrative Quick Actions
                </h3>
              </div>
            </div>

            <div className="admin-quick-actions">
              <Link to="/admin/analytics" className="admin-quick-action" style={{ background: 'var(--brand-navy-primary)', color: '#FFFFFF' }}>
                <span className="material-symbols-outlined">analytics</span>
                Analytics Radar
              </Link>
              <Link to="/admin/students" className="admin-quick-action">
                <span className="material-symbols-outlined">person_add</span>
                Manage Students
              </Link>
              <Link to="/admin/teachers" className="admin-quick-action">
                <span className="material-symbols-outlined">group_add</span>
                Manage Faculty
              </Link>
              <Link to="/admin/parents" className="admin-quick-action">
                <span className="material-symbols-outlined">family_restroom</span>
                Manage Parents
              </Link>
              <Link to="/admin/classes" className="admin-quick-action">
                <span className="material-symbols-outlined">domain_add</span>
                Manage Classes
              </Link>
              <Link to="/admin/schedule" className="admin-quick-action">
                <span className="material-symbols-outlined">calendar_month</span>
                Manage Schedule
              </Link>
              <Link to="/admin/subjects" className="admin-quick-action">
                <span className="material-symbols-outlined">auto_stories</span>
                Curriculum Subjects
              </Link>
            </div>
          </section>

          {/* Institutional Status Deck */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <Link to="/admin/analytics" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ padding: '20px', cursor: 'pointer', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--brand-navy-light)', fontSize: '24px' }}>
                    bar_chart
                  </span>
                  <h4 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    Executive Analytics Console
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Real-time intelligence on campus attendance rates, score distribution histograms, subject benchmarks, and early warning risk monitoring.
                </p>
              </div>
            </Link>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--status-present-text)', fontSize: '24px' }}>
                  check_circle
                </span>
                <h4 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Database Engine & Auth
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                PostgreSQL and Prisma ORM are synchronized. JWT token verification and role guards are actively enforced across all routes.
              </p>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--gold-accent)', fontSize: '24px' }}>
                  schedule
                </span>
                <h4 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Academic Term Status
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Academic Year 2025/2026 • Semester II is ongoing. Attendance, quarterly grades, and timetable schedules are active.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
