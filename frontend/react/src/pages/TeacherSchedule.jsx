import React, { useState, useEffect, useCallback } from 'react'
import { getTeacherSchedule } from '../api/apiClient'
import { LiveClassCard } from '../components/LiveClassCard'
import { CardSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../context/ToastContext'

const DAYS = [
  { key: 'monday', label: 'Mon', full: 'Monday' },
  { key: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { key: 'thursday', label: 'Thu', full: 'Thursday' },
  { key: 'friday', label: 'Fri', full: 'Friday' },
]

const TODAY_KEY = (() => {
  const d = new Date().getDay()
  const map = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' }
  return map[d] || 'monday'
})()

export default function TeacherSchedule() {
  const { toast } = useToast()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(TODAY_KEY)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const scheduleData = await getTeacherSchedule()
      setSlots(scheduleData || [])
    } catch (e) {
      toast.error(e.message || 'Failed to load teaching schedule')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const slotList = Array.isArray(slots) ? slots : []
  const daySlots = slotList
    .filter((s) => (s.dayOfWeek || '').toLowerCase() === activeDay)
    .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')))

  const uniqueDays = new Set(slotList.map((s) => (s.dayOfWeek || '').toLowerCase())).size

  return (
    <div className="container">
      {/* 1. Header */}
      <div className="section-header">
        <div>
          <span className="subtitle">Classroom Timetable</span>
          <h1 className="title">Teaching Schedule</h1>
        </div>
      </div>

      {/* 2. Top Live Class Card */}
      <div style={{ marginBottom: '24px' }}>
        <LiveClassCard slots={slotList} />
      </div>

      {/* 3. Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <span>Weekly Periods</span>
          <strong>{slotList.length}</strong>
        </div>
        <div className="stat-card">
          <span>Teaching Days</span>
          <strong>{uniqueDays} / 5 Days</strong>
        </div>
        <div className="stat-card">
          <span>Viewing Day</span>
          <strong style={{ textTransform: 'capitalize' }}>
            {DAYS.find(d => d.key === activeDay)?.full || activeDay}
          </strong>
        </div>
      </div>

      {/* 4. Day Tabs Strip */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {DAYS.map((d) => {
            const count = slotList.filter((s) => (s.dayOfWeek || '').toLowerCase() === d.key).length
            const isToday = d.key === TODAY_KEY
            const isActive = d.key === activeDay

            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDay(d.key)}
                className={`btn-ghost ${isActive ? 'active' : ''}`}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-btn)',
                  background: isActive ? 'var(--navy-primary)' : isToday ? 'var(--navy-surface)' : 'transparent',
                  color: isActive ? '#FFFFFF' : isToday ? 'var(--navy-primary)' : 'var(--text-primary)',
                  border: isActive ? 'none' : isToday ? '1px solid var(--navy-light)' : '1px solid var(--border-color)',
                  transition: 'var(--transition-fast)',
                }}
              >
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: isActive ? 0.9 : 0.7 }}>
                  {d.label} {isToday ? '•' : ''}
                </span>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: '2px' }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. Timetable Schedule List */}
      {loading ? (
        <CardSkeleton lines={4} />
      ) : daySlots.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {daySlots.map((slot) => (
            <div 
              key={slot.id} 
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: '4px solid var(--navy-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ background: 'var(--navy-surface)', padding: '10px 14px', borderRadius: 'var(--radius-btn)', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--navy-primary)', fontSize: '24px' }}>
                    alarm
                  </span>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-primary)', marginTop: '2px' }}>
                    {slot.startTime}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="status-pill present" style={{ fontSize: '0.72rem' }}>
                      {slot.class?.name || 'Class'}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                    {slot.subject?.name || 'Subject'}
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="chip">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>meeting_room</span>
                  {slot.room || 'Room 101'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-muted)' }}>
            event_available
          </span>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
            No teaching periods scheduled for this day.
          </p>
        </div>
      )}
    </div>
  )
}
