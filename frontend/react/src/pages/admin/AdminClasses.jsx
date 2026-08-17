import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import {
  createClass,
  deleteClass,
  listClasses,
  listTeachers,
  updateClass,
} from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'

export default function AdminClasses() {
  const { searchQuery = '' } = useOutletContext() ?? {}
  const { toast } = useToast()
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([])
  const [saving, setSaving] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [classData, teacherData] = await Promise.all([listClasses(), listTeachers()])
      setClasses(classData ?? [])
      setTeachers(teacherData ?? [])
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load classes')
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
    if (!name.trim()) {
      toast.warning('Please provide a class name.')
      return
    }
    try {
      setSaving(true)
      const payload = {
        name: name.trim(),
        teacherIds: selectedTeacherIds.map((id) => Number(id)),
      }

      if (editing) {
        const updated = await updateClass(editing.id, payload)
        setClasses((current) => current.map((item) => (item.id === editing.id ? updated : item)))
        toast.success(`Class "${name}" updated successfully.`)
      } else {
        const created = await createClass(payload)
        setClasses((current) => [created, ...current])
        toast.success(`Class "${name}" created successfully.`)
      }

      setModalOpen(false)
    } catch (err) {
      toast.error(err?.message ?? 'Unable to save class')
    } finally {
      setSaving(false)
    }
  }

  async function removeClass(schoolClass) {
    if (!window.confirm(`Are you sure you want to delete class ${schoolClass.name}?`)) return
    try {
      await deleteClass(schoolClass.id)
      setClasses((current) => current.filter((item) => item.id !== schoolClass.id))
      toast.success(`Class "${schoolClass.name}" deleted.`)
    } catch (err) {
      toast.error(err?.message ?? 'Unable to delete class')
    }
  }

  const filtered = classes.filter((schoolClass) => {
    if (!searchQuery) return true
    const teacherNames = (schoolClass.teachers ?? []).map((entry) => entry.teacher?.name).join(' ')
    return [schoolClass.name, teacherNames].some((value) => value?.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">School Sections</span>
          <h1>Classes & Cohorts</h1>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span>
          Create New Class
        </button>
      </section>

      {loading ? (
        <div className="admin-loading">Loading classes…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Class Cohort</th>
                <th>Assigned Faculty</th>
                <th>Enrolled Students</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>
                      domain_disabled
                    </span>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>No classes registered yet.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((schoolClass) => (
                  <tr key={schoolClass.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--navy-primary)' }}>
                          school
                        </span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{schoolClass.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(schoolClass.teachers ?? []).length > 0 ? (
                          (schoolClass.teachers ?? []).map((t, idx) => (
                            <span key={idx} className="admin-tag-pill">
                              {t.teacher?.name || 'Teacher'}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No teacher assigned</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="status-pill present" style={{ fontSize: '0.78rem' }}>
                        {schoolClass.students?.length ?? 0} Students Enrolled
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button type="button" className="admin-icon-btn" onClick={() => openEdit(schoolClass)} title="Edit class">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                        <button type="button" className="admin-icon-btn danger" onClick={() => removeClass(schoolClass)} title="Delete class">
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
        title={editing ? 'Edit Class Cohort' : 'Create New Class'}
        subtitle="Configure section name and assign faculty instructors"
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submit}>
          <div className="input-label">
            <span className="label-caps">Class / Section Name</span>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Grade 10A or Year 1 Biology"
              required
            />
          </div>

          <div className="input-label">
            <span className="label-caps">Assign Faculty Instructors</span>
            {teachers.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No teachers registered yet.</p>
            ) : (
              <div className="admin-checkbox-list">
                {teachers.map((teacher) => (
                  <label key={teacher.id} className="admin-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedTeacherIds.includes(String(teacher.id))}
                      onChange={() => toggleTeacher(String(teacher.id))}
                    />
                    <span>{teacher.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              <span className="material-symbols-outlined">save</span>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Class'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
