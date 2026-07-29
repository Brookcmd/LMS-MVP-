import React from 'react'
import { getParentGrades, listParentStudents } from '../api/apiClient'

const currentYear = `${new Date().getFullYear()}/${String((new Date().getFullYear() + 1) % 100).padStart(2, '0')}`
const quarterOptions = [1, 2, 3, 4]

export default function ParentGrades() {
  const [students, setStudents] = React.useState([])
  const [studentId, setStudentId] = React.useState('')
  const [year, setYear] = React.useState(currentYear)
  const [quarter, setQuarter] = React.useState('1')
  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let active = true
    setLoading(true)
    listParentStudents()
      .then((items) => {
        if (!active) return
        setStudents(items)
        setStudentId(items[0] ? String(items[0].id) : '')
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
  }, [])

  React.useEffect(() => {
    if (!studentId) {
      setData(null)
      return
    }

    let active = true
    setLoading(true)
    getParentGrades({ studentId, academicYear: year, quarter })
      .then((payload) => {
        if (!active) return
        setData(payload)
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
  }, [studentId, year, quarter])

  const result = data?.result

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Grades</span>
          <h1 className="title">Quarterly results</h1>
        </div>
      </div>

      <div className="card section">
        <div className="form-row">
          <label className="input-label">
            Student
            <select className="input-field" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </label>
          <label className="input-label">
            Academic year
            <input className="input-field" value={year} onChange={(e) => setYear(e.target.value)} />
          </label>
          <label className="input-label">
            Quarter
            <select className="input-field" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
              {quarterOptions.map((value) => (
                <option key={value} value={String(value)}>{value}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading && !data ? (
        <div className="loader">Loading grades…</div>
      ) : null}

      {!loading && !error && result && (
        <>
          <div className="card section">
            <div className="event-meta">
              <div>
                <span className="subtitle">Student report</span>
                <h2 className="title">{result.student.name}</h2>
              </div>
              <span className="status-pill present">Quarter {quarter}</span>
            </div>
            <div className="class-summary" style={{ marginTop: 16 }}>
              <div className="summary-item">
                <strong>{result.average?.toFixed(1) ?? '—'}</strong>
                <span>Average</span>
              </div>
              <div className="summary-item">
                <strong>{result.rank ?? '—'}</strong>
                <span>Class rank</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {result.subjectScores?.length ? (
              result.subjectScores.map((row) => (
                <div className="event-card" key={row.subject.id}>
                  <div className="event-meta">
                    <strong>{row.subject.name}</strong>
                    <span className="status-pill present">{row.score}/100</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No grades saved for this quarter yet.</div>
            )}
          </div>
        </>
      )}

      {!loading && !error && !result && studentId && (
        <div className="empty-state">No grade data is available for this selection yet.</div>
      )}
    </div>
  )
}

