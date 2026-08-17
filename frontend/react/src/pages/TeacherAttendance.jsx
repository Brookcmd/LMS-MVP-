import React, { useState, useEffect, useMemo } from 'react'
import { getAttendanceByClass, markAttendanceBatch, listTeachingAssignments } from '../api/apiClient'
import { useToast } from '../context/ToastContext'
import { RosterSkeleton } from '../components/SkeletonLoader'

export default function TeacherAttendance() {
  const { toast } = useToast()
  const [classId, setClassId] = useState('')
  const [assignments, setAssignments] = useState([])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Load teacher's assigned classes
  useEffect(() => {
    async function loadAssignments() {
      try {
        const data = await listTeachingAssignments()
        setAssignments(data || [])
        if (data && data.length > 0 && !classId) {
          setClassId(String(data[0].class.id))
        }
      } catch (err) {
        toast.error(err?.message || 'Unable to load assigned classes')
      }
    }
    loadAssignments()
  }, [])

  // Load roster when classId or date changes
  useEffect(() => {
    async function loadRoster() {
      if (!classId || !date) return
      setLoading(true)
      try {
        const data = await getAttendanceByClass({ classId, date })
        setRecords((data || []).map(record => ({ ...record, status: record.status || 'unmarked' })))
      } catch (err) {
        toast.error(err?.message || 'Unable to load attendance records')
        setRecords([])
      } finally {
        setLoading(false)
      }
    }
    loadRoster()
  }, [classId, date])

  const classes = useMemo(() => {
    const map = new Map()
    assignments.forEach((assignment) => {
      if (!assignment.class?.id) return
      const existing = map.get(assignment.class.id)
      if (!existing) {
        map.set(assignment.class.id, {
          id: assignment.class.id,
          name: assignment.class.name,
          subjects: assignment.subject?.name ? [assignment.subject.name] : [],
        })
      } else if (assignment.subject?.name && !existing.subjects.includes(assignment.subject.name)) {
        existing.subjects.push(assignment.subject.name)
      }
    })
    return Array.from(map.values())
  }, [assignments])

  const selectedClass = useMemo(
    () => classes.find((c) => String(c.id) === classId),
    [classes, classId],
  )

  function updateStatus(studentId, status) {
    setRecords(prev => prev.map(r => r.student.id === studentId ? { ...r, status } : r))
  }

  function markAll(status) {
    setRecords(prev => prev.map(r => ({ ...r, status })))
    toast.info(`Marked all ${records.length} students as ${status}`)
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (records.length === 0) {
      toast.warning('No attendance records to submit')
      return
    }

    const unmarkedCount = records.filter(r => !['present', 'absent', 'late'].includes(r.status)).length
    if (unmarkedCount > 0) {
      toast.warning(`Please mark all students before saving. ${unmarkedCount} still unmarked.`)
      return
    }

    setSubmitting(true)
    try {
      const marks = records.map(r => ({ studentId: r.student.id, status: r.status }))
      const res = await markAttendanceBatch({ classId: Number(classId), date, marks })
      toast.success(`Saved successfully: ${res.created || 0} marked, ${res.updated || 0} updated, ${res.notificationsCreated || 0} absent alerts sent.`)
    } catch (err) {
      toast.error(err?.message || 'Failed to submit attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredRecords = records.filter(r => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true
    return r.student.name.toLowerCase().includes(term) || String(r.student.id).includes(term)
  })

  const counts = useMemo(() => {
    let present = 0, late = 0, absent = 0, unmarked = 0
    records.forEach(r => {
      if (r.status === 'present') present++
      else if (r.status === 'late') late++
      else if (r.status === 'absent') absent++
      else unmarked++
    })
    return { present, late, absent, unmarked }
  }, [records])

  return (
    <div className="container">
      {/* 1. Header Banner */}
      <div className="section-header">
        <div>
          <span className="subtitle">Daily Classroom Register</span>
          <h1 className="title">
            {selectedClass ? `${selectedClass.name} Attendance` : 'Attendance Roster'}
          </h1>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div className="input-label" style={{ margin: 0 }}>
            <span className="label-caps">Select Class</span>
            <select 
              className="select-field" 
              value={classId} 
              onChange={e => setClassId(e.target.value)}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.subjects.length > 0 ? `(${c.subjects.join(', ')})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="input-label" style={{ margin: 0 }}>
            <span className="label-caps">Register Date</span>
            <input 
              type="date" 
              className="input-field" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
            />
          </div>

          <div className="search-wrapper">
            <span className="material-symbols-outlined search-icon">search</span>
            <input 
              type="text" 
              className="search-field" 
              placeholder="Filter student name..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* 3. Live Summary Stats & Batch Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="status-pill present" style={{ fontSize: '0.78rem' }}>
              {counts.present} Present
            </span>
            <span className="status-pill late" style={{ fontSize: '0.78rem' }}>
              {counts.late} Late
            </span>
            <span className="status-pill absent" style={{ fontSize: '0.78rem' }}>
              {counts.absent} Absent
            </span>
            {counts.unmarked > 0 && (
              <span className="status-pill unmarked" style={{ fontSize: '0.78rem' }}>
                {counts.unmarked} Unmarked
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => markAll('present')}
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>done_all</span>
              Mark All Present
            </button>
            <button 
              type="button" 
              className="btn-ghost" 
              onClick={() => markAll('unmarked')}
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* 4. Student Roster Deck */}
      {loading ? (
        <RosterSkeleton count={5} />
      ) : filteredRecords.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredRecords.map((record) => {
            const student = record.student
            return (
              <div 
                key={student.id} 
                className="card teacher-roster-card" 
                style={{ 
                  borderLeft: record.status === 'present' 
                    ? '4px solid var(--status-present-text)' 
                    : record.status === 'absent' 
                    ? '4px solid var(--status-absent-text)' 
                    : record.status === 'late' 
                    ? '4px solid var(--status-late-text)' 
                    : '4px solid var(--border-color)'
                }}
              >
                <div className="teacher-roster-student">
                  <div className="avatar">
                    <span style={{ fontFamily: 'var(--font-headline)', fontWeight: '700', color: 'var(--navy-primary)' }}>
                      {(student.name || 'S')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="student-name">{student.name}</h3>
                    <p className="student-roll">Roll ID #{student.id}</p>
                  </div>
                </div>

                <div className="teacher-attendance-actions">
                  <button
                    type="button"
                    className={`status-pill ${record.status === 'present' ? 'present' : 'unmarked'}`}
                    onClick={() => updateStatus(student.id, 'present')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                    Present
                  </button>

                  <button
                    type="button"
                    className={`status-pill ${record.status === 'late' ? 'late' : 'unmarked'}`}
                    onClick={() => updateStatus(student.id, 'late')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                    Late
                  </button>

                  <button
                    type="button"
                    className={`status-pill ${record.status === 'absent' ? 'absent' : 'unmarked'}`}
                    onClick={() => updateStatus(student.id, 'absent')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                    Absent
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-muted)' }}>
            group_off
          </span>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
            {searchTerm ? 'No matching students found in this roster.' : 'No students enrolled in this class.'}
          </p>
        </div>
      )}

      {/* 5. Sticky Bottom Commit Toolbar */}
      <div className="submit-panel">
        <div className="summary">
          {counts.unmarked === 0 ? (
            <span style={{ color: 'var(--status-present-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
              All {records.length} students marked and ready
            </span>
          ) : (
            <span style={{ color: 'var(--gold-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
              {counts.unmarked} of {records.length} students remaining
            </span>
          )}
        </div>

        <button 
          type="button" 
          className="btn-primary" 
          onClick={handleSubmit} 
          disabled={submitting || records.length === 0}
          style={{ minWidth: '180px' }}
        >
          <span className="material-symbols-outlined">save</span>
          {submitting ? 'Saving Register…' : 'Save Attendance'}
        </button>
      </div>
    </div>
  )
}
