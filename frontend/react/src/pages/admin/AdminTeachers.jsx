import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import { listTeachers, signup } from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminTeachers() {
  const { searchQuery = '' } = useOutletContext() ?? {}
  const { toast } = useToast()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const data = await listTeachers()
      setTeachers(data ?? [])
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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
      const created = await signup({ name: name.trim(), email: email.trim(), password: password.trim(), role: 'teacher' })
      setTeachers((current) => [created, ...current])
      toast.success(`Faculty account created for "${name}".`)
      setModalOpen(false)
    } catch (err) {
      toast.error(err?.message ?? 'Unable to create teacher account')
    } finally {
      setSaving(false)
    }
  }

  const filtered = teachers.filter((teacher) => {
    if (!searchQuery) return true
    return [teacher.name, teacher.email, teacher.phone].some((value) => value?.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">Academic Faculty</span>
          <h1>Faculty & Teachers</h1>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span className="material-symbols-outlined">person_add</span>
          Add Teacher Account
        </button>
      </section>

      {loading ? (
        <div className="admin-loading">Loading faculty records…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Instructor Name</th>
                <th>Institutional Email</th>
                <th>Role Category</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>
                      group_off
                    </span>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>No faculty teachers found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                          {(teacher.name || 'T')[0].toUpperCase()}
                        </div>
                        <strong style={{ color: 'var(--text-primary)' }}>{teacher.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{teacher.email}</td>
                    <td>
                      <span className="status-pill present" style={{ fontSize: '0.78rem' }}>
                        Faculty Instructor
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {formatDate(teacher.createdAt)}
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
