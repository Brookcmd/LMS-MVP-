import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import {
  listClasses,
  listTeachers,
  listSubjects,
  getClassSchedule,
  createScheduleSlot,
  deleteScheduleSlot,
} from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
]

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function AdminSchedule() {
  const { searchQuery = '' } = useOutletContext() ?? {}
  const { toast } = useToast()
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedDay, setSelectedDay] = useState('all')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 'monday',
    startTime: '08:00',
    endTime: '08:45',
    room: '',
  })
  const [saving, setSaving] = useState(false)

  // Load initial dropdown data
  const loadClassesAndTeachers = useCallback(async () => {
    try {
      setLoading(true)
      const [classData, teacherData, subjectData] = await Promise.all([
        listClasses(),
        listTeachers(),
        listSubjects(),
      ])
      setClasses(classData ?? [])
      setTeachers(teacherData ?? [])
      setSubjects(subjectData ?? [])
      if (classData?.length && !selectedClassId) {
        setSelectedClassId(String(classData[0].id))
      }
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load schedule metadata')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    loadClassesAndTeachers()
  }, [loadClassesAndTeachers])

  // Fetch slots whenever selectedClassId changes
  const loadScheduleSlots = useCallback(async () => {
    if (!classes.length) return
    try {
      setLoading(true)
      let classIdsToFetch = []
      if (selectedClassId === 'all' || !selectedClassId) {
        classIdsToFetch = classes.map((c) => c.id)
      } else {
        classIdsToFetch = [Number(selectedClassId)]
      }

      const results = await Promise.all(
        classIdsToFetch.map((id) =>
          getClassSchedule(id).catch(() => [])
        )
      )

      const merged = results.flat()
      setSlots(merged)
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load schedule slots')
    } finally {
      setLoading(false)
    }
  }, [classes, selectedClassId])

  useEffect(() => {
    loadScheduleSlots()
  }, [loadScheduleSlots])

  function openCreate() {
    setForm({
      classId: selectedClassId && selectedClassId !== 'all' ? selectedClassId : (classes[0]?.id ? String(classes[0].id) : ''),
      subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
      teacherId: teachers[0]?.id ? String(teachers[0].id) : '',
      dayOfWeek: 'monday',
      startTime: '08:00',
      endTime: '08:45',
      room: '',
    })
    setModalOpen(true)
  }

  async function handleCreate(event) {
    event.preventDefault()
    if (!form.classId || !form.subjectId || !form.teacherId) {
      toast.warning('Please select class, subject, and teacher.')
      return
    }
    if (form.startTime >= form.endTime) {
      toast.warning('Start time must be before end time.')
      return
    }

    try {
      setSaving(true)
      await createScheduleSlot({
        classId: Number(form.classId),
        subjectId: Number(form.subjectId),
        teacherId: Number(form.teacherId),
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room.trim() || undefined,
      })

      toast.success('Schedule period slot created.')
      setModalOpen(false)
      await loadScheduleSlots()
    } catch (err) {
      toast.error(err?.message ?? 'Unable to create schedule slot')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(slotId) {
    if (!window.confirm('Delete this timetable slot?')) return
    try {
      await deleteScheduleSlot(slotId)
      toast.success('Schedule slot deleted.')
      await loadScheduleSlots()
    } catch (err) {
      toast.error(err?.message ?? 'Unable to delete schedule slot')
    }
  }

  const filteredSlots = slots.filter((slot) => {
    if (selectedTeacherId && String(slot.teacherId) !== selectedTeacherId) return false
    if (selectedDay !== 'all' && (slot.dayOfWeek || '').toLowerCase() !== selectedDay) return false

    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (slot.class?.name || '').toLowerCase().includes(q) ||
      (slot.subject?.name || '').toLowerCase().includes(q) ||
      (slot.teacher?.name || '').toLowerCase().includes(q) ||
      (slot.room || '').toLowerCase().includes(q)
    )
  })

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">School-wide Timetable</span>
          <h1>Timetable Schedule</h1>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate} disabled={classes.length === 0}>
          <span className="material-symbols-outlined">add</span>
          Add Schedule Slot
        </button>
      </section>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div className="admin-filter-row" style={{ margin: 0 }}>
          <div className="input-label" style={{ margin: 0, minWidth: '160px' }}>
            <span className="label-caps">Filter Class</span>
            <select className="select-field" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="input-label" style={{ margin: 0, minWidth: '160px' }}>
            <span className="label-caps">Filter Teacher</span>
            <select className="select-field" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
              <option value="">All Teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="input-label" style={{ margin: 0, minWidth: '140px' }}>
            <span className="label-caps">Filter Day</span>
            <select className="select-field" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
              <option value="all">All Weekdays</option>
              {DAYS.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading schedule data…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time Window</th>
                <th>Class Cohort</th>
                <th>Subject Course</th>
                <th>Assigned Teacher</th>
                <th>Room</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>
                      calendar_month
                    </span>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>No timetable periods found for this filter.</p>
                  </td>
                </tr>
              ) : (
                filteredSlots.map((slot) => (
                  <tr key={slot.id}>
                    <td>
                      <span className="status-pill present" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                        {slot.dayOfWeek}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </strong>
                    </td>
                    <td>
                      <span className="admin-tag-pill">{slot.class?.name ?? '—'}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--navy-primary)' }}>{slot.subject?.name ?? '—'}</strong>
                    </td>
                    <td>{slot.teacher?.name ?? '—'}</td>
                    <td>
                      <span className="chip" style={{ fontSize: '0.78rem' }}>
                        {slot.room || 'Room 101'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-icon-btn danger"
                          onClick={() => handleDelete(slot.id)}
                          title="Delete slot"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title="Add Schedule Period"
        subtitle="Define a recurring timetable lecture slot"
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="input-label">
            <span className="label-caps">Class Cohort</span>
            <select
              className="select-field"
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              required
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="input-label">
            <span className="label-caps">Subject Course</span>
            <select
              className="select-field"
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="input-label">
            <span className="label-caps">Assigned Teacher</span>
            <select
              className="select-field"
              value={form.teacherId}
              onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
              required
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="input-label">
            <span className="label-caps">Weekday</span>
            <select
              className="select-field"
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
              required
            >
              {DAYS.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-label">
              <span className="label-caps">Start Time</span>
              <input
                type="time"
                className="input-field"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
            <div className="input-label">
              <span className="label-caps">End Time</span>
              <input
                type="time"
                className="input-field"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-label">
            <span className="label-caps">Classroom / Hall</span>
            <input
              type="text"
              className="input-field"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              placeholder="e.g. Science Lab B or Hall 204"
            />
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              <span className="material-symbols-outlined">save</span>
              {saving ? 'Creating…' : 'Save Slot'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
