import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import Pagination from '../../components/Pagination'
import { listTeachers, signup } from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminTeachers() {
  const { searchQuery: topSearch = '' } = useOutletContext() ?? {}
  const { toast } = useToast()

  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState(topSearch)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  // Sync top navbar search
  useEffect(() => {
    if (topSearch !== searchTerm) {
      setSearchTerm(topSearch)
      setPage(1)
    }
  }, [topSearch])

  const loadTeachers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await listTeachers({
        page,
        limit,
        search: searchTerm,
      })

      if (res && res.items) {
        setTeachers(res.items)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } else if (Array.isArray(res)) {
        setTeachers(res)
        setTotal(res.length)
        setTotalPages(1)
      } else {
        setTeachers([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load faculty teachers')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchTerm])

  useEffect(() => {
    loadTeachers()
  }, [loadTeachers])

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
      await signup({ name: name.trim(), email: email.trim(), password: password.trim(), role: 'teacher' })
      toast.success(`Faculty account created for "${name}".`)
      setModalOpen(false)
      loadTeachers()
    } catch (err) {
      toast.error(err?.message ?? 'Unable to create teacher account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">Academic Faculty & Instructors</span>
          <h1>Faculty Directory ({total.toLocaleString()} Teachers)</h1>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span className="material-symbols-outlined">person_add</span>
          Add Faculty Account
        </button>
      </section>

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary, #f8fafc)', borderRadius: '8px', padding: '0 10px', border: '1px solid var(--border-color, #cbd5e1)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>search</span>
          <input
            type="text"
            placeholder="Search faculty by name, email, or contact number..."
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
          Loading faculty records…
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-table-wrap" style={{ margin: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Instructor</th>
                  <th>Institutional Email</th>
                  <th>Assigned Sections</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="admin-empty-cell" style={{ padding: '40px 20px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-muted)' }}>
                        group_off
                      </span>
                      <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        No faculty teachers match the search criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => {
                    const teachingClasses = teacher.classesTeaching ?? []

                    return (
                      <tr key={teacher.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                              {(teacher.name || 'T')[0].toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{teacher.name}</strong>
                              {teacher.phone && (
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{teacher.phone}</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                          {teacher.email}
                        </td>
                        <td>
                          {teachingClasses.length > 0 ? (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {teachingClasses.map((item, idx) => (
                                <span key={idx} className="status-pill present" style={{ fontSize: '0.75rem' }}>
                                  {item.class?.name || 'Class'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Floating Specialist</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {formatDate(teacher.createdAt)}
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
            itemLabel="teachers"
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1) }}
          />
        </div>
      )}

      {/* Create Modal */}
      <AdminModal
        open={modalOpen}
        title="Create Faculty Account"
        subtitle="Issue an instructor credential for the learning management system"
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
              placeholder="e.g. Dr. Alemayehu Bekele"
              required
            />
          </div>

          <div className="input-label">
            <span className="label-caps">Institutional Email</span>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="alembekele@school.edu"
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
    </>
  )
}
