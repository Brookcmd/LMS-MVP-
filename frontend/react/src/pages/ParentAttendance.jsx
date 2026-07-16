import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getChildAttendanceHistory } from '../api/apiClient'

function useQuery(){ return new URLSearchParams(useLocation().search) }

export default function ParentAttendance(){
  const { user } = useAuth()
  const q = useQuery()
  const defaultStudent = q.get('studentId') || ''
  const [studentId,setStudentId]=React.useState(defaultStudent)
  const [from,setFrom]=React.useState('')
  const [to,setTo]=React.useState('')
  const [data,setData]=React.useState(null)
  const [loading,setLoading]=React.useState(false)
  const [error,setError]=React.useState(null)

  async function load(){
    if(!studentId) {
      setError('Student ID is required')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await getChildAttendanceHistory({ studentId, from: from || undefined, to: to || undefined })
      setData(res)
    } catch (err) {
      setError(err?.message ?? 'Unable to load attendance history')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!user || !defaultStudent) return
    load()
  }, [user, defaultStudent])

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Attendance</span>
          <h1 className="title">Student history</h1>
        </div>
      </div>

      <div className="card section">
        <div className="form-row">
          <label className="input-label">
            Student ID
            <input className="input-field" placeholder="Student ID" value={studentId} onChange={e=>setStudentId(e.target.value)} />
          </label>
          <label className="input-label">
            From
            <input className="input-field" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          </label>
          <label className="input-label">
            To
            <input className="input-field" type="date" value={to} onChange={e=>setTo(e.target.value)} />
          </label>
          <button className="btn-secondary" type="button" onClick={load}>Load</button>
        </div>
        {error && <div className="error" style={{ color: '#ba1a1a', marginTop: 12 }}>{error}</div>}
      </div>

      {loading ? (
        <div className="loader">Loading…</div>
      ) : data ? (
        <div className="space-y-4">
          <div className="card">
            <div className="section-header">
              <div>
                <span className="subtitle">{data.student.name}</span>
                <h2 className="title">{data.student.class?.name || 'Class info'}</h2>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {data.attendance.map(a => (
              <div key={a.id} className="event-card">
                <div className="event-meta">
                  <span className="event-status" style={{ background: a.status === 'absent' ? '#ffdad6' : a.status === 'late' ? '#eef2ff' : '#e0f2f1', color: a.status === 'absent' ? '#ba1a1a' : a.status === 'late' ? '#4648d4' : '#00695c' }}>
                    {a.status?.toUpperCase() || 'UNMARKED'}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: 12 }}>{new Date(a.date).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0, color: '#475569' }}>{a.notes || 'No notes available.'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
