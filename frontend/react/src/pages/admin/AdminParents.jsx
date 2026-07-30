import React from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import { listParents, signup } from '../../api/apiClient'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export default function AdminParents() {
  const { searchQuery = '' } = useOutletContext() ?? {}
  const [parents, setParents] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const data = await listParents()
      setParents(data ?? [])
    } catch (err) {
      setError(err?.message ?? 'Unable to load parents')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
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
    try {
      setSaving(true)
      setError(null)
      const created = await signup({ name, email, password, role: 'parent' })
      setParents((current) => [created, ...current])
      setModalOpen(false)
    } catch (err) {
      setError(err?.message ?? 'Unable to create parent account')
    } finally {
      setSaving(false)
    }
  }

  const filtered = parents.filter((parent) => {
    if (!searchQuery) return true
    return [parent.name, parent.email, parent.phone].some((value) => value?.toLowerCase().includes(searchQuery))
  })

  return (
    <>
      <section className="admin-page-head">
        <div>
          <h2>Parents</h2>
          <p>Create parent login accounts, then link them to students on the Parent Links page.</p>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span className="material-symbols-outlined">person_add</span>
          Add Parent
        </button>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading parents…</div>
      ) : (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Linked children</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">No parents found.</td>
                </tr>
              ) : filtered.map((parent) => (
                <tr key={parent.id}>
                  <td>{parent.name}</td>
                  <td>{parent.email}</td>
                  <td>{parent.phone || '—'}</td>
                  <td>{parent.parentChildren?.map((entry) => entry.student?.name).filter(Boolean).join(', ') || '—'}</td>
                  <td>{formatDate(parent.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title="Add parent account"
        subtitle="Creates a login account so the parent can view attendance and grades."
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submit}>
          <label>
            Full name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Temporary password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          </label>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? 'Creating…' : 'Create parent'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
