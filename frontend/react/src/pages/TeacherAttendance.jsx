import React from 'react'
import { getAttendanceByClass, markAttendanceBatch } from '../api/apiClient'

export default function TeacherAttendance(){
  const [classId,setClassId]=React.useState('10')
  const [date,setDate]=React.useState(new Date().toISOString().slice(0,10))
  const [records,setRecords]=React.useState([])
  const [loading,setLoading]=React.useState(false)
  const [error,setError]=React.useState(null)

  async function load(){
    setError(null)
    setLoading(true)
    try {
      const data = await getAttendanceByClass({ classId, date })
      setRecords(data.map(record => ({ ...record, status: record.status })))
    } catch (err) {
      setError(err?.message ?? 'Unable to load attendance')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  async function submit(){
    setError(null)
    try {
      const marks = records.map(r=>({ studentId: r.student.id, status: r.status }))
      const res = await markAttendanceBatch({ classId, date, marks })
      alert(`Saved attendance: ${res.created} created, ${res.updated} updated, ${res.notificationsCreated} notifications`)
    } catch (err) {
      setError(err?.message ?? 'Unable to submit attendance')
    }
  }

  function updateStatus(recordId, status) {
    setRecords(records.map(record => record.id === recordId ? { ...record, status } : record))
  }

  return (
    <div className="container">
      <h2>Teacher Attendance</h2>
      <div className="card" style={{marginTop:8}}>
        <div style={{display:'flex',gap:8, flexWrap:'wrap'}}>
          <input value={classId} onChange={e=>setClassId(e.target.value)} placeholder="Class ID" />
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <button onClick={load}>Load</button>
        </div>
        {error && <div style={{marginTop:12,color:'red'}}>{error}</div>}
        {loading ? (
          <div style={{marginTop:12}}>Loading attendance…</div>
        ) : records.length === 0 ? (
          <div style={{marginTop:12}}>No attendance records found for this class and date.</div>
        ) : (
          <div style={{marginTop:12}}>
            {records.map(r=> (
              <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:8,borderBottom:'1px solid #eee'}}>
                <div>{r.student.name}</div>
                <select value={r.status} onChange={e=>updateStatus(r.id, e.target.value)}>
                  <option value="present">present</option>
                  <option value="absent">absent</option>
                  <option value="late">late</option>
                </select>
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:12}}><button onClick={submit} disabled={records.length===0}>Submit Marks</button></div>
      </div>
    </div>
  )
}
