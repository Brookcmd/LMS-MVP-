import React from 'react'
import { getTeacherSchedule } from '../api/apiClient'

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
]

const DAY_FULL = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
}

const TODAY_KEY = (() => {
  const d = new Date().getDay() // 0=Sun
  const map = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' }
  return map[d] || 'monday'
})()

const SUBJECT_COLORS = [
  { bg: '#f0f4ff', border: '#c7d7fe', text: '#3730a3' },
  { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
  { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412' },
  { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce' },
  { bg: '#f0fdfa', border: '#99f6e4', text: '#115e59' },
]

function subjectColor(subjectId) {
  return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length]
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function TeacherSchedule() {
  const [slots, setSlots] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [activeDay, setActiveDay] = React.useState(TODAY_KEY)

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const scheduleData = await getTeacherSchedule()
      setSlots(scheduleData || [])
    } catch (e) {
      setError(e.message || 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll every 30 seconds for real-time feel
  React.useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30_000)
    return () => clearInterval(interval)
  }, [loadData])

  const daySlots = slots
    .filter((s) => s.dayOfWeek === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Weekly stats
  const totalSlots = slots.length
  const uniqueDays = new Set(slots.map((s) => s.dayOfWeek)).size

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Timetable</span>
          <h1 className="title">My Teaching Schedule</h1>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Stats */}
      <div className="stats-grid section">
        <div className="stat-card">
          <span className="label-caps">Total Slots</span>
          <strong>{totalSlots}</strong>
        </div>
        <div className="stat-card">
          <span className="label-caps">Active Days</span>
          <strong>{uniqueDays} / 5</strong>
        </div>
        <div className="stat-card">
          <span className="label-caps">Today</span>
          <strong>{DAY_FULL[TODAY_KEY] || '—'}</strong>
        </div>
      </div>

      {/* Day Tab Strip */}
      <div className="card section toolbar-card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {DAYS.map((d) => {
            const count = slots.filter((s) => s.dayOfWeek === d.key).length
            const isToday = d.key === TODAY_KEY
            const isActive = d.key === activeDay
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDay(d.key)}
                className={`btn-secondary ${isActive ? 'active-filter' : ''}`}
                style={{
                  minWidth: 72,
                  fontWeight: isActive ? 700 : 400,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '8px 10px',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {d.label}
                </span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{count}</span>
                {isToday && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 6,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent, #4338ca)',
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Slot List */}
      {loading ? (
        <div className="loader">Loading schedule…</div>
      ) : daySlots.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {daySlots.map((slot) => {
            const color = subjectColor(slot.subject.id)
            return (
              <div
                key={slot.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  borderLeft: `4px solid ${color.border}`,
                  background: color.bg,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Time block */}
                  <div style={{ textAlign: 'center', minWidth: 68 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: color.text }}>
                      {formatTime(slot.startTime)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {formatTime(slot.endTime)}
                    </div>
                  </div>
                  {/* Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: color.text }}>
                        school
                      </span>
                      <h3 className="title" style={{ fontSize: '1rem', margin: 0 }}>
                        {slot.subject.name}
                      </h3>
                      <span className="chip" style={{ background: color.bg, color: color.text, borderColor: color.border }}>
                        {slot.class.name}
                      </span>
                    </div>
                    {slot.room && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>meeting_room</span>
                        {slot.room}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', marginBottom: 8, display: 'block' }}>
            calendar_view_week
          </span>
          No classes scheduled for {DAY_FULL[activeDay]}.
        </div>
      )}

      {/* Realtime notice */}
      <p style={{ marginTop: 20, fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', verticalAlign: 'middle', marginRight: 4 }}>
          sync
        </span>
        Schedule refreshes automatically every 30 seconds
      </p>
    </div>
  )
}
