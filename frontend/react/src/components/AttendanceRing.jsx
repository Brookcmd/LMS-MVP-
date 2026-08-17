import React from 'react'

export function AttendanceRing({ present = 0, late = 0, absent = 0, size = 160, strokeWidth = 12 }) {
  const total = present + late + absent
  const percentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  // Color decision based on percentage
  let strokeGradient = 'url(#ringGradientSuccess)'
  let statusText = 'Excellent'
  let statusClass = 'present'

  if (percentage < 75) {
    strokeGradient = 'url(#ringGradientDanger)'
    statusText = 'Needs Attention'
    statusClass = 'absent'
  } else if (percentage < 90) {
    strokeGradient = 'url(#ringGradientWarning)'
    statusText = 'Good Standing'
    statusClass = 'late'
  }

  return (
    <div className="attendance-ring-card">
      <div className="attendance-ring-header">
        <div>
          <span className="subtitle">Attendance Performance</span>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.15rem' }}>Term Record</h3>
        </div>
        <span className={`status-pill ${statusClass}`}>{statusText}</span>
      </div>

      <div className="attendance-ring-body">
        <div className="attendance-ring-svg-wrap" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <linearGradient id="ringGradientSuccess" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="ringGradientWarning" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="ringGradientDanger" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--bg-surface-strong)"
              strokeWidth={strokeWidth}
            />

            {/* Progress Stroke */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeGradient}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </svg>

          <div className="attendance-ring-center">
            <span className="attendance-ring-percent">{percentage}%</span>
            <span className="attendance-ring-label">Overall Rate</span>
          </div>
        </div>

        <div className="attendance-breakdown-list">
          <div className="attendance-breakdown-item">
            <span className="attendance-breakdown-dot dot-present" />
            <span className="attendance-breakdown-name">Present</span>
            <strong className="attendance-breakdown-count">{present}</strong>
          </div>
          <div className="attendance-breakdown-item">
            <span className="attendance-breakdown-dot dot-late" />
            <span className="attendance-breakdown-name">Late</span>
            <strong className="attendance-breakdown-count">{late}</strong>
          </div>
          <div className="attendance-breakdown-item">
            <span className="attendance-breakdown-dot dot-absent" />
            <span className="attendance-breakdown-name">Absent</span>
            <strong className="attendance-breakdown-count">{absent}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
