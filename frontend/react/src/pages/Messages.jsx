import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  listConversations,
  createConversation,
  getConversationDetails,
  sendMessage as sendApiMessage,
  listParentStudents,
  listTeachers,
  listStudents,
  listParents,
} from '../api/apiClient'

const QUICK_REPLIES = [
  'Thank you!',
  'Received and noted.',
  'I will follow up with the student.',
  'Excuse request approved.',
  'Please check the updated grades.',
  'Let us schedule a discussion.',
]

function formatMessageTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatChatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Messages() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [activeConvData, setActiveConvData] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInfoSidebar, setShowInfoSidebar] = useState(true)
  const [mobileViewActiveChat, setMobileViewActiveChat] = useState(false)

  // New Conversation Modal State
  const [showNewModal, setShowNewModal] = useState(false)
  const [modalChildren, setModalChildren] = useState([])
  const [modalTeachers, setModalTeachers] = useState([])
  const [modalParents, setModalParents] = useState([])
  const [modalStudents, setModalStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedParentId, setSelectedParentId] = useState('')
  const [creatingConv, setCreatingConv] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Load conversations list
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConvs(true)
    try {
      const data = await listConversations()
      setConversations(data || [])
      // Auto-select first conversation on desktop if none selected
      if (!activeConvId && data && data.length > 0 && window.innerWidth > 768) {
        setActiveConvId(data[0].id)
        fetchThread(data[0].id, false)
      }
    } catch (err) {
      if (!silent) toast.error(err.message || 'Failed to load conversations')
    } finally {
      if (!silent) setLoadingConvs(false)
    }
  }

  // Load specific thread messages
  const fetchThread = async (convId, silent = false) => {
    if (!silent) setLoadingMessages(true)
    try {
      const res = await getConversationDetails(convId)
      if (res?.conversation) {
        setActiveConvData(res.conversation)
        setMessages(res.messages || [])
      }
    } catch (err) {
      if (!silent) toast.error(err.message || 'Failed to load messages')
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchConversations()
  }, [])

  // Auto-polling conversation list every 15s
  useEffect(() => {
    const listInterval = setInterval(() => {
      fetchConversations(true)
    }, 15000)
    return () => clearInterval(listInterval)
  }, [activeConvId])

  // Auto-polling active thread every 8s
  useEffect(() => {
    if (!activeConvId) return
    fetchThread(activeConvId, true)

    const threadInterval = setInterval(() => {
      fetchThread(activeConvId, true)
    }, 8000)

    return () => clearInterval(threadInterval)
  }, [activeConvId])

  // Select conversation
  const handleSelectConv = (convId) => {
    setActiveConvId(convId)
    setMobileViewActiveChat(true)
    fetchThread(convId, false)
  }

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputText])

  // Send Message handler
  const handleSend = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : inputText
    if (!textToSend.trim() || sending || !activeConvId) return

    const content = textToSend.trim()
    setSending(true)

    // Optimistic message append
    const tempId = `temp-${Date.now()}`
    const optimisticMsg = {
      id: tempId,
      conversationId: activeConvId,
      senderId: Number(user.id),
      content,
      createdAt: new Date().toISOString(),
      sender: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setInputText('')

    try {
      const realMsg = await sendApiMessage(activeConvId, content)
      setMessages((prev) => prev.map((m) => (m.id === tempId ? realMsg : m)))
      fetchConversations(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send message')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  // Handle Enter key submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Load modal data based on user role
  const handleOpenNewModal = async () => {
    setShowNewModal(true)
    setSelectedStudentId('')
    setSelectedTeacherId('')
    setSelectedParentId('')

    try {
      if (user?.role === 'parent') {
        const kidsData = await listParentStudents()
        const kids = kidsData?.students || kidsData || []
        setModalChildren(kids)
        if (kids.length > 0) setSelectedStudentId(String(kids[0].id))

        const teachersData = await listTeachers()
        setModalTeachers(teachersData || [])
        if (teachersData?.length > 0) setSelectedTeacherId(String(teachersData[0].id))
      } else if (user?.role === 'teacher') {
        const studentsData = await listStudents()
        const students = studentsData || []
        setModalStudents(students)
        if (students.length > 0) {
          setSelectedStudentId(String(students[0].id))
          const linkedParents = (students[0].parents || []).map((p) => p.parent).filter(Boolean)
          setModalParents(linkedParents)
          if (linkedParents.length > 0) setSelectedParentId(String(linkedParents[0].id))
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load recipients list')
    }
  }

  // Handle Teacher Student selection change
  const handleTeacherStudentChange = (studentIdStr) => {
    setSelectedStudentId(studentIdStr)
    const selectedStudent = modalStudents.find((s) => String(s.id) === String(studentIdStr))
    if (selectedStudent?.parents && selectedStudent.parents.length > 0) {
      const linkedParents = selectedStudent.parents.map((p) => p.parent).filter(Boolean)
      setModalParents(linkedParents)
      if (linkedParents.length > 0) setSelectedParentId(String(linkedParents[0].id))
    } else {
      listParents().then((allParents) => {
        setModalParents(allParents || [])
        if (allParents?.length > 0) setSelectedParentId(String(allParents[0].id))
      }).catch(() => {})
    }
  }

  // Create Conversation
  const handleCreateConversation = async (e) => {
    e.preventDefault()
    if (!selectedStudentId) {
      toast.warning('Please select a student record.')
      return
    }

    setCreatingConv(true)
    try {
      const body = {
        studentId: Number.parseInt(selectedStudentId, 10),
      }

      if (user?.role === 'parent') {
        if (!selectedTeacherId) {
          toast.warning('Please select a faculty instructor.')
          setCreatingConv(false)
          return
        }
        body.teacherId = Number.parseInt(selectedTeacherId, 10)
      } else if (user?.role === 'teacher') {
        if (!selectedParentId) {
          toast.warning('Please select a parent guardian.')
          setCreatingConv(false)
          return
        }
        body.parentId = Number.parseInt(selectedParentId, 10)
      }

      const conv = await createConversation(body)
      setShowNewModal(false)
      toast.success('Conversation channel opened.')
      await fetchConversations(false)
      setActiveConvId(conv.id)
      setMobileViewActiveChat(true)
      await fetchThread(conv.id, false)
    } catch (err) {
      toast.error(err.message || 'Failed to start conversation')
    } finally {
      setCreatingConv(false)
    }
  }

  // Helper participant naming
  const getCounterpart = (conv) => {
    if (!conv) return { name: 'User', role: 'Member', email: '', avatarUrl: null }
    if (user?.role === 'parent') {
      return {
        name: conv.teacher?.name || 'Faculty Instructor',
        role: 'Faculty Teacher',
        email: conv.teacher?.email || '',
        avatarUrl: conv.teacher?.avatarUrl || null,
      }
    }
    return {
      name: conv.parent?.name || 'Parent Guardian',
      role: 'Parent / Guardian',
      email: conv.parent?.email || '',
      avatarUrl: conv.parent?.avatarUrl || null,
    }
  }

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const counterpart = getCounterpart(conv)
    const studentName = conv.student?.name || ''
    return counterpart.name.toLowerCase().includes(q) || studentName.toLowerCase().includes(q)
  })

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateLabel = formatChatDate(msg.createdAt)
    if (!groups[dateLabel]) groups[dateLabel] = []
    groups[dateLabel].push(msg)
    return groups
  }, {})

  const activeCounterpart = getCounterpart(activeConvData)

  return (
    <div className="chat-page-container">
      <div className={`chat-shell ${mobileViewActiveChat ? 'mobile-chat-open' : 'mobile-threads-open'}`}>
        
        {/* ==================================================================
            PANEL 1: THREAD LIST (LEFT PANEL)
           ================================================================== */}
        <aside className="chat-threads-panel">
          <div className="chat-threads-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 className="chat-title">Direct Messages</h1>
                <span className="chat-subtitle">Institutional Channels</span>
              </div>
              <button
                type="button"
                className="chat-new-btn"
                onClick={handleOpenNewModal}
                title="Start New Conversation"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit_square</span>
              </button>
            </div>

            <div className="chat-search-wrap">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Search messages, teachers, parents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              )}
            </div>
          </div>

          <div className="chat-threads-list">
            {loadingConvs ? (
              <div className="chat-threads-empty">
                <span className="material-symbols-outlined spin">sync</span>
                <p>Loading active conversations…</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="chat-threads-empty">
                <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.4 }}>chat_bubble_outline</span>
                <p style={{ fontWeight: 600, marginTop: '8px' }}>No conversations found</p>
                <button type="button" className="btn-secondary" onClick={handleOpenNewModal} style={{ fontSize: '0.8rem', marginTop: '10px' }}>
                  Start a Message
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId
                const counterpart = getCounterpart(conv)
                const studentName = conv.student?.name || 'Student'
                const lastMsg = conv.lastMessage?.content || 'No messages yet'
                const lastTime = formatMessageTime(conv.lastMessage?.createdAt || conv.updatedAt)

                return (
                  <div
                    key={conv.id}
                    className={`chat-thread-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectConv(conv.id)}
                  >
                    <div className="chat-avatar-wrap">
                      {counterpart.avatarUrl ? (
                        <img src={counterpart.avatarUrl} alt={counterpart.name} className="chat-avatar-img" />
                      ) : (
                        <div className="avatar" style={{ width: '44px', height: '44px', fontSize: '1rem' }}>
                          {(counterpart.name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="chat-status-dot" />
                    </div>

                    <div className="chat-thread-info">
                      <div className="chat-thread-top">
                        <strong className="chat-thread-name">{counterpart.name}</strong>
                        <span className="chat-thread-time">{lastTime}</span>
                      </div>
                      <div className="chat-thread-student-tag">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>school</span>
                        {studentName}
                      </div>
                      <p className="chat-thread-snippet">{lastMsg}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* ==================================================================
            PANEL 2: ACTIVE CHAT CANVAS (CENTER PANEL)
           ================================================================== */}
        <section className="chat-canvas">
          {activeConvId && activeConvData ? (
            <>
              {/* Chat Canvas Topbar */}
              <header className="chat-canvas-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    className="chat-mobile-back"
                    onClick={() => setMobileViewActiveChat(false)}
                    title="Back to conversation list"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>

                  <div className="chat-avatar-wrap">
                    {activeCounterpart.avatarUrl ? (
                      <img src={activeCounterpart.avatarUrl} alt={activeCounterpart.name} className="chat-avatar-img" />
                    ) : (
                      <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>
                        {(activeCounterpart.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 className="chat-header-title">{activeCounterpart.name}</h2>
                      <span className="status-pill present" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        {activeCounterpart.role}
                      </span>
                    </div>
                    <span className="chat-header-sub">
                      Student: <strong>{activeConvData.student?.name}</strong> • {activeConvData.student?.class?.name || 'Academic Cohort'}
                    </span>
                  </div>
                </div>

                <div className="chat-header-actions">
                  <button
                    type="button"
                    className={`icon-button ${showInfoSidebar ? 'active' : ''}`}
                    onClick={() => setShowInfoSidebar(!showInfoSidebar)}
                    title="Toggle Student Details Sidebar"
                  >
                    <span className="material-symbols-outlined">info</span>
                  </button>
                </div>
              </header>

              {/* Chat Message Stream */}
              <div className="chat-messages-stream">
                {loadingMessages ? (
                  <div className="chat-loading-history">
                    <span className="material-symbols-outlined spin">sync</span>
                    <p>Loading messages…</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-no-messages">
                    <div className="chat-welcome-pill">
                      <span className="material-symbols-outlined">lock</span>
                      End-to-end encrypted direct school communication
                    </div>
                    <p style={{ margin: '14px 0 0', color: 'var(--text-secondary)' }}>
                      Start the dialogue regarding <strong>{activeConvData.student?.name}</strong>.
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([dateLabel, msgs]) => (
                    <div key={dateLabel} className="chat-date-group">
                      <div className="chat-date-separator">
                        <span>{dateLabel}</span>
                      </div>

                      {msgs.map((msg) => {
                        const isOutgoing = Number(msg.senderUserId || msg.senderId || msg.sender?.id) === Number(user.id)

                        return (
                          <div
                            key={msg.id}
                            className={`chat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`}
                          >
                            {!isOutgoing && (
                              <div className="chat-bubble-avatar" title={msg.sender?.name || activeCounterpart.name}>
                                {activeCounterpart.avatarUrl ? (
                                  <img src={activeCounterpart.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <span>{(msg.sender?.name || activeCounterpart.name || 'U')[0].toUpperCase()}</span>
                                )}
                              </div>
                            )}
                            <div className={`chat-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                              {!isOutgoing && (
                                <span className="chat-bubble-sender">{msg.sender?.name || activeCounterpart.name}</span>
                              )}
                              <p className="chat-bubble-text">{msg.content}</p>
                              <div className="chat-bubble-meta">
                                <span className="chat-bubble-time">{formatMessageTime(msg.createdAt)}</span>
                                {isOutgoing && (
                                  <span className="material-symbols-outlined chat-check-icon">done_all</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Response Chips */}
              <div className="chat-quick-chips">
                {QUICK_REPLIES.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="chat-chip-btn"
                    onClick={() => handleSend(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Composer Input Bar */}
              <div className="chat-composer-bar">
                <textarea
                  ref={textareaRef}
                  className="chat-composer-input"
                  placeholder={`Message ${activeCounterpart.name}... (Press Enter to send)`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  type="button"
                  className="chat-send-btn"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || sending}
                  title="Send Message"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </>
          ) : (
            <div className="chat-empty-canvas">
              <div className="chat-empty-illustration">
                <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--navy-primary)' }}>
                  forum
                </span>
              </div>
              <h2>Select a Conversation</h2>
              <p>Choose an existing thread from the left or start a new direct message channel.</p>
              <button type="button" className="btn-primary" onClick={handleOpenNewModal} style={{ marginTop: '12px' }}>
                <span className="material-symbols-outlined">add_comment</span>
                New Conversation
              </button>
            </div>
          )}
        </section>

        {/* ==================================================================
            PANEL 3: STUDENT & CONTACT INFO SIDEBAR (RIGHT PANEL)
           ================================================================== */}
        {activeConvId && activeConvData && showInfoSidebar && (
          <aside className="chat-info-panel">
            <div className="chat-info-head">
              <h3>Academic Context</h3>
              <button type="button" className="icon-button" onClick={() => setShowInfoSidebar(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            <div className="chat-info-body">
              {/* Student Overview Card */}
              <div className="chat-context-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div className="avatar" style={{ width: '42px', height: '42px', background: 'var(--navy-surface)', color: 'var(--navy-primary)' }}>
                    {(activeConvData.student?.name || 'S')[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-heading)' }}>
                      {activeConvData.student?.name}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Student #{activeConvData.student?.id}
                    </span>
                  </div>
                </div>

                <div className="chat-context-details">
                  <div className="chat-context-row">
                    <span>Enrolled Class:</span>
                    <strong>{activeConvData.student?.class?.name || 'Grade 10'}</strong>
                  </div>
                  <div className="chat-context-row">
                    <span>Campus Institution:</span>
                    <strong>Sheba Academy</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate('/attendance')}
                    style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>fact_check</span>
                    Attendance
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate('/grades')}
                    style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>grade</span>
                    Report Card
                  </button>
                </div>
              </div>

              {/* Counterpart Contact Card */}
              <div className="chat-context-card">
                <h5 style={{ margin: '0 0 10px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                  Participant Details
                </h5>
                <div className="chat-context-details">
                  <div className="chat-context-row">
                    <span>Full Name:</span>
                    <strong>{activeCounterpart.name}</strong>
                  </div>
                  <div className="chat-context-row">
                    <span>Role:</span>
                    <strong style={{ color: 'var(--navy-primary)' }}>{activeCounterpart.role}</strong>
                  </div>
                  {activeCounterpart.email && (
                    <div className="chat-context-row">
                      <span>Email:</span>
                      <strong style={{ wordBreak: 'break-all' }}>{activeCounterpart.email}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ==================================================================
          NEW CONVERSATION MODAL
         ================================================================== */}
      {showNewModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3>Start Direct Message</h3>
                <p>Open a direct communication channel</p>
              </div>
              <button type="button" className="admin-icon-btn" onClick={() => setShowNewModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="admin-modal-body admin-form" onSubmit={handleCreateConversation}>
              {user?.role === 'parent' ? (
                <>
                  <div className="input-label">
                    <span className="label-caps">Select Child / Student</span>
                    <select
                      className="select-field"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                    >
                      {modalChildren.map((kid) => (
                        <option key={kid.id} value={kid.id}>
                          {kid.name} ({kid.class?.name || 'Class'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-label">
                    <span className="label-caps">Select Faculty Instructor</span>
                    <select
                      className="select-field"
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      required
                    >
                      {modalTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-label">
                    <span className="label-caps">Select Enrolled Student</span>
                    <select
                      className="select-field"
                      value={selectedStudentId}
                      onChange={(e) => handleTeacherStudentChange(e.target.value)}
                      required
                    >
                      {modalStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.class?.name || 'Class'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-label">
                    <span className="label-caps">Select Linked Parent / Guardian</span>
                    {modalParents.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        No parents linked to this student.
                      </p>
                    ) : (
                      <select
                        className="select-field"
                        value={selectedParentId}
                        onChange={(e) => setSelectedParentId(e.target.value)}
                        required
                      >
                        {modalParents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </>
              )}

              <div className="admin-form-actions">
                <button type="button" className="admin-secondary-button" onClick={() => setShowNewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary-button" disabled={creatingConv}>
                  <span className="material-symbols-outlined">send</span>
                  {creatingConv ? 'Opening…' : 'Start Conversation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
