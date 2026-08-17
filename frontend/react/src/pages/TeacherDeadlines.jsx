import React, { useState, useEffect, useCallback } from 'react'
import {
  createAssessment,
  deleteAssessment,
  listTeacherAssessments,
  listTeachingAssignments,
} from '../api/apiClient'
import { useToast } from '../context/ToastContext'
import { CardSkeleton } from '../components/SkeletonLoader'

const TYPE_OPTIONS = [
  { value: 'assignment', label: 'Assignment', icon: 'description' },
  { value: 'exam', label: 'Exam', icon: 'quiz' },
  { value: 'quiz', label: 'Quiz', icon: 'help_outline' },
  { value: 'project', label: 'Project', icon: 'folder' },
]

export default function TeacherDeadlines() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState([])
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [filterType, setFilterType] = useState('all')

  // Form state
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('assignment')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
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
      toast.error(e.message || 'Failed to load deadlines')
    } finally {
      setLoading(false)
    }
  }, [selectedAssignmentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!selectedAssignmentId || !title.trim() || !dueDate) {
      toast.warning('Please select a course, title, and due date.')
      return
    }

    const chosen = assignments.find((a) => String(a.id) === selectedAssignmentId)
    if (!chosen) {
      toast.error('Invalid course selection.')
      return
    }

    try {
      setCreating(true)
      await createAssessment({
        classId: chosen.class.id,
        subjectId: chosen.subject.id,
        title: title.trim(),
        type,
        dueDate: new Date(dueDate).toISOString(),
        description: description.trim() || undefined,
      })
      toast.success(`Deadline "${title}" posted to students!`)
      setTitle('')
      setDescription('')
      setDueDate('')
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to post deadline')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, itemTitle) => {
    try {
      setDeletingId(id)
      await deleteAssessment(id)
      toast.success(`Removed "${itemTitle}".`)
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete deadline')
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
    <div className="container">
      {/* 1. Header */}
      <div className="section-header">
        <div>
          <span className="subtitle">Curriculum Timetable</span>
          <h1 className="title">Assessments & Deadlines</h1>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <span>Active Tasks</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Exams</span>
          <strong style={{ color: 'var(--red-accent)' }}>{stats.exams}</strong>
        </div>
        <div className="stat-card">
          <span>Assignments</span>
          <strong style={{ color: 'var(--navy-primary)' }}>{stats.assignments}</strong>
        </div>
        <div className="stat-card">
          <span>Quizzes</span>
          <strong style={{ color: 'var(--gold-accent)' }}>{stats.quizzes}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* 3. Creation Form Card */}
        <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="subtitle">Publish Notice</span>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.2rem', color: 'var(--text-heading)' }}>
                New Assessment
              </h2>
            </div>
            <span className="chip">Faculty</span>
          </div>

          <form onSubmit={handleCreate}>
            <div className="input-label">
              <span className="label-caps">Course Assignment</span>
              <select
                className="select-field"
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                required
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.class.name} · {a.subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-label">
              <span className="label-caps">Task Category</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn-ghost ${type === opt.value ? 'active' : ''}`}
                    onClick={() => setType(opt.value)}
                    style={{
                      justifyContent: 'flex-start',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      border: type === opt.value ? '2px solid var(--navy-primary)' : '1px solid var(--border-color)',
                      background: type === opt.value ? 'var(--navy-surface)' : 'transparent',
                      color: type === opt.value ? 'var(--navy-primary)' : 'var(--text-primary)',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-label">
              <span className="label-caps">Title</span>
              <input
                type="text"
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm Chapter 1-4 Exam"
                required
              />
            </div>

            <div className="input-label">
              <span className="label-caps">Due Date & Time</span>
              <input
                type="datetime-local"
                className="input-field"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div className="input-label">
              <span className="label-caps">Instructions & Materials</span>
              <textarea
                className="textarea-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed instructions or reference pages..."
                style={{ minHeight: '80px' }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={creating}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <span className="material-symbols-outlined">add_task</span>
              {creating ? 'Publishing…' : 'Publish Deadline'}
            </button>
          </form>
        </div>

        {/* 4. Active Deadlines List */}
        <div>
          <div className="card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {['all', 'exam', 'assignment', 'quiz', 'project'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`btn-ghost ${filterType === tab ? 'active' : ''}`}
                  onClick={() => setFilterType(tab)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    textTransform: 'capitalize',
                    background: filterType === tab ? 'var(--navy-primary)' : 'transparent',
                    color: filterType === tab ? '#FFFFFF' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  {tab === 'all' ? 'All Deadlines' : `${tab}s`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <CardSkeleton lines={3} />
          ) : filteredAssessments.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredAssessments.map((item) => {
                const dateObj = new Date(item.dueDate)
                const isPast = dateObj < new Date()

                return (
                  <div 
                    key={item.id} 
                    className="card" 
                    style={{ 
                      padding: '18px 20px',
                      borderLeft: `4px solid ${
                        item.type === 'exam' ? 'var(--red-accent)' : item.type === 'quiz' ? 'var(--gold-accent)' : 'var(--navy-primary)'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="status-pill present" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            {item.type}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {item.class?.name} · {item.subject?.name}
                          </span>
                        </div>
                        <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                          {item.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleDelete(item.id, item.title)}
                        disabled={deletingId === item.id}
                        title="Delete this deadline"
                        style={{ color: 'var(--status-absent-text)', padding: '4px 8px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>

                    {item.description && (
                      <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: isPast ? 'var(--status-absent-text)' : 'var(--text-secondary)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event</span>
                        Due {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isPast && (
                        <span className="status-pill absent" style={{ fontSize: '0.7rem' }}>Expired</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>
                fact_check
              </span>
              <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
                No deadlines posted for this category.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
