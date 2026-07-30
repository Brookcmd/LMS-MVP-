import React from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import {
  createStudent,
  deleteStudent,
  listClasses,
  listStudents,
  updateStudent,
} from '../../api/apiClient'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export default function AdminStudents() {
  const { searchQuery = '' } = useOutletContext() ?? {}
  const [students, setStudents] = React.useState([])
  const [classes, setClasses] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [classFilter, setClassFilter] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(null)
  const [name, setName] = React.useState('')
  const [classId, setClassId] = React.useState('')
  const [dob, setDob] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [studentData, classData] = await Promise.all([listStudents(), listClasses()])
      setStudents(studentData ?? [])
      setClasses(classData ?? [])
    } catch (err) {
      setError(err?.message ?? 'Unable to load students')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setClassId(classes[0]?.id ? String(classes[0].id) : '')
    setDob('')
    setModalOpen(true)
  }

  function openEdit(student) {
    setEditing(student)
    setName(student.name ?? '')
    setClassId(String(student.classId ?? student.class?.id ?? ''))
    setDob(student.dob ? new Date(student.dob).toISOString().slice(0, 10) : '')
    setModalOpen(true)
  }

  async function submit(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setError(null)
      const payload = { name, classId: Number(classId), dob: dob || null }

      if (editing) {
        const updated = await updateStudent(editing.id, payload)
        setStudents((current) => current.map((item) => (item.id === editing.id ? { ...item, ...updated } : item)))
      } else {
        const created = await createStudent(payload)
        setStudents((current) => [created, ...current])
      }

      setModalOpen(false)
    } catch (err) {
      setError(err?.message ?? 'Unable to save student')
    } finally {
      setSaving(false)
    }
  }

  async function removeStudent(student) {
    if (!window.confirm(`Remove ${student.name}?`)) return
    try {
      setError(null)
      await deleteStudent(student.id)
      setStudents((current) => current.filter((item) => item.id !== student.id))
    } catch (err) {
      setError(err?.message ?? 'Unable to delete student')
    }
  }

  const classMap = Object.fromEntries(classes.map((item) => [item.id, item.name]))
  const filtered = students.filter((student) => {
    if (classFilter && String(student.classId ?? student.class?.id) !== classFilter) return false
    if (!searchQuery) return true
    const className = classMap[student.classId ?? student.class?.id] ?? ''
    return [student.name, className].some((value) => value?.toLowerCase().includes(searchQuery))
  })

  return (
    <>
      <section className="admin-page-head">
        <div>
          <h2>Students Management</h2>
          <p>Manage enrollments and student profiles.</p>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate} disabled={classes.length === 0}>
          <span className="material-symbols-outlined">person_add</span>
          Enroll New Student
        </button>
      </section>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-filter-row">
        <label>
          Class
          <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
            <option value="">All classes</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="admin-loading">Loading students…</div>
      ) : (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Date of birth</th>
                <th className="admin-table-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">No students found.</td>
                </tr>
              ) : filtered.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{classMap[student.classId ?? student.class?.id] ?? student.class?.name ?? '—'}</td>
                  <td>{formatDate(student.dob)}</td>
                  <td className="admin-table-actions">
                    <button type="button" className="admin-link-button" onClick={() => openEdit(student)}>Edit</button>
                    <button type="button" className="admin-link-button danger" onClick={() => removeStudent(student)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title={editing ? 'Edit student' : 'Enroll new student'}
        subtitle="Students are enrollment records, not login accounts."
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submit}>
          <label>
            Student name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Class
            <select value={classId} onChange={(event) => setClassId(event.target.value)} required>
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Date of birth
            <input type="date" value={dob} onChange={(event) => setDob(event.target.value)} />
          </label>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Enroll student'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
