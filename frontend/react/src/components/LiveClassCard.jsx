import React, { useState, useEffect } from 'react'

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function LiveClassCard({ slots = [], studentName = '' }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 30000) // Update every 30s
    return () => clearInterval(interval)
  }, [])

  const currentDay = DAY_NAMES[now.getDay()]
  const currentHours = String(now.getHours()).padStart(2, '0')
  const currentMinutes = String(now.getMinutes()).padStart(2, '0')
  const currentTimeString = `${currentHours}:${currentMinutes}`

  const slotList = Array.isArray(slots) ? slots : []

  // Filter slots for today
  const todaySlots = slotList
    .filter(s => s && (s.dayOfWeek || s.day || '').toLowerCase() === currentDay)
    .sort((a, b) => String(a?.startTime || '').localeCompare(String(b?.startTime || '')))

  // Find active ongoing slot
  const currentSlot = todaySlots.find(
    s => s?.startTime && s?.endTime && s.startTime <= currentTimeString && s.endTime >= currentTimeString
  )

  // Find next upcoming slot
  const nextSlot = todaySlots.find(s => s?.startTime && s.startTime > currentTimeString)

  return (
    <div className="live-class-card">
      <div className="live-class-header">
        <div className="live-status-badge-wrap">
          {currentSlot ? (
            <div className="live-beacon-active">
              <span className="live-beacon-dot" />
              <span>LIVE IN SESSION</span>
            </div>
          ) : nextSlot ? (
            <div className="live-beacon-upcoming">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
              <span>NEXT UPCOMING</span>
            </div>
          ) : (
            <div className="live-beacon-idle">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
              <span>CLASSES CONCLUDED</span>
            </div>
          )}
        </div>

        <span className="live-clock-pill">
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="live-class-body">
        {currentSlot ? (
          <div>
            <h3 className="live-subject-title">{currentSlot.subject?.name || currentSlot.subjectName || 'Current Lecture'}</h3>
            <div className="live-meta-row">
              <span className="live-time-range">
                <span className="material-symbols-outlined">alarm</span>
                {currentSlot.startTime} – {currentSlot.endTime}
              </span>
              <span className="live-room-tag">
                <span className="material-symbols-outlined">meeting_room</span>
                {currentSlot.room || 'Main Hall A'}
              </span>
            </div>
            {currentSlot.teacher && (
              <div className="live-teacher-pill">
                <span className="material-symbols-outlined">person</span>
                <span>Instructor: {currentSlot.teacher.name}</span>
              </div>
            )}
          </div>
        ) : nextSlot ? (
          <div>
            <h3 className="live-subject-title">{nextSlot.subject?.name || nextSlot.subjectName || 'Upcoming Class'}</h3>
            <div className="live-meta-row">
              <span className="live-time-range">
                <span className="material-symbols-outlined">alarm</span>
                Starts at {nextSlot.startTime}
              </span>
              <span className="live-room-tag">
                <span className="material-symbols-outlined">meeting_room</span>
                {nextSlot.room || 'Room 102'}
              </span>
            </div>
            <p className="live-standby-note">Student is currently on class break.</p>
          </div>
        ) : (
          <div className="live-empty-state">
            <h4 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontFamily: 'var(--font-headline)' }}>
              No active classes right now
            </h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {todaySlots.length > 0
                ? 'All scheduled periods for today have been completed.'
                : 'No scheduled timetable classes for today.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
