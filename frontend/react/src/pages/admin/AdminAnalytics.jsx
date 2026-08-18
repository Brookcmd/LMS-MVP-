import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getAdminAnalytics, listClasses } from '../../api/apiClient'
import { StatsSkeleton } from '../../components/SkeletonLoader'
import GradeBandTabs from '../../components/GradeBandTabs'
import Pagination from '../../components/Pagination'
import { useToast } from '../../context/ToastContext'
import { GRADE_BANDS, groupClassesByGradeBand } from '../../utils/gradeBands'

export default function AdminAnalytics() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [classes, setClasses] = useState([])

  // Active view tab: 'overview' | 'attendance' | 'grades' | 'at-risk'
  const [activeTab, setActiveTab] = useState('overview')

  // Filter states
  const [selectedGradeBand, setSelectedGradeBand] = useState('all')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedQuarter, setSelectedQuarter] = useState('')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025/26')
  const [riskSearchQuery, setRiskSearchQuery] = useState('')

  // Pagination for at-risk table
  const [riskPage, setRiskPage] = useState(1)
  const [riskLimit, setRiskLimit] = useState(25)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [analyticsRes, classesRes] = await Promise.all([
        getAdminAnalytics({
          classId: selectedClassId || undefined,
          quarter: selectedQuarter || undefined,
          academicYear: selectedAcademicYear || undefined,
          gradeBand: selectedGradeBand !== 'all' ? selectedGradeBand : undefined,
        }),
        classes.length === 0 ? listClasses().catch(() => []) : Promise.resolve(classes),
      ])

      setData(analyticsRes)
      if (classesRes && classesRes.length > 0 && classes.length === 0) {
        setClasses(classesRes)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load institutional analytics')
      addToast(err?.message || 'Error loading analytics data', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedClassId, selectedQuarter, selectedAcademicYear, selectedGradeBand, classes, addToast])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  function handleGradeBandChange(bandId) {
    setSelectedGradeBand(bandId)
    setSelectedClassId('') // reset specific class filter when changing band
    setRiskPage(1)
  }

  const kpis = data?.kpis || {}
  const attendance = data?.attendance || {}
  const grades = data?.grades || {}
  const atRiskStudents = data?.atRiskStudents || []
  const gradeBandBreakdown = data?.gradeBandBreakdown || []

  // Status totals
  const totalStatus = (attendance.statusCounts?.present || 0) + (attendance.statusCounts?.late || 0) + (attendance.statusCounts?.absent || 0)
  const presentPct = totalStatus ? Math.round((attendance.statusCounts.present / totalStatus) * 100) : 0
  const latePct = totalStatus ? Math.round((attendance.statusCounts.late / totalStatus) * 100) : 0
  const absentPct = totalStatus ? Math.round((attendance.statusCounts.absent / totalStatus) * 100) : 0

  // Filtered at-risk students
  const filteredRiskStudents = useMemo(() => {
    if (!riskSearchQuery.trim()) return atRiskStudents
    const q = riskSearchQuery.toLowerCase()
    return atRiskStudents.filter(
      (st) =>
        st.studentName.toLowerCase().includes(q) ||
        st.className.toLowerCase().includes(q) ||
        st.riskFactors.some((rf) => rf.toLowerCase().includes(q))
    )
  }, [atRiskStudents, riskSearchQuery])

  // Paginated at-risk students
  const paginatedRiskStudents = useMemo(() => {
    const start = (riskPage - 1) * riskLimit
    return filteredRiskStudents.slice(start, start + riskLimit)
  }, [filteredRiskStudents, riskPage, riskLimit])

  const totalRiskPages = Math.ceil(filteredRiskStudents.length / riskLimit) || 1

  // Export report to CSV
  function handleExportCSV() {
    if (!data) return
    const csvRows = [
      ['Sheba Academy - Executive Analytics Report'],
      [`Scope: Academic Year ${selectedAcademicYear}, Quarter: ${selectedQuarter || 'All'}, Tier: ${selectedGradeBand}, Class: ${selectedClassId || 'All'}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [''],
      ['--- EXECUTIVE KPIS ---'],
      ['Metric', 'Value'],
      ['Overall Attendance Rate', `${kpis.overallAttendanceRate ?? 100}%`],
      ['Overall Grade Mean', `${kpis.overallGradeAverage ?? 0}%`],
      ['Total Students', kpis.totalStudents || 0],
      ['Total Teachers', kpis.totalTeachers || 0],
      ['At-Risk Students Count', kpis.atRiskCount || 0],
      [''],
      ['--- AT-RISK STUDENTS ROSTER ---'],
      ['Student Name', 'Class', 'Attendance Rate', 'Grade Average', 'Risk Factors', 'Guardian Info'],
      ...atRiskStudents.map((st) => [
        `"${st.studentName}"`,
        `"${st.className}"`,
        st.attendanceRate !== null ? `${st.attendanceRate}%` : 'N/A',
        st.gradeAverage !== null ? `${st.gradeAverage}%` : 'N/A',
        `"${st.riskFactors.join(' | ')}"`,
        `"${st.parents.map((p) => `${p.name} (${p.phone || p.email})`).join(', ')}"`,
      ]),
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Sheba_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast('Analytics report exported as CSV', 'success')
  }

  // Circular gauge calculations
  const circumference = 2 * Math.PI * 15.9155
  const attendanceOffset = circumference - (circumference * (kpis.overallAttendanceRate || 100)) / 100
  const gradeOffset = circumference - (circumference * (kpis.overallGradeAverage || 0)) / 100

  const groupedClasses = groupClassesByGradeBand(classes)

  return (
    <div className="admin-analytics-page" style={{ paddingBottom: '32px' }}>
      {/* Institutional Hero Banner */}
      <section className="academic-hero-banner" style={{ marginBottom: '20px' }}>
        <div className="academic-hero-top">
          <span className="academic-hero-kicker">
            Sheba Academy • Institutional Registrar
          </span>
          <span className="academic-hero-date">
            Executive Analytics Console
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="academic-hero-title">
              Institutional Performance & Analytics Radar
            </h1>
            <p className="academic-hero-subtitle">
              Aggregated analytics across 15 grades and 75 sections covering attendance rates, quarterly grade distributions, curriculum mastery, and early intervention indicators.
            </p>
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={handleExportCSV}
            disabled={!data || loading}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-btn)',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export CSV
          </button>
        </div>

        {/* Quick Institutional Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', color: '#FFFFFF' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#93C5FD' }}>school</span>
            {kpis.totalClasses || 0} Class Sections
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', color: '#FFFFFF' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#86EFAC' }}>person</span>
            {(kpis.totalStudents || 0).toLocaleString()} Enrolled Students
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.1)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', color: '#FFFFFF' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#FDE047' }}>menu_book</span>
            {kpis.totalSubjects || 0} Curriculum Subjects
          </span>
        </div>
      </section>

      {/* Grade-Band Filter Tabs */}
      <GradeBandTabs
        activeBand={selectedGradeBand}
        onSelectBand={handleGradeBandChange}
      />

      {/* Filter & View Navigation Toolbar */}
      <div className="analytics-filter-bar">
        {/* Navigation Tabs */}
        <div className="analytics-tab-group" role="tablist">
          {[
            { id: 'overview', label: 'Executive Overview', icon: 'dashboard' },
            { id: 'attendance', label: 'Attendance Radar', icon: 'how_to_reg' },
            { id: 'grades', label: 'Academics & Grades', icon: 'equalizer' },
            { id: 'at-risk', label: `At-Risk (${kpis.atRiskCount || 0})`, icon: 'warning' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`analytics-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="analytics-controls-group">
          <select
            className="analytics-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            aria-label="Filter by class"
            style={{ minWidth: '180px' }}
          >
            <option value="">All Class Sections</option>
            {Object.entries(groupedClasses).map(([bandKey, group]) => {
              if (group.classes.length === 0) return null
              return (
                <optgroup key={bandKey} label={group.label}>
                  {group.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </optgroup>
              )
            })}
          </select>

          <select
            className="analytics-select"
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            aria-label="Filter by academic quarter"
          >
            <option value="">All Quarters</option>
            <option value="1">Quarter 1</option>
            <option value="2">Quarter 2</option>
            <option value="3">Quarter 3</option>
            <option value="4">Quarter 4</option>
          </select>

          <select
            className="analytics-select"
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            aria-label="Filter by academic year"
          >
            <option value="2025/26">2025/2026</option>
            <option value="2024/25">2024/2025</option>
          </select>

          <button
            type="button"
            className="admin-ghost-button"
            onClick={fetchAnalytics}
            disabled={loading}
            style={{ padding: '7px 12px', fontSize: '0.84rem' }}
          >
            <span className={`material-symbols-outlined ${loading ? 'spin' : ''}`} style={{ fontSize: '17px' }}>
              refresh
            </span>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error" style={{ marginBottom: '20px' }}>
          <span className="material-symbols-outlined">warning</span>
          {error}
        </div>
      )}

      {loading && !data ? (
        <StatsSkeleton count={4} />
      ) : (
        <>
          {/* Executive KPI Metric Grid */}
          <div className="analytics-kpi-grid">
            {/* KPI 1: Campus Attendance */}
            <div className="analytics-kpi-card" style={{ borderTop: '3px solid var(--status-present-text)' }}>
              <div className="analytics-kpi-header">
                <div className="analytics-kpi-icon" style={{ background: 'var(--status-present-bg)', color: 'var(--status-present-text)' }}>
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <span className="badge badge-present" style={{ fontSize: '0.72rem' }}>
                  Target: 95%
                </span>
              </div>
              <div className="analytics-kpi-body">
                <div>
                  <h3>{kpis.overallAttendanceRate ?? 100}%</h3>
                  <p>Attendance Rate</p>
                </div>
                <div className="analytics-gauge-wrap">
                  <svg className="analytics-gauge-svg" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="var(--border-color)"
                      strokeWidth="3.6"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="var(--status-present-text)"
                      strokeWidth="3.6"
                      strokeDasharray={circumference}
                      strokeDashoffset={attendanceOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="analytics-gauge-val">{kpis.overallAttendanceRate}%</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Grade Mean */}
            <div className="analytics-kpi-card" style={{ borderTop: '3px solid var(--navy-primary)' }}>
              <div className="analytics-kpi-header">
                <div className="analytics-kpi-icon" style={{ background: 'var(--status-info-bg)', color: 'var(--navy-primary)' }}>
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                  Academic Mean
                </span>
              </div>
              <div className="analytics-kpi-body">
                <div>
                  <h3>{kpis.overallGradeAverage ?? 0}%</h3>
                  <p>Grade Average</p>
                </div>
                <div className="analytics-gauge-wrap">
                  <svg className="analytics-gauge-svg" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="var(--border-color)"
                      strokeWidth="3.6"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="var(--navy-primary)"
                      strokeWidth="3.6"
                      strokeDasharray={circumference}
                      strokeDashoffset={gradeOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="analytics-gauge-val">{kpis.overallGradeAverage}%</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Total Members */}
            <div className="analytics-kpi-card" style={{ borderTop: '3px solid #6366F1' }}>
              <div className="analytics-kpi-header">
                <div className="analytics-kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' }}>
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <span className="badge" style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' }}>
                  Active Roster
                </span>
              </div>
              <div className="analytics-kpi-body">
                <div>
                  <h3>{(kpis.totalStudents || 0).toLocaleString()}</h3>
                  <p>{kpis.totalStudents || 0} Students • {kpis.totalTeachers || 0} Faculty</p>
                </div>
              </div>
            </div>

            {/* KPI 4: At-Risk Students */}
            <div className="analytics-kpi-card" style={{ borderTop: `3px solid ${kpis.atRiskCount > 0 ? 'var(--status-absent-text)' : 'var(--status-present-text)'}` }}>
              <div className="analytics-kpi-header">
                <div
                  className="analytics-kpi-icon"
                  style={{
                    background: kpis.atRiskCount > 0 ? 'var(--status-absent-bg)' : 'var(--status-present-bg)',
                    color: kpis.atRiskCount > 0 ? 'var(--status-absent-text)' : 'var(--status-present-text)',
                  }}
                >
                  <span className="material-symbols-outlined">
                    {kpis.atRiskCount > 0 ? 'error' : 'task_alt'}
                  </span>
                </div>
                <span
                  className="badge"
                  style={{
                    fontSize: '0.72rem',
                    background: kpis.atRiskCount > 0 ? 'var(--status-absent-bg)' : 'var(--status-present-bg)',
                    color: kpis.atRiskCount > 0 ? 'var(--status-absent-text)' : 'var(--status-present-text)',
                  }}
                >
                  {kpis.atRiskCount > 0 ? 'Action Needed' : 'All Clear'}
                </span>
              </div>
              <div className="analytics-kpi-body">
                <div>
                  <h3 style={{ color: kpis.atRiskCount > 0 ? 'var(--status-absent-text)' : 'inherit' }}>
                    {kpis.atRiskCount || 0}
                  </h3>
                  <p>Students Flagged</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grade-Band Comparative Breakdown (in Overview tab) */}
          {activeTab === 'overview' && gradeBandBreakdown.length > 0 && (
            <section className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <span className="subtitle">Tier Comparison</span>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-headline)', fontSize: '1.15rem', color: 'var(--text-heading)' }}>
                    Educational Tier Benchmarks
                  </h3>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {gradeBandBreakdown.map((tier) => {
                  const bandMeta = GRADE_BANDS.find(b => b.id === tier.bandId) || { label: tier.bandId, icon: 'school' }
                  return (
                    <div
                      key={tier.bandId}
                      className="admin-grade-tier-card"
                      style={{ cursor: 'default' }}
                    >
                      <div className="tier-header">
                        <span className="material-symbols-outlined">
                          {bandMeta.icon}
                        </span>
                        <strong>{bandMeta.shortLabel || bandMeta.label}</strong>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block' }}>Sections:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{tier.sections} Classes</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block' }}>Students:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{tier.students.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block' }}>Attendance:</span>
                          <strong style={{ color: 'var(--status-present-text)' }}>{tier.attendanceRate}%</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block' }}>Grade Mean:</span>
                          <strong style={{ color: 'var(--navy-primary)' }}>{tier.averageGrade}%</strong>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* TAB 1: EXECUTIVE OVERVIEW or TAB 2: ATTENDANCE RADAR */}
          {(activeTab === 'overview' || activeTab === 'attendance') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
              {/* Daily Attendance Trend */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div>
                    <span className="subtitle">Time-Series Monitor</span>
                    <h3 style={{ margin: '2px 0 0', fontFamily: 'var(--font-headline)', fontSize: '1.15rem', color: 'var(--text-heading)' }}>
                      14-Day Attendance Velocity
                    </h3>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: 'var(--navy-primary)' }}>timeline</span>
                </div>

                {(attendance.dailyTrends || []).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No attendance roll logs found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(attendance.dailyTrends || []).map((day) => {
                      const dayRate = day.total > 0 ? Math.round(((day.present + day.late) / day.total) * 100) : 100
                      return (
                        <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
                          <span style={{ minWidth: '85px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{day.date}</span>
                          <div style={{ flex: 1, height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${(day.present / (day.total || 1)) * 100}%`, background: 'var(--status-present-text)' }} title={`Present: ${day.present}`} />
                            <div style={{ width: `${(day.late / (day.total || 1)) * 100}%`, background: 'var(--gold-accent)' }} title={`Late: ${day.late}`} />
                            <div style={{ width: `${(day.absent / (day.total || 1)) * 100}%`, background: 'var(--status-absent-text)' }} title={`Absent: ${day.absent}`} />
                          </div>
                          <span style={{ minWidth: '40px', textAlign: 'right', fontWeight: '700', color: 'var(--text-heading)' }}>{dayRate}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Status Composition Breakdown */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div>
                    <span className="subtitle">Roll Breakdown</span>
                    <h3 style={{ margin: '2px 0 0', fontFamily: 'var(--font-headline)', fontSize: '1.15rem', color: 'var(--text-heading)' }}>
                      Attendance Status Mix
                    </h3>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: 'var(--navy-primary)' }}>pie_chart</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Present', count: attendance.statusCounts?.present || 0, pct: presentPct, color: 'var(--status-present-text)', bg: 'var(--status-present-bg)', icon: 'check_circle' },
                    { label: 'Late Arrival', count: attendance.statusCounts?.late || 0, pct: latePct, color: 'var(--gold-accent)', bg: 'rgba(217, 119, 6, 0.12)', icon: 'schedule' },
                    { label: 'Absent', count: attendance.statusCounts?.absent || 0, pct: absentPct, color: 'var(--status-absent-text)', bg: 'var(--status-absent-bg)', icon: 'cancel' },
                  ].map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--radius-btn)', background: s.bg, border: `1px solid ${s.color}22` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ color: s.color, fontSize: '20px' }}>{s.icon}</span>
                        <strong style={{ color: 'var(--text-heading)', fontSize: '0.9rem' }}>{s.label}</strong>
                      </div>
                      <span style={{ fontWeight: '700', color: s.color, fontSize: '0.95rem' }}>
                        {(s.count).toLocaleString()} ({s.pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: EXECUTIVE OVERVIEW or TAB 3: ACADEMICS & GRADES */}
          {(activeTab === 'overview' || activeTab === 'grades') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
              {/* Grade Band Distribution */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div>
                    <span className="subtitle">Score Distribution</span>
                    <h3 style={{ margin: '2px 0 0', fontFamily: 'var(--font-headline)', fontSize: '1.15rem', color: 'var(--text-heading)' }}>
                      Letter Grade Distribution
                    </h3>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: 'var(--navy-primary)' }}>bar_chart</span>
                </div>

                {grades.totalGrades === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No grade marks recorded for this scope.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { label: 'Band A (90 - 100%)', count: grades.distribution?.bandA || 0, color: 'var(--status-present-text)', icon: 'military_tech' },
                      { label: 'Band B (80 - 89%)', count: grades.distribution?.bandB || 0, color: 'var(--navy-primary)', icon: 'workspace_premium' },
                      { label: 'Band C (70 - 79%)', count: grades.distribution?.bandC || 0, color: 'var(--gold-accent)', icon: 'thumb_up' },
                      { label: 'Band D (60 - 69%)', count: grades.distribution?.bandD || 0, color: '#8B5CF6', icon: 'remove' },
                      { label: 'Band F (< 60%)', count: grades.distribution?.bandF || 0, color: 'var(--status-absent-text)', icon: 'priority_high' },
                    ].map((band) => {
                      const pct = Math.round((band.count / grades.totalGrades) * 100)
                      return (
                        <div key={band.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text-heading)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: band.color }}>{band.icon}</span>
                              <span>{band.label}</span>
                            </div>
                            <span style={{ fontWeight: '700', color: band.color }}>{band.count.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: band.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Subject Performance Ranking */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div>
                    <span className="subtitle">Curriculum Benchmarks</span>
                    <h3 style={{ margin: '2px 0 0', fontFamily: 'var(--font-headline)', fontSize: '1.15rem', color: 'var(--text-heading)' }}>
                      Subject Score Averages
                    </h3>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: 'var(--navy-primary)' }}>school</span>
                </div>

                {(grades.subjectPerformance || []).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No subject grade averages available.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {grades.subjectPerformance.map((sub) => (
                      <div key={sub.subjectId} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-heading)' }}>{sub.subjectName}</span>
                          <span style={{ fontWeight: '700', color: 'var(--navy-primary)' }}>{sub.averageScore}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${sub.averageScore}%`,
                              background: 'var(--navy-primary)',
                              borderRadius: '4px',
                              transition: 'width 0.6s ease',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: EXECUTIVE OVERVIEW or TAB 4: AT-RISK MONITORING */}
          {(activeTab === 'overview' || activeTab === 'at-risk') && (
            <section className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <span className="subtitle" style={{ color: atRiskStudents.length > 0 ? 'var(--status-absent-text)' : 'var(--status-present-text)' }}>
                    Early Intervention Protocol
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontFamily: 'var(--font-headline)', fontSize: '1.2rem', color: 'var(--text-heading)' }}>
                    At-Risk Student Monitoring Roster ({filteredRiskStudents.length.toLocaleString()})
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Search within Roster */}
                  <div className="admin-search-box" style={{ background: 'var(--bg-surface-muted)', padding: '4px 10px', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-color)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
                    <input
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: 'var(--text-primary)' }}
                      value={riskSearchQuery}
                      onChange={(e) => { setRiskSearchQuery(e.target.value); setRiskPage(1) }}
                      placeholder="Search student or class..."
                    />
                  </div>

                  <span className="badge" style={{ background: atRiskStudents.length > 0 ? 'var(--status-absent-bg)' : 'var(--status-present-bg)', color: atRiskStudents.length > 0 ? 'var(--status-absent-text)' : 'var(--status-present-text)', padding: '6px 14px', fontSize: '0.85rem', fontWeight: '700' }}>
                    {atRiskStudents.length} Flagged
                  </span>
                </div>
              </div>

              {filteredRiskStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-surface-muted)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-color)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '44px', color: 'var(--status-present-text)', marginBottom: '8px' }}>
                    verified
                  </span>
                  <h4 style={{ margin: '0 0 4px', color: 'var(--text-heading)', fontSize: '1.1rem' }}>No At-Risk Students Flagged</h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    {riskSearchQuery ? 'No student matches your search query.' : 'All students are operating above the risk thresholds (attendance >= 85% & grade average >= 60%).'}
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Class</th>
                          <th>Attendance Rate</th>
                          <th>Grade Average</th>
                          <th>Risk Indicators</th>
                          <th>Guardian Contacts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRiskStudents.map((st) => (
                          <tr key={st.studentId}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'var(--status-absent-bg)',
                                    color: 'var(--status-absent-text)',
                                    fontWeight: '700',
                                    fontSize: '0.8rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid var(--status-absent-border)',
                                  }}
                                >
                                  {st.studentName[0]}
                                </span>
                                <strong style={{ color: 'var(--text-heading)' }}>{st.studentName}</strong>
                              </div>
                            </td>
                            <td>
                              <span className="badge" style={{ background: 'var(--bg-surface-strong)', color: 'var(--text-primary)', fontSize: '0.78rem' }}>
                                {st.className}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: '700', color: st.attendanceRate !== null && st.attendanceRate < 85 ? 'var(--status-absent-text)' : 'var(--text-primary)' }}>
                                {st.attendanceRate !== null ? `${st.attendanceRate}%` : 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: '700', color: st.gradeAverage !== null && st.gradeAverage < 60 ? 'var(--status-absent-text)' : 'var(--text-primary)' }}>
                                {st.gradeAverage !== null ? `${st.gradeAverage}%` : 'N/A'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {st.riskFactors.map((rf, i) => (
                                  <span key={i} className="badge badge-absent" style={{ fontSize: '0.74rem' }}>
                                    {rf}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              {st.parents && st.parents.length > 0 ? (
                                st.parents.map((p) => (
                                  <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <strong style={{ color: 'var(--text-heading)', fontSize: '0.84rem' }}>{p.name}</strong>
                                    {p.phone && (
                                      <a
                                        href={`tel:${p.phone}`}
                                        className="analytics-contact-link"
                                        title={`Call ${p.name}`}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>call</span>
                                        {p.phone}
                                      </a>
                                    )}
                                    {p.email && (
                                      <a
                                        href={`mailto:${p.email}`}
                                        className="analytics-contact-link"
                                        title={`Email ${p.name}`}
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>mail</span>
                                        Email
                                      </a>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No guardian linked</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    page={riskPage}
                    limit={riskLimit}
                    total={filteredRiskStudents.length}
                    totalPages={totalRiskPages}
                    itemLabel="at-risk students"
                    onPageChange={(p) => setRiskPage(p)}
                    onLimitChange={(l) => { setRiskLimit(l); setRiskPage(1) }}
                  />
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
