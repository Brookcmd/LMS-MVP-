import React from 'react'

export default function Pagination({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 50,
  onPageChange,
  onLimitChange,
  itemLabel = 'records',
  pageSizeOptions = [25, 50, 100],
}) {
  if (total === 0) return null

  const startRecord = Math.min(total, (page - 1) * limit + 1)
  const endRecord = Math.min(total, page * limit)

  // Generate page numbers window (e.g. 1 ... 4 5 6 ... 10)
  function getPageNumbers() {
    const pages = []
    const delta = 1
    const left = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)

    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) {
      pages.push(i)
    }
    if (right < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  return (
    <div className="pagination-bar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '14px 18px',
      background: 'var(--bg-surface, #ffffff)',
      borderTop: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '0 0 12px 12px',
      fontSize: '0.875rem',
      color: 'var(--text-secondary, #64748b)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span>
          Showing <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{startRecord.toLocaleString()}–{endRecord.toLocaleString()}</strong> of <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{total.toLocaleString()}</strong> {itemLabel}
        </span>

        {onLimitChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-primary, #f8fafc)',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="admin-icon-btn"
          title="Previous Page"
          style={{
            width: '32px',
            height: '32px',
            opacity: page <= 1 ? 0.4 : 1,
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', color: 'var(--text-muted, #94a3b8)' }}>
                …
              </span>
            )
          }

          const isActive = p === page
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              style={{
                minWidth: '32px',
                height: '32px',
                padding: '0 8px',
                borderRadius: '6px',
                border: isActive ? '1px solid var(--navy-primary, #0f2744)' : '1px solid transparent',
                background: isActive ? 'var(--navy-primary, #0f2744)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-primary, #0f172a)',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {p}
            </button>
          )
        })}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="admin-icon-btn"
          title="Next Page"
          style={{
            width: '32px',
            height: '32px',
            opacity: page >= totalPages ? 0.4 : 1,
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
        </button>
      </div>
    </div>
  )
}
