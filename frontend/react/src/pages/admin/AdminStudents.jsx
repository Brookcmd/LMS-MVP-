import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import Pagination from '../../components/Pagination'
import GradeBandTabs from '../../components/GradeBandTabs'
import SearchableSelect from '../../components/SearchableSelect'
import {
  createStudent,
  deleteStudent,
  listClasses,
  listStudents,
  updateStudent,
  listParents,
  upsertParentStudentLink,
} from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'
import { groupClassesByGradeBand } from '../../utils/gradeBands'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminStudents() {
  const { searchQuery: topSearch = '' } = useOutletContext() ?? {}
  const { toast } = useToast()

  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters & Pagination State
  const [activeBand, setActiveBand] = useState('all')
  const [classFilter, setClassFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState(topSearch)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [classId, setClassId] = useState('')
  const [dob, setDob] = useState('')
  const [saving, setSaving] = useState(false)

  // Quick Link Parent Modal
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkingStudent, setLinkingStudent] = useState(null)
  const [parentOptions, setParentOptions] = useState([])
  const [selectedParentId, setSelectedParentId] = useState('')
  const [relationship, setRelationship] = useState('parent')
  const [savingLink, setSavingLink] = useState(false)

  // Sync top navbar search
  useEffect(() => {
    if (topSearch !== searchTerm) {
      setSearchTerm(topSearch)
      setPage(1)
    }
  }, [topSearch])

  // Load classes once for dropdowns
  useEffect(() => {
    async function fetchClasses() {
      try {
        const classData = await listClasses()
        setClasses(classData ?? [])
      } catch (err) {
        toast.error(err?.message ?? 'Unable to load classes')
      }
    }
    fetchClasses()
  }, [])

  // Load paginated students from backend
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await listStudents({
        page,
        limit,
        search: searchTerm,
        classId: classFilter ? Number(classFilter) : undefined,
        gradeBand: activeBand !== 'all' ? activeBand : undefined,
      })

      if (res && res.items) {
        setStudents(res.items)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } else if (Array.isArray(res)) {
        setStudents(res)
        setTotal(res.length)
        setTotalPages(1)
      } else {
        setStudents([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load students')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchTerm, classFilter, activeBand])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  function handleBandChange(bandId) {
    setActiveBand(bandId)
    setClassFilter('') // reset specific class filter when changing band
    setPage(1)
  }

  function handleClassFilterChange(e) {
    setClassFilter(e.target.value)
    setPage(1)
  }

  function handleSearchChange(e) {
    setSearchTerm(e.target.value)
    setPage(1)
  }

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
        await updateStudent(editing.id, payload)
        toast.success(`Student "${name}" updated successfully.`)
      } else {
        await createStudent(payload)
        toast.success(`Student "${name}" enrolled successfully.`)
      }

      setModalOpen(false)
      loadStudents()
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
      toast.success(`Student "${student.name}" removed from registry.`)
      loadStudents()
    } catch (err) {
      toast.error(err?.message ?? 'Unable to delete student')
    }
  }

  // Quick Link Guardian Modal Actions
  function openLinkModal(student) {
    setLinkingStudent(student)
    setSelectedParentId('')
    setRelationship('parent')
    setParentOptions([])
    setLinkModalOpen(true)
    // Pre-fetch initial parents
    searchParents('')
  }

  async function searchParents(query = '') {
    try {
      const res = await listParents({ search: query, limit: 20 })
      const list = res?.items ?? res ?? []
      setParentOptions(list)
    } catch {
      // silently fallback
    }
  }

  async function submitLink(event) {
    event.preventDefault()
    if (!selectedParentId || !linkingStudent) {
      toast.warning('Please select a guardian parent.')
      return
    }
    try {
      setSavingLink(true)
      await upsertParentStudentLink({
        parentUserId: Number(selectedParentId),
        studentId: linkingStudent.id,
        relationship,
        isPrimary: true,
      })
      toast.success(`Linked guardian to ${linkingStudent.name}.`)
      setLinkModalOpen(false)
      loadStudents()
    } catch (err) {
      toast.error(err?.message ?? 'Unable to link parent')
    } finally {
      setSavingLink(false)
    }
  }

  const groupedClasses = groupClassesByGradeBand(classes)

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">Student Registry & Records</span>
          <h1>Students Directory ({total.toLocaleString()})</h1>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate} disabled={classes.length === 0}>
          <span className="material-symbols-outlined">person_add</span>
          Enroll Student
        </button>
      </section>

      {/* Grade-Band Tabs */}
      <GradeBandTabs
        activeBand={activeBand}
        onSelectBand={handleBandChange}
      />

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary, #f8fafc)', borderRadius: '8px', padding: '0 10px', border: '1px solid var(--border-color, #cbd5e1)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>search</span>
              <input
                type="text"
                placeholder="Search students, parents, or classes..."
                value={searchTerm}
                onChange={handleSearchChange}
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
                  onClick={() => { setSearchTerm(''); setPage(1) }}
                  className="admin-icon-btn"
                  style={{ width: '24px', height: '24px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ minWidth: '240px', flex: '0 1 auto' }}>
            <select
              className="select-field"
              value={classFilter}
              onChange={handleClassFilterChange}
              style={{ padding: '9px 12px', borderRadius: '8px', width: '100%' }}
            >
              <option value="">All Class Sections ({classes.length} Total)</option>
              {Object.entries(groupedClasses).map(([bandKey, group]) => {
                if (group.classes.length === 0) return null
                return (
                  <optgroup key={bandKey} label={`── ${group.label} ──`}>
                    {group.classes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.students?.length ?? 0} students)
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="admin-loading" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined spinning" style={{ fontSize: '28px', marginRight: '8px' }}>progress_activity</span>
          Loading student registry…
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-table-wrap" style={{ margin: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Section / Class</th>
                  <th>Date of Birth</th>
                  <th>Guardians</th>
                  <th>ID</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-empty-cell" style={{ padding: '40px 20px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-muted)' }}>
                        person_off
                      </span>
                      <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        No students match the current filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const parentLinks = student.parents ?? []
                    const hasParents = parentLinks.length > 0

                    return (
                      <tr key={student.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                              {(student.name || 'S')[0].toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{student.name}</strong>
                              {hasParents && (
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                  {parentLinks.map(p => p.parent?.name).filter(Boolean).join(', ')}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="status-pill present" style={{ fontSize: '0.78rem' }}>
                            {student.class?.name ?? 'Unassigned'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {formatDate(student.dob)}
                        </td>
                        <td>
                          {hasParents ? (
                            <span className="admin-tag-pill" title={parentLinks.map(p => p.parent?.name).join(', ')}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--status-present-text)' }}>family_restroom</span>
                              {parentLinks.length} Linked
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openLinkModal(student)}
                              style={{
                                border: '1px dashed var(--border-color, #cbd5e1)',
                                background: 'transparent',
                                color: 'var(--navy-primary, #0f2744)',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>link</span>
                              Link Parent
                            </button>
                          )}
                        </td>
                        <td>
                          <span className="admin-tag-pill" style={{ fontFamily: 'monospace' }}>#{student.id}</span>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-icon-btn"
                              onClick={() => openLinkModal(student)}
                              title="Link / Manage Guardian"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>family_restroom</span>
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn"
                              onClick={() => openEdit(student)}
                              title="Edit profile"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn danger"
                              onClick={() => removeStudent(student)}
                              title="Remove student"
                            >
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

          {/* Pagination Footer */}
          <Pagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            itemLabel="students"
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1) }}
          />
        </div>
      )}

      {/* Enroll / Edit Modal */}
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
              {Object.entries(groupedClasses).map(([bandKey, group]) => {
                if (group.classes.length === 0) return null
                return (
                  <optgroup key={bandKey} label={group.label}>
                    {group.classes.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </optgroup>
                )
              })}
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

      {/* Quick Link Guardian Modal */}
      <AdminModal
        open={linkModalOpen}
        title={`Link Guardian to ${linkingStudent?.name ?? 'Student'}`}
        subtitle={`Class: ${linkingStudent?.class?.name ?? 'Assigned Section'}`}
        onClose={() => setLinkModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submitLink}>
          <div className="input-label">
            <span className="label-caps">Search Guardian Parent</span>
            <SearchableSelect
              value={selectedParentId}
              onChange={(val) => setSelectedParentId(val)}
              onSearch={searchParents}
              options={parentOptions}
              placeholder="Type guardian name or email..."
              labelKey="name"
              valueKey="id"
              renderOption={(parent) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{parent.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{parent.email}</span>
                </div>
              )}
            />
          </div>

          <div className="input-label">
            <span className="label-caps">Relationship Role</span>
            <select
              className="select-field"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              <option value="parent">Parent / Mother / Father</option>
              <option value="guardian">Legal Guardian</option>
              <option value="sponsor">Academic Sponsor</option>
            </select>
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-primary-button" disabled={savingLink || !selectedParentId}>
              <span className="material-symbols-outlined">link</span>
              {savingLink ? 'Linking…' : 'Establish Link'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
