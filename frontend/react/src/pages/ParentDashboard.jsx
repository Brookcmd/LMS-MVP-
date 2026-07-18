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

  const unreadCount = items.filter(item => !item.readAt).length

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Parent dashboard</span>
          <h1 className="title">{user?.name || 'Welcome'}</h1>
        </div>
        <span className="status-pill" style={{ background: '#d8f3ec', color: '#005049' }}>{unreadCount} alerts</span>
      </div>

      <div className="metric-grid">
        <div className="stats-card">
          <strong>{items.length}</strong>
          <span>Notifications</span>
        </div>
        <div className="stats-card">
          <strong>{unreadCount}</strong>
          <span>Unread</span>
        </div>
        <div className="stats-card">
          <strong>{items.length > 0 ? items.slice(0, 3).filter(i => !i.readAt).length : 0}</strong>
          <span>New</span>
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

      <div className="glass-card section">
        <div className="section-header" style={{ marginBottom: 18 }}>
          <div>
            <span className="subtitle">Recent alerts</span>
            <h2 className="title">Latest activity</h2>
          </div>
        </div>
        {loading ? (
          <div className="loader">Loading alerts…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No recent alerts yet.</div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 3).map(item => (
              <div key={item.id} className="event-card" style={{ opacity: item.readAt ? 0.7 : 1 }}>
                <div className="event-meta">
                  <span className="event-status" style={{ background: item.type === 'absence' ? '#ffdad6' : '#f4f6fb', color: item.type === 'absence' ? '#ba1a1a' : '#475569' }}>
                    {item.type?.toUpperCase() || 'INFO'}
                  </span>
                  <span style={{ color: '#475569', fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 style={{ margin: '8px 0 6px' }}>{item.message}</h3>
                <p style={{ margin: 0, color: '#475569' }}>{item.description || `${item.student?.name || 'A student'} attendance update.`}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h2 className="title">Monthly calendar</h2>
        <div className="card section" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, color: '#6b7280', fontSize: 12, marginBottom: 8 }}>
            {['M','T','W','T','F','S','S'].map(day => <div key={day} style={{ textAlign: 'center' }}>{day}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 10, color: '#6b7280', fontSize: 14 }}>
            {Array.from({ length: 30 }, (_, index) => {
              const day = index + 1
              const isToday = day === new Date().getDate()
              const dot = [4, 9, 10, 11].includes(day)
              return (
                <div key={day} style={{ padding: 12, borderRadius: 18, background: isToday ? '#091426' : 'transparent', color: isToday ? '#fff' : day <= 6 ? '#9ca3af' : '#111827', textAlign: 'center' }}>
                  <div>{day}</div>
                  {dot && <div style={{ width: 6, height: 6, borderRadius: '50%', margin: '8px auto 0', background: day === 9 ? '#ba1a1a' : day === 4 ? '#4648d4' : '#28a094' }}></div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
