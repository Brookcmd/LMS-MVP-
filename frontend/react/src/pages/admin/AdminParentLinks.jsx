import React, { useState, useEffect } from 'react'
import AdminModal from './AdminModal'
import {
  deleteParentStudentLink,
  listParentStudentLinks,
  listParents,
  listStudents,
  upsertParentStudentLink,
} from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'

export default function AdminParentLinks() {
  const { toast } = useToast()
  const [links, setLinks] = useState([])
  const [parents, setParents] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [parentUserId, setParentUserId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [relationship, setRelationship] = useState('parent')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [linkData, parentData, studentData] = await Promise.all([
        listParentStudentLinks(),
        listParents(),
        listStudents(),
      ])
      setLinks(linkData ?? [])
      setParents(parentData ?? [])
      setStudents(studentData ?? [])
    } catch (err) {
      toast.error(err?.message ?? 'Unable to load parent links')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
      toast.success('Parent-student link verified and saved.')
      await loadData()
      setModalOpen(false)
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
      setLinks((current) => current.filter((item) => {
        const itemParentId = item.parent?.id ?? item.parentUserId
        const itemStudentId = item.student?.id ?? item.studentId
        return !(itemParentId === parentId && itemStudentId === childId)
      }))
      toast.success('Relationship link removed.')
    } catch (err) {
      toast.error(err?.message ?? 'Unable to delete parent link')
    }
  }

  return (
    <>
      <section className="admin-page-head">
        <div>
          <span className="subtitle">Family Registry</span>
          <h1>Parent-Student Linkages</h1>
        </div>
        <button
          type="button"
          className="admin-primary-button"
          onClick={openCreate}
          disabled={parents.length === 0 || students.length === 0}
        >
          <span className="material-symbols-outlined">link</span>
          Link Parent to Student
        </button>
      </section>

      {loading ? (
        <div className="admin-loading">Loading relationship links…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Guardian Parent</th>
                <th>Linked Child</th>
                <th>Relationship Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty-cell">
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>
                      link_off
                    </span>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>No parent-student linkages established yet.</p>
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
                            <strong style={{ color: 'var(--text-primary)' }}>{parentName}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
                            <strong style={{ color: 'var(--text-primary)' }}>{studentName}</strong>
                            {studentClass && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
      )}

      <AdminModal
        open={modalOpen}
        title="Link Parent to Student"
        subtitle="Grant a registered parent portal access to view their student's records"
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submit}>
          <div className="input-label">
            <span className="label-caps">Select Guardian Parent</span>
            <select
              className="select-field"
              value={parentUserId}
              onChange={(event) => setParentUserId(event.target.value)}
              required
            >
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name} ({parent.email})
                </option>
              ))}
            </select>
          </div>

          <div className="input-label">
            <span className="label-caps">Select Enrolled Student</span>
            <select
              className="select-field"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              required
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.class?.name ?? 'Class'})
                </option>
              ))}
            </select>
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
            <button type="submit" className="admin-primary-button" disabled={saving}>
              <span className="material-symbols-outlined">link</span>
              {saving ? 'Linking…' : 'Establish Link'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
