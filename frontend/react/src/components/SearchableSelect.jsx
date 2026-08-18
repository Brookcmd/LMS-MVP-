import React, { useState, useEffect, useRef } from 'react'

export default function SearchableSelect({
  value,
  onChange,
  onSearch,
  options = [],
  placeholder = 'Search & select...',
  labelKey = 'name',
  valueKey = 'id',
  renderOption,
  disabled = false,
  emptyMessage = 'No matching items found',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  // Find currently selected item object
  const selectedItem = options.find((opt) => String(opt[valueKey]) === String(value))

  // Debounced search trigger
  useEffect(() => {
    if (!isOpen || !onSearch) return
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        await onSearch(searchTerm)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchTerm, isOpen])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(item) {
    onChange(item[valueKey], item)
    setIsOpen(false)
    setSearchTerm('')
  }

  function handleClear(e) {
    e.stopPropagation()
    onChange('', null)
    setSearchTerm('')
  }

  // Filter options locally if onSearch is not provided
  const displayedOptions = onSearch
    ? options
    : options.filter((item) =>
        String(item[labelKey] ?? '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #cbd5e1)',
          background: disabled ? 'var(--bg-primary, #f1f5f9)' : 'var(--bg-surface, #ffffff)',
          color: selectedItem ? 'var(--text-primary, #0f172a)' : 'var(--text-muted, #94a3b8)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '42px',
          boxSizing: 'border-box',
          gap: '8px',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedItem
            ? renderOption
              ? renderOption(selectedItem)
              : selectedItem[labelKey]
            : placeholder}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="admin-icon-btn"
              title="Clear selection"
              style={{ width: '24px', height: '24px', padding: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted, #94a3b8)' }}>
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border-color, #cbd5e1)',
            overflow: 'hidden',
            maxHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary, #f8fafc)', borderRadius: '6px', padding: '0 8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted, #94a3b8)' }}>
                search
              </span>
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary, #0f172a)',
                }}
              />
              {loading && (
                <span className="material-symbols-outlined spinning" style={{ fontSize: '16px', color: 'var(--navy-primary, #0f2744)' }}>
                  progress_activity
                </span>
              )}
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {displayedOptions.length === 0 ? (
              <div style={{ padding: '12px 16px', color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem', textAlign: 'center' }}>
                {loading ? 'Searching...' : emptyMessage}
              </div>
            ) : (
              displayedOptions.map((item) => {
                const isSelected = String(item[valueKey]) === String(value)
                return (
                  <div
                    key={item[valueKey]}
                    onClick={() => handleSelect(item)}
                    style={{
                      padding: '8px 14px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(15, 39, 68, 0.08)' : 'transparent',
                      color: isSelected ? 'var(--navy-primary, #0f2744)' : 'var(--text-primary, #0f172a)',
                      fontWeight: isSelected ? '600' : '400',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-primary, #f1f5f9)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {renderOption ? renderOption(item) : item[labelKey]}
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy-primary, #0f2744)' }}>
                        check
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
