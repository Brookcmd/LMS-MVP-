import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getChildAttendanceHistory, listParentStudents } from '../api/apiClient'

function useQuery(){ return new URLSearchParams(useLocation().search) }

function toDateInputValue(date){
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date, days){
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function parseDateValue(value){
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function buildDateRail(selectedDate){
  const center = parseDateValue(selectedDate)
  return Array.from({ length: 21 }, (_, index) => {
    const date = addDays(center, index - 10)
    return {
      value: toDateInputValue(date),
      weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
      day: date.getDate(),
      month: date.toLocaleDateString(undefined, { month: 'short' }),
    }
  })
}

export default function ParentAttendance(){
  const { user } = useAuth()
  const q = useQuery()
  const defaultStudent = q.get('studentId') || ''
  const [studentId,setStudentId]=React.useState(defaultStudent)
  const [students,setStudents]=React.useState([])
  const [selectedDate,setSelectedDate]=React.useState(() => toDateInputValue(new Date()))
  const [data,setData]=React.useState(null)
  const [loading,setLoading]=React.useState(false)
  const [loadingStudents,setLoadingStudents]=React.useState(false)
  const [error,setError]=React.useState(null)
  const railRef = React.useRef(null)
  const activeDateRef = React.useRef(null)
  const dateRail = React.useMemo(() => buildDateRail(selectedDate), [selectedDate])

  async function loadStudents(){
    setError(null)
    setLoadingStudents(true)
    try {
      const result = await listParentStudents()
      setStudents(result)
      if (!defaultStudent && result.length > 0) {
        setStudentId(String(result[0].id))
      }
    } catch (err) {
      setError(err?.message ?? 'Unable to load linked students')
    } finally {
      setLoadingStudents(false)
    }
  }

  async function load(){
    if(!studentId) {
      setError('Please select a student')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await getChildAttendanceHistory({ studentId, from: selectedDate, to: selectedDate })
      setData(res)
    } catch (err) {
      setError(err?.message ?? 'Unable to load attendance history')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!user) return
    loadStudents()
  }, [user])

  React.useEffect(() => {
    if (!user || !studentId) return
    load()
  }, [user, studentId, selectedDate])

  React.useEffect(() => {
    activeDateRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedDate])

  function moveDate(days){
    setSelectedDate(current => toDateInputValue(addDays(parseDateValue(current), days)))
  }

  function scrollRail(direction){
    railRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' })
  }

  const selectedDateLabel = parseDateValue(selectedDate).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div>
      <div className="section-header">
        <div>
          <span className="subtitle">Attendance</span>
          <h1 className="title">Student history</h1>
        </div>
      </div>

      <div className="card section">
        <div className="form-row">
          <label className="input-label">
            Student
            <select className="input-field" value={studentId} onChange={e=>setStudentId(e.target.value)}>
              <option value="">Select a student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} {student.class?.name ? `(${student.class.name})` : ''}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-secondary" type="button" onClick={load} disabled={!studentId || loadingStudents}>Load</button>
        </div>

        <div className="attendance-calendar">
          <div className="attendance-calendar-header">
            <div>
              <span className="subtitle">Selected day</span>
              <h2>{selectedDateLabel}</h2>
            </div>
            <div className="calendar-actions" aria-label="Attendance day navigation">
              <button className="icon-button calendar-arrow" type="button" onClick={() => moveDate(-1)} aria-label="Previous day">
                <span className="material-symbols-rounded">chevron_left</span>
              </button>
              <button className="icon-button calendar-arrow" type="button" onClick={() => moveDate(1)} aria-label="Next day">
                <span className="material-symbols-rounded">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="date-rail-wrap">
            <button className="date-rail-peek left" type="button" onClick={() => scrollRail(-1)} aria-label="Scroll to earlier days">
              <span className="material-symbols-rounded">arrow_back_ios_new</span>
            </button>
            <div className="date-rail" ref={railRef} aria-label="Choose attendance date">
              {dateRail.map(date => {
                const isActive = date.value === selectedDate
                return (
                  <button
                    key={date.value}
                    ref={isActive ? activeDateRef : null}
                    type="button"
                    className={`date-squircle${isActive ? ' active' : ''}`}
                    onClick={() => setSelectedDate(date.value)}
                    aria-pressed={isActive}
                  >
                    <span>{date.weekday}</span>
                    <strong>{date.day}</strong>
                    <em>{date.month}</em>
                  </button>
                )
              })}
            </div>
            <button className="date-rail-peek right" type="button" onClick={() => scrollRail(1)} aria-label="Scroll to later days">
              <span className="material-symbols-rounded">arrow_forward_ios</span>
            </button>
          </div>
        </div>

        {loadingStudents && <div className="loader">Loading students…</div>}
        {error && <div className="error" style={{ color: '#ba1a1a', marginTop: 12 }}>{error}</div>}
        {!loadingStudents && students.length === 0 && (
          <div className="empty-state" style={{ marginTop: 12 }}>
            No linked students found. Contact your school administrator to add your child.
          </div>
        )}
      </div>

      {loading ? (
        <div className="loader">Loading…</div>
      ) : data ? (
        <div className="space-y-4">
          <div className="card">
            <div className="section-header">
              <div>
                <span className="subtitle">{data.student.name}</span>
                <h2 className="title">{data.student.class?.name || 'Class info'}</h2>
                <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: 13 }}>
                  Showing attendance for {selectedDateLabel}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {data.attendance.length === 0 ? (
              <div className="empty-state">No attendance record found for this day.</div>
            ) : data.attendance.map(a => (
              <div key={a.id} className="event-card">
                <div className="event-meta">
                  <span className="event-status" style={{ background: a.status === 'absent' ? '#ffdad6' : a.status === 'late' ? '#eef2ff' : '#e0f2f1', color: a.status === 'absent' ? '#ba1a1a' : a.status === 'late' ? '#4648d4' : '#00695c' }}>
                    {a.status?.toUpperCase() || 'UNMARKED'}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: 12 }}>{new Date(a.date).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: 0, color: '#475569' }}>{a.notes || 'No notes available.'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
