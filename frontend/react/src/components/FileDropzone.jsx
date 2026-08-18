import React, { useState, useRef } from 'react'

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileExtension(name = '') {
  return name.split('.').pop()?.toUpperCase() || 'FILE'
}

export default function FileDropzone({
  file,
  onFileSelect,
  uploading = false,
  uploadProgress = 0,
  maxSizeMB = 50,
  accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip,.png,.jpg,.jpeg,.webp',
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSet(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSet(e.target.files[0])
    }
  }

  const validateAndSet = (selected) => {
    if (selected.size > maxSizeMB * 1024 * 1024) {
      alert(`File size exceeds maximum allowable limit of ${maxSizeMB}MB.`)
      return
    }
    onFileSelect(selected)
  }

  const clearFile = (e) => {
    e.stopPropagation()
    onFileSelect(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        className={`file-dropzone-box ${isDragOver ? 'dragover' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--navy-primary)' : file ? 'var(--status-present-text)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-card, 12px)',
          background: isDragOver ? 'var(--navy-surface)' : file ? 'var(--bg-surface-elevated)' : 'var(--bg-surface-muted)',
          padding: '24px 20px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={uploading}
        />

        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'var(--navy-surface)',
                  color: 'var(--navy-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                }}
              >
                {getFileExtension(file.name)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.92rem', wordBreak: 'break-all' }}>
                  {file.name}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {formatFileSize(file.size)} • Ready to publish
                </span>
              </div>
            </div>

            {!uploading && (
              <button
                type="button"
                className="btn-ghost"
                onClick={clearFile}
                title="Remove Selected File"
                style={{ color: 'var(--status-absent-text)', padding: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--navy-surface)',
                color: 'var(--navy-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>cloud_upload</span>
            </div>
            <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px' }}>
              Drag & drop learning material here, or <span style={{ color: 'var(--navy-primary)', textDecoration: 'underline' }}>Browse files</span>
            </strong>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supports PDF, DOCX, PPTX, XLSX, TXT, Images, and ZIP archives up to {maxSizeMB}MB
            </p>
          </div>
        )}

        {/* Upload progress indicator */}
        {uploading && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Uploading & encrypting file payload…</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'var(--navy-primary)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
