import React from 'react'
import { useAuth } from '../auth/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  if (!user) {
    return <div className="container"><p>Profile not available.</p></div>
  }

  return (
    <div className="container">
      <div className="section-header">
        <div>
          <span className="subtitle">Your profile</span>
          <h1 className="title">Account details</h1>
        </div>
      </div>
      <div className="card">
        <div className="event-card">
          <div className="event-meta">
            <div>
              <p className="subtitle">Name</p>
              <p>{user.name || user.email}</p>
            </div>
            <div>
              <p className="subtitle">Role</p>
              <p>{user.role}</p>
            </div>
          </div>
          <div className="event-meta">
            <div>
              <p className="subtitle">Email</p>
              <p>{user.email}</p>
            </div>
            <div>
              <p className="subtitle">School</p>
              <p>{user.schoolId || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
