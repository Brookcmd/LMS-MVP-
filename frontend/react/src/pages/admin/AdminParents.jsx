import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import { listParents, signup } from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminParents() {
  const { searchQuery = '' } = useOutletContext() ?? {}
  const { toast } = useToast()
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const data = await listParents()
      setParents(data ?? [])
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load parents')
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
      const created = await signup({ name: name.trim(), email: email.trim(), password: password.trim(), role: 'parent' })
      setParents((current) => [created, ...current])
      toast.success(`Parent account created for "${name}".`)
      setModalOpen(false)
    } catch (err) {
      toast.error(err?.message ?? 'Unable to create parent account')
    } finally {
      setSaving(false)
    }
  }

  const filtered = parents.filter((parent) => {
    if (!searchQuery) return true
    return [parent.name, parent.email, parent.phone].some((value) => value?.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">Family & Guardian Accounts</span>
          <h1>Parents & Guardians</h1>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span className="material-symbols-outlined">person_add</span>
          Add Parent Account
        </button>
      </section>

      {loading ? (
        <div className="admin-loading">Loading parent records…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Guardian Name</th>
                <th>Contact Email</th>
                <th>Linked Children</th>
                <th>Account Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>
                      family_restroom
                    </span>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>No registered parent accounts found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((parent) => (
                  <tr key={parent.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                          {(parent.name || 'P')[0].toUpperCase()}
                        </div>
                        <strong style={{ color: 'var(--text-primary)' }}>{parent.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{parent.email}</td>
                    <td>
                      <span className="status-pill present" style={{ fontSize: '0.78rem' }}>
                        {parent.parentStudents?.length ?? parent.students?.length ?? 1} Child Linked
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {formatDate(parent.createdAt)}
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
    </>
  )
}
