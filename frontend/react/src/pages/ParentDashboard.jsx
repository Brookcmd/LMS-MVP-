import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listNotifications, listParentStudents } from '../api/apiClient'

function toDateKey(date){
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(value){
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function monthLabel(date){
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function getCalendarDays(monthDate){
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingDays = (firstDay.getDay() + 6) % 7

  return [
    ...Array.from({ length: leadingDays }, (_, index) => ({ key: `blank-${index}`, empty: true })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1)
      return {
        key: toDateKey(date),
        day: index + 1,
        dateKey: toDateKey(date),
      }
    }),
  ]
}

function getStoredRequests(userId){
  try {
    const stored = localStorage.getItem(`rollcall_parent_requests_${userId || 'guest'}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export default function ParentDashboard(){
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items,setItems]=React.useState([])
  const [students,setStudents]=React.useState([])
  const [loading,setLoading]=React.useState(false)
  const [error,setError]=React.useState(null)
  const [calendarMonth,setCalendarMonth]=React.useState(() => new Date())
  const [selectedDate,setSelectedDate]=React.useState(() => toDateKey(new Date()))
  const [quickAction,setQuickAction]=React.useState(null)
  const [actionMessage,setActionMessage]=React.useState('')
  const [actionError,setActionError]=React.useState('')
  const [requests,setRequests]=React.useState(() => getStoredRequests(user?.id))
  const [requestForm,setRequestForm]=React.useState({
    studentId: '',
    date: toDateKey(new Date()),
    time: '12:00',
    reason: '',
  })

  React.useEffect(()=>{
    async function load(){
      if(!user) return
      setLoading(true)
      setError(null)
      try {
        const [notifications, linkedStudents] = await Promise.all([
          listNotifications(),
          listParentStudents(),
        ])
        setItems(notifications)
        setStudents(linkedStudents)
        setRequestForm(current => ({
          ...current,
          studentId: current.studentId || String(linkedStudents[0]?.id || ''),
        }))
      } catch (err) {
        setError(err?.message ?? 'Unable to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  },[user])

  React.useEffect(() => {
    if (!user) return
    const nextRequests = getStoredRequests(user.id)
    setRequests(nextRequests)
  }, [user])

  React.useEffect(() => {
    if (!user) return
    localStorage.setItem(`rollcall_parent_requests_${user.id || 'guest'}`, JSON.stringify(requests))
  }, [requests, user])

  const unreadCount = items.filter(item => !item.readAt).length
  const calendarDays = React.useMemo(() => getCalendarDays(calendarMonth), [calendarMonth])
  const todayKey = toDateKey(new Date())
  const notificationsByDate = React.useMemo(() => {
    return items.reduce((grouped, item) => {
      const sourceDate = item.attendance?.date || item.createdAt
      if (!sourceDate) return grouped
      const key = toDateKey(new Date(sourceDate))
      grouped[key] = [...(grouped[key] || []), item]
      return grouped
    }, {})
  }, [items])
  const selectedItems = notificationsByDate[selectedDate] || []
  const selectedDateLabel = parseDateKey(selectedDate).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  function moveMonth(offset){
    setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  function openQuickAction(type){
    setQuickAction(type)
    setActionMessage('')
    setActionError('')
    setRequestForm(current => ({
      ...current,
      studentId: current.studentId || String(students[0]?.id || ''),
      date: selectedDate,
      time: type === 'early-leave' ? current.time || '12:00' : current.time,
      reason: '',
    }))
  }

  function closeQuickAction(){
    setQuickAction(null)
    setActionError('')
  }

  function updateRequestForm(field, value){
    setRequestForm(current => ({ ...current, [field]: value }))
  }

  function submitQuickAction(event){
    event.preventDefault()
    setActionError('')
    setActionMessage('')

    if (!requestForm.studentId) {
      setActionError('Please choose a student.')
      return
    }

    if (!requestForm.date) {
      setActionError('Please choose a date.')
      return
    }

    if (quickAction === 'early-leave' && !requestForm.time) {
      setActionError('Please choose a pickup time.')
      return
    }

    const student = students.find(item => String(item.id) === String(requestForm.studentId))
    const request = {
      id: `${Date.now()}`,
      type: quickAction,
      studentId: requestForm.studentId,
      studentName: student?.name || 'Student',
      className: student?.class?.name || '',
      date: requestForm.date,
      time: quickAction === 'early-leave' ? requestForm.time : '',
      reason: requestForm.reason.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    setRequests(current => [request, ...current])
    setActionMessage(`${quickAction === 'absence' ? 'Absence report' : 'Early leave request'} saved for ${request.studentName}.`)
    setQuickAction(null)
    setRequestForm(current => ({ ...current, reason: '' }))
  }

  const actionTitle = quickAction === 'absence' ? 'Report Absence' : 'Request Early Leave'
  const actionHelp = quickAction === 'absence'
    ? 'Tell the school your child will be absent for the selected day.'
    : 'Ask the school to prepare your child for early pickup.'

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
          <button className="btn-primary" type="button" onClick={() => openQuickAction('absence')} style={{ width: '100%', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            Report Absence
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button className="btn-secondary" type="button" onClick={() => openQuickAction('early-leave')} style={{ width: '100%', justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            Request Early Leave
            <span className="material-symbols-outlined">schedule</span>
          </button>
          <div style={{ background: '#f4f6fb', borderRadius: '18px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#4648d4' }}>info</span>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.5 }}>School picnic scheduled for Friday, Oct 27.</p>
          </div>
        </div>
        {actionMessage && <div className="success-message">{actionMessage}</div>}
        {requests.length > 0 && (
          <div className="request-list">
            {requests.slice(0, 3).map(request => (
              <div key={request.id} className="request-card">
                <span className="event-status">{request.status}</span>
                <div>
                  <h3>{request.type === 'absence' ? 'Absence report' : 'Early leave request'}</h3>
                  <p>
                    {request.studentName} · {new Date(request.date).toLocaleDateString()}
                    {request.time ? ` at ${request.time}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {quickAction && (
        <div className="modal-backdrop" role="presentation">
          <form className="action-modal" onSubmit={submitQuickAction}>
            <div className="section-header">
              <div>
                <span className="subtitle">Quick action</span>
                <h2 className="title">{actionTitle}</h2>
                <p className="modal-copy">{actionHelp}</p>
              </div>
              <button className="icon-button calendar-arrow" type="button" onClick={closeQuickAction} aria-label="Close quick action">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            {actionError && <div className="error" style={{ color: '#ba1a1a', marginBottom: 12 }}>{actionError}</div>}

            <label className="input-label">
              Student
              <select className="input-field" value={requestForm.studentId} onChange={event => updateRequestForm('studentId', event.target.value)}>
                <option value="">Select a student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} {student.class?.name ? `(${student.class.name})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row">
              <label className="input-label">
                Date
                <input className="input-field" type="date" value={requestForm.date} onChange={event => updateRequestForm('date', event.target.value)} />
              </label>
              {quickAction === 'early-leave' && (
                <label className="input-label">
                  Pickup time
                  <input className="input-field" type="time" value={requestForm.time} onChange={event => updateRequestForm('time', event.target.value)} />
                </label>
              )}
            </div>

            <label className="input-label">
              Reason
              <textarea className="input-field textarea-field" value={requestForm.reason} onChange={event => updateRequestForm('reason', event.target.value)} placeholder="Add a short note for the school" />
            </label>

            {students.length === 0 && (
              <div className="empty-state compact">No linked students found. Contact your school administrator to add your child.</div>
            )}

            <div className="action-row modal-actions">
              <button className="btn-secondary" type="button" onClick={closeQuickAction}>Cancel</button>
              <button className="btn-primary" type="submit" disabled={students.length === 0}>Submit</button>
            </div>
          </form>
        </div>
      )}

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
        <div className="section-header" style={{ marginBottom: 12 }}>
          <div>
            <span className="subtitle">Monthly calendar</span>
            <h2 className="title">{monthLabel(calendarMonth)}</h2>
          </div>
          <div className="calendar-actions" aria-label="Calendar month navigation">
            <button className="icon-button calendar-arrow" type="button" onClick={() => moveMonth(-1)} aria-label="Previous month">
              <span className="material-symbols-rounded">chevron_left</span>
            </button>
            <button className="icon-button calendar-arrow" type="button" onClick={() => moveMonth(1)} aria-label="Next month">
              <span className="material-symbols-rounded">chevron_right</span>
            </button>
          </div>
        </div>
        <div className="card section homepage-calendar">
          <div className="calendar-weekdays">
            {['M','T','W','T','F','S','S'].map((day, index) => <div key={`${day}-${index}`}>{day}</div>)}
          </div>
          <div className="calendar-grid">
            {calendarDays.map(day => {
              if (day.empty) return <div key={day.key} className="calendar-day empty" aria-hidden="true" />

              const dayItems = notificationsByDate[day.dateKey] || []
              const isToday = day.dateKey === todayKey
              const isSelected = day.dateKey === selectedDate
              const hasAbsence = dayItems.some(item => item.type === 'absence')
              const hasLate = dayItems.some(item => item.type === 'late')

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  className={`calendar-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                  onClick={() => setSelectedDate(day.dateKey)}
                  aria-pressed={isSelected}
                >
                  <span>{day.day}</span>
                  {dayItems.length > 0 && (
                    <span className={`calendar-dot${hasAbsence ? ' absence' : hasLate ? ' late' : ''}`} />
                  )}
                </button>
              )
            })}
          </div>
          <div className="calendar-summary">
            <div>
              <span className="subtitle">Selected day</span>
              <h3>{selectedDateLabel}</h3>
            </div>
            <button className="btn-ghost" type="button" onClick={() => navigate(`/attendance?date=${selectedDate}`)}>
              View attendance
            </button>
          </div>
          {selectedItems.length === 0 ? (
            <div className="empty-state compact">No alerts on this day.</div>
          ) : (
            <div className="calendar-alert-list">
              {selectedItems.map(item => (
                <div key={item.id} className="calendar-alert">
                  <span className="event-status" style={{ background: item.type === 'absence' ? '#ffdad6' : '#f4f6fb', color: item.type === 'absence' ? '#ba1a1a' : '#475569' }}>
                    {item.type?.toUpperCase() || 'INFO'}
                  </span>
                  <p>{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
