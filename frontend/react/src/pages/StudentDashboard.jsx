import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getStudentOverview,
  submitAssignment,
} from '../api/apiClient'
import { AttendanceRing } from '../components/AttendanceRing'
import { LiveClassCard } from '../components/LiveClassCard'
import { CardSkeleton } from '../components/SkeletonLoader'
import FileDropzone from '../components/FileDropzone'

function getLetterGrade(score) {
  const num = Number(score)
  if (num >= 90) return { grade: 'A+', class: 'present' }
  if (num >= 85) return { grade: 'A', class: 'present' }
  if (num >= 80) return { grade: 'A-', class: 'present' }
  if (num >= 75) return { grade: 'B+', class: 'chip' }
  if (num >= 70) return { grade: 'B', class: 'chip' }
  if (num >= 65) return { grade: 'C+', class: 'late' }
  if (num >= 60) return { grade: 'C', class: 'late' }
  return { grade: 'D/F', class: 'absent' }
}

const TYPE_ICONS = {
  assignment: 'description',
  exam: 'quiz',
  quiz: 'help_outline',
  project: 'folder',
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  // Homework Submission Modal State
  const [activeSubmissionModal, setActiveSubmissionModal] = useState(null)
  const [submissionFile, setSubmissionFile] = useState(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadOverview = async () => {
    try {
      setLoading(true)
      const res = await getStudentOverview()
      setData(res)
    } catch (err) {
      toast.error(err?.message || 'Failed to load student dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
  }, [])

  const student = data?.student
  const schedule = data?.schedule
  const assessments = data?.assessments
  const attendance = data?.attendance
  const grades = data?.grades
  const materials = data?.materials

  const currentDateDisplay = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // Quick submission modal handler
  const handleOpenSubmitModal = (item) => {
    setActiveSubmissionModal(item)
    setSubmissionContent(item.submission?.content || '')
    setSubmissionFile(null)
  }

  const handleSubmitHomework = async (e) => {
    e.preventDefault()
    if (!activeSubmissionModal) return

    if (!submissionFile && !submissionContent.trim() && !activeSubmissionModal.submission?.fileUrl) {
      toast.warning('Please select a file or enter your written answer.')
      return
    }

    try {
      setSubmitting(true)
      await submitAssignment(activeSubmissionModal.id, {
        file: submissionFile || undefined,
        content: submissionContent.trim() || undefined,
      })

      toast.success(`Work submitted for "${activeSubmissionModal.title}"!`)
      setActiveSubmissionModal(null)
      loadOverview()
    } catch (err) {
      toast.error(err?.message || 'Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="container">
        <CardSkeleton height="160px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <CardSkeleton height="240px" />
          <CardSkeleton height="240px" />
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* 1. Student Academic Greeting Banner */}
      <section className="academic-hero-banner" aria-label="Student Academic Portal Greeting">
        <div className="academic-hero-top">
          <span className="academic-hero-kicker">
            {student?.class?.name || 'Class'} • Academic Year 2025/2026
          </span>
          <span className="academic-hero-date">{currentDateDisplay}</span>
        </div>

        <h1 className="academic-hero-title">
          Welcome, {student?.name || user?.name || 'Student'}
        </h1>
        <p className="academic-hero-subtitle">
          Your personal learning console — access today's classes, submit homework, check grade performance, and view lecture notes.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
          <div className="status-pill present" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>badge</span>
            Student ID: #{student?.id || user?.id}
          </div>
          {student?.class?.homeroomTeacher && (
            <div className="status-pill chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
              Homeroom: {student.class.homeroomTeacher.name}
            </div>
          )}
        </div>
      </section>

      {/* 2. Top Summary Metric Cards: Attendance Ring + Live Class Schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <AttendanceRing
          present={attendance?.stats?.present ?? 18}
          late={attendance?.stats?.late ?? 2}
          absent={attendance?.stats?.absent ?? 1}
        />

        <LiveClassCard
          slots={schedule?.weekly || []}
          studentName={student?.name}
        />
      </div>

      {/* 3. Quick Action Ribbon */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="subtitle">Student Shortcuts</span>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.1rem' }}>
              Study & Academic Tools
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/deadlines')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
              Submit Assignments
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/materials')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>menu_book</span>
              Class Materials
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/schedule')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_view_week</span>
              Full Timetable
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/grades')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>school</span>
              My Report Card
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Two-Column Academic Grid: Pending Tasks & Recent Grades */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Pending Assignments & Deadlines Panel */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="subtitle">Active Coursework</span>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.15rem' }}>
                Assignments & Tasks
              </h3>
            </div>
            <button type="button" className="btn-ghost" onClick={() => navigate('/deadlines')} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
              View All ({assessments?.totalCount || 0})
            </button>
          </div>

          {assessments?.upcoming && assessments.upcoming.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {assessments.upcoming.slice(0, 4).map((item) => {
                const isSubmitted = item.isSubmitted
                const isGraded = item.isGraded
                const isPastDue = new Date(item.dueDate) < new Date()

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-btn)',
                      background: 'var(--bg-surface-muted)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '22px',
                          color: isGraded ? 'var(--status-present-text)' : isSubmitted ? 'var(--navy-primary)' : 'var(--status-absent-text)',
                        }}
                      >
                        {TYPE_ICONS[item.type] || 'description'}
                      </span>
                      <div style={{ overflow: 'hidden' }}>
                        <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {item.subject?.name || 'Course'} • Due {new Date(item.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {isGraded ? (
                        <span className="status-pill present" style={{ fontSize: '0.72rem' }}>
                          Score: {item.submission?.gradeScore}/100
                        </span>
                      ) : isSubmitted ? (
                        <span className="status-pill present" style={{ fontSize: '0.72rem' }}>
                          Submitted
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                          onClick={() => handleOpenSubmitModal(item)}
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--status-present-text)', marginBottom: '6px' }}>
                task_alt
              </span>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '2px' }}>
                All caught up!
              </strong>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                You have no pending assignments due this week.
              </p>
            </div>
          )}
        </div>

        {/* Academic Performance & Recent Grades Panel */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="subtitle">Report Card</span>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.15rem' }}>
                Subject Performance
              </h3>
            </div>
            <button type="button" className="btn-ghost" onClick={() => navigate('/grades')} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
              Full Card
            </button>
          </div>

          {grades?.recent && grades.recent.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {grades.recent.slice(0, 5).map((grade) => {
                const subjectName = grade.teachingAssignment?.subject?.name || 'Subject'
                const letter = getLetterGrade(grade.score)

                return (
                  <div
                    key={grade.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-btn)',
                      background: 'var(--bg-surface-muted)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                        {subjectName}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Q{grade.quarter} • {grade.academicYear}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {grade.score}%
                      </span>
                      <span className={`status-pill ${letter.class}`} style={{ fontSize: '0.72rem', minWidth: '32px', textAlign: 'center' }}>
                        {letter.grade}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--navy-primary)', marginBottom: '6px' }}>
                school
              </span>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '2px' }}>
                Academic Year in Progress
              </strong>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Quarterly exam and continuous assessment scores will appear here once finalized by teachers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Course Materials Quick Access Strip */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span className="subtitle">Digital Library</span>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.15rem' }}>
              Recent Class Course Materials
            </h3>
          </div>
          <button type="button" className="btn-ghost" onClick={() => navigate('/materials')} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
            Browse Library
          </button>
        </div>

        {materials?.recent && materials.recent.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {materials.recent.map((mat) => (
              <div
                key={mat.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-card)',
                  background: 'var(--bg-surface-muted)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span className="status-pill chip" style={{ fontSize: '0.7rem', marginBottom: '8px', display: 'inline-block' }}>
                    {mat.subject?.name || 'Class Resource'}
                  </span>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.92rem', marginBottom: '4px' }}>
                    {mat.title}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Instructor: {mat.teacher?.name || 'Teacher'}
                  </p>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {mat.fileName}
                  </span>
                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '20px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--navy-primary)', marginBottom: '4px' }}>
              folder_open
            </span>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              No lecture materials published for your class yet. Check back soon.
            </p>
          </div>
        )}
      </div>

      {/* 6. Quick Homework Submission Modal */}
      {activeSubmissionModal && (
        <div className="modal-backdrop" onClick={() => setActiveSubmissionModal(null)}>
          <div className="action-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="subtitle">
                  {activeSubmissionModal.subject?.name || 'Subject'} • Due {new Date(activeSubmissionModal.dueDate).toLocaleDateString()}
                </span>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.25rem', color: 'var(--text-heading)' }}>
                  Submit: {activeSubmissionModal.title}
                </h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setActiveSubmissionModal(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {activeSubmissionModal.description && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-btn)',
                  background: 'var(--bg-surface-muted)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {activeSubmissionModal.description}
              </div>
            )}

            <form onSubmit={handleSubmitHomework}>
              <div className="input-label">
                <span className="label-caps">Upload Solution File (PDF, DOCX, ZIP, Image)</span>
                <FileDropzone
                  file={submissionFile}
                  onFileSelect={setSubmissionFile}
                  uploading={submitting}
                />
              </div>

              <div className="input-label">
                <span className="label-caps">Notes or Written Answer (Optional)</span>
                <textarea
                  className="textarea-field"
                  placeholder="Enter any comments, explanation, or direct text answers for your instructor..."
                  rows={4}
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveSubmissionModal(null)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting Work…' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
