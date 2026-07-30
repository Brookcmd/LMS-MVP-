import React from 'react'
import { Link } from 'react-router-dom'
import { listClasses, listStudents, listSubjects, listTeachers } from '../../api/apiClient'

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
  const [stats, setStats] = React.useState({ classes: 0, students: 0, teachers: 0, subjects: 0 })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [classes, students, teachers, subjects] = await Promise.all([
          listClasses(),
          listStudents(),
          listTeachers(),
          listSubjects(),
        ])

        if (!active) return
        setStats({
          classes: classes?.length ?? 0,
          students: students?.length ?? 0,
          teachers: teachers?.length ?? 0,
          subjects: subjects?.length ?? 0,
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
    <>
      <section className="admin-hero">
        <div>
          <span className="admin-kicker">System Overview</span>
          <h2>Admin control center</h2>
          <p>Manage classes, students, teachers, subjects, and parent links from one place.</p>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading dashboard…</div>
      ) : (
        <>
          <div className="admin-stats-grid">
            <StatCard title="Total Classes" value={stats.classes} accent="accent-blue" icon="school" />
            <StatCard title="Total Students" value={stats.students} accent="accent-green" icon="person" />
            <StatCard title="Total Teachers" value={stats.teachers} accent="accent-indigo" icon="group" />
            <StatCard title="Active Subjects" value={stats.subjects} accent="accent-purple" icon="book" />
          </div>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <h3>Quick Actions</h3>
            </div>
            <div className="admin-quick-actions">
              <Link to="/admin/students" className="admin-quick-action">
                <span className="material-symbols-outlined">person_add</span>
                Add Student
              </Link>
              <Link to="/admin/teachers" className="admin-quick-action">
                <span className="material-symbols-outlined">group_add</span>
                Add Teacher
              </Link>
              <Link to="/admin/parents" className="admin-quick-action">
                <span className="material-symbols-outlined">family_restroom</span>
                Add Parent
              </Link>
              <Link to="/admin/classes" className="admin-quick-action">
                <span className="material-symbols-outlined">add</span>
                Add Class
              </Link>
              <Link to="/admin/subjects" className="admin-quick-action">
                <span className="material-symbols-outlined">menu_book</span>
                Manage Subjects
              </Link>
              <Link to="/admin/parent-links" className="admin-quick-action">
                <span className="material-symbols-outlined">link</span>
                Link Parent
              </Link>
            </div>
          </section>

          <section className="admin-panel admin-panel-muted">
            <div className="admin-panel-head">
              <h3>Coming soon</h3>
            </div>
            <p className="admin-muted-copy">
              Live class monitoring, activity feeds, and analytics are planned for a later phase.
            </p>
          </section>
        </>
      )}
    </>
  )
}
