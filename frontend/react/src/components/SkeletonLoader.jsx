import React from 'react'

export function SkeletonBox({ width = '100%', height = '20px', borderRadius = 'var(--radius-btn)', style }) {
  return (
    <div 
      className="skeleton-shimmer" 
      style={{ width, height, borderRadius, ...style }}
    />
  )
}

export function CardSkeleton({ lines = 3, height = '140px' }) {
  return (
    <div className="card skeleton-card-container">
      <SkeletonBox width="45%" height="24px" style={{ marginBottom: '16px' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox 
          key={i} 
          width={i === lines - 1 ? '60%' : '100%'} 
          height="16px" 
          style={{ marginBottom: '10px' }} 
        />
      ))}
    </div>
  )
}

export function StatsSkeleton({ count = 3 }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card skeleton-card-container">
          <SkeletonBox width="60%" height="14px" style={{ marginBottom: '12px' }} />
          <SkeletonBox width="40%" height="32px" />
        </div>
      ))}
    </div>
  )
}

export function RosterSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
          <SkeletonBox width="48px" height="48px" borderRadius="10px" />
          <div style={{ flex: 1 }}>
            <SkeletonBox width="40%" height="18px" style={{ marginBottom: '6px' }} />
            <SkeletonBox width="25%" height="14px" />
          </div>
          <SkeletonBox width="80px" height="32px" borderRadius="999px" />
        </div>
      ))}
    </div>
  )
}
