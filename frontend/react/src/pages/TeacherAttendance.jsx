import React from 'react'
import { getAttendanceByClass, markAttendanceBatch } from '../api/apiClient'

export default function TeacherAttendance(){
  const [classId,setClassId]=React.useState('10')
  const [date,setDate]=React.useState(new Date().toISOString().slice(0,10))
  const [records,setRecords]=React.useState([])
  const [loading,setLoading]=React.useState(false)
  const [error,setError]=React.useState(null)
  const [searchTerm,setSearchTerm]=React.useState('')

  async function load(){
    if (!classId || !date) {
      setError('Class ID and date are required')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const data = await getAttendanceByClass({ classId, date })
      setRecords(data.map(record => ({ ...record, status: record.status || 'unmarked' })))
    } catch (err) {
      setError(err?.message ?? 'Unable to load attendance')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [classId, date])

  async function submit(){
    if (records.length === 0) {
      setError('No attendance records to submit')
      return
    }

    const unmarkedCount = records.filter(r => !['present', 'absent', 'late'].includes(r.status)).length
    if (unmarkedCount > 0) {
      setError(`Please mark all students before submitting. ${unmarkedCount} still unmarked.`)
      return
    }

    setError(null)
    try {
      const marks = records.map(r => ({ studentId: r.student.id, status: r.status }))
      const res = await markAttendanceBatch({ classId: Number(classId), date, marks })
      alert(`Saved attendance: ${res.created} created, ${res.updated} updated, ${res.notificationsCreated ?? 0} notifications`)
    } catch (err) {
      setError(err?.message ?? 'Unable to submit attendance')
    }
  }

  function updateStatus(studentId, status) {
    setRecords(records.map(record => record.student.id === studentId ? { ...record, status } : record))
  }

  const filteredRecords = records.filter(r => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true
    return r.student.name.toLowerCase().includes(term) || String(r.student.id).includes(term)
  })

  const presentCount = records.filter(r => r.status === 'present').length
  const absentCount = records.filter(r => r.status === 'absent').length

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Current class</span>
          <h1 className="title">Class {classId} attendance</h1>
        </div>
        <div className="class-summary">
          <div className="summary-item">
            <strong>{records.length}</strong>
            <span>Total</span>
          </div>
          <div className="summary-item">
            <strong>{presentCount}</strong>
            <span>Here</span>
          </div>
        </div>
      </div>

      <div className="card section">
        <div className="form-row">
          <label className="input-label">
            Class ID
            <input className="input-field" value={classId} onChange={e => setClassId(e.target.value)} />
          </label>
          <label className="input-label">
            Date
            <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
          <button className="btn-secondary" type="button" onClick={load}>Load</button>
        </div>
      </div>

      <div className="section">
        <div className="search-wrapper">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            className="search-field"
            placeholder="Search student name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error" style={{ color: '#ba1a1a', marginBottom: 18 }}>{error}</div>}

      {loading ? (
        <div className="loader">Loading attendance…</div>
      ) : filteredRecords.length === 0 ? (
        <div className="empty-state">No attendance records found for this class and date.</div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map(r => (
            <div key={r.student.id} className="student-card">
              <div className="card-body">
                <div className="student-meta">
                  <div className="avatar">
                    <img src={r.student.avatarUrl || 'https://via.placeholder.com/150'} alt={r.student.name} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="student-name">{r.student.name}</p>
                    <p className="student-roll">ID: {r.student.id}</p>
                  </div>
                  <span className={`status-pill ${r.status === 'present' ? 'present' : r.status === 'absent' ? 'absent' : r.status === 'late' ? 'late' : 'unmarked'}`}>
                    {r.status?.toUpperCase() || 'UNMARKED'}
                  </span>
                </div>
                <div className="status-actions">
                  <button type="button" className={r.status === 'present' ? 'active' : ''} onClick={() => updateStatus(r.student.id, 'present')}>
                    <span className="material-symbols-outlined">check_circle</span>
                    Present
                  </button>
                  <button type="button" className={`absent ${r.status === 'absent' ? 'active' : ''}`} onClick={() => updateStatus(r.student.id, 'absent')}>
                    <span className="material-symbols-outlined">cancel</span>
                    Absent
                  </button>
                  <button type="button" className={`late ${r.status === 'late' ? 'active' : ''}`} onClick={() => updateStatus(r.student.id, 'late')}>
                    <span className="material-symbols-outlined">schedule</span>
                    Late
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="submit-panel">
        <div className="summary">{presentCount} Present · {absentCount} Absent</div>
        <button className="btn-primary" type="button" onClick={submit} disabled={records.length === 0}>Submit</button>
      </div>
    </div>
  )
}
