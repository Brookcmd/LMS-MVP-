import React from 'react'
import { useAuth } from '../auth/AuthContext'
import { listNotifications, markNotificationRead } from '../api/apiClient'

export default function Notifications(){
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

  return (
    <div className="container">
      <h2>Notifications</h2>
      {error && <div className="error" style={{marginBottom:12,color:'red'}}>{error}</div>}
      {loading ? (
        <p>Loading notifications…</p>
      ) : items.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        items.map(n=> (
          <div key={n.id} className="card" style={{marginTop:8}}>
            <div style={{display:'flex',justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
              <div>{n.message}</div>
              <div style={{fontSize:12,color:'#666'}}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            <div style={{marginTop:8, display:'flex', gap:8}}>
              {n.readAt ? <span style={{color:'#4a4'}}>Read</span> : <button onClick={()=>handleMarkRead(n.id)}>Mark read</button>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
