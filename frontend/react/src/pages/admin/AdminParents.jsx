import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import Pagination from '../../components/Pagination'
import SearchableSelect from '../../components/SearchableSelect'
import {
  listParents,
  signup,
  listStudents,
  upsertParentStudentLink,
} from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminParents() {
  const { searchQuery: topSearch = '' } = useOutletContext() ?? {}
  const { toast } = useToast()

  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState(topSearch)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Create Parent Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  // Link Child Modal
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkingParent, setLinkingParent] = useState(null)
  const [studentOptions, setStudentOptions] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [relationship, setRelationship] = useState('parent')
  const [savingLink, setSavingLink] = useState(false)

  // Sync top navbar search
  useEffect(() => {
    if (topSearch !== searchTerm) {
      setSearchTerm(topSearch)
      setPage(1)
    }
  }, [topSearch])

  // Load paginated parents from backend
  const loadParents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await listParents({
        page,
        limit,
        search: searchTerm,
      })

      if (res && res.items) {
        setParents(res.items)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } else if (Array.isArray(res)) {
        setParents(res)
        setTotal(res.length)
        setTotalPages(1)
      } else {
        setParents([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load parents')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchTerm])

  useEffect(() => {
    loadParents()
  }, [loadParents])

  function handleSearchChange(e) {
    setSearchTerm(e.target.value)
    setPage(1)
  }

  function openCreate() {
    setName('')
    setEmail('')
    setPassword('')
    setModalOpen(true)
  }

  async function submit(event) {
    event.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.warning('Please complete all required fields.')
      return
    }
    try {
      setSaving(true)
      await signup({ name: name.trim(), email: email.trim(), password: password.trim(), role: 'parent' })
      toast.success(`Parent account created for "${name}".`)
      setModalOpen(false)
      loadParents()
    } catch (err) {
      toast.error(err?.message ?? 'Unable to create parent account')
    } finally {
      setSaving(false)
    }
  }

  // Quick Link Student Modal
  function openLinkModal(parent) {
    setLinkingParent(parent)
    setSelectedStudentId('')
    setRelationship('parent')
    setStudentOptions([])
    setLinkModalOpen(true)
    searchStudents('')
  }

  async function searchStudents(query = '') {
    try {
      const res = await listStudents({ search: query, limit: 20 })
      const list = res?.items ?? res ?? []
      setStudentOptions(list)
    } catch {
      // fallback
    }
  }

  async function submitLink(event) {
    event.preventDefault()
    if (!selectedStudentId || !linkingParent) {
      toast.warning('Please select a student.')
      return
    }
    try {
      setSavingLink(true)
      await upsertParentStudentLink({
        parentUserId: linkingParent.id,
        studentId: Number(selectedStudentId),
        relationship,
        isPrimary: true,
      })
      toast.success(`Linked student to ${linkingParent.name}.`)
      setLinkModalOpen(false)
      loadParents()
    } catch (err) {
      toast.error(err?.message ?? 'Unable to link student')
    } finally {
      setSavingLink(false)
    }
  }

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">Family & Guardian Accounts</span>
          <h1>Parents & Guardians Directory ({total.toLocaleString()})</h1>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span className="material-symbols-outlined">person_add</span>
          Add Parent Account
        </button>
      </section>

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary, #f8fafc)', borderRadius: '8px', padding: '0 10px', border: '1px solid var(--border-color, #cbd5e1)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>search</span>
          <input
            type="text"
            placeholder="Search guardians by name, email, phone, or child name..."
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
          Loading parent records…
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-table-wrap" style={{ margin: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Guardian Name</th>
                  <th>Contact Email</th>
                  <th>Linked Children</th>
                  <th>Account Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-empty-cell" style={{ padding: '40px 20px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-muted)' }}>
                        family_restroom
                      </span>
                      <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        No parent accounts match the search criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  parents.map((parent) => {
                    const children = parent.parentChildren ?? []
                    const hasChildren = children.length > 0

                    return (
                      <tr key={parent.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                              {(parent.name || 'P')[0].toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{parent.name}</strong>
                              {parent.phone && (
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{parent.phone}</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                          {parent.email}
                        </td>
                        <td>
                          {hasChildren ? (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {children.map((c, i) => (
                                <span
                                  key={i}
                                  className="status-pill present"
                                  style={{ fontSize: '0.75rem' }}
                                  title={`Class: ${c.student?.class?.name ?? 'Class'}`}
                                >
                                  {c.student?.name} {c.student?.class?.name ? `(${c.student.class.name})` : ''}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openLinkModal(parent)}
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
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add_link</span>
                              Link Child
                            </button>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {formatDate(parent.createdAt)}
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-icon-btn"
                              onClick={() => openLinkModal(parent)}
                              title="Link Student to this Guardian"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_link</span>
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
            itemLabel="guardians"
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1) }}
          />
        </div>
      )}

      {/* Create Modal */}
      <AdminModal
        open={modalOpen}
        title="Create Parent Account"
        subtitle="Issue a guardian access credential for the parent portal"
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submit}>
          <div className="input-label">
            <span className="label-caps">Guardian Full Name</span>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Worku Abebe"
              required
            />
          </div>

          <div className="input-label">
            <span className="label-caps">Email Address</span>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="workuabebe@parent.com"
              required
            />
          </div>

          <div className="input-label">
            <span className="label-caps">Temporary Password</span>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              <span className="material-symbols-outlined">save</span>
              {saving ? 'Creating…' : 'Issue Account'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Link Student Modal */}
      <AdminModal
        open={linkModalOpen}
        title={`Link Student to ${linkingParent?.name ?? 'Guardian'}`}
        subtitle={`Guardian Email: ${linkingParent?.email ?? ''}`}
        onClose={() => setLinkModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submitLink}>
          <div className="input-label">
            <span className="label-caps">Search Enrolled Student</span>
            <SearchableSelect
              value={selectedStudentId}
              onChange={(val) => setSelectedStudentId(val)}
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
            <button type="submit" className="admin-primary-button" disabled={savingLink || !selectedStudentId}>
              <span className="material-symbols-outlined">link</span>
              {savingLink ? 'Linking…' : 'Establish Link'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
