import React from 'react'
import { getGradeRoster, listTeachingAssignments, saveGrades } from '../api/apiClient'
import { getGradeStats, filterRosterBySearch, applyPreviousQuarterScores } from './gradeUtils.mjs'

const currentYear = `${new Date().getFullYear()}/${String((new Date().getFullYear() + 1) % 100).padStart(2, '0')}`
const quarterOptions = [1, 2, 3, 4]

export default function TeacherGrades() {
  const [assignments, setAssignments] = React.useState([])
  const [assignmentId, setAssignmentId] = React.useState('')
  const [year, setYear] = React.useState(currentYear)
  const [quarter, setQuarter] = React.useState('1')
  const [roster, setRoster] = React.useState([])
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [savedMessage, setSavedMessage] = React.useState('')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [fillValue, setFillValue] = React.useState('')
  const [copying, setCopying] = React.useState(false)

  React.useEffect(() => {
    listTeachingAssignments()
      .then((data) => {
        setAssignments(data)
        if (data[0]) setAssignmentId(String(data[0].id))
      })
      .catch((e) => setError(e.message))
  }, [])

  React.useEffect(() => {
    if (!assignmentId) {
      setRoster([])
      return
    }

    let active = true
    setLoading(true)
    setSavedMessage('')
    getGradeRoster({ assignmentId, academicYear: year, quarter })
      .then((data) => {
        if (!active) return
        setRoster(data.students.map((student) => ({ ...student, score: student.grade?.score ?? '' })))
        setError('')
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
  }, [assignmentId, year, quarter])

  const save = async () => {
    try {
      setError('')
      setSaving(true)
      const normalized = roster.map((student) => ({ studentId: student.id, score: Number(student.score) }))
      const hasInvalidScore = normalized.some((entry) => !Number.isInteger(entry.score) || entry.score < 0 || entry.score > 100)
      if (hasInvalidScore) {
        throw new Error('Enter a whole number from 0 to 100 for each student')
      }

      await saveGrades({ assignmentId, academicYear: year, quarter: Number(quarter), grades: normalized })
      setSavedMessage('Grades saved for this quarter.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const chosen = assignments.find((assignment) => String(assignment.id) === assignmentId)
  const visibleRoster = filterRosterBySearch(roster, searchTerm)
  const stats = getGradeStats(roster)

  const applyFillValue = () => {
    if (fillValue === '') return
    const value = fillValue
    setRoster((rows) => rows.map((row) => ({ ...row, score: value })))
    setSavedMessage('')
  }

  const copyFromPreviousQuarter = async () => {
    if (!assignmentId || Number(quarter) <= 1) return

    try {
      setError('')
      setCopying(true)
      const previousQuarterRoster = await getGradeRoster({ assignmentId, academicYear: year, quarter: Number(quarter) - 1 })
      setRoster((rows) => applyPreviousQuarterScores(rows, previousQuarterRoster.students || []))
      setSavedMessage('Copied scores from the previous quarter.')
    } catch (e) {
      setError(e.message)
    } finally {
      setCopying(false)
    }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Grades</span>
          <h1 className="title">Enter quarterly grades</h1>
        </div>
      </div>

      <div className="card section grade-summary-card">
        <div className="grade-summary-top">
          <div>
            <p className="label-caps">Current assignment</p>
            <h2 className="title">{chosen ? `${chosen.class.name} · ${chosen.subject.name}` : 'Choose a teaching assignment'}</h2>
            <p className="summary">Quarter {quarter} · {year}</p>
          </div>
          <div className="chip">Grade entry</div>
        </div>

        <div className="form-row" style={{ marginTop: 20, gap: 16, alignItems: 'flex-end' }}>
          <label className="input-label" style={{ flex: 1 }}>
            <span className="label-caps">Class and subject</span>
            <select className="input-field" value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>{assignment.class.name} · {assignment.subject.name}</option>
              ))}
            </select>
          </label>
          <label className="input-label" style={{ flex: 1 }}>
            <span className="label-caps">Academic year</span>
            <input className="input-field" value={year} onChange={(e) => setYear(e.target.value)} />
          </label>
          <label className="input-label" style={{ flex: 0.6 }}>
            <span className="label-caps">Quarter</span>
            <select className="input-field" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
              {quarterOptions.map((value) => (
                <option key={value} value={String(value)}>{value}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {savedMessage && <div className="success">{savedMessage}</div>}

      <div className="stats-grid section">
        <div className="stat-card">
          <span className="label-caps">Entered</span>
          <strong>{stats.enteredCount}</strong>
        </div>
        <div className="stat-card">
          <span className="label-caps">Blank</span>
          <strong>{stats.blankCount}</strong>
        </div>
        <div className="stat-card">
          <span className="label-caps">Average</span>
          <strong>{stats.average !== null ? stats.average.toFixed(1) : '—'}</strong>
        </div>
      </div>

      {roster.length > 0 && (
        <div className="card section toolbar-card">
          <div className="toolbar-actions">
            <label className="input-label" style={{ flex: 1 }}>
              <span className="label-caps">Search students</span>
              <input className="input-field" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Type a name" />
            </label>
            <label className="input-label" style={{ flex: 1 }}>
              <span className="label-caps">Fill visible rows</span>
              <input className="input-field" type="number" min="0" max="100" value={fillValue} onChange={(e) => setFillValue(e.target.value)} placeholder="e.g. 85" />
            </label>
          </div>
          <div className="action-row" style={{ marginTop: 18, justifyContent: 'space-between', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <div className="toolbar-actions" style={{ gap: 12 }}>
              <button className="btn-secondary" type="button" onClick={applyFillValue}>Apply fill value</button>
              <button className="btn-secondary" type="button" onClick={copyFromPreviousQuarter} disabled={copying || Number(quarter) <= 1}>
                {copying ? 'Copying…' : 'Copy from previous quarter'}
              </button>
            </div>
            <div className="summary">{roster.length} students · {stats.enteredCount} entered</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loader">Loading grades…</div>
      ) : (
        <div className="space-y-3">
          {visibleRoster.length ? (
            visibleRoster.map((student, index) => (
              <div className="card student-card" key={student.id}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 0 }}>
                  <div style={{ flex: 1 }}>
                    <p className="student-name">{student.name}</p>
                    <p className="student-roll">Student {index + 1}</p>
                  </div>
                  <label className="input-label" style={{ minWidth: 160 }}>
                    <span className="label-caps">Score</span>
                    <input
                      className="input-field"
                      type="number"
                      min="0"
                      max="100"
                      value={student.score}
                      onChange={(e) => setRoster((rows) => rows.map((row) => row.id === student.id ? { ...row, score: e.target.value } : row))}
                    />
                  </label>
                </div>
              </div>
            ))
          ) : roster.length ? (
            <div className="empty-state">No students match that search.</div>
          ) : (
            <div className="empty-state">No students are available for this assignment yet.</div>
          )}
        </div>
      )}

      <div className="submit-panel">
        <div className="summary">{roster.length ? `${roster.length} students ready for grade entry` : 'Select an assignment to begin'}</div>
        <button className="btn-primary" disabled={!roster.length || saving} onClick={save}>
          {saving ? 'Saving…' : 'Save grades'}
        </button>
      </div>
    </div>
  )
}

