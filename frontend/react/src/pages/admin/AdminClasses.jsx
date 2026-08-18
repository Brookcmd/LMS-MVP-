import React, { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import GradeBandTabs from '../../components/GradeBandTabs'
import {
  createClass,
  deleteClass,
  listClasses,
  listTeachers,
  updateClass,
} from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'
import { getGradeBandForClass } from '../../utils/gradeBands'

export default function AdminClasses() {
  const { searchQuery: topSearch = '' } = useOutletContext() ?? {}
  const { toast } = useToast()
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeBand, setActiveBand] = useState('all')
  const [searchTerm, setSearchTerm] = useState(topSearch)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [teacherSearch, setTeacherSearch] = useState('')

  useEffect(() => {
    if (topSearch !== searchTerm) {
      setSearchTerm(topSearch)
    }
  }, [topSearch])

  async function loadData() {
    try {
      setLoading(true)
      const [classData, teacherData] = await Promise.all([
        listClasses(),
        listTeachers({ limit: 100 }),
      ])
      setClasses(classData ?? [])
      setTeachers(teacherData?.items ?? teacherData ?? [])
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
    setTeacherSearch('')
    setModalOpen(true)
  }

  function openEdit(schoolClass) {
    setEditing(schoolClass)
    setName(schoolClass.name ?? '')
    setSelectedTeacherIds((schoolClass.teachers ?? []).map((entry) => String(entry.teacher?.id ?? entry.teacherId)).filter(Boolean))
    setTeacherSearch('')
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

  // Grade-Band counts
  const bandCounts = useMemo(() => {
    const counts = { all: classes.length, kg: 0, primary: 0, high: 0, prep: 0 }
    classes.forEach((c) => {
      const band = getGradeBandForClass(c.name)
      if (counts[band] !== undefined) counts[band]++
    })
    return counts
  }, [classes])

  // Filter classes
  const filtered = useMemo(() => {
    return classes.filter((schoolClass) => {
      if (activeBand !== 'all') {
        const band = getGradeBandForClass(schoolClass.name)
        if (band !== activeBand) return false
      }
      if (!searchTerm) return true
      const teacherNames = (schoolClass.teachers ?? []).map((entry) => entry.teacher?.name).join(' ')
      return [schoolClass.name, teacherNames].some((value) => value?.toLowerCase().includes(searchTerm.toLowerCase()))
    })
  }, [classes, activeBand, searchTerm])

  const filteredModalTeachers = useMemo(() => {
    if (!teacherSearch) return teachers
    return teachers.filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || t.email.toLowerCase().includes(teacherSearch.toLowerCase()))
  }, [teachers, teacherSearch])

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">Curriculum & Class Sections</span>
          <h1>Classes & Cohorts ({classes.length} Total Sections)</h1>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span className="material-symbols-outlined">add</span>
          Create New Class Section
        </button>
      </section>

      {/* Grade-Band Tabs */}
      <GradeBandTabs
        activeBand={activeBand}
        onSelectBand={setActiveBand}
        counts={bandCounts}
      />

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary, #f8fafc)', borderRadius: '8px', padding: '0 10px', border: '1px solid var(--border-color, #cbd5e1)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>search</span>
          <input
            type="text"
            placeholder="Search class name or assigned faculty teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 8px',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="admin-icon-btn"
              style={{ width: '24px', height: '24px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined spinning" style={{ fontSize: '28px', marginRight: '8px' }}>progress_activity</span>
          Loading classes directory…
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-table-wrap" style={{ margin: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Class Section</th>
                  <th>Level / Tier</th>
                  <th>Assigned Faculty</th>
                  <th>Enrolled Students</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-empty-cell" style={{ padding: '40px 20px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-muted)' }}>
                        domain_disabled
                      </span>
                      <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        No classes found matching your criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((schoolClass) => {
                    const studentCount = schoolClass.students?.length ?? 0
                    const teachersList = schoolClass.teachers ?? []

                    return (
                      <tr key={schoolClass.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem', background: 'var(--navy-surface)', color: 'var(--navy-primary)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>school</span>
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', display: 'block' }}>
                                {schoolClass.name}
                              </strong>
                              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID #{schoolClass.id}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="admin-tag-pill" style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
                            {getGradeBandForClass(schoolClass.name)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {teachersList.length > 0 ? (
                              teachersList.map((t, idx) => (
                                <span key={idx} className="status-pill present" style={{ fontSize: '0.75rem' }}>
                                  {t.teacher?.name || 'Teacher'}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No homeroom assigned</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '600',
                            color: studentCount > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontSize: '0.875rem',
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--navy-primary)' }}>group</span>
                            {studentCount} Students
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Edit/Create Modal */}
      <AdminModal
        open={modalOpen}
        title={editing ? 'Edit Class Cohort' : 'Create New Class Section'}
        subtitle="Configure section naming and assign faculty instructors"
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
              placeholder="e.g. Grade 10-A, KG 1-B, or Grade 12 Natural-A"
              required
            />
          </div>

          <div className="input-label">
            <span className="label-caps">Assign Faculty Instructors ({selectedTeacherIds.length} Selected)</span>
            <input
              type="text"
              className="input-field"
              placeholder="Filter teachers by name..."
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              style={{ marginBottom: '8px' }}
            />
            {filteredModalTeachers.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matching teachers found.</p>
            ) : (
              <div className="admin-checkbox-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {filteredModalTeachers.map((teacher) => (
                  <label key={teacher.id} className="admin-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedTeacherIds.includes(String(teacher.id))}
                      onChange={() => toggleTeacher(String(teacher.id))}
                    />
                    <span>{teacher.name} ({teacher.email})</span>
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
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Section'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
