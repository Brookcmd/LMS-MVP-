import React from 'react'
import {
  createAssessment,
  deleteAssessment,
  listTeacherAssessments,
  listTeachingAssignments,
} from '../api/apiClient'

const TYPE_OPTIONS = [
  { value: 'assignment', label: 'Assignment', icon: 'description' },
  { value: 'exam', label: 'Exam', icon: 'quiz' },
  { value: 'quiz', label: 'Quiz', icon: 'help_outline' },
  { value: 'project', label: 'Project', icon: 'folder' },
]

export default function TeacherDeadlines() {
  const [assignments, setAssignments] = React.useState([])
  const [assessments, setAssessments] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState(null)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [filterType, setFilterType] = React.useState('all')

  // Form state
  const [selectedAssignmentId, setSelectedAssignmentId] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [type, setType] = React.useState('assignment')
  const [dueDate, setDueDate] = React.useState('')
  const [description, setDescription] = React.useState('')

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [teachingList, assessmentList] = await Promise.all([
        listTeachingAssignments(),
        listTeacherAssessments(),
      ])
      setAssignments(teachingList || [])
      setAssessments(assessmentList || [])
      if (teachingList && teachingList.length > 0 && !selectedAssignmentId) {
        setSelectedAssignmentId(String(teachingList[0].id))
      }
    } catch (e) {
      setError(e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [selectedAssignmentId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!selectedAssignmentId || !title.trim() || !dueDate) {
      setError('Please select a class/subject, title, and due date.')
      return
    }

    const chosen = assignments.find((a) => String(a.id) === selectedAssignmentId)
    if (!chosen) {
      setError('Invalid class/subject selection.')
      return
    }

    try {
      setCreating(true)
      setError('')
      setSuccess('')
      await createAssessment({
        classId: chosen.class.id,
        subjectId: chosen.subject.id,
        title: title.trim(),
        type,
        dueDate: new Date(dueDate).toISOString(),
        description: description.trim() || undefined,
      })
      setSuccess(`Deadline "${title}" created successfully!`)
      setTitle('')
      setDescription('')
      setDueDate('')
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to create deadline')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, itemTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${itemTitle}"?`)) return

    try {
      setDeletingId(id)
      setError('')
      await deleteAssessment(id)
      setSuccess(`Deleted "${itemTitle}".`)
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to delete deadline')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredAssessments = filterType === 'all'
    ? assessments
    : assessments.filter((a) => a.type === filterType)

  const stats = {
    total: assessments.length,
    exams: assessments.filter((a) => a.type === 'exam').length,
    assignments: assessments.filter((a) => a.type === 'assignment').length,
    quizzes: assessments.filter((a) => a.type === 'quiz').length,
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Deadlines & Schedule</span>
          <h1 className="title">Exam & Assignment Deadlines</h1>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="success" style={{ marginBottom: 16 }}>{success}</div>}

      {/* Creation Card */}
      <div className="card section" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="title" style={{ fontSize: '1.25rem' }}>Create New Deadline / Assessment</h2>
          <span className="chip">Teacher Action</span>
        </div>

        <form onSubmit={handleCreate}>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <label className="input-label">
              <span className="label-caps">Class & Subject</span>
              <select
                className="input-field"
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                disabled={creating}
              >
                {assignments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.class.name} · {item.subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="input-label">
              <span className="label-caps">Title</span>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. Midterm Physics Exam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={creating}
                required
              />
            </label>

            <label className="input-label">
              <span className="label-caps">Type</span>
              <select
                className="input-field"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={creating}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="input-label">
              <span className="label-caps">Due Date & Time</span>
              <input
                className="input-field"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={creating}
                required
              />
            </label>
          </div>

          <label className="input-label" style={{ marginTop: 16, display: 'block' }}>
            <span className="label-caps">Description / Instructions (Optional)</span>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Provide context, required chapters, or submission instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creating}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </label>

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button className="btn-primary" type="submit" disabled={creating || !assignments.length} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span> {creating ? 'Creating…' : 'Add Deadline'}
            </button>
          </div>
        </form>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid section">
        <div className="stat-card">
          <span className="label-caps">Total Deadlines</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span className="label-caps">Exams</span>
          <strong>{stats.exams}</strong>
        </div>
        <div className="stat-card">
          <span className="label-caps">Assignments</span>
          <strong>{stats.assignments}</strong>
        </div>
        <div className="stat-card">
          <span className="label-caps">Quizzes</span>
          <strong>{stats.quizzes}</strong>
        </div>
      </div>

      {/* Filters & List */}
      <div className="card section toolbar-card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn-secondary ${filterType === 'all' ? 'active-filter' : ''}`}
              type="button"
              onClick={() => setFilterType('all')}
              style={{ fontWeight: filterType === 'all' ? '700' : 'normal' }}
            >
              All Types ({stats.total})
            </button>
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`btn-secondary ${filterType === opt.value ? 'active-filter' : ''}`}
                type="button"
                onClick={() => setFilterType(opt.value)}
                style={{ fontWeight: filterType === opt.value ? '700' : 'normal', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader">Loading deadlines…</div>
      ) : filteredAssessments.length > 0 ? (
        <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredAssessments.map((item) => {
            const due = new Date(item.dueDate)
            const typeInfo = TYPE_OPTIONS.find((t) => t.value === item.type) || TYPE_OPTIONS[0]
            const isOverdue = due.getTime() < Date.now()

            return (
              <div className="card" key={item.id} style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: 'var(--text-secondary, #475569)' }}>{typeInfo.icon}</span>
                      <h3 className="title" style={{ fontSize: '1.1rem', margin: 0 }}>{item.title}</h3>
                      <span className="chip" style={{ textTransform: 'capitalize' }}>{item.type}</span>
                      {isOverdue && <span className="chip" style={{ background: '#fee2e2', color: '#991b1b' }}>Past Due</span>}
                    </div>

                    <p className="summary" style={{ margin: '4px 0 8px 0' }}>
                      <strong>{item.class?.name}</strong> · {item.subject?.name}
                    </p>

                    {item.description && (
                      <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.9rem', marginBottom: 8 }}>
                        {item.description}
                      </p>
                    )}

                    <p className="label-caps" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Due: {due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deletingId === item.id}
                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      {deletingId === item.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">No deadlines found for the selected filter.</div>
      )}
    </div>
  )
}
