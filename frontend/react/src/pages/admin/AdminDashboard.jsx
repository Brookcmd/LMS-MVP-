import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listClasses, listStudents, listSubjects, listTeachers, listParents } from '../../api/apiClient'
import { StatsSkeleton } from '../../components/SkeletonLoader'
import { GRADE_BANDS, getGradeBandForClass } from '../../utils/gradeBands'

function StatCard({ title, value, accent, icon }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-head">
        <div className={`admin-stat-icon ${accent}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div className="admin-stat-body">
        <h3>{typeof value === 'number' ? value.toLocaleString() : value}</h3>
        <p>{title}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ classes: 0, students: 0, teachers: 0, subjects: 0, parents: 0 })
  const [bandBreakdown, setBandBreakdown] = useState({ kg: 0, primary: 0, high: 0, prep: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quickSearch, setQuickSearch] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [classesRes, studentsRes, teachersRes, subjectsRes, parentsRes] = await Promise.all([
          listClasses().catch(() => []),
          listStudents({ limit: 1 }).catch(() => ({ total: 0 })),
          listTeachers({ limit: 1 }).catch(() => ({ total: 0 })),
          listSubjects().catch(() => []),
          listParents({ limit: 1 }).catch(() => ({ total: 0 })),
        ])

        if (!active) return

        const classesList = Array.isArray(classesRes) ? classesRes : (classesRes?.items ?? [])
        const studentCount = studentsRes?.total ?? (Array.isArray(studentsRes) ? studentsRes.length : 0)
        const teacherCount = teachersRes?.total ?? (Array.isArray(teachersRes) ? teachersRes.length : 0)
        const parentCount = parentsRes?.total ?? (Array.isArray(parentsRes) ? parentsRes.length : 0)
        const subjectCount = Array.isArray(subjectsRes) ? subjectsRes.length : 0

        // Calculate band breakdown from classes
        const breakdown = { kg: 0, primary: 0, high: 0, prep: 0 }
        classesList.forEach((c) => {
          const band = getGradeBandForClass(c.name)
          if (breakdown[band] !== undefined) breakdown[band]++
        })

        setStats({
          classes: classesList.length,
          students: studentCount,
          teachers: teacherCount,
          subjects: subjectCount,
          parents: parentCount,
        })
        setBandBreakdown(breakdown)
      } catch (err) {
        if (active) setError(err?.message ?? 'Unable to load dashboard data')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  function handleQuickSearch(e) {
    e.preventDefault()
    if (!quickSearch.trim()) return
    navigate(`/admin/students?search=${encodeURIComponent(quickSearch.trim())}`)
  }

  return (
    <div>
      <section className="academic-hero-banner" style={{ marginBottom: '24px' }}>
        <div className="academic-hero-top">
          <span className="academic-hero-kicker">Sheba Academy & University College • Institutional Registrar</span>
          <span className="academic-hero-date">Campus Super Admin</span>
        </div>
        <h1 className="academic-hero-title">
          Administrative Command Center
        </h1>
        <p className="academic-hero-subtitle">
          Managing 15 grade levels, 75 class sections, and {stats.students.toLocaleString()} enrolled students with real-time academic workflows.
        </p>

        {/* Global Jump Search */}
        <form onSubmit={handleQuickSearch} style={{ marginTop: '18px', maxWidth: '540px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', borderRadius: '10px', padding: '4px 12px', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
            <span className="material-symbols-outlined" style={{ color: '#93C5FD', fontSize: '20px', marginRight: '8px' }}>search</span>
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Quick search any student, guardian, or section across campus..."
              style={{
                width: '100%',
                padding: '8px 4px',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: '#FFFFFF',
                fontSize: '0.9rem',
              }}
            />
            <button type="submit" style={{ background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}>
              Search
            </button>
          </div>
        </form>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <StatsSkeleton count={5} />
      ) : (
        <>
          <div className="admin-stats-grid">
            <StatCard title="Enrolled Students" value={stats.students} accent="accent-green" icon="person" />
            <StatCard title="Active Classes" value={stats.classes} accent="accent-blue" icon="school" />
            <StatCard title="Faculty Teachers" value={stats.teachers} accent="accent-indigo" icon="group" />
            <StatCard title="Registered Parents" value={stats.parents} accent="accent-purple" icon="family_restroom" />
            <StatCard title="Curriculum Subjects" value={stats.subjects} accent="accent-blue" icon="menu_book" />
          </div>

          {/* Grade-Band Institutional Breakdown */}
          <section className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="subtitle">Institutional Structure</span>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.15rem', color: 'var(--text-heading)' }}>
                  K-12 Grade-Band Tiers
                </h3>
              </div>
              <Link to="/admin/classes" style={{ fontSize: '0.85rem', color: 'var(--navy-primary)', fontWeight: '600', textDecoration: 'none' }}>
                View all 75 sections →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {GRADE_BANDS.filter(b => b.id !== 'all').map((band) => {
                const sectionCount = bandBreakdown[band.id] ?? 0
                const estimatedStudents = sectionCount * 35

                return (
                  <div
                    key={band.id}
                    className="admin-grade-tier-card"
                    onClick={() => navigate(`/admin/students`)}
                  >
                    <div className="tier-header">
                      <span className="material-symbols-outlined">
                        {band.icon}
                      </span>
                      <strong>{band.shortLabel || band.label}</strong>
                    </div>
                    <div className="tier-stats">
                      <span className="tier-count">
                        {sectionCount} <small>classes</small>
                      </span>
                      <span className="status-pill present" style={{ fontSize: '0.75rem' }}>
                        ~{estimatedStudents.toLocaleString()} students
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Quick Navigation Panels */}
          <section className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span className="subtitle">School Management</span>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.2rem', color: 'var(--text-heading)' }}>
                  Administrative Operations
                </h3>
              </div>
            </div>

            <div className="admin-quick-actions">
              <Link to="/admin/analytics" className="admin-quick-action">
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
        </>
      )}
    </div>
  )
}
