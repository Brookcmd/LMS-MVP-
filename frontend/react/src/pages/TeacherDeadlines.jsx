import React, { useState, useEffect, useCallback } from 'react'
import {
  createAssessment,
  deleteAssessment,
  gradeSubmission,
  listAssessmentSubmissions,
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

  // Submissions Modal State
  const [activeAssessment, setActiveAssessment] = useState(null)
  const [submissionsData, setSubmissionsData] = useState(null)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [gradingState, setGradingState] = useState({}) // { [submissionId]: { score: number, feedback: string, saving: boolean } }

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

  const handleOpenSubmissions = async (assessment) => {
    try {
      setActiveAssessment(assessment)
      setLoadingSubmissions(true)
      const data = await listAssessmentSubmissions(assessment.id)
      setSubmissionsData(data)
      
      // Initialize grading state
      const initialGrading = {}
      if (data?.roster) {
        for (const item of data.roster) {
          if (item.submission) {
            initialGrading[item.submission.id] = {
              score: item.submission.gradeScore !== null && item.submission.gradeScore !== undefined ? String(item.submission.gradeScore) : '',
              feedback: item.submission.feedback || '',
              saving: false,
            }
          }
        }
      }
      setGradingState(initialGrading)
    } catch (err) {
      toast.error(err.message || 'Failed to load submissions')
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleSaveGrade = async (submissionId, studentName) => {
    const current = gradingState[submissionId]
    if (!current || current.score === '' || isNaN(Number(current.score))) {
      toast.warning('Please enter a valid numeric grade (0 - 100).')
      return
    }

    const scoreNum = Number(current.score)
    if (scoreNum < 0 || scoreNum > 100) {
      toast.warning('Score must be between 0 and 100.')
      return
    }

    try {
      setGradingState((prev) => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: true },
      }))

      await gradeSubmission(submissionId, {
        gradeScore: scoreNum,
        feedback: current.feedback || undefined,
      })

      toast.success(`Grade saved for ${studentName}!`)

      // Refresh submissions data
      if (activeAssessment) {
        const refreshed = await listAssessmentSubmissions(activeAssessment.id)
        setSubmissionsData(refreshed)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save grade')
    } finally {
      setGradingState((prev) => ({
        ...prev,
        [submissionId]: { ...prev[submissionId], saving: false },
      }))
    }
  }

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
    if (!window.confirm(`Are you sure you want to delete "${itemTitle}"?`)) return
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
    <div className="container" style={{ paddingBottom: '60px' }}>
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
            <span className="chip" style={{ background: 'var(--navy-surface)', color: 'var(--navy-primary)' }}>Faculty</span>
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
              <span className="label-caps">Instructions & Reference Notes</span>
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
              {['all', 'assignment', 'exam', 'quiz', 'project'].map((tab) => (
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

                      <div style={{ display: 'flex', gap: '6px' }}>
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
                    </div>

                    {item.description && (
                      <p style={{ margin: '0 0 12px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: isPast ? 'var(--status-absent-text)' : 'var(--text-secondary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event</span>
                          Due {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isPast && (
                          <span className="status-pill absent" style={{ fontSize: '0.7rem' }}>Expired</span>
                        )}
                      </div>

                      {/* Submissions Review Trigger */}
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleOpenSubmissions(item)}
                        style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment_turned_in</span>
                        Submissions Roster
                      </button>
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

      {/* Submissions Review Modal / Drawer */}
      {activeAssessment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setActiveAssessment(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="chip" style={{ background: 'var(--navy-surface)', color: 'var(--navy-primary)' }}>
                    {activeAssessment.type?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {activeAssessment.class?.name} · {activeAssessment.subject?.name}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.35rem', color: 'var(--text-heading)' }}>
                  {activeAssessment.title} — Submissions Roster
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setActiveAssessment(null)}
                style={{ width: '36px', height: '36px' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {loadingSubmissions ? (
              <CardSkeleton lines={4} />
            ) : submissionsData ? (
              <div>
                {/* Stats Summary Strip */}
                <div className="stats-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="stat-card">
                    <span>Enrolled Students</span>
                    <strong>{submissionsData.assessment.totalStudents}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Submissions Handed In</span>
                    <strong style={{ color: 'var(--navy-primary)' }}>{submissionsData.assessment.submittedCount}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Graded</span>
                    <strong style={{ color: 'var(--gold-accent)' }}>{submissionsData.assessment.gradedCount}</strong>
                  </div>
                </div>

                {/* Roster Cards */}
                <div style={{ display: 'grid', gap: '16px' }}>
                  {submissionsData.roster.map(({ student, hasSubmitted, submission }) => {
                    const subId = submission?.id
                    const currentGrade = subId ? gradingState[subId] || {} : {}

                    return (
                      <div
                        key={student.id}
                        className="card"
                        style={{
                          padding: '18px 20px',
                          background: hasSubmitted ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                          borderLeft: `4px solid ${
                            hasSubmitted
                              ? submission?.status === 'graded'
                                ? '#059669'
                                : submission?.status === 'late'
                                ? '#D97706'
                                : '#2563EB'
                              : '#94A3B8'
                          }`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                              {student.name[0].toUpperCase()}
                            </div>
                            <div>
                              <h4 style={{ margin: '0 0 2px', fontSize: '1rem', color: 'var(--text-heading)' }}>
                                {student.name}
                              </h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {hasSubmitted ? (
                                  <span
                                    className={`status-pill ${
                                      submission?.status === 'late' ? 'late' : 'present'
                                    }`}
                                    style={{ fontSize: '0.7rem' }}
                                  >
                                    {submission?.status === 'late' ? 'Submitted Late' : 'Submitted On-Time'}
                                  </span>
                                ) : (
                                  <span className="status-pill absent" style={{ fontSize: '0.7rem' }}>
                                    Missing / Pending
                                  </span>
                                )}
                                {submission?.submittedAt && (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {new Date(submission.submittedAt).toLocaleDateString([], {
                                      month: 'short',
                                      day: 'numeric',
                                    })}{' '}
                                    at{' '}
                                    {new Date(submission.submittedAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Submission Attachment */}
                          {submission?.fileUrl && (
                            <a
                              href={submission.fileUrl}
                              download={submission.fileName || 'submission'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-ghost"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.82rem',
                                color: 'var(--navy-primary)',
                                padding: '6px 12px',
                                border: '1px solid var(--border-color)',
                                textDecoration: 'none',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                              {submission.fileName || 'Download Work'}
                            </a>
                          )}
                        </div>

                        {/* Student Commentary */}
                        {submission?.content && (
                          <div
                            style={{
                              marginTop: '12px',
                              padding: '10px 14px',
                              background: 'var(--bg-surface)',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px', fontSize: '0.78rem' }}>
                              Student Note:
                            </strong>
                            {submission.content}
                          </div>
                        )}

                        {/* Grading Controls */}
                        {hasSubmitted && (
                          <div
                            style={{
                              marginTop: '16px',
                              paddingTop: '14px',
                              borderTop: '1px solid var(--border-color)',
                              display: 'grid',
                              gridTemplateColumns: '120px 1fr auto',
                              gap: '12px',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <span className="label-caps" style={{ margin: '0 0 4px', fontSize: '0.72rem' }}>Grade (0-100)</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                className="input-field"
                                value={currentGrade.score ?? ''}
                                onChange={(e) =>
                                  setGradingState((prev) => ({
                                    ...prev,
                                    [subId]: { ...prev[subId], score: e.target.value },
                                  }))
                                }
                                placeholder="e.g. 95"
                                style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                              />
                            </div>

                            <div>
                              <span className="label-caps" style={{ margin: '0 0 4px', fontSize: '0.72rem' }}>Teacher Feedback</span>
                              <input
                                type="text"
                                className="input-field"
                                value={currentGrade.feedback ?? ''}
                                onChange={(e) =>
                                  setGradingState((prev) => ({
                                    ...prev,
                                    [subId]: { ...prev[subId], feedback: e.target.value },
                                  }))
                                }
                                placeholder="e.g. Well organized arguments, great effort on problem 4."
                                style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                              />
                            </div>

                            <div style={{ alignSelf: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleSaveGrade(subId, student.name)}
                                disabled={currentGrade.saving}
                                style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                              >
                                {currentGrade.saving ? 'Saving…' : 'Save Grade'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

