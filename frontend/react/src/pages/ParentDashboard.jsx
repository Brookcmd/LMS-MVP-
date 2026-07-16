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
    <div className="container">
      <h2>Parent Dashboard</h2>
      <div className="card" style={{marginTop:8}}>
        <h3>Recent Notifications</h3>
        {error && <div style={{color:'red', marginBottom:12}}>{error}</div>}
        {loading ? (
          <p>Loading…</p>
        ) : items.length === 0 ? (
          <p>No recent notifications.</p>
        ) : (
          items.slice(0,5).map(n=> <div key={n.id} style={{padding:8,borderBottom:'1px solid #eee'}}>{n.message}</div>)
        )}
      </div>
    </div>
  )
}
