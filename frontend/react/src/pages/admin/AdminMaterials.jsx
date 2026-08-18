import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  deleteMaterial,
  listAdminMaterials,
  listClasses,
  listSubjects,
  uploadMaterial,
} from '../../api/apiClient'
import { useToast } from '../../context/ToastContext'
import { CardSkeleton } from '../../components/SkeletonLoader'
import FileDropzone from '../../components/FileDropzone'
import FilePreviewModal from '../../components/FilePreviewModal'
import GradeBandTabs from '../../components/GradeBandTabs'
import Pagination from '../../components/Pagination'
import { groupClassesByGradeBand } from '../../utils/gradeBands'

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

export default function AdminMaterials() {
  const { searchQuery: topSearch = '' } = useOutletContext() ?? {}
  const { toast } = useToast()

  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(topSearch)
  const [gradeBand, setGradeBand] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')

  // Synchronize with topbar search
  useEffect(() => {
    if (topSearch !== search) {
      setSearch(topSearch)
      setPage(1)
    }
  }, [topSearch])

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Options for select inputs
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])

  // Modal states
  const [previewMaterial, setPreviewMaterial] = useState(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCategory, setUploadCategory] = useState('lecture_notes')
  const [uploadClassId, setUploadClassId] = useState('')
  const [uploadSubjectId, setUploadSubjectId] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Initial load classes & subjects
  useEffect(() => {
    async function loadMeta() {
      try {
        const [clsRes, subRes] = await Promise.all([
          listClasses(),
          listSubjects(),
        ])
        setClasses(clsRes || [])
        setSubjects(subRes || [])
        if (clsRes && clsRes.length > 0 && !uploadClassId) {
          setUploadClassId(String(clsRes[0].id))
        }
        if (subRes && subRes.length > 0 && !uploadSubjectId) {
          setUploadSubjectId(String(subRes[0].id))
        }
      } catch (err) {
        console.error('Failed to load metadata', err)
      }
    }
    loadMeta()
  }, [])

  // Load materials from backend
  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true)
      const res = await listAdminMaterials({
        page,
        limit,
        search: search.trim() || undefined,
        classId: selectedClassId ? Number(selectedClassId) : undefined,
        subjectId: selectedSubjectId ? Number(selectedSubjectId) : undefined,
        gradeBand: gradeBand !== 'all' ? gradeBand : undefined,
      })

      setMaterials(res?.items || [])
      setTotal(res?.total || 0)
      setTotalPages(res?.totalPages || 1)
    } catch (err) {
      toast.error(err.message || 'Failed to load materials')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, selectedClassId, selectedSubjectId, gradeBand])

  useEffect(() => {
    loadMaterials()
  }, [loadMaterials])

  // Group classes for optgroup
  const groupedClasses = React.useMemo(() => {
    return groupClassesByGradeBand(classes)
  }, [classes])

  // Handle Admin Upload
  const handleAdminUpload = async (e) => {
    e.preventDefault()
    if (!uploadTitle.trim() || !uploadClassId || !uploadSubjectId || !uploadFile) {
      toast.warning('Please provide title, class, subject, and file attachment.')
      return
    }

    try {
      setUploading(true)
      setUploadProgress(20)

      const interval = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 15 : p))
      }, 120)

      await uploadMaterial({
        title: uploadTitle.trim(),
        description: uploadDescription.trim() || undefined,
        category: uploadCategory,
        classId: Number(uploadClassId),
        subjectId: Number(uploadSubjectId),
        file: uploadFile,
      })

      clearInterval(interval)
      setUploadProgress(100)
      toast.success(`Published "${uploadTitle}" campus-wide!`)

      setUploadTitle('')
      setUploadDescription('')
      setUploadFile(null)
      setUploadProgress(0)
      setUploadModalOpen(false)
      await loadMaterials()
    } catch (err) {
      toast.error(err.message || 'Failed to upload material')
    } finally {
      setUploading(false)
    }
  }

  // Handle Delete
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return
    try {
      setDeletingId(id)
      await deleteMaterial(id)
      toast.success(`Removed "${title}".`)
      await loadMaterials()
    } catch (err) {
      toast.error(err.message || 'Failed to delete material')
    } finally {
      setDeletingId(null)
    }
  }

  // Filter materials on client by category if selected
  const displayedMaterials = materials.filter((m) => {
    if (selectedCategory === 'all') return true
    return parseMaterialCategory(m.description) === selectedCategory
  })

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="subtitle">Curriculum & Resources</span>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.6rem', color: 'var(--text-heading)' }}>
            Course Materials Repository
          </h1>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setUploadModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-symbols-outlined">upload_file</span>
          Publish Resource
        </button>
      </div>

      {/* Grade-Band Filter Tabs */}
      <GradeBandTabs
        activeBand={gradeBand}
        onSelectBand={(band) => {
          setGradeBand(band)
          setPage(1)
        }}
      />

      {/* Category Pills Strip */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              className={`btn-ghost ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 14px',
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
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: isSelected ? '#FFFFFF' : cat.color || 'inherit' }}>
                {cat.icon}
              </span>
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Search & Filters Toolbar Card */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }}>
              search
            </span>
            <input
              type="text"
              className="input-field"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by title, teacher, file..."
              style={{ paddingLeft: '38px' }}
            />
          </div>

          <select
            className="select-field"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Class Sections ({classes.length})</option>
            {Object.entries(groupedClasses).map(([tierKey, group]) => {
              if (!group.classes || group.classes.length === 0) return null
              return (
                <optgroup key={tierKey} label={group.label}>
                  {group.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>

          <select
            className="select-field"
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Academic Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Table or Cards */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}>
            <CardSkeleton lines={4} />
          </div>
        ) : displayedMaterials.length > 0 ? (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Resource / File</th>
                  <th>Category</th>
                  <th>Target Section</th>
                  <th>Subject</th>
                  <th>Published By</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedMaterials.map((item) => {
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
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: `${color}18`,
                              color: color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              cursor: 'pointer',
                            }}
                            onClick={() => setPreviewMaterial(item)}
                            title="Preview File"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                              {icon}
                            </span>
                          </div>
                          <div>
                            <strong
                              style={{ display: 'block', color: 'var(--text-heading)', cursor: 'pointer' }}
                              onClick={() => setPreviewMaterial(item)}
                            >
                              {item.title}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {item.fileName}
                            </span>
                            {displayDesc && (
                              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {displayDesc.length > 60 ? `${displayDesc.substring(0, 60)}…` : displayDesc}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <span className="chip" style={{ fontSize: '0.75rem' }}>{item.class?.name || 'Class'}</span>
                      </td>
                      <td>
                        <span className="chip" style={{ fontSize: '0.75rem', background: 'var(--navy-surface)', color: 'var(--navy-primary)' }}>
                          {item.subject?.name || 'Subject'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          {item.teacher?.name || 'Admin'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(item.fileSize)}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {uploadDate}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => setPreviewMaterial(item)}
                            title="Interactive In-Browser Preview"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                          </button>
                          <a
                            href={item.fileUrl}
                            download={item.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="icon-button"
                            title="Download File"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                          </a>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => handleDelete(item.id, item.title)}
                            disabled={deletingId === item.id}
                            title="Delete Material"
                            style={{ color: 'var(--status-absent-text)' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
              No learning resources match the current filter or search criteria.
            </p>
          </div>
        )}

        {/* Universal Pagination */}
        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          itemLabel="materials"
          onPageChange={(p) => setPage(p)}
          onLimitChange={(sz) => {
            setLimit(sz)
            setPage(1)
          }}
        />
      </div>

      {/* Admin Upload Modal */}
      {uploadModalOpen && (
        <div className="modal-backdrop" onClick={() => setUploadModalOpen(false)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="subtitle">Campus Publication</span>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.25rem', color: 'var(--text-heading)' }}>
                  Upload Learning Material
                </h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setUploadModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAdminUpload}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-label">
                  <span className="label-caps">Target Class Section</span>
                  <select
                    className="select-field"
                    value={uploadClassId}
                    onChange={(e) => setUploadClassId(e.target.value)}
                    required
                  >
                    {Object.entries(groupedClasses).map(([tierKey, group]) => {
                      if (!group.classes || group.classes.length === 0) return null
                      return (
                        <optgroup key={tierKey} label={group.label}>
                          {group.classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      )
                    })}
                  </select>
                </div>

                <div className="input-label">
                  <span className="label-caps">Academic Subject</span>
                  <select
                    className="select-field"
                    value={uploadSubjectId}
                    onChange={(e) => setUploadSubjectId(e.target.value)}
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                <div className="input-label">
                  <span className="label-caps">Material Title</span>
                  <input
                    type="text"
                    className="input-field"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Term 2 Syllabus & Reading Pack"
                    required
                  />
                </div>

                <div className="input-label">
                  <span className="label-caps">Category</span>
                  <select
                    className="select-field"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
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
                <span className="label-caps">Description / Instructions</span>
                <textarea
                  className="textarea-field"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Additional notes for students or teachers..."
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="input-label" style={{ marginBottom: '16px' }}>
                <span className="label-caps">Attachment File</span>
                <FileDropzone
                  file={uploadFile}
                  onFileSelect={setUploadFile}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploading || !uploadFile}>
                  <span className="material-symbols-outlined">upload_file</span>
                  {uploading ? 'Publishing File…' : 'Publish Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewMaterial && (
        <FilePreviewModal
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
        />
      )}
    </div>
  )
}
