import React, { useState, useEffect, useRef, useMemo } from 'react'
import { getGradeRoster, listTeachingAssignments, saveGrades, downloadGradeTemplate, uploadGradeFile } from '../api/apiClient'
import { getGradeStats, filterRosterBySearch, applyPreviousQuarterScores } from './gradeUtils.mjs'
import { useToast } from '../context/ToastContext'
import { CardSkeleton } from '../components/SkeletonLoader'

const currentYear = `${new Date().getFullYear()}/${String((new Date().getFullYear() + 1) % 100).padStart(2, '0')}`
const quarterOptions = [1, 2, 3, 4]

export default function TeacherGrades() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState([])
  const [assignmentId, setAssignmentId] = useState('')
  const [year, setYear] = useState(currentYear)
  const [quarter, setQuarter] = useState('1')
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [fillValue, setFillValue] = useState('')
  const [copying, setCopying] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadErrors, setUploadErrors] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    listTeachingAssignments()
      .then((data) => {
        setAssignments(data || [])
        if (data && data[0]) setAssignmentId(String(data[0].id))
      })
      .catch((e) => toast.error(e.message))
  }, [])

  useEffect(() => {
    if (!assignmentId) {
      setRoster([])
      return
    }

    let active = true
    setLoading(true)
    getGradeRoster({ assignmentId, academicYear: year, quarter })
      .then((data) => {
        if (!active) return
        setRoster((data.students || []).map((student) => ({ ...student, score: student.grade?.score ?? '' })))
      })
      .catch((e) => {
        if (active) toast.error(e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [assignmentId, year, quarter])

  const save = async () => {
    try {
      setSaving(true)
      const normalized = roster.map((student) => ({ studentId: student.id, score: Number(student.score) }))
      const hasInvalidScore = normalized.some((entry) => !Number.isInteger(entry.score) || entry.score < 0 || entry.score > 100)
      if (hasInvalidScore) {
        toast.warning('Please enter a valid whole score between 0 and 100 for each student.')
        setSaving(false)
        return
      }

      await saveGrades({ assignmentId, academicYear: year, quarter: Number(quarter), grades: normalized })
      toast.success(`Grades saved successfully for Quarter ${quarter}.`)
    } catch (e) {
      toast.error(e.message || 'Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  const chosen = assignments.find((assignment) => String(assignment.id) === assignmentId)
  const visibleRoster = filterRosterBySearch(roster, searchTerm)
  const stats = getGradeStats(roster)

  // Grade breakdown distribution
  const gradeDistribution = useMemo(() => {
    const dist = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    roster.forEach((r) => {
      if (r.score === '') return
      const s = Number(r.score)
      if (isNaN(s)) return
      if (s >= 85) dist.A++
      else if (s >= 75) dist.B++
      else if (s >= 60) dist.C++
      else if (s >= 50) dist.D++
      else dist.F++
    })
    return dist
  }, [roster])

  const applyFillValue = () => {
    if (fillValue === '') return
    const val = Number(fillValue)
    if (isNaN(val) || val < 0 || val > 100) {
      toast.warning('Fill score must be between 0 and 100.')
      return
    }
    setRoster((rows) => rows.map((row) => ({ ...row, score: fillValue })))
    toast.info(`Filled score ${fillValue} across all students.`)
  }

  const handleDownloadTemplate = async () => {
    if (!assignmentId) return
    try {
      setDownloading(true)
      await downloadGradeTemplate({ assignmentId, academicYear: year, quarter })
      toast.success('Excel grade template downloaded.')
    } catch (e) {
      toast.error(e.message || 'Failed to download template')
    } finally {
      setDownloading(false)
    }
  }

  const handleUploadFile = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !assignmentId) return
    try {
      setUploadErrors([])
      setUploading(true)
      const result = await uploadGradeFile({ assignmentId, academicYear: year, quarter, file })
      if (result?.success) {
        toast.success(`${result.data?.saved || 0} grades imported from Excel successfully!`)
        const data = await getGradeRoster({ assignmentId, academicYear: year, quarter })
        setRoster((data.students || []).map((student) => ({ ...student, score: student.grade?.score ?? '' })))
      } else if (result?.error?.details) {
        setUploadErrors(result.error.details)
        toast.error(result.error.message || 'Some rows failed validation')
      } else {
        toast.error(result?.error?.message || 'Upload failed')
      }
    } catch (e) {
      toast.error(e.message || 'Excel upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const copyFromPreviousQuarter = async () => {
    if (!assignmentId || Number(quarter) <= 1) return

    try {
      setCopying(true)
      const previousQuarterRoster = await getGradeRoster({ assignmentId, academicYear: year, quarter: Number(quarter) - 1 })
      setRoster((rows) => applyPreviousQuarterScores(rows, previousQuarterRoster.students || []))
      toast.info(`Copied baseline scores from Quarter ${Number(quarter) - 1}.`)
    } catch (e) {
      toast.error(e.message || 'Failed to copy previous grades')
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="container">
      {/* 1. Header Banner */}
      <div className="section-header">
        <div>
          <span className="subtitle">Evaluation & Academic Records</span>
          <h1 className="title">
            {chosen ? `${chosen.class.name} · ${chosen.subject.name}` : 'Grade Entry'}
          </h1>
        </div>
      </div>

      {/* 2. Quick Course Switcher Pills */}
      {assignments.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}>
          {assignments.map((a) => {
            const isSelected = String(a.id) === String(assignmentId)
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAssignmentId(String(a.id))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isSelected ? '1.5px solid var(--navy-primary, #0f2744)' : '1px solid var(--border-color, #cbd5e1)',
                  background: isSelected ? 'var(--navy-primary, #0f2744)' : 'var(--bg-surface, #ffffff)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary, #0f172a)',
                  fontWeight: isSelected ? '600' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 2px 6px rgba(15, 39, 68, 0.15)' : 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: isSelected ? '#93C5FD' : 'inherit' }}>menu_book</span>
                <span>{a.class.name}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>({a.subject.name})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* 3. Assignment & Quarter Selectors */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div className="input-label" style={{ margin: 0 }}>
            <span className="label-caps">Teaching Assignment</span>
            <select 
              className="select-field" 
              value={assignmentId} 
              onChange={(e) => setAssignmentId(e.target.value)}
            >
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.class.name} · {assignment.subject.name}
                </option>
              ))}
            </select>
          </div>

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

      {/* 4. Live Stats KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span>Entered Scores</span>
          <strong>{stats.enteredCount} / {stats.totalStudents}</strong>
        </div>
        <div className="stat-card">
          <span>Pending Scores</span>
          <strong style={{ color: stats.blankCount > 0 ? 'var(--gold-accent)' : 'var(--status-present-text)' }}>
            {stats.blankCount}
          </strong>
        </div>
        <div className="stat-card">
          <span>Class Average</span>
          <strong>{stats.average !== null ? `${stats.average.toFixed(1)}%` : '—'}</strong>
        </div>
        <div className="stat-card">
          <span>Score Distribution</span>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--status-present-text)', fontWeight: '600' }}>A: {gradeDistribution.A}</span>
            <span style={{ color: '#3B82F6', fontWeight: '600' }}>B: {gradeDistribution.B}</span>
            <span style={{ color: 'var(--gold-accent)', fontWeight: '600' }}>C: {gradeDistribution.C}</span>
            <span style={{ color: 'var(--status-absent-text)', fontWeight: '600' }}>F: {gradeDistribution.F}</span>
          </div>
        </div>
      </div>

      {/* 5. Batch Operations & Excel Toolbar */}
      {roster.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div className="search-wrapper" style={{ minWidth: '220px', flex: 1 }}>
              <span className="material-symbols-outlined search-icon">search</span>
              <input 
                className="search-field" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Search student in roster..." 
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="admin-icon-btn"
                  style={{ width: '24px', height: '24px', position: 'absolute', right: '10px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input 
                  type="number" 
                  className="input-field" 
                  min="0" 
                  max="100" 
                  value={fillValue} 
                  onChange={(e) => setFillValue(e.target.value)} 
                  placeholder="Score" 
                  style={{ width: '80px', padding: '8px 10px' }} 
                />
                <button type="button" className="btn-secondary" onClick={applyFillValue} style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
                  Fill All
                </button>
              </div>

              {Number(quarter) > 1 && (
                <button 
                  type="button" 
                  className="btn-ghost" 
                  onClick={copyFromPreviousQuarter} 
                  disabled={copying}
                  style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                  Copy Q{Number(quarter) - 1}
                </button>
              )}

              <button 
                type="button" 
                className="btn-ghost" 
                onClick={handleDownloadTemplate} 
                disabled={downloading}
                style={{ padding: '8px 12px', fontSize: '0.82rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--status-present-text)' }}>download</span>
                Excel Template
              </button>

              <label className="btn-ghost" style={{ padding: '8px 12px', fontSize: '0.82rem', cursor: 'pointer', margin: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--navy-primary)' }}>upload_file</span>
                {uploading ? 'Importing…' : 'Import Excel'}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUploadFile} 
                  accept=".xlsx,.xls" 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>

          {uploadErrors.length > 0 && (
            <div className="error" style={{ marginTop: '14px' }}>
              <strong>Upload Validation Errors:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: '20px', fontSize: '0.85rem' }}>
                {uploadErrors.map((err, i) => (
                  <li key={i}>{typeof err === 'string' ? err : `${err.student || 'Row'}: ${err.message || 'Invalid score'}`}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 6. Grades Roster Grid */}
      {loading ? (
        <CardSkeleton lines={5} />
      ) : visibleRoster.length > 0 ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          {visibleRoster.map((student) => {
            const scoreNum = Number(student.score)
            const isValid = student.score !== '' && !isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100

            return (
              <div 
                key={student.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 18px',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar" style={{ width: '38px', height: '38px', fontSize: '0.85rem' }}>
                    <span style={{ fontFamily: 'var(--font-headline)', fontWeight: '700', color: 'var(--navy-primary)' }}>
                      {(student.name || 'S')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="student-name" style={{ margin: 0, fontSize: '0.95rem' }}>{student.name}</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Student ID #{student.id}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isValid && (
                    <span className={`status-pill ${scoreNum >= 80 ? 'present' : scoreNum >= 60 ? 'late' : 'absent'}`} style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                      {scoreNum >= 90 ? 'A+' : scoreNum >= 80 ? 'A' : scoreNum >= 70 ? 'B' : scoreNum >= 60 ? 'C' : scoreNum >= 50 ? 'D' : 'F'}
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      className="input-field"
                      value={student.score}
                      onChange={(e) => {
                        const val = e.target.value
                        setRoster((prev) => prev.map((r) => r.id === student.id ? { ...r, score: val } : r))
                      }}
                      placeholder="0 - 100"
                      style={{ width: '85px', textAlign: 'center', fontWeight: '700', fontSize: '0.95rem', padding: '6px 8px' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>
            school
          </span>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
            {searchTerm ? 'No matching students found.' : 'No students found in this course assignment.'}
          </p>
        </div>
      )}

      {/* 7. Bottom Sticky Save Toolbar */}
      {roster.length > 0 && (
        <div className="submit-panel" style={{ marginTop: '24px' }}>
          <div className="summary">
            {stats.blankCount === 0 ? (
              <span style={{ color: 'var(--status-present-text)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                All {stats.totalStudents} grades entered
              </span>
            ) : (
              <span style={{ color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                {stats.blankCount} students still pending scores
              </span>
            )}
          </div>

          <button 
            type="button" 
            className="btn-primary" 
            onClick={save} 
            disabled={saving || roster.length === 0}
            style={{ minWidth: '180px' }}
          >
            <span className="material-symbols-outlined">save</span>
            {saving ? 'Saving Records…' : 'Save All Grades'}
          </button>
        </div>
      )}
    </div>
  )
}
