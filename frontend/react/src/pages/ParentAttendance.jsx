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
    <div className="container">
      <h2>Parent Attendance History</h2>
      <div className="card" style={{marginTop:8}}>
        <div style={{display:'flex',gap:8, flexWrap:'wrap'}}>
          <input placeholder="Student ID" value={studentId} onChange={e=>setStudentId(e.target.value)} />
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} />
          <button onClick={load}>Load</button>
        </div>
        {error && <div style={{marginTop:12,color:'red'}}>{error}</div>}
        {loading ? (
          <div style={{marginTop:12}}>Loading…</div>
        ) : data ? (
          <div style={{marginTop:12}}>
            <div><strong>{data.student.name}</strong> — {data.student.class.name}</div>
            <div style={{marginTop:8}}>
              {data.attendance.map(a=> (
                <div key={a.id} style={{padding:8,borderBottom:'1px solid #eee'}}>
                  <div>{new Date(a.date).toISOString().slice(0,10)} — {a.status}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
