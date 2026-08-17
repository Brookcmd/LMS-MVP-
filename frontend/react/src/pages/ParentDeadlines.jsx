import React from 'react'
import { getStudentAssessments, listParentAssessments, listParentStudents } from '../api/apiClient'
import { useAuth } from '../auth/AuthContext'

const TYPE_ICONS = {
  assignment: 'description',
  exam: 'quiz',
  quiz: 'help_outline',
  project: 'folder',
}

export default function ParentDeadlines() {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'
  const [children, setChildren] = React.useState([])
  const [selectedStudentId, setSelectedStudentId] = React.useState('')
  const [assessments, setAssessments] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')

  React.useEffect(() => {
    if (isStudent) return
    listParentStudents()
      .then((data) => {
        const studentList = data?.students || data || []
        setChildren(studentList)
        if (studentList.length > 0) {
          setSelectedStudentId(String(studentList[0].id))
        }
      })
      .catch((e) => setError(e.message))
  }, [isStudent])

  React.useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    if (isStudent) {
      getStudentAssessments()
        .then((data) => {
          if (!active) return
          setAssessments(data || [])
        })
        .catch((e) => {
          if (active) setError(e.message)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
      return () => { active = false }
    }

    listParentAssessments(selectedStudentId)
      .then((data) => {
        if (!active) return
        setAssessments(data || [])
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isStudent, selectedStudentId])

  const filteredAssessments = assessments.filter((item) => {
    if (statusFilter === 'upcoming') return item.status === 'upcoming'
    if (statusFilter === 'today') return item.status === 'today'
    if (statusFilter === 'overdue') return item.status === 'overdue'
    return true
  })

  const stats = {
    total: assessments.length,
    today: assessments.filter((a) => a.status === 'today').length,
    upcoming: assessments.filter((a) => a.status === 'upcoming').length,
    overdue: assessments.filter((a) => a.status === 'overdue').length,
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Deadlines & Schedule</span>
          <h1 className="title">Upcoming Deadlines & Schedule</h1>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Child selector toolbar */}
      {!isStudent && (
        <div className="card section toolbar-card" style={{ padding: 20 }}>
          <div className="toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <label className="input-label" style={{ flex: 1, minWidth: 220 }}>
              <span className="label-caps">Select Child</span>
              <select
                className="input-field"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">All Children</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} ({child.class?.name || 'Class Assigned'})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="stats-grid section">
        <div className="stat-card">
          <span className="label-caps">Total Deadlines</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="label-caps">Due Today</span>
          <strong style={{ color: '#d97706' }}>{stats.today}</strong>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span className="label-caps">Upcoming</span>
          <strong style={{ color: '#2563eb' }}>{stats.upcoming}</strong>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="label-caps">Past Due</span>
          <strong style={{ color: '#dc2626' }}>{stats.overdue}</strong>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card section toolbar-card" style={{ padding: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn-secondary ${statusFilter === 'all' ? 'active-filter' : ''}`}
            type="button"
            onClick={() => setStatusFilter('all')}
            style={{ fontWeight: statusFilter === 'all' ? '700' : 'normal' }}
          >
            All ({stats.total})
          </button>
          <button
            className={`btn-secondary ${statusFilter === 'today' ? 'active-filter' : ''}`}
            type="button"
            onClick={() => setStatusFilter('today')}
            style={{ fontWeight: statusFilter === 'today' ? '700' : 'normal', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>schedule</span> Due Today ({stats.today})
          </button>
          <button
            className={`btn-secondary ${statusFilter === 'upcoming' ? 'active-filter' : ''}`}
            type="button"
            onClick={() => setStatusFilter('upcoming')}
            style={{ fontWeight: statusFilter === 'upcoming' ? '700' : 'normal', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>event</span> Upcoming ({stats.upcoming})
          </button>
          <button
            className={`btn-secondary ${statusFilter === 'overdue' ? 'active-filter' : ''}`}
            type="button"
            onClick={() => setStatusFilter('overdue')}
            style={{ fontWeight: statusFilter === 'overdue' ? '700' : 'normal', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>warning</span> Past Due ({stats.overdue})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loader">Loading student deadlines…</div>
      ) : filteredAssessments.length > 0 ? (
        <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredAssessments.map((item) => {
            const due = new Date(item.dueDate)
            const iconName = TYPE_ICONS[item.type] || 'description'

            let statusBadge = (
              <span className="chip" style={{ background: '#dbeafe', color: '#1e40af' }}>
                Upcoming ({item.daysRemaining} {item.daysRemaining === 1 ? 'day' : 'days'})
              </span>
            )
            if (item.status === 'today') {
              statusBadge = (
                <span className="chip" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 'bold' }}>
                  Due Today
                </span>
              )
            } else if (item.status === 'overdue') {
              statusBadge = (
                <span className="chip" style={{ background: '#fee2e2', color: '#991b1b' }}>
                  Past Due
                </span>
              )
            }

            return (
              <div className="card" key={item.id} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: 'var(--text-secondary, #475569)' }}>{iconName}</span>
                      <h3 className="title" style={{ fontSize: '1.1rem', margin: 0 }}>{item.title}</h3>
                      <span className="chip" style={{ textTransform: 'capitalize' }}>{item.type}</span>
                      {statusBadge}
                    </div>

                    <p className="summary" style={{ margin: '4px 0 8px 0' }}>
                      <strong>{item.class?.name}</strong> · {item.subject?.name} · Teacher: {item.teacher?.name}
                    </p>

                    {item.students && item.students.length > 0 && (
                      <div style={{ margin: '6px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className="label-caps" style={{ fontSize: '0.75rem' }}>For:</span>
                        {item.students.map((s) => (
                          <span key={s.id} className="chip" style={{ background: '#f1f5f9', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>person</span> {s.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.description && (
                      <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.9rem', marginTop: 8 }}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p className="label-caps" style={{ fontSize: '0.75rem', color: '#64748b' }}>Due Date</p>
                    <p style={{ fontWeight: 'bold', margin: '2px 0 0 0', color: 'var(--text-primary, #0f172a)' }}>
                      {due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                      {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">No deadlines or exams found for this selection.</div>
      )}
    </div>
  )
}
