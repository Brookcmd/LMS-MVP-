import React from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import {
  createClass,
  deleteClass,
  listClasses,
  listTeachers,
  updateClass,
} from '../../api/apiClient'

export default function AdminClasses() {
  const { searchQuery = '' } = useOutletContext() ?? {}
  const [classes, setClasses] = React.useState([])
  const [teachers, setTeachers] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(null)
  const [name, setName] = React.useState('')
  const [selectedTeacherIds, setSelectedTeacherIds] = React.useState([])
  const [saving, setSaving] = React.useState(false)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [classData, teacherData] = await Promise.all([listClasses(), listTeachers()])
      setClasses(classData ?? [])
      setTeachers(teacherData ?? [])
    } catch (err) {
      setError(err?.message ?? 'Unable to load classes')
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
    setSelectedTeacherIds([])
    setModalOpen(true)
  }

  function openEdit(schoolClass) {
    setEditing(schoolClass)
    setName(schoolClass.name ?? '')
    setSelectedTeacherIds((schoolClass.teachers ?? []).map((entry) => String(entry.teacher?.id ?? entry.teacherId)).filter(Boolean))
    setModalOpen(true)
  }

  function toggleTeacher(teacherId) {
    setSelectedTeacherIds((current) => (
      current.includes(teacherId)
        ? current.filter((id) => id !== teacherId)
        : [...current, teacherId]
    ))
  }

  async function submit(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setError(null)
      const payload = {
        name,
        teacherIds: selectedTeacherIds.map((id) => Number(id)),
      }

      if (editing) {
        const updated = await updateClass(editing.id, payload)
        setClasses((current) => current.map((item) => (item.id === editing.id ? updated : item)))
      } else {
        const created = await createClass(payload)
        setClasses((current) => [created, ...current])
      }

      setModalOpen(false)
    } catch (err) {
      setError(err?.message ?? 'Unable to save class')
    } finally {
      setSaving(false)
    }
  }

  async function removeClass(schoolClass) {
    if (!window.confirm(`Delete class ${schoolClass.name}?`)) return
    try {
      setError(null)
      await deleteClass(schoolClass.id)
      setClasses((current) => current.filter((item) => item.id !== schoolClass.id))
    } catch (err) {
      setError(err?.message ?? 'Unable to delete class')
    }
  }

  const filtered = classes.filter((schoolClass) => {
    if (!searchQuery) return true
    const teacherNames = (schoolClass.teachers ?? []).map((entry) => entry.teacher?.name).join(' ')
    return [schoolClass.name, teacherNames].some((value) => value?.toLowerCase().includes(searchQuery))
  })

  return (
    <>
      <section className="admin-page-head">
        <div>
          <h2>Classes Management</h2>
          <p>Organize school sections and assign teachers to classes.</p>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span>
          Add New Class
        </button>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading classes…</div>
      ) : (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Class name</th>
                <th>Teachers</th>
                <th>Students</th>
                <th className="admin-table-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">No classes found.</td>
                </tr>
              ) : filtered.map((schoolClass) => (
                <tr key={schoolClass.id}>
                  <td>{schoolClass.name}</td>
                  <td>{(schoolClass.teachers ?? []).map((entry) => entry.teacher?.name).filter(Boolean).join(', ') || '—'}</td>
                  <td>{schoolClass.students?.length ?? 0}</td>
                  <td className="admin-table-actions">
                    <button type="button" className="admin-link-button" onClick={() => openEdit(schoolClass)}>Edit</button>
                    <button type="button" className="admin-link-button danger" onClick={() => removeClass(schoolClass)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title={editing ? 'Edit class' : 'Add new class'}
        subtitle="Assign one or more teachers to this class."
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submit}>
          <label>
            Class name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Grade 10-A" required />
          </label>
          <fieldset className="admin-checkbox-group">
            <legend>Teachers</legend>
            {teachers.length === 0 ? (
              <p className="admin-muted-copy">No teachers yet. Add teachers first.</p>
            ) : teachers.map((teacher) => (
              <label key={teacher.id} className="admin-checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedTeacherIds.includes(String(teacher.id))}
                  onChange={() => toggleTeacher(String(teacher.id))}
                />
                <span>{teacher.name} ({teacher.email})</span>
              </label>
            ))}
          </fieldset>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create class'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
