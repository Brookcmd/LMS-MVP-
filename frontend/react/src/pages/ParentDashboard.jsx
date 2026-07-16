import React from 'react'
import { useAuth } from '../auth/AuthContext'
import { listNotifications } from '../api/apiClient'

export default function ParentDashboard(){
  const { user } = useAuth()
  const [items,setItems]=React.useState([])
  const [loading,setLoading]=React.useState(false)
  const [error,setError]=React.useState(null)

  React.useEffect(()=>{
    async function load(){
      if(!user) return
      setLoading(true)
      setError(null)
      try {
        const data = await listNotifications()
        setItems(data)
      } catch (err) {
        setError(err?.message ?? 'Unable to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  },[user])

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Student overview</span>
          <h1 className="title">Leo Harrison</h1>
        </div>
        <span className="status-pill" style={{ background: '#d8f3ec', color: '#005049' }}>GRADE 4-B</span>
      </div>

      <div className="metric-grid">
        <div className="stats-card">
          <strong>98%</strong>
          <span>Present</span>
        </div>
        <div className="stats-card">
          <strong>2</strong>
          <span>Late</span>
        </div>
        <div className="stats-card">
          <strong>1</strong>
          <span>Absent</span>
        </div>
      </div>

      <div className="glass-card section">
        <h2 className="title" style={{ fontSize: '1rem', marginBottom: 16 }}>Quick Actions</h2>
        <div className="space-y-3">
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            Report Absence
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            Request Early Leave
            <span className="material-symbols-outlined">schedule</span>
          </button>
          <div style={{ background: '#f4f6fb', borderRadius: '18px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#4648d4' }}>info</span>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.5 }}>School picnic scheduled for Friday, Oct 27.</p>
          </div>
        </div>
      </div>

      <div className="card section">
        <div className="section-header" style={{ marginBottom: 18 }}>
          <div>
            <span className="subtitle">October 2023</span>
            <h2 className="title">Monthly calendar</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-button"><span className="material-symbols-outlined">chevron_left</span></button>
            <button className="icon-button"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, color: '#6b7280', fontSize: 12, marginBottom: 8 }}>
          {['M','T','W','T','F','S','S'].map(day => <div key={day} style={{ textAlign: 'center' }}>{day}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 10, color: '#6b7280', fontSize: 14 }}>
          {Array.from({ length: 30 }, (_, index) => {
            const day = index + 1
            const isToday = day === 11
            const dot = [4, 9, 10, 11].includes(day)
            return (
              <div key={day} style={{ padding: 12, borderRadius: 18, background: isToday ? '#091426' : 'transparent', color: isToday ? '#fff' : day <= 6 ? '#9ca3af' : '#111827', textAlign: 'center' }}>
                <div>{day}</div>
                {dot && <div style={{ width: 6, height: 6, borderRadius: '50%', margin: '8px auto 0', background: day === 9 ? '#ba1a1a' : day === 4 ? '#4648d4' : '#28a094' }}></div>}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center', color: '#6b7280', fontSize: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28a094' }}></span>Present</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4648d4' }}></span>Late</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ba1a1a' }}></span>Absent</span>
        </div>
      </div>

      <div className="section">
        <h2 className="title">Recent events</h2>
        <div className="space-y-4" style={{ marginTop: 16 }}>
          <div className="event-card">
            <div className="event-meta">
              <span className="event-status" style={{ background: '#e0f2f1', color: '#00695c' }}>On-Time Arrival</span>
              <span style={{ color: '#475569', fontSize: 12 }}>Oct 11, 08:24 AM</span>
            </div>
            <h3>On-Time Arrival</h3>
            <p>Leo arrived on time for homeroom and was marked present.</p>
          </div>
          <div className="event-card">
            <div className="event-meta">
              <span className="event-status" style={{ background: '#eef2ff', color: '#4648d4' }}>Late</span>
              <span style={{ color: '#475569', fontSize: 12 }}>Oct 10, 08:52 AM</span>
            </div>
            <h3>Late Arrival</h3>
            <p>Mia checked in late due to traffic.</p>
          </div>
          <div className="event-card">
            <div className="event-meta">
              <span className="event-status" style={{ background: '#ffdad6', color: '#ba1a1a' }}>Unexcused</span>
              <span style={{ color: '#475569', fontSize: 12 }}>Oct 09</span>
            </div>
            <h3>Full Day Absence</h3>
            <p>Student was absent for the full day.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
