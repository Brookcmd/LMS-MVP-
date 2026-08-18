import React, { useState, useEffect, useCallback } from 'react'
import {
  getMySubmission,
  getStudentAssessments,
  listParentAssessments,
  listParentStudents,
  submitAssignment,
} from '../api/apiClient'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../context/ToastContext'
import { CardSkeleton } from '../components/SkeletonLoader'

const TYPE_ICONS = {
  assignment: 'description',
  exam: 'quiz',
  quiz: 'help_outline',
  project: 'folder',
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function ParentDeadlines() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isStudent = user?.role === 'student'
  const [children, setChildren] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [assessments, setAssessments] = useState([])
  const [submissionsMap, setSubmissionsMap] = useState({}) // { [assessmentId]: submission }
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  // Submission Modal State
  const [activeSubmissionModal, setActiveSubmissionModal] = useState(null) // assessment object
  const [submissionFile, setSubmissionFile] = useState(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      let assessmentData = []
      let studentIdForQuery = selectedStudentId

      if (isStudent) {
        assessmentData = (await getStudentAssessments()) || []
      } else {
        const kids = await listParentStudents()
        const kidList = kids?.students || kids || []
        setChildren(kidList)
        if (kidList.length > 0 && !selectedStudentId) {
          studentIdForQuery = String(kidList[0].id)
          setSelectedStudentId(studentIdForQuery)
        }
        assessmentData = (await listParentAssessments(studentIdForQuery)) || []
      }

      setAssessments(assessmentData)

      // Fetch student submissions for assignments and projects
      const subMap = {}
      const relevant = assessmentData.filter((a) => a.type === 'assignment' || a.type === 'project')
      await Promise.all(
        relevant.map(async (a) => {
          try {
            const sub = await getMySubmission(a.id, isStudent ? undefined : studentIdForQuery)
            if (sub) subMap[a.id] = sub
          } catch {
            // No submission found or error
          }
        })
      )
      setSubmissionsMap(subMap)
    } catch (e) {
      toast.error(e.message || 'Failed to load deadlines')
    } finally {
      setLoading(false)
    }
  }, [isStudent, selectedStudentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenSubmitModal = (item) => {
    const existing = submissionsMap[item.id]
    setActiveSubmissionModal(item)
    setSubmissionContent(existing?.content || '')
    setSubmissionFile(null)
  }

  const handleSubmitHomework = async (e) => {
    e.preventDefault()
    if (!activeSubmissionModal) return

    if (!submissionFile && !submissionContent.trim() && !submissionsMap[activeSubmissionModal.id]?.fileUrl) {
      toast.warning('Please select a solution file or enter your submission text.')
      return
    }

    try {
      setSubmitting(true)
      const res = await submitAssignment(activeSubmissionModal.id, {
        file: submissionFile || undefined,
        content: submissionContent.trim() || undefined,
        studentId: isStudent ? undefined : selectedStudentId,
      })

      toast.success(`Work submitted for "${activeSubmissionModal.title}"!`)
      setSubmissionsMap((prev) => ({
        ...prev,
        [activeSubmissionModal.id]: res,
      }))
      setActiveSubmissionModal(null)
    } catch (err) {
      toast.error(err.message || 'Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

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
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <span className="subtitle">Curriculum Deadlines & Homework</span>
          <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--navy-primary)' }}>
              event_available
            </span>
            Assessments & Submissions
          </h1>
        </div>
      </div>

      {/* Child selector toolbar for parents */}
      {!isStudent && children.length > 0 && (
        <div className="card toolbar-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span className="label-caps" style={{ margin: 0 }}>Select Child:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className={`btn-ghost ${selectedStudentId === String(child.id) ? 'active' : ''}`}
                  onClick={() => setSelectedStudentId(String(child.id))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    background: selectedStudentId === String(child.id) ? 'var(--navy-primary)' : 'var(--bg-surface-elevated)',
                    color: selectedStudentId === String(child.id) ? '#FFFFFF' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>face</span>
                  {child.name} ({child.class?.name || 'Class Assigned'})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span>Total Deadlines</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Due Today</span>
          <strong style={{ color: 'var(--gold-accent)' }}>{stats.today}</strong>
        </div>
        <div className="stat-card">
          <span>Upcoming</span>
          <strong style={{ color: 'var(--navy-primary)' }}>{stats.upcoming}</strong>
        </div>
        <div className="stat-card">
          <span>Past Due</span>
          <strong style={{ color: 'var(--red-accent)' }}>{stats.overdue}</strong>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'today', 'upcoming', 'overdue'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`btn-ghost ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                textTransform: 'capitalize',
                borderRadius: 'var(--radius-pill)',
                background: statusFilter === tab ? 'var(--navy-primary)' : 'transparent',
                color: statusFilter === tab ? '#FFFFFF' : 'var(--text-secondary)',
              }}
            >
              {tab === 'all'
                ? `All (${stats.total})`
                : tab === 'today'
                ? `Due Today (${stats.today})`
                : tab === 'upcoming'
                ? `Upcoming (${stats.upcoming})`
                : `Past Due (${stats.overdue})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <CardSkeleton lines={3} />
      ) : filteredAssessments.length > 0 ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredAssessments.map((item) => {
            const due = new Date(item.dueDate)
            const iconName = TYPE_ICONS[item.type] || 'description'
            const isSubmittable = item.type === 'assignment' || item.type === 'project'
            const submission = submissionsMap[item.id]

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: '20px 24px',
                  borderLeft: `4px solid ${
                    submission?.status === 'graded'
                      ? '#059669'
                      : item.type === 'exam'
                      ? 'var(--red-accent)'
                      : item.type === 'quiz'
                      ? 'var(--gold-accent)'
                      : 'var(--navy-primary)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span className="chip" style={{ background: 'var(--navy-surface)', color: 'var(--navy-primary)', textTransform: 'capitalize' }}>
                        {item.type}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {item.class?.name} · {item.subject?.name} · Instructor: {item.teacher?.name || 'Faculty'}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-headline)', fontSize: '1.2rem', color: 'var(--text-heading)' }}>
                      {item.title}
                    </h3>

                    {item.description && (
                      <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                        {item.description}
                      </p>
                    )}

                    {/* Submission Status & Feedback Box */}
                    {isSubmittable && (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: submission ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="label-caps" style={{ margin: 0, fontSize: '0.72rem' }}>Submission Status:</span>
                            {submission ? (
                              <span
                                className={`status-pill ${
                                  submission.status === 'graded' ? 'present' : submission.status === 'late' ? 'late' : 'present'
                                }`}
                                style={{ fontSize: '0.75rem' }}
                              >
                                {submission.status === 'graded'
                                  ? `Graded (${submission.gradeScore} / 100)`
                                  : submission.status === 'late'
                                  ? 'Submitted Late'
                                  : 'Submitted On-Time'}
                              </span>
                            ) : (
                              <span className="status-pill absent" style={{ fontSize: '0.75rem' }}>
                                Not Submitted
                              </span>
                            )}
                          </div>

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
                                gap: '4px',
                                fontSize: '0.78rem',
                                color: 'var(--navy-primary)',
                                padding: '4px 8px',
                                textDecoration: 'none',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>attach_file</span>
                              {submission.fileName} {submission.fileSize ? `(${formatFileSize(submission.fileSize)})` : ''}
                            </a>
                          )}
                        </div>

                        {/* Teacher Feedback Notes */}
                        {submission?.feedback && (
                          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--navy-primary)', marginBottom: '2px' }}>
                              Teacher Feedback:
                            </span>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                              "{submission.feedback}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <div>
                      <span className="label-caps" style={{ fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Due Date</span>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-heading)' }}>
                        {due.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {isSubmittable && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleOpenSubmitModal(item)}
                        style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {submission ? 'edit_document' : 'upload_file'}
                        </span>
                        {submission ? 'Update Submission' : 'Submit Homework'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>
            assignment_turned_in
          </span>
          <h3 style={{ margin: '12px 0 4px', fontFamily: 'var(--font-headline)', color: 'var(--text-heading)' }}>
            No Assessments Found
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            There are no deadlines scheduled for this category.
          </p>
        </div>
      )}

      {/* Submission Upload Modal */}
      {activeSubmissionModal && (
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
          onClick={() => setActiveSubmissionModal(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <span className="subtitle">Submit Solution</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.25rem', color: 'var(--text-heading)' }}>
                  {activeSubmissionModal.title}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setActiveSubmissionModal(null)}
                style={{ width: '32px', height: '32px' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitHomework}>
              <div className="input-label">
                <span className="label-caps">Attach Solution File (PDF, DOCX, ZIP, Image)</span>
                <input
                  type="file"
                  className="input-field"
                  onChange={(e) => setSubmissionFile(e.target.files[0] || null)}
                  style={{ padding: '8px' }}
                />
                {submissionsMap[activeSubmissionModal.id]?.fileName && !submissionFile && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--navy-primary)', marginTop: '4px', display: 'block' }}>
                    Currently submitted: {submissionsMap[activeSubmissionModal.id].fileName}
                  </span>
                )}
                {submissionFile && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Selected: {submissionFile.name} ({formatFileSize(submissionFile.size)})
                  </span>
                )}
              </div>

              <div className="input-label">
                <span className="label-caps">Student Notes & Comments (Optional)</span>
                <textarea
                  className="textarea-field"
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="Notes for your teacher regarding your work..."
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setActiveSubmissionModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  <span className="material-symbols-outlined">send</span>
                  {submitting ? 'Submitting…' : 'Hand in Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

