import React from 'react'
import { getParentSchedule, listParentStudents } from '../api/apiClient'
import { useAuth } from '../auth/AuthContext'

const DAYS = [
  { key: 'monday', label: 'Mon', full: 'Monday' },
  { key: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { key: 'thursday', label: 'Thu', full: 'Thursday' },
  { key: 'friday', label: 'Fri', full: 'Friday' },
]

function getTodayKey() {
  const d = new Date().getDay()
  const map = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' }
  return map[d] || 'monday' // weekend → show monday
}

const TODAY_KEY = getTodayKey()

const SUBJECT_COLORS = [
  { bg: '#f0f4ff', border: '#c7d7fe', text: '#3730a3', dot: '#6366f1' },
  { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#22c55e' },
  { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', dot: '#f97316' },
  { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce', dot: '#a855f7' },
  { bg: '#f0fdfa', border: '#99f6e4', text: '#115e59', dot: '#14b8a6' },
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

function getCurrentPeriod(daySlots) {
  const now = new Date()
  const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return daySlots.find((s) => s.startTime <= nowHHMM && nowHHMM < s.endTime) || null
}

function getNextPeriod(daySlots) {
  const now = new Date()
  const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return daySlots.find((s) => s.startTime > nowHHMM) || null
}

export default function ParentSchedule() {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'
  const [allSlots, setAllSlots] = React.useState([])
  const [children, setChildren] = React.useState([])
  const [selectedChildId, setSelectedChildId] = React.useState(null)
  const [activeDay, setActiveDay] = React.useState(TODAY_KEY)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  const loadData = React.useCallback(async (childId) => {
    try {
      setError('')
      const [scheduleData, studentData] = await Promise.all([
        getParentSchedule(childId || undefined),
        isStudent ? Promise.resolve([]) : listParentStudents().catch(() => []),
      ])
      setAllSlots(scheduleData || [])
      const uniqueChildren = []
      const seen = new Set()
      for (const slot of scheduleData || []) {
        for (const s of (slot.students || [])) {
          if (!seen.has(s.id)) {
            seen.add(s.id)
            uniqueChildren.push(s)
          }
        }
      }
      if (uniqueChildren.length === 0 && studentData?.length) {
        for (const s of studentData) {
          if (!seen.has(s.id)) {
            seen.add(s.id)
            uniqueChildren.push(s)
          }
        }
      }
      setChildren(uniqueChildren)
      if (!childId && uniqueChildren.length > 0) {
        setSelectedChildId(uniqueChildren[0].id)
      }
    } catch (e) {
      setError(e.message || 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [isStudent])

  React.useEffect(() => {
    loadData(selectedChildId)
    const interval = setInterval(() => loadData(selectedChildId), 30_000)
    return () => clearInterval(interval)
  }, [loadData, selectedChildId])

  // Filter slots for selected child
  const selectedChild = children.find((c) => c.id === selectedChildId) || (isStudent ? { id: user?.id, name: user?.name } : null)
  const childSlots = isStudent
    ? allSlots
    : selectedChild
    ? allSlots.filter((s) => s.students?.some((st) => st.id === selectedChild.id))
    : []

  const daySlots = childSlots
    .filter((s) => s.dayOfWeek === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6
  const isToday = activeDay === TODAY_KEY
  const currentPeriod = isToday && !isWeekend ? getCurrentPeriod(daySlots) : null
  const nextPeriod = isToday && !isWeekend ? getNextPeriod(daySlots) : null

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Timetable</span>
          <h1 className="title">Daily Schedule</h1>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Child selector */}
      {children.length > 1 && (
        <div className="card section toolbar-card" style={{ padding: '10px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="label-caps" style={{ marginRight: 4 }}>Child:</span>
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                className={`btn-secondary ${selectedChildId === child.id ? 'active-filter' : ''}`}
                onClick={() => setSelectedChildId(child.id)}
                style={{
                  fontWeight: selectedChildId === child.id ? 700 : 400,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>person</span>
                {child.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's status card */}
      {isToday && !isWeekend && (currentPeriod || nextPeriod) && (
        <div className="card section" style={{ padding: 20, marginBottom: 16, background: '#f8faff', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="material-symbols-outlined" style={{ color: '#6366f1' }}>schedule</span>
            <span className="label-caps" style={{ color: '#6366f1' }}>Live — Today</span>
          </div>
          {currentPeriod ? (
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                Now in class: {currentPeriod.subject.name}
              </p>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                {formatTime(currentPeriod.startTime)} – {formatTime(currentPeriod.endTime)}
                {currentPeriod.room ? ` · ${currentPeriod.room}` : ''}
              </p>
            </div>
          ) : nextPeriod ? (
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
                Next: {nextPeriod.subject.name}
              </p>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                Starts at {formatTime(nextPeriod.startTime)}
                {nextPeriod.room ? ` · ${nextPeriod.room}` : ''}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Day Tab Strip */}
      <div className="card section toolbar-card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {DAYS.map((d) => {
            const count = childSlots.filter((s) => s.dayOfWeek === d.key).length
            const isActiveTabs = d.key === activeDay
            const isTodayTab = d.key === TODAY_KEY
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDay(d.key)}
                className={`btn-secondary ${isActiveTabs ? 'active-filter' : ''}`}
                style={{
                  minWidth: 68,
                  fontWeight: isActiveTabs ? 700 : 400,
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
                {isTodayTab && (
                  <span style={{
                    position: 'absolute', top: 4, right: 6,
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#6366f1',
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Slot Timeline */}
      {loading ? (
        <div className="loader">Loading schedule…</div>
      ) : !selectedChild ? (
        <div className="empty-state">No children linked to your account.</div>
      ) : daySlots.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          {/* Vertical timeline line */}
          <div style={{
            position: 'absolute',
            left: 47,
            top: 28,
            bottom: 28,
            width: 2,
            background: 'linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)',
            borderRadius: 2,
          }} />

          {daySlots.map((slot, idx) => {
            const color = subjectColor(slot.subject.id)
            const isCurrentSlot = currentPeriod?.id === slot.id && isToday

            return (
              <div
                key={slot.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  paddingBottom: idx < daySlots.length - 1 ? 16 : 0,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* Time column */}
                <div style={{ width: 64, textAlign: 'right', flexShrink: 0, paddingTop: 16 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isCurrentSlot ? '#6366f1' : '#475569' }}>
                    {formatTime(slot.startTime)}
                  </span>
                </div>

                {/* Dot on timeline */}
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: isCurrentSlot ? '#6366f1' : color.dot,
                  border: `2px solid ${isCurrentSlot ? '#c7d2fe' : color.border}`,
                  flexShrink: 0,
                  marginTop: 20,
                  boxShadow: isCurrentSlot ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
                  zIndex: 2,
                }} />

                {/* Card */}
                <div
                  className="card"
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    borderLeft: `3px solid ${color.border}`,
                    background: isCurrentSlot ? '#f0f4ff' : color.bg,
                    outline: isCurrentSlot ? '2px solid #c7d2fe' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 className="title" style={{ fontSize: '1rem', margin: 0, color: color.text }}>
                          {slot.subject.name}
                        </h3>
                        {isCurrentSlot && (
                          <span className="chip" style={{ background: '#6366f1', color: '#fff', borderColor: '#6366f1', fontSize: '0.7rem' }}>
                            Now
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748b' }}>
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        {slot.room && <> · <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', verticalAlign: 'middle' }}>meeting_room</span> {slot.room}</>}
                      </p>
                    </div>
                    <span className="chip" style={{ flexShrink: 0, background: 'transparent', color: '#475569', borderColor: '#e2e8f0' }}>
                      {slot.class.name}
                    </span>
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
          No classes scheduled for {DAYS.find((d) => d.key === activeDay)?.full}.
        </div>
      )}

      {/* Realtime notice */}
      <p style={{ marginTop: 24, fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', verticalAlign: 'middle', marginRight: 4 }}>
          sync
        </span>
        Schedule refreshes automatically every 30 seconds
      </p>
    </div>
  )
}
