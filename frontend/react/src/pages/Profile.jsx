import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { getMyProfile, updateMyProfile, changeMyPassword } from '../api/apiClient'

export default function Profile() {
  const { user, logout, updateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()

  // Profile fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoadingProfile(true)
        const profile = await getMyProfile()
        if (profile) {
          setName(profile.name || '')
          setPhone(profile.phone || '')
          setAvatarUrl(profile.avatarUrl || null)
          updateUser(profile)
        }
      } catch (err) {
        // Fallback to auth session user
        if (user) {
          setName(user.name || '')
          setPhone(user.phone || '')
          setAvatarUrl(user.avatarUrl || null)
        }
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [])

  // Handle avatar image file selection
  function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result
      if (typeof base64 === 'string') {
        setAvatarUrl(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  function removeAvatar() {
    setAvatarUrl(null)
  }

  // Save personal profile details
  async function handleSaveProfile(event) {
    event.preventDefault()
    if (!name.trim()) {
      toast.warning('Full name cannot be blank.')
      return
    }

    try {
      setSavingProfile(true)
      const updated = await updateMyProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        avatarUrl: avatarUrl || null,
      })

      updateUser(updated)
      toast.success('Profile details updated successfully.')
    } catch (err) {
      toast.error(err?.message ?? 'Failed to update profile details.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle password update
  async function handleChangePassword(event) {
    event.preventDefault()
    if (!currentPassword || !newPassword) {
      toast.warning('Please enter your current and new password.')
      return
    }
    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.warning('New password and confirmation do not match.')
      return
    }

    try {
      setChangingPassword(true)
      await changeMyPassword({
        currentPassword,
        newPassword,
      })

      toast.success('Your password has been changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err?.message ?? 'Failed to change password. Check your current password.')
    } finally {
      setChangingPassword(false)
    }
  }

  if (!user) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Profile information is not available. Please sign in again.</p>
        </div>
      </div>
    )
  }

  const roleDisplay = {
    parent: 'Parent / Guardian',
    teacher: 'Faculty Instructor',
    student: 'Student Member',
    admin: 'System Administrator',
  }[user.role] || user.role

  return (
    <div className="container" style={{ maxWidth: '960px' }}>
      {/* 1. Header Banner */}
      <div className="section-header">
        <div>
          <span className="subtitle">Account Management</span>
          <h1 className="title">User Profile &amp; Security</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* 2. Personal Information & Avatar Card */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <h2 style={{ margin: '0 0 20px', fontFamily: 'var(--font-headline)', fontSize: '1.25rem', color: 'var(--text-heading)' }}>
            Personal Details &amp; Photo
          </h2>

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '28px', flexWrap: 'wrap' }}>
              <div className="avatar-upload-wrap">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name || user.name} className="avatar-img-large" />
                ) : (
                  <div className="avatar avatar-large">
                    {(name || user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <label className="avatar-upload-badge" title="Upload new photo">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_camera</span>
                  <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="btn-secondary" style={{ cursor: 'pointer', fontSize: '0.82rem', padding: '6px 14px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
                    Upload Photo
                    <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarChange} style={{ display: 'none' }} />
                  </label>
                  {avatarUrl && (
                    <button type="button" className="btn-ghost" onClick={removeAvatar} style={{ fontSize: '0.82rem', padding: '6px 12px', color: 'var(--status-absent-text)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      Remove
                    </button>
                  )}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Recommended: Square JPG, PNG, or WebP (max 5MB).
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '20px' }}>
              <div className="input-label" style={{ margin: 0 }}>
                <span className="label-caps">Full Name</span>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="input-label" style={{ margin: 0 }}>
                <span className="label-caps">Phone Number</span>
                <input
                  type="tel"
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +251 911 000 000"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={savingProfile}>
                <span className="material-symbols-outlined">save</span>
                {savingProfile ? 'Saving…' : 'Save Personal Details'}
              </button>
            </div>
          </form>
        </div>

        {/* 3. Security & Password Change Card */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-headline)', fontSize: '1.25rem', color: 'var(--text-heading)' }}>
            Security &amp; Password
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            To update your login password, please verify your current password.
          </p>

          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px', marginBottom: '24px' }}>
              <div className="input-label" style={{ margin: 0 }}>
                <span className="label-caps">Current Password</span>
                <div className="login-password-field">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    className="input-field"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    aria-label="Toggle current password visibility"
                  >
                    <span className="material-symbols-outlined">{showCurrentPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="input-label" style={{ margin: 0 }}>
                <span className="label-caps">New Password (min. 6 characters)</span>
                <div className="login-password-field">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className="input-field"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowNewPw(!showNewPw)}
                    aria-label="Toggle new password visibility"
                  >
                    <span className="material-symbols-outlined">{showNewPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="input-label" style={{ margin: 0 }}>
                <span className="label-caps">Confirm New Password</span>
                <div className="login-password-field">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    className="input-field"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    aria-label="Toggle confirm password visibility"
                  >
                    <span className="material-symbols-outlined">{showConfirmPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={changingPassword}>
                <span className="material-symbols-outlined">lock_reset</span>
                {changingPassword ? 'Updating Password…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* 4. Institutional Overview & Preferences Card */}
        <div className="card" style={{ padding: '28px 32px' }}>
          <h2 style={{ margin: '0 0 16px', fontFamily: 'var(--font-headline)', fontSize: '1.25rem', color: 'var(--text-heading)' }}>
            Institutional Account Details
          </h2>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '24px' }}>
            <div className="stat-card">
              <span>Institutional Email</span>
              <strong style={{ fontSize: '1rem', wordBreak: 'break-all', marginTop: '4px' }}>{user.email}</strong>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>Managed by Registrar</small>
            </div>
            <div className="stat-card">
              <span>Assigned Role</span>
              <strong style={{ fontSize: '1rem', marginTop: '4px' }}>{roleDisplay}</strong>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>System Permissions</small>
            </div>
            <div className="stat-card">
              <span>Campus Institution</span>
              <strong style={{ fontSize: '1rem', marginTop: '4px' }}>Sheba University College</strong>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>Campus ID #{user.schoolId ?? ''}</small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Visual Interface Theme</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Currently set to {theme === 'dark' ? 'Dark Mode (Institutional Navy)' : 'Light Mode (Clean Slate)'}
              </span>
            </div>
            <button type="button" className="btn-secondary" onClick={toggleTheme}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              {theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn-danger" onClick={logout} style={{ minWidth: '140px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
              Sign Out of Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
