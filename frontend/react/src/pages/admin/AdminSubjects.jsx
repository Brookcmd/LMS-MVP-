import React from 'react'
import AdminModal from './AdminModal'
import {
  createSubject,
  createTeachingAssignment,
  listAllTeachingAssignments,
  listClasses,
  listSubjects,
  listTeachers,
} from '../../api/apiClient'

export default function AdminSubjects() {
  const [subjects, setSubjects] = React.useState([])
  const [assignments, setAssignments] = React.useState([])
  const [classes, setClasses] = React.useState([])
  const [teachers, setTeachers] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [subjectModalOpen, setSubjectModalOpen] = React.useState(false)
  const [assignmentModalOpen, setAssignmentModalOpen] = React.useState(false)
  const [subjectName, setSubjectName] = React.useState('')
  const [assignmentClassId, setAssignmentClassId] = React.useState('')
  const [assignmentTeacherId, setAssignmentTeacherId] = React.useState('')
  const [assignmentSubjectId, setAssignmentSubjectId] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [subjectData, assignmentData, classData, teacherData] = await Promise.all([
        listSubjects(),
        listAllTeachingAssignments(),
        listClasses(),
        listTeachers(),
      ])
      setSubjects(subjectData ?? [])
      setAssignments(assignmentData ?? [])
      setClasses(classData ?? [])
      setTeachers(teacherData ?? [])
    } catch (err) {
      setError(err?.message ?? 'Unable to load curriculum data')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  async function submitSubject(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setError(null)
      const created = await createSubject({ name: subjectName })
      setSubjects((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
      setSubjectName('')
      setSubjectModalOpen(false)
    } catch (err) {
      setError(err?.message ?? 'Unable to create subject')
    } finally {
      setSaving(false)
    }
  }

  async function submitAssignment(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setError(null)
      const created = await createTeachingAssignment({
        classId: Number(assignmentClassId),
        teacherId: Number(assignmentTeacherId),
        subjectId: Number(assignmentSubjectId),
      })
      setAssignments((current) => [created, ...current])
      setAssignmentModalOpen(false)
    } catch (err) {
      setError(err?.message ?? 'Unable to create assignment')
    } finally {
      setSaving(false)
    }
  }

  function openAssignmentModal() {
    setAssignmentClassId(classes[0]?.id ? String(classes[0].id) : '')
    setAssignmentTeacherId(teachers[0]?.id ? String(teachers[0].id) : '')
    setAssignmentSubjectId(subjects[0]?.id ? String(subjects[0].id) : '')
    setAssignmentModalOpen(true)
  }

  return (
    <>
      <section className="admin-page-head">
        <div>
          <h2>Curriculum &amp; Teaching</h2>
          <p>Manage subject directories and teaching staff assignments.</p>
        </div>
        <div className="admin-page-head-actions">
          <button type="button" className="admin-secondary-button" onClick={() => setSubjectModalOpen(true)}>
            <span className="material-symbols-outlined">add</span>
            Create Subject
          </button>
          <button type="button" className="admin-primary-button" onClick={openAssignmentModal}>
            <span className="material-symbols-outlined">assignment_add</span>
            New Assignment
          </button>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading subjects and assignments…</div>
      ) : (
        <div className="admin-split-grid">
          <section className="admin-panel">
            <div className="admin-panel-head">
              <h3>Subject Directory</h3>
              <span>{subjects.length} subjects</span>
            </div>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Subject name</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr>
                      <td className="admin-empty-cell">No subjects yet.</td>
                    </tr>
                  ) : subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>{subject.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <h3>Teaching Assignments</h3>
              <span>{assignments.length} active</span>
            </div>
            <div className="admin-assignment-grid">
              {assignments.length === 0 ? (
                <p className="admin-muted-copy">No teaching assignments yet.</p>
              ) : assignments.map((assignment) => (
                <article key={assignment.id} className="admin-assignment-card">
                  <p className="admin-assignment-subject">{assignment.subject?.name ?? 'Subject'}</p>
                  <h4>{assignment.class?.name ?? 'Class'}</h4>
                  <p>{assignment.teacher?.name ?? 'Teacher'}</p>
                </article>
              ))}
              <button type="button" className="admin-assignment-card admin-assignment-add" onClick={openAssignmentModal}>
                <span className="material-symbols-outlined">add</span>
                Create assignment
              </button>
            </div>
          </section>
        </div>
      )}

      <AdminModal
        open={subjectModalOpen}
        title="Create subject"
        onClose={() => setSubjectModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submitSubject}>
          <label>
            Subject name
            <input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder="Mathematics" required />
          </label>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setSubjectModalOpen(false)}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save subject'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={assignmentModalOpen}
        title="New teaching assignment"
        subtitle="Link a teacher to a subject and class section."
        onClose={() => setAssignmentModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submitAssignment}>
          <label>
            Subject
            <select value={assignmentSubjectId} onChange={(event) => setAssignmentSubjectId(event.target.value)} required>
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </label>
          <label>
            Teacher
            <select value={assignmentTeacherId} onChange={(event) => setAssignmentTeacherId(event.target.value)} required>
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </label>
          <label>
            Class
            <select value={assignmentClassId} onChange={(event) => setAssignmentClassId(event.target.value)} required>
              <option value="">Select class</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
              ))}
            </select>
          </label>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setAssignmentModalOpen(false)}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              {saving ? 'Creating…' : 'Create assignment'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
