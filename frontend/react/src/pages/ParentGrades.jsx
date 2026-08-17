import React, { useState, useEffect } from 'react'
import { getParentGrades, getStudentGrades, listParentStudents } from '../api/apiClient'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../context/ToastContext'
import { CardSkeleton, StatsSkeleton } from '../components/SkeletonLoader'

const currentYear = `${new Date().getFullYear()}/${String((new Date().getFullYear() + 1) % 100).padStart(2, '0')}`
const quarterOptions = [1, 2, 3, 4]

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

export default function ParentGrades() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isStudent = user?.role === 'student'
  
  const [students, setStudents] = useState([])
  const [studentId, setStudentId] = useState('')
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState('1')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Load students if parent
  useEffect(() => {
    if (isStudent) return
    let active = true
    setLoading(true)
    listParentStudents()
      .then((items) => {
        if (!active) return
        setStudents(items || [])
        if (items && items.length > 0) {
          setStudentId(String(items[0].id))
        }
      })
      .catch((e) => {
        if (active) toast.error(e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [isStudent])

  // Load grades
  useEffect(() => {
    let active = true
    setLoading(true)

    if (isStudent) {
      getStudentGrades({ academicYear: year, quarter })
        .then((payload) => {
          if (!active) return
          setData(payload)
        })
        .catch((e) => {
          if (active) toast.error(e.message)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
      return () => { active = false }
    }

    if (!studentId) {
      setData(null)
      setLoading(false)
      return
    }

    getParentGrades({ studentId, academicYear: year, quarter })
      .then((payload) => {
        if (!active) return
        setData(payload)
      })
      .catch((e) => {
        if (active) toast.error(e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [isStudent, studentId, year, quarter])

  const result = data?.result

  return (
    <div className="container">
      {/* 1. Header Banner */}
      <div className="section-header">
        <div>
          <span className="subtitle">Official Academic Performance</span>
          <h1 className="title">Report Card & Grades</h1>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          {!isStudent && students.length > 0 && (
            <div className="input-label" style={{ margin: 0 }}>
              <span className="label-caps">Student</span>
              <select 
                className="select-field" 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="input-label" style={{ margin: 0 }}>
            <span className="label-caps">Academic Year</span>
            <input 
              className="input-field" 
              value={year} 
              onChange={(e) => setYear(e.target.value)} 
            />
          </div>

          <div className="input-label" style={{ margin: 0 }}>
            <span className="label-caps">Evaluation Quarter</span>
            <select 
              className="select-field" 
              value={quarter} 
              onChange={(e) => setQuarter(e.target.value)}
            >
              {quarterOptions.map((value) => (
                <option key={value} value={String(value)}>Quarter {value}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Grades Content */}
      {loading ? (
        <div>
          <StatsSkeleton count={2} />
          <CardSkeleton lines={4} />
        </div>
      ) : result ? (
        <div>
          {/* Summary KPI Banner */}
          <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <span className="subtitle">Student Transcript</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.4rem', color: 'var(--text-heading)' }}>
                  {result.student.name}
                </h2>
              </div>
              <span className="status-pill present" style={{ fontSize: '0.85rem' }}>
                Quarter {quarter} Verified
              </span>
            </div>

            <div className="stats-grid" style={{ marginBottom: 0 }}>
              <div className="stat-card">
                <span>Term Average Score</span>
                <strong>{result.average ? `${result.average.toFixed(1)}%` : '—'}</strong>
              </div>
              <div className="stat-card">
                <span>Class Ranking</span>
                <strong>{result.rank ? `#${result.rank} in Class` : '—'}</strong>
              </div>
            </div>
          </div>

          {/* Subject Grades Breakdown Cards */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {result.subjectScores && result.subjectScores.length > 0 ? (
              result.subjectScores.map((row) => {
                const badge = getLetterGrade(row.score)
                const percentage = Math.min(100, Math.max(0, Number(row.score) || 0))

                return (
                  <div 
                    key={row.subject.id} 
                    className="card" 
                    style={{ padding: '18px 22px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                          {row.subject.name}
                        </h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Course Credit: 3.0 • Instructor Evaluated
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`status-pill ${badge.class}`} style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
                          Grade {badge.grade}
                        </span>
                        <strong style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', color: 'var(--text-heading)' }}>
                          {row.score} / 100
                        </strong>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface-strong)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          background: percentage >= 80 ? 'var(--status-present-text)' : percentage >= 65 ? 'var(--gold-accent)' : 'var(--red-accent)',
                          borderRadius: '999px',
                          transition: 'width 0.6s ease'
                        }} 
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state">
                <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>
                  assignment_late
                </span>
                <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
                  No grades have been submitted for Quarter {quarter} yet.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>
            folder_open
          </span>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
            No grade record found for this student and academic term.
          </p>
        </div>
      )}
    </div>
  )
}
