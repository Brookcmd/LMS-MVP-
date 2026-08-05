import React from 'react'
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
  const [classes, setClasses] = React.useState([])
  const [teachers, setTeachers] = React.useState([])
  const [subjects, setSubjects] = React.useState([])
  const [slots, setSlots] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  // Filter state
  const [selectedClassId, setSelectedClassId] = React.useState('')
  const [selectedTeacherId, setSelectedTeacherId] = React.useState('')
  const [selectedDay, setSelectedDay] = React.useState('all')

  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 'monday',
    startTime: '08:00',
    endTime: '08:45',
    room: '',
  })
  const [saving, setSaving] = React.useState(false)

  // Load initial dropdown data and schedules
  const loadClassesAndTeachers = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
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
      setError(err?.message ?? 'Unable to load initial metadata')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  React.useEffect(() => {
    loadClassesAndTeachers()
  }, [loadClassesAndTeachers])

  // Fetch slots whenever selectedClassId changes (or all classes)
  const loadScheduleSlots = React.useCallback(async () => {
    if (!classes.length) return
    try {
      setLoading(true)
      setError(null)

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

      const combined = results.flat()
      setSlots(combined)
    } catch (err) {
      setError(err?.message ?? 'Unable to load schedule slots')
    } finally {
      setLoading(false)
    }
  }, [classes, selectedClassId])

  React.useEffect(() => {
    loadScheduleSlots()
  }, [loadScheduleSlots])

  function openCreate() {
    const defaultClass = selectedClassId && selectedClassId !== 'all' ? selectedClassId : (classes[0]?.id ? String(classes[0].id) : '')
    const defaultTeacher = teachers[0]?.id ? String(teachers[0].id) : ''
    const defaultSubject = subjects[0]?.id ? String(subjects[0].id) : ''

    setForm({
      classId: defaultClass,
      subjectId: defaultSubject,
      teacherId: defaultTeacher,
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
      setError('Please select Class, Subject, and Teacher.')
      return
    }
    if (form.startTime >= form.endTime) {
      setError('Start time must be before end time.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      await createScheduleSlot({
        classId: Number(form.classId),
        subjectId: Number(form.subjectId),
        teacherId: Number(form.teacherId),
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room.trim() || undefined,
      })

      setModalOpen(false)
      await loadScheduleSlots()
    } catch (err) {
      setError(err?.message ?? 'Unable to create schedule slot')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(slotId) {
    if (!window.confirm('Delete this schedule slot?')) return
    try {
      setError(null)
      await deleteScheduleSlot(slotId)
      setSlots((curr) => curr.filter((s) => s.id !== slotId))
    } catch (err) {
      setError(err?.message ?? 'Unable to delete schedule slot')
    }
  }

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    if (selectedTeacherId && String(slot.teacher?.id) !== selectedTeacherId) {
      return false
    }
    if (selectedDay !== 'all' && slot.dayOfWeek !== selectedDay) {
      return false
    }
    if (searchQuery) {
      const targetStr = `${slot.class?.name} ${slot.subject?.name} ${slot.teacher?.name} ${slot.room}`.toLowerCase()
      if (!targetStr.includes(searchQuery)) return false
    }
    return true
  }).sort((a, b) => {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    const dA = dayOrder.indexOf(a.dayOfWeek)
    const dB = dayOrder.indexOf(b.dayOfWeek)
    if (dA !== dB) return dA - dB
    return a.startTime.localeCompare(b.startTime)
  })

  return (
    <>
      <section className="admin-page-head">
        <div>
          <h2>Schedule Management</h2>
          <p>Create and manage class timetables and slot assignments across the school.</p>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span>
          Add Schedule Slot
        </button>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {/* Filter toolbar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', fontWeight: 600, gap: 4 }}>
          Class Filter
          <select
            className="input-field"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{ minWidth: 160, padding: '6px 12px' }}
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', fontWeight: 600, gap: 4 }}>
          Teacher Filter
          <select
            className="input-field"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            style={{ minWidth: 160, padding: '6px 12px' }}
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', fontWeight: 600, gap: 4 }}>
          Day Filter
          <select
            className="input-field"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            style={{ minWidth: 140, padding: '6px 12px' }}
          >
            <option value="all">All Days</option>
            {DAYS.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="admin-loading">Loading schedule slots…</div>
      ) : (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Room</th>
                <th className="admin-table-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    No schedule slots found. Select a class or add a new slot.
                  </td>
                </tr>
              ) : (
                filteredSlots.map((slot) => (
                  <tr key={slot.id}>
                    <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{slot.dayOfWeek}</td>
                    <td>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</td>
                    <td>{slot.class?.name ?? '—'}</td>
                    <td>{slot.subject?.name ?? '—'}</td>
                    <td>{slot.teacher?.name ?? '—'}</td>
                    <td>{slot.room || '—'}</td>
                    <td className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-link-button danger"
                        onClick={() => handleDelete(slot.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      <AdminModal
        open={modalOpen}
        title="Add Schedule Slot"
        subtitle="Assign a subject and teacher to a class for a specific day and time."
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={handleCreate}>
          <label>
            Class
            <select
              value={form.classId}
              onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
              required
            >
              <option value="">Select class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label>
            Subject
            <select
              value={form.subjectId}
              onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
              required
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code || 'No code'})</option>
              ))}
            </select>
          </label>

          <label>
            Teacher
            <select
              value={form.teacherId}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
              required
            >
              <option value="">Select teacher...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label>
            Day of Week
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
              required
            >
              {DAYS.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              Start Time
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                required
              />
            </label>

            <label>
              End Time
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                required
              />
            </label>
          </div>

          <label>
            Room (Optional)
            <input
              type="text"
              placeholder="e.g. Room 204"
              value={form.room}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
            />
          </label>

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Create Schedule Slot'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
