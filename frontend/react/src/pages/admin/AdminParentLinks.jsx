import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import Pagination from '../../components/Pagination'
import SearchableSelect from '../../components/SearchableSelect'
import {
  deleteParentStudentLink,
  listParentStudentLinks,
  listParents,
  listStudents,
  upsertParentStudentLink,
} from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'

export default function AdminParentLinks() {
  const { searchQuery: topSearch = '' } = useOutletContext() ?? {}
  const { toast } = useToast()

  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState(topSearch)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Create Link Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [parentOptions, setParentOptions] = useState([])
  const [studentOptions, setStudentOptions] = useState([])
  const [parentUserId, setParentUserId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [relationship, setRelationship] = useState('parent')
  const [saving, setSaving] = useState(false)

  // Sync top navbar search
  useEffect(() => {
    if (topSearch !== searchTerm) {
      setSearchTerm(topSearch)
      setPage(1)
    }
  }, [topSearch])

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true)
      const res = await listParentStudentLinks({
        page,
        limit,
        search: searchTerm,
      })

      if (res && res.items) {
        setLinks(res.items)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } else if (Array.isArray(res)) {
        setLinks(res)
        setTotal(res.length)
        setTotalPages(1)
      } else {
        setLinks([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load parent links')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchTerm])

  useEffect(() => {
    loadLinks()
  }, [loadLinks])

  function handleSearchChange(e) {
    setSearchTerm(e.target.value)
    setPage(1)
  }

  function openCreate() {
    setParentUserId('')
    setStudentId('')
    setRelationship('parent')
    setParentOptions([])
    setStudentOptions([])
    setModalOpen(true)
    searchParents('')
    searchStudents('')
  }

  async function searchParents(query = '') {
    try {
      const res = await listParents({ search: query, limit: 25 })
      const list = res?.items ?? res ?? []
      setParentOptions(list)
    } catch {
      // fallback
    }
  }

  async function searchStudents(query = '') {
    try {
      const res = await listStudents({ search: query, limit: 25 })
      const list = res?.items ?? res ?? []
      setStudentOptions(list)
    } catch {
      // fallback
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (!parentUserId || !studentId) {
      toast.warning('Please select both a parent and a student.')
      return
    }
    try {
      setSaving(true)
      await upsertParentStudentLink({
        parentUserId: Number(parentUserId),
        studentId: Number(studentId),
        relationship,
        isPrimary: true,
      })
      toast.success('Parent-student relationship verified and saved.')
      setModalOpen(false)
      loadLinks()
    } catch (err) {
      toast.error(err?.message ?? 'Unable to save parent link')
    } finally {
      setSaving(false)
    }
  }

  async function removeLink(link) {
    const parentId = link.parent?.id ?? link.parentUserId
    const childId = link.student?.id ?? link.studentId
    if (!window.confirm('Are you sure you want to disconnect this parent-student relationship?')) return

    try {
      await deleteParentStudentLink(parentId, childId)
      toast.success('Relationship link removed.')
      loadLinks()
    } catch (err) {
      toast.error(err?.message ?? 'Unable to delete parent link')
    }
  }

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">Family Registry & Relationships</span>
          <h1>Parent-Student Linkages ({total.toLocaleString()})</h1>
        </div>
        <button
          type="button"
          className="admin-primary-button"
          onClick={openCreate}
        >
          <span className="material-symbols-outlined">link</span>
          Establish Relationship Link
        </button>
      </section>

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary, #f8fafc)', borderRadius: '8px', padding: '0 10px', border: '1px solid var(--border-color, #cbd5e1)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>search</span>
          <input
            type="text"
            placeholder="Search relationships by parent name, email, or student name..."
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

      {loading ? (
        <div className="admin-loading" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined spinning" style={{ fontSize: '28px', marginRight: '8px' }}>progress_activity</span>
          Loading relationship linkages…
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-table-wrap" style={{ margin: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Guardian Parent</th>
                  <th>Linked Student</th>
                  <th>Relationship</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-empty-cell" style={{ padding: '40px 20px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-muted)' }}>
                        link_off
                      </span>
                      <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        No relationship links found.
                      </p>
                    </td>
                  </tr>
                ) : (
                  links.map((link) => {
                    const parentName = link.parent?.name ?? 'Parent'
                    const studentName = link.student?.name ?? 'Student'
                    const studentClass = link.student?.class?.name ?? ''

                    return (
                      <tr key={`${link.parentUserId}-${link.studentId}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '0.8rem' }}>
                              {parentName[0]?.toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{parentName}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {link.parent?.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '0.8rem', background: 'var(--navy-surface)', color: 'var(--navy-primary)' }}>
                              {studentName[0]?.toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{studentName}</strong>
                              {studentClass && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {studentClass}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="status-pill present" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                            {link.relationship || 'Primary Guardian'}
                          </span>
                        </td>
                        <td>
                          <span className="admin-tag-pill">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--status-present-text)' }}>verified</span>
                            Authorized
                          </span>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-icon-btn danger"
                              onClick={() => removeLink(link)}
                              title="Unlink guardian"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>link_off</span>
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

          {/* Pagination */}
          <Pagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            itemLabel="linkages"
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1) }}
          />
        </div>
      )}

      {/* Link Parent Modal */}
      <AdminModal
        open={modalOpen}
        title="Establish Parent-Student Link"
        subtitle="Authorize guardian portal access for student records"
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submit}>
          <div className="input-label">
            <span className="label-caps">Select Guardian Parent</span>
            <SearchableSelect
              value={parentUserId}
              onChange={(val) => setParentUserId(val)}
              onSearch={searchParents}
              options={parentOptions}
              placeholder="Type parent name or email..."
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
            <span className="label-caps">Select Enrolled Student</span>
            <SearchableSelect
              value={studentId}
              onChange={(val) => setStudentId(val)}
              onSearch={searchStudents}
              options={studentOptions}
              placeholder="Type student name or section..."
              labelKey="name"
              valueKey="id"
              renderOption={(student) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{student.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ID #{student.id}</span>
                  </div>
                  <span className="status-pill present" style={{ fontSize: '0.7rem' }}>
                    {student.class?.name ?? 'Section'}
                  </span>
                </div>
              )}
            />
          </div>

          <div className="input-label">
            <span className="label-caps">Relationship Role</span>
            <select
              className="select-field"
              value={relationship}
              onChange={(event) => setRelationship(event.target.value)}
            >
              <option value="parent">Parent / Mother / Father</option>
              <option value="guardian">Legal Guardian</option>
              <option value="sponsor">Academic Sponsor</option>
            </select>
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-primary-button" disabled={saving || !parentUserId || !studentId}>
              <span className="material-symbols-outlined">link</span>
              {saving ? 'Linking…' : 'Establish Link'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
