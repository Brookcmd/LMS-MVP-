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
import FileDropzone from '../components/FileDropzone'
import FilePreviewModal from '../components/FilePreviewModal'
import GradeBandTabs from '../components/GradeBandTabs'
import { groupClassesByGradeBand } from '../utils/gradeBands'

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

const CATEGORIES = [
  { id: 'all', label: 'All Resources', icon: 'grid_view' },
  { id: 'lecture_notes', label: 'Lecture Slides', icon: 'co_present', color: '#2563EB' },
  { id: 'syllabus', label: 'Syllabus & Guide', icon: 'menu_book', color: '#059669' },
  { id: 'worksheet', label: 'Worksheets & Labs', icon: 'assignment', color: '#7C3AED' },
  { id: 'past_exam', label: 'Past Exams & Keys', icon: 'quiz', color: '#DC2626' },
  { id: 'reading', label: 'Reference Readings', icon: 'auto_stories', color: '#D97706' },
]

function parseMaterialCategory(description = '') {
  const match = description.match(/\[category:([^\]]+)\]/i)
  if (match) return match[1].toLowerCase()
  return 'general'
}

function cleanDescription(description = '') {
  return description.replace(/\[category:[^\]]+\]\s*/i, '').trim()
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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedGradeBand, setSelectedGradeBand] = useState('all')

  // Preview modal state
  const [previewMaterial, setPreviewMaterial] = useState(null)

  // Teacher upload state
  const [teachingAssignments, setTeachingAssignments] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('lecture_notes')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
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
      toast.warning('Please select a course assignment, enter a title, and drop a file.')
      return
    }

    const chosen = teachingAssignments.find((a) => String(a.id) === selectedAssignmentId)
    if (!chosen) {
      toast.error('Invalid course assignment selection.')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(15)

      const interval = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 15 : p))
      }, 120)

      await uploadMaterial({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        classId: chosen.class.id,
        subjectId: chosen.subject.id,
        file: selectedFile,
      })

      clearInterval(interval)
      setUploadProgress(100)
      toast.success(`Published "${title}" successfully!`)

      setTitle('')
      setDescription('')
      setSelectedFile(null)
      setUploadProgress(0)
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
    const itemCat = parseMaterialCategory(m.description)
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.fileName && m.fileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.subject?.name && m.subject.name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesSubject = selectedSubject === 'all' || m.subject?.name === selectedSubject
    const matchesCategory = selectedCategory === 'all' || itemCat === selectedCategory
    return matchesSearch && matchesSubject && matchesCategory
  })

  // Group teaching assignments for optgroup
  const groupedAssignments = React.useMemo(() => {
    const map = {}
    teachingAssignments.forEach((a) => {
      const clsName = a.class?.name || 'Class'
      if (!map[clsName]) map[clsName] = []
      map[clsName].push(a)
    })
    return map
  }, [teachingAssignments])

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <span className="subtitle">Official Academic Repository</span>
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
        <div className="card toolbar-card" style={{ padding: '14px 20px', marginBottom: '20px' }}>
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

      {/* Category Filter Pills Strip */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '16px' }}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              className={`btn-ghost ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-pill)',
                background: isSelected ? 'var(--navy-primary)' : 'var(--bg-surface)',
                color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                fontWeight: isSelected ? '600' : '400',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px', color: isSelected ? '#FFFFFF' : cat.color || 'inherit' }}>
                {cat.icon}
              </span>
              {cat.label}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isTeacher ? 'repeat(auto-fit, minmax(340px, 1fr))' : '1fr', gap: '24px' }}>
        {/* Teacher Upload Form Panel */}
        {isTeacher && (
          <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="subtitle">Publish Resource</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.2rem', color: 'var(--text-heading)' }}>
                  Upload Learning Material
                </h2>
              </div>
              <span className="chip" style={{ background: 'var(--navy-surface)', color: 'var(--navy-primary)' }}>Faculty Hub</span>
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
                  {Object.entries(groupedAssignments).map(([className, items]) => (
                    <optgroup key={className} label={`Class: ${className}`}>
                      {items.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.subject?.name} ({a.class?.name})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-label">
                  <span className="label-caps">Material Title</span>
                  <input
                    type="text"
                    className="input-field"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chapter 4 Slides"
                    required
                  />
                </div>

                <div className="input-label">
                  <span className="label-caps">Resource Category</span>
                  <select
                    className="select-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="lecture_notes">Lecture Slides</option>
                    <option value="syllabus">Syllabus & Guide</option>
                    <option value="worksheet">Worksheet / Lab</option>
                    <option value="past_exam">Past Exam / Key</option>
                    <option value="reading">Reference Reading</option>
                  </select>
                </div>
              </div>

              <div className="input-label">
                <span className="label-caps">Description / Study Notes (Optional)</span>
                <textarea
                  className="textarea-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key concepts or instructions for students..."
                  style={{ minHeight: '60px' }}
                />
              </div>

              {/* Drag and Drop File Dropzone */}
              <div className="input-label" style={{ marginBottom: '8px' }}>
                <span className="label-caps">File Attachment</span>
                <FileDropzone
                  file={selectedFile}
                  onFileSelect={setSelectedFile}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={uploading || !selectedFile}
                style={{ width: '100%', marginTop: '8px' }}
              >
                <span className="material-symbols-outlined">upload_file</span>
                {uploading ? 'Publishing File…' : 'Publish to Students'}
              </button>
            </form>
          </div>
        )}

        {/* Materials List Panel */}
        <div>
          {/* Search & Subject Bar */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
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
                  placeholder="Search materials by title, topic, or file..."
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
                      padding: '5px 12px',
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
                        padding: '5px 12px',
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
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredMaterials.map((item) => {
                const { icon, color } = getFileIcon(item.fileName, item.mimeType)
                const itemCat = parseMaterialCategory(item.description)
                const catObj = CATEGORIES.find((c) => c.id === itemCat) || { label: 'Resource', icon: 'description', color: '#64748B' }
                const uploadDate = new Date(item.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
                const displayDesc = cleanDescription(item.description)

                return (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      padding: '16px 20px',
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
                            cursor: 'pointer',
                          }}
                          onClick={() => setPreviewMaterial(item)}
                          title="Click to Preview File"
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
                            <span
                              className="chip"
                              style={{
                                fontSize: '0.72rem',
                                background: `${catObj.color || '#64748B'}18`,
                                color: catObj.color || 'var(--text-primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{catObj.icon}</span>
                              {catObj.label}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {item.class?.name} · By {item.teacher?.name || 'Faculty'}
                            </span>
                          </div>

                          <h3
                            style={{
                              margin: '0 0 4px',
                              fontFamily: 'var(--font-headline)',
                              fontSize: '1.05rem',
                              color: 'var(--text-heading)',
                              cursor: 'pointer',
                            }}
                            onClick={() => setPreviewMaterial(item)}
                          >
                            {item.title}
                          </h3>

                          {displayDesc && (
                            <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {displayDesc}
                            </p>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>{item.fileName}</span>
                            <span>•</span>
                            <span>{formatFileSize(item.fileSize)}</span>
                            <span>•</span>
                            <span>{uploadDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setPreviewMaterial(item)}
                          title="Interactive In-Browser Preview"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                          Preview
                        </button>

                        <a
                          href={item.fileUrl}
                          download={item.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
                          title="Download Resource"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
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
                No Materials Found
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {isTeacher
                  ? 'Publish study materials, slides, and syllabus files using the upload panel.'
                  : 'Your instructors have not published learning materials matching your filter.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* In-Browser File Preview Modal */}
      {previewMaterial && (
        <FilePreviewModal
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
        />
      )}
    </div>
  )
}

