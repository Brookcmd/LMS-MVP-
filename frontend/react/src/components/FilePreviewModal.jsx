import React, { useState } from 'react'

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function FilePreviewModal({ material, onClose }) {
  const [zoom, setZoom] = useState(100)

  if (!material) return null

  const fileExt = material.fileName?.split('.').pop()?.toLowerCase() || ''
  const isPdf = fileExt === 'pdf' || material.mimeType?.includes('pdf')
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(fileExt) || material.mimeType?.includes('image')
  const isDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExt)

  // Construct absolute or relative URL
  const fileUrl = material.fileUrl?.startsWith('http')
    ? material.fileUrl
    : material.fileUrl?.startsWith('/')
    ? material.fileUrl
    : `/${material.fileUrl}`

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-card, 16px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '24px',
                color: isPdf ? '#E63946' : isImage ? '#7C3AED' : 'var(--navy-primary)',
              }}
            >
              {isPdf ? 'picture_as_pdf' : isImage ? 'image' : isDoc ? 'description' : 'draft'}
            </span>
            <div style={{ overflow: 'hidden' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontFamily: 'var(--font-headline)',
                  color: 'var(--text-heading)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {material.title}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {material.fileName} • {formatFileSize(material.fileSize)} • {material.subject?.name || 'Subject'}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {isImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setZoom((z) => Math.max(50, z - 20))}
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>zoom_out</span>
                </button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '40px', textAlign: 'center' }}>
                  {zoom}%
                </span>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setZoom((z) => Math.min(200, z + 20))}
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>zoom_in</span>
                </button>
              </div>
            )}

            <a
              href={fileUrl}
              download={material.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              Download
            </a>

            <button
              type="button"
              className="icon-button"
              onClick={onClose}
              title="Close Preview"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer Canvas */}
        <div
          style={{
            flex: 1,
            minHeight: '400px',
            maxHeight: 'calc(90vh - 140px)',
            overflow: 'auto',
            background: isImage ? '#0f172a' : 'var(--bg-surface-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {isPdf ? (
            <iframe
              src={`${fileUrl}#toolbar=1`}
              title={material.title}
              style={{
                width: '100%',
                height: '650px',
                border: 'none',
              }}
            />
          ) : isImage ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <img
                src={fileUrl}
                alt={material.title}
                style={{
                  maxWidth: `${zoom}%`,
                  maxHeight: 'calc(90vh - 180px)',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  transition: 'max-width 0.15s ease',
                }}
              />
            </div>
          ) : (
            /* Document Fallback (DOCX, PPTX, XLSX, etc.) */
            <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '480px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'var(--navy-surface)',
                  color: 'var(--navy-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>description</span>
              </div>
              <h4 style={{ margin: '0 0 8px', fontFamily: 'var(--font-headline)', color: 'var(--text-heading)' }}>
                {material.fileName}
              </h4>
              <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Direct in-browser interactive preview is optimized for PDF documents and image files. Download this file to open it in Microsoft Office or your default viewer.
              </p>
              <a
                href={fileUrl}
                download={material.fileName}
                className="btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span className="material-symbols-outlined">download</span>
                Download {formatFileSize(material.fileSize)}
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer Notes */}
        {material.description && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy-primary)' }}>info</span>
            <span>{material.description.replace(/\[category:[^\]]+\]\s*/i, '')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
