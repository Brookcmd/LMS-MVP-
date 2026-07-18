import React from 'react'
import { useAuth } from '../auth/AuthContext'
import { listNotifications, markNotificationRead } from '../api/apiClient'

export default function Notifications(){
  const { user } = useAuth()
  const [items,setItems]=React.useState([])
  const [loading,setLoading]=React.useState(false)
  const [error,setError]=React.useState(null)
  const [markingAll,setMarkingAll]=React.useState(false)

  React.useEffect(()=>{
    async function load(){
      if(!user) return
      setLoading(true)
      setError(null)
      try {
        const data = await listNotifications()
        setItems(data)
      } catch (err) {
        setError(err?.message ?? 'Unable to load notifications')
      } finally {
        setLoading(false)
      }
    }
    load()
  },[user])

  async function handleMarkRead(notificationId){
    try {
      await markNotificationRead(notificationId)
      setItems(items.map(item => item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item))
    } catch (err) {
      setError(err?.message ?? 'Unable to mark notification read')
    }
  }

  async function handleMarkAllRead(){
    const unread = items.filter(item => !item.readAt).map(item => item.id)
    if (unread.length === 0) return

    setError(null)
    setMarkingAll(true)
    try {
      await Promise.all(unread.map(id => markNotificationRead(id)))
      setItems(items.map(item => item.readAt ? item : { ...item, readAt: new Date().toISOString() }))
    } catch (err) {
      setError(err?.message ?? 'Unable to mark all read')
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = items.filter(item => !item.readAt).length

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Center</span>
          <h1 className="title">Activity</h1>
        </div>
        <button className="btn-ghost" type="button" onClick={handleMarkAllRead} disabled={unreadCount === 0 || markingAll}>
          {markingAll ? 'Marking...' : `Mark all read (${unreadCount})`}
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: 16, color: '#ba1a1a' }}>{error}</div>}

      <div className="space-y-4">
        {loading ? (
          <div className="loader">Loading notifications…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No notifications available.</div>
        ) : (
          items.map(n => {
            const status = n.type?.toLowerCase() || 'info'
            const badgeStyles = {
              absence: { background: '#ffdad6', color: '#ba1a1a' },
              late: { background: '#eef2ff', color: '#4648d4' },
              event: { background: '#f4f6fb', color: '#475569' },
              approved: { background: '#e0f2f1', color: '#00695c' },
              default: { background: '#f4f6fb', color: '#475569' },
            }
            const badge = badgeStyles[status] || badgeStyles.default
            return (
              <div key={n.id} className="glass-card" style={{ padding: 20, position: 'relative', opacity: n.readAt ? 0.75 : 1 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: status === 'absence' ? '#ba1a1a' : status === 'late' ? '#4648d4' : status === 'approved' ? '#28a094' : '#c5c6cd' }} />
                <div style={{ marginLeft: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <span style={{ ...badge, borderRadius: 999, padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>{n.title || n.type || 'Notification'}</span>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#091426' }}>{n.message}</h2>
                  <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>{n.description || 'No additional details.'}</p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btn-primary" style={{ flex: 1 }}>Verify Status</button>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={() => handleMarkRead(n.id)} disabled={Boolean(n.readAt)}>
                      {n.readAt ? 'Read' : 'Mark Read'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
