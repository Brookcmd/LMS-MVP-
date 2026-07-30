import React from 'react'
import AdminModal from './AdminModal'
import {
  deleteParentStudentLink,
  listParentStudentLinks,
  listParents,
  listStudents,
  upsertParentStudentLink,
} from '../../api/apiClient'

export default function AdminParentLinks() {
  const [links, setLinks] = React.useState([])
  const [parents, setParents] = React.useState([])
  const [students, setStudents] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [parentUserId, setParentUserId] = React.useState('')
  const [studentId, setStudentId] = React.useState('')
  const [relationship, setRelationship] = React.useState('parent')
  const [saving, setSaving] = React.useState(false)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [linkData, parentData, studentData] = await Promise.all([
        listParentStudentLinks(),
        listParents(),
        listStudents(),
      ])
      setLinks(linkData ?? [])
      setParents(parentData ?? [])
      setStudents(studentData ?? [])
    } catch (err) {
      setError(err?.message ?? 'Unable to load parent links')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  function openCreate() {
    setParentUserId(parents[0]?.id ? String(parents[0].id) : '')
    setStudentId(students[0]?.id ? String(students[0].id) : '')
    setRelationship('parent')
    setModalOpen(true)
  }

  async function submit(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setError(null)
      await upsertParentStudentLink({
        parentUserId: Number(parentUserId),
        studentId: Number(studentId),
        relationship,
        isPrimary: true,
      })
      await loadData()
      setModalOpen(false)
    } catch (err) {
      setError(err?.message ?? 'Unable to save parent link')
    } finally {
      setSaving(false)
    }
  }

  async function removeLink(link) {
    const parentId = link.parent?.id ?? link.parentUserId
    const childId = link.student?.id ?? link.studentId
    if (!window.confirm('Remove this parent link?')) return

    try {
      setError(null)
      await deleteParentStudentLink(parentId, childId)
      setLinks((current) => current.filter((item) => {
        const itemParentId = item.parent?.id ?? item.parentUserId
        const itemStudentId = item.student?.id ?? item.studentId
        return !(itemParentId === parentId && itemStudentId === childId)
      }))
    } catch (err) {
      setError(err?.message ?? 'Unable to delete parent link')
    }
  }

  return (
    <>
      <section className="admin-page-head">
        <div>
          <h2>Parent Links</h2>
          <p>Connect parent accounts to student records so parents can view attendance and grades.</p>
        </div>
        <button
          type="button"
          className="admin-primary-button"
          onClick={openCreate}
          disabled={parents.length === 0 || students.length === 0}
        >
          <span className="material-symbols-outlined">link</span>
          Link Parent
        </button>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading parent links…</div>
      ) : (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Parent</th>
                <th>Student</th>
                <th>Relationship</th>
                <th className="admin-table-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">No parent links yet.</td>
                </tr>
              ) : links.map((link) => {
                const parentId = link.parent?.id ?? link.parentUserId
                const childId = link.student?.id ?? link.studentId
                return (
                  <tr key={`${parentId}-${childId}`}>
                    <td>{link.parent?.name ?? parentId} ({link.parent?.email ?? '—'})</td>
                    <td>{link.student?.name ?? childId}</td>
                    <td>{link.relationship || 'parent'}</td>
                    <td className="admin-table-actions">
                      <button type="button" className="admin-link-button danger" onClick={() => removeLink(link)}>Remove</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title="Link parent to student"
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submit}>
          <label>
            Parent account
            <select value={parentUserId} onChange={(event) => setParentUserId(event.target.value)} required>
              <option value="">Select parent</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>{parent.name} ({parent.email})</option>
              ))}
            </select>
          </label>
          <label>
            Student
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)} required>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </label>
          <label>
            Relationship
            <select value={relationship} onChange={(event) => setRelationship(event.target.value)}>
              <option value="parent">Parent</option>
              <option value="guardian">Guardian</option>
            </select>
          </label>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save link'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
