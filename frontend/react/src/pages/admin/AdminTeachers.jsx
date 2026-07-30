import React from 'react'
import { useOutletContext } from 'react-router-dom'
import AdminModal from './AdminModal'
import { listTeachers, signup } from '../../api/apiClient'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export default function AdminTeachers() {
  const { searchQuery = '' } = useOutletContext() ?? {}
  const [teachers, setTeachers] = React.useState([])
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
      const data = await listTeachers()
      setTeachers(data ?? [])
    } catch (err) {
      setError(err?.message ?? 'Unable to load teachers')
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
      const created = await signup({ name, email, password, role: 'teacher' })
      setTeachers((current) => [created, ...current])
      setModalOpen(false)
    } catch (err) {
      setError(err?.message ?? 'Unable to create teacher account')
    } finally {
      setSaving(false)
    }
  }

  const filtered = teachers.filter((teacher) => {
    if (!searchQuery) return true
    return [teacher.name, teacher.email, teacher.phone].some((value) => value?.toLowerCase().includes(searchQuery))
  })

  return (
    <>
      <section className="admin-page-head">
        <div>
          <h2>Teachers</h2>
          <p>Create teacher login accounts and view staff records.</p>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span className="material-symbols-outlined">person_add</span>
          Add Teacher
        </button>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading teachers…</div>
      ) : (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Classes</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">No teachers found.</td>
                </tr>
              ) : filtered.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.phone || '—'}</td>
                  <td>{teacher.classesTeaching?.map((entry) => entry.class?.name).filter(Boolean).join(', ') || '—'}</td>
                  <td>{formatDate(teacher.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title="Add teacher account"
        subtitle="Creates a login account the teacher can use to mark attendance and enter grades."
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
              {saving ? 'Creating…' : 'Create teacher'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
