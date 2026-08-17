import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import {
  createStudent,
  deleteStudent,
  listClasses,
  listStudents,
  updateStudent,
} from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminStudents() {
  const { searchQuery = '' } = useOutletContext() ?? {}
  const { toast } = useToast()
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [classId, setClassId] = useState('')
  const [dob, setDob] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [studentData, classData] = await Promise.all([listStudents(), listClasses()])
      setStudents(studentData ?? [])
      setClasses(classData ?? [])
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
    if (!name.trim() || !classId) {
      toast.warning('Please provide a student name and class assignment.')
      return
    }
    try {
      setSaving(true)
      const payload = { name: name.trim(), classId: Number(classId), dob: dob || null }

      if (editing) {
        const updated = await updateStudent(editing.id, payload)
        setStudents((current) => current.map((item) => (item.id === editing.id ? { ...item, ...updated } : item)))
        toast.success(`Student "${name}" updated successfully.`)
      } else {
        const created = await createStudent(payload)
        setStudents((current) => [created, ...current])
        toast.success(`Student "${name}" enrolled successfully.`)
      }

      setModalOpen(false)
    } catch (err) {
      toast.error(err?.message ?? 'Unable to save student')
    } finally {
      setSaving(false)
    }
  }

  async function removeStudent(student) {
    if (!window.confirm(`Are you sure you want to remove ${student.name}?`)) return
    try {
      await deleteStudent(student.id)
      setStudents((current) => current.filter((item) => item.id !== student.id))
      toast.success(`Student "${student.name}" removed from registry.`)
    } catch (err) {
      toast.error(err?.message ?? 'Unable to delete student')
    }
  }

  const classMap = Object.fromEntries(classes.map((item) => [item.id, item.name]))
  const filtered = students.filter((student) => {
    if (classFilter && String(student.classId ?? student.class?.id) !== classFilter) return false
    if (!searchQuery) return true
    const className = classMap[student.classId ?? student.class?.id] ?? ''
    return [student.name, className].some((value) => value?.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">Student Registry</span>
          <h1>Students Management</h1>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate} disabled={classes.length === 0}>
          <span className="material-symbols-outlined">person_add</span>
          Enroll Student
        </button>
      </section>

      <div className="card" style={{ padding: '14px 20px', marginBottom: '20px' }}>
        <div className="admin-filter-row" style={{ margin: 0 }}>
          <div className="input-label" style={{ margin: 0, minWidth: '220px' }}>
            <span className="label-caps">Filter by Class</span>
            <select className="select-field" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="">All Classes ({students.length} Students)</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading student registry…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Enrolled Class</th>
                <th>Date of Birth</th>
                <th>Student ID</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>
                      person_off
                    </span>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>No students found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                          {(student.name || 'S')[0].toUpperCase()}
                        </div>
                        <strong style={{ color: 'var(--text-primary)' }}>{student.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="status-pill present" style={{ fontSize: '0.78rem' }}>
                        {student.class?.name ?? classMap[student.classId] ?? 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {formatDate(student.dob)}
                    </td>
                    <td>
                      <span className="admin-tag-pill">#{student.id}</span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button type="button" className="admin-icon-btn" onClick={() => openEdit(student)} title="Edit profile">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                        <button type="button" className="admin-icon-btn danger" onClick={() => removeStudent(student)} title="Remove student">
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
        title={editing ? 'Edit Student Profile' : 'Enroll New Student'}
        subtitle="Manage official student registry records"
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submit}>
          <div className="input-label">
            <span className="label-caps">Full Name</span>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Abebe Kebede"
              required
            />
          </div>

          <div className="input-label">
            <span className="label-caps">Enrolled Class</span>
            <select
              className="select-field"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              required
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="input-label">
            <span className="label-caps">Date of Birth (Optional)</span>
            <input
              type="date"
              className="input-field"
              value={dob}
              onChange={(event) => setDob(event.target.value)}
            />
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              <span className="material-symbols-outlined">save</span>
              {saving ? 'Saving…' : editing ? 'Update Student' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
