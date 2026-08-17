import React, { useState, useEffect } from 'react'
import AdminModal from './AdminModal'
import {
  createSubject,
  createTeachingAssignment,
  listAllTeachingAssignments,
  listClasses,
  listSubjects,
  listTeachers,
} from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'

export default function AdminSubjects() {
  const { toast } = useToast()
  const [subjects, setSubjects] = useState([])
  const [assignments, setAssignments] = useState([])
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [subjectModalOpen, setSubjectModalOpen] = useState(false)
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [subjectName, setSubjectName] = useState('')
  const [assignmentClassId, setAssignmentClassId] = useState('')
  const [assignmentTeacherId, setAssignmentTeacherId] = useState('')
  const [assignmentSubjectId, setAssignmentSubjectId] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
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
      toast.error(err?.message ?? 'Unable to load curriculum data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function submitSubject(event) {
    event.preventDefault()
    if (!subjectName.trim()) {
      toast.warning('Please enter a subject name.')
      return
    }
    try {
      setSaving(true)
      const created = await createSubject({ name: subjectName.trim() })
      setSubjects((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success(`Subject "${subjectName}" added to curriculum.`)
      setSubjectName('')
      setSubjectModalOpen(false)
    } catch (err) {
      toast.error(err?.message ?? 'Unable to create subject')
    } finally {
      setSaving(false)
    }
  }

  async function submitAssignment(event) {
    event.preventDefault()
    if (!assignmentClassId || !assignmentTeacherId || !assignmentSubjectId) {
      toast.warning('Please select subject, teacher, and class.')
      return
    }
    try {
      setSaving(true)
      const created = await createTeachingAssignment({
        classId: Number(assignmentClassId),
        teacherId: Number(assignmentTeacherId),
        subjectId: Number(assignmentSubjectId),
      })
      setAssignments((current) => [created, ...current])
      toast.success('Teaching assignment created successfully.')
      setAssignmentModalOpen(false)
    } catch (err) {
      toast.error(err?.message ?? 'Unable to create teaching assignment')
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
          <span className="subtitle">Academic Curriculum</span>
          <h1>Subjects & Teaching Roles</h1>
        </div>
        <div className="admin-page-head-actions">
          <button type="button" className="admin-secondary-button" onClick={() => setSubjectModalOpen(true)}>
            <span className="material-symbols-outlined">add</span>
            New Subject
          </button>
          <button type="button" className="admin-primary-button" onClick={openAssignmentModal} disabled={subjects.length === 0 || teachers.length === 0}>
            <span className="material-symbols-outlined">assignment_add</span>
            Assign Faculty
          </button>
        </div>
      </section>

      {loading ? (
        <div className="admin-loading">Loading subjects and assignments…</div>
      ) : (
        <div className="admin-split-grid">
          {/* Subject Directory */}
          <section className="admin-panel">
            <div className="admin-panel-head">
              <h3>Subject Directory</h3>
              <span className="status-pill present" style={{ fontSize: '0.75rem' }}>{subjects.length} Courses</span>
            </div>
            <div className="admin-table-wrap" style={{ margin: 0, border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Course Subject</th>
                    <th>Code / ID</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="admin-empty-cell">No subjects created yet.</td>
                    </tr>
                  ) : (
                    subjects.map((subject) => (
                      <tr key={subject.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--navy-primary)' }}>
                              menu_book
                            </span>
                            <strong style={{ color: 'var(--text-primary)' }}>{subject.name}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="admin-tag-pill">SUB-{subject.id}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Teaching Assignments */}
          <section className="admin-panel">
            <div className="admin-panel-head">
              <h3>Faculty Assignments</h3>
              <span className="status-pill present" style={{ fontSize: '0.75rem' }}>{assignments.length} Active</span>
            </div>
            <div className="admin-assignment-grid">
              {assignments.length === 0 ? (
                <p className="admin-muted-copy" style={{ gridColumn: '1 / -1' }}>No teaching assignments configured yet.</p>
              ) : (
                assignments.map((assignment) => (
                  <article key={assignment.id} className="admin-assignment-card">
                    <p className="admin-assignment-subject">{assignment.subject?.name ?? 'Subject'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--navy-primary)' }}>school</span>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{assignment.class?.name ?? 'Class'}</strong>
                    </div>
                    <div className="admin-assignment-teacher">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>person</span>
                      {assignment.teacher?.name ?? 'Teacher'}
                    </div>
                  </article>
                ))
              )}
              <button type="button" className="admin-assignment-card admin-assignment-add" onClick={openAssignmentModal}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '4px' }}>Add Assignment</span>
              </button>
            </div>
          </section>
        </div>
      )}

      <AdminModal
        open={subjectModalOpen}
        title="Add Curriculum Subject"
        subtitle="Register a new academic discipline or course subject"
        onClose={() => setSubjectModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submitSubject}>
          <div className="input-label">
            <span className="label-caps">Subject Name</span>
            <input
              type="text"
              className="input-field"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="e.g. Advanced Calculus or World History"
              required
            />
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setSubjectModalOpen(false)}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              <span className="material-symbols-outlined">save</span>
              {saving ? 'Saving…' : 'Add Subject'}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={assignmentModalOpen}
        title="New Teaching Assignment"
        subtitle="Link an instructor to a subject course and class cohort"
        onClose={() => setAssignmentModalOpen(false)}
      >
        <form className="admin-form" onSubmit={submitAssignment}>
          <div className="input-label">
            <span className="label-caps">Subject Course</span>
            <select
              className="select-field"
              value={assignmentSubjectId}
              onChange={(event) => setAssignmentSubjectId(event.target.value)}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          <div className="input-label">
            <span className="label-caps">Instructor Faculty</span>
            <select
              className="select-field"
              value={assignmentTeacherId}
              onChange={(event) => setAssignmentTeacherId(event.target.value)}
              required
            >
              <option value="">Select Teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </div>
          <div className="input-label">
            <span className="label-caps">Class Cohort</span>
            <select
              className="select-field"
              value={assignmentClassId}
              onChange={(event) => setAssignmentClassId(event.target.value)}
              required
            >
              <option value="">Select Class</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary-button" onClick={() => setAssignmentModalOpen(false)}>Cancel</button>
            <button type="submit" className="admin-primary-button" disabled={saving}>
              <span className="material-symbols-outlined">save</span>
              {saving ? 'Creating…' : 'Assign Faculty'}
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
