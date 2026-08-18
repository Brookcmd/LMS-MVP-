import React, { useState, useEffect, useCallback } from 'react'
import {
  deleteMaterial,
  listClassMaterials,
  listStudentMaterials,
  listTeacherMaterials,
  listTeachingAssignments,
  listParentStudents,
  uploadMaterial,
} from '../api/apiClient'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../context/ToastContext'
import { CardSkeleton } from '../components/SkeletonLoader'

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileIcon(fileName = '', mimeType = '') {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (mimeType.includes('pdf') || ext === 'pdf') return { icon: 'picture_as_pdf', color: '#E63946' }
  if (mimeType.includes('word') || ['doc', 'docx'].includes(ext)) return { icon: 'description', color: '#2563EB' }
  if (mimeType.includes('presentation') || ['ppt', 'pptx'].includes(ext)) return { icon: 'slideshow', color: '#D97706' }
  if (mimeType.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return { icon: 'table_chart', color: '#059669' }
  if (mimeType.includes('image') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return { icon: 'image', color: '#7C3AED' }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { icon: 'folder_zip', color: '#D97706' }
  return { icon: 'draft', color: '#64748B' }
}

export default function CourseMaterials() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const isParent = user?.role === 'parent'
  const isStudent = user?.role === 'student'

  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')

  // Teacher upload state
  const [teachingAssignments, setTeachingAssignments] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Parent student selector state
  const [children, setChildren] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      if (isTeacher) {
        const [mats, assignments] = await Promise.all([
          listTeacherMaterials(),
          listTeachingAssignments(),
        ])
        setMaterials(mats || [])
        setTeachingAssignments(assignments || [])
        if (assignments && assignments.length > 0 && !selectedAssignmentId) {
          setSelectedAssignmentId(String(assignments[0].id))
        }
      } else if (isStudent) {
        const mats = await listStudentMaterials()
        setMaterials(mats || [])
      } else if (isParent) {
        const kids = await listParentStudents()
        const kidList = kids?.students || kids || []
        setChildren(kidList)
        const targetStudentId = selectedStudentId || (kidList[0]?.id ? String(kidList[0].id) : '')
        if (targetStudentId) {
          setSelectedStudentId(targetStudentId)
          const mats = await listStudentMaterials({ studentId: targetStudentId })
          setMaterials(mats || [])
        }
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load course materials')
    } finally {
      setLoading(false)
    }
  }, [isTeacher, isStudent, isParent, selectedStudentId, selectedAssignmentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedAssignmentId || !title.trim() || !selectedFile) {
      toast.warning('Please provide a course assignment, material title, and file.')
      return
    }

    const chosen = teachingAssignments.find((a) => String(a.id) === selectedAssignmentId)
    if (!chosen) {
      toast.error('Invalid course assignment selection.')
      return
    }

    try {
      setUploading(true)
      await uploadMaterial({
        title: title.trim(),
        description: description.trim() || undefined,
        classId: chosen.class.id,
        subjectId: chosen.subject.id,
        file: selectedFile,
      })
      toast.success(`Uploaded "${title}" successfully!`)
      setTitle('')
      setDescription('')
      setSelectedFile(null)
      // Reset file input
      const fileInput = document.getElementById('material-file-input')
      if (fileInput) fileInput.value = ''
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to upload material')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id, itemTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${itemTitle}"?`)) return
    try {
      setDeletingId(id)
      await deleteMaterial(id)
      toast.success(`Removed "${itemTitle}".`)
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete material')
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered materials
  const subjects = Array.from(new Set(materials.map((m) => m.subject?.name).filter(Boolean)))
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.subject?.name && m.subject.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesSubject = selectedSubject === 'all' || m.subject?.name === selectedSubject
    return matchesSearch && matchesSubject
  })

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <span className="subtitle">Digital Learning Repository</span>
          <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--navy-primary)' }}>
              menu_book
            </span>
            Course Materials & Resources
          </h1>
        </div>
      </div>

      {/* Parent Child Switcher */}
      {isParent && children.length > 0 && (
        <div className="card toolbar-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span className="label-caps" style={{ margin: 0 }}>Select Child:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className={`btn-ghost ${selectedStudentId === String(child.id) ? 'active' : ''}`}
                  onClick={() => setSelectedStudentId(String(child.id))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    background: selectedStudentId === String(child.id) ? 'var(--navy-primary)' : 'var(--bg-surface-elevated)',
                    color: selectedStudentId === String(child.id) ? '#FFFFFF' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>face</span>
                  {child.name} ({child.class?.name || 'Class'})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isTeacher ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: '24px' }}>
        {/* Teacher Upload Form */}
        {isTeacher && (
          <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="subtitle">Publish Resource</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.2rem', color: 'var(--text-heading)' }}>
                  Upload Learning Material
                </h2>
              </div>
              <span className="chip" style={{ background: 'var(--navy-surface)', color: 'var(--navy-primary)' }}>Faculty</span>
            </div>

            <form onSubmit={handleUpload}>
              <div className="input-label">
                <span className="label-caps">Target Class & Subject</span>
                <select
                  className="select-field"
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  required
                >
                  {teachingAssignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.class.name} · {a.subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-label">
                <span className="label-caps">Material Title</span>
                <input
                  type="text"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Lecture Slides & Worksheet"
                  required
                />
              </div>

              <div className="input-label">
                <span className="label-caps">Description / Study Notes (Optional)</span>
                <textarea
                  className="textarea-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context or recommended reading before class..."
                  style={{ minHeight: '70px' }}
                />
              </div>

              <div className="input-label">
                <span className="label-caps">Attachment File (PDF, DOCX, PPTX, ZIP, Image)</span>
                <input
                  id="material-file-input"
                  type="file"
                  className="input-field"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  required
                  style={{ padding: '8px' }}
                />
                {selectedFile && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={uploading}
                style={{ width: '100%', marginTop: '12px' }}
              >
                <span className="material-symbols-outlined">upload_file</span>
                {uploading ? 'Uploading Resource…' : 'Publish Material'}
              </button>
            </form>
          </div>
        )}

        {/* Materials List Panel */}
        <div>
          {/* Search & Subject Filter Bar */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }}>
                  search
                </span>
                <input
                  type="text"
                  className="input-field"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search materials by title or topic..."
                  style={{ paddingLeft: '38px' }}
                />
              </div>

              {subjects.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px' }}>
                  <button
                    type="button"
                    className={`btn-ghost ${selectedSubject === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedSubject('all')}
                    style={{
                      fontSize: '0.8rem',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-pill)',
                      background: selectedSubject === 'all' ? 'var(--navy-primary)' : 'transparent',
                      color: selectedSubject === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                    }}
                  >
                    All Subjects
                  </button>
                  {subjects.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      className={`btn-ghost ${selectedSubject === sub ? 'active' : ''}`}
                      onClick={() => setSelectedSubject(sub)}
                      style={{
                        fontSize: '0.8rem',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-pill)',
                        background: selectedSubject === sub ? 'var(--navy-primary)' : 'transparent',
                        color: selectedSubject === sub ? '#FFFFFF' : 'var(--text-secondary)',
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <CardSkeleton lines={3} />
          ) : filteredMaterials.length > 0 ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              {filteredMaterials.map((item) => {
                const { icon, color } = getFileIcon(item.fileName, item.mimeType)
                const uploadDate = new Date(item.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      padding: '18px 20px',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      borderLeft: `4px solid ${color}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            background: `${color}18`,
                            color: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                            {icon}
                          </span>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span className="chip" style={{ fontSize: '0.72rem', background: 'var(--navy-surface)', color: 'var(--navy-primary)' }}>
                              {item.subject?.name || 'Subject'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {item.class?.name} · By {item.teacher?.name || 'Instructor'}
                            </span>
                          </div>

                          <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-headline)', fontSize: '1.1rem', color: 'var(--text-heading)' }}>
                            {item.title}
                          </h3>

                          {item.description && (
                            <p style={{ margin: '0 0 10px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {item.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <span>{item.fileName}</span>
                            <span>•</span>
                            <span>{formatFileSize(item.fileSize)}</span>
                            <span>•</span>
                            <span>Uploaded {uploadDate}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <a
                          href={item.fileUrl}
                          download={item.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.82rem', textDecoration: 'none' }}
                          title="Download Resource"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                          Download
                        </a>

                        {isTeacher && (
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleDelete(item.id, item.title)}
                            disabled={deletingId === item.id}
                            title="Delete Material"
                            style={{ color: 'var(--status-absent-text)', padding: '6px 8px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>
                folder_open
              </span>
              <h3 style={{ margin: '12px 0 4px', fontFamily: 'var(--font-headline)', color: 'var(--text-heading)' }}>
                No Course Materials Found
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {isTeacher
                  ? 'Publish study materials, slides, and syllabus files using the upload panel.'
                  : 'Your teachers have not uploaded learning materials for this selection yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
