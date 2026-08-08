import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  listConversations,
  createConversation,
  getConversationDetails,
  sendMessage as sendApiMessage,
  listParentStudents,
  listTeachers,
  listStudents,
  listParents,
  listParentStudentLinks,
} from '../api/apiClient'

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [activeConvData, setActiveConvData] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  
  // New conversation modal state
  const [showNewModal, setShowNewModal] = useState(false)
  const [modalChildren, setModalChildren] = useState([])
  const [modalTeachers, setModalTeachers] = useState([])
  const [modalParents, setModalParents] = useState([])
  const [modalStudents, setModalStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedParentId, setSelectedParentId] = useState('')
  const [creatingConv, setCreatingConv] = useState(false)
  const [modalError, setModalError] = useState('')

  const messagesEndRef = useRef(null)

  // Load conversations list
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConvs(true)
    try {
      const data = await listConversations()
      setConversations(data || [])
    } catch (err) {
      if (!silent) setError(err.message || 'Failed to load conversations')
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
      if (!silent) setError(err.message || 'Failed to load messages')
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchConversations()
  }, [])

  // Poll list every 15s
  useEffect(() => {
    const listInterval = setInterval(() => {
      fetchConversations(true)
    }, 15000)
    return () => clearInterval(listInterval)
  }, [])

  // Poll active thread every 10s
  useEffect(() => {
    if (!activeConvId) return
    fetchThread(activeConvId, true)

    const threadInterval = setInterval(() => {
      fetchThread(activeConvId, true)
    }, 10000)

    return () => clearInterval(threadInterval)
  }, [activeConvId])

  // Select conversation
  const handleSelectConv = (convId) => {
    setActiveConvId(convId)
    fetchThread(convId, false)
  }

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle Send Message
  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || sending || !activeConvId) return

    const content = inputText.trim()
    if (content.length > 1000) {
      setError('Message exceeds 1000 character limit')
      return
    }

    setSending(true)
    setError('')
    try {
      const newMsg = await sendApiMessage(activeConvId, content)
      setInputText('')
      setMessages((prev) => [...prev, newMsg])
      fetchConversations(true)
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleTeacherStudentChange = (studentIdStr, studentsList = modalStudents) => {
    setSelectedStudentId(studentIdStr)
    const selectedStudent = studentsList.find((s) => String(s.id) === String(studentIdStr))
    if (selectedStudent?.parents && selectedStudent.parents.length > 0) {
      const linkedParents = selectedStudent.parents.map((p) => p.parent).filter(Boolean)
      if (linkedParents.length > 0) {
        setModalParents(linkedParents)
        setSelectedParentId(String(linkedParents[0].id))
        return
      }
    }
    listParents().then((allParents) => {
      setModalParents(allParents || [])
      if (allParents?.length > 0) setSelectedParentId(String(allParents[0].id))
    }).catch(() => {})
  }

  // Load modal data based on user role
  const handleOpenNewModal = async () => {
    setShowNewModal(true)
    setModalError('')
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
          handleTeacherStudentChange(String(students[0].id), students)
        }
      }
    } catch (err) {
      setModalError(err.message || 'Failed to load recipients list')
    }
  }

  // Handle Create Conversation
  const handleCreateConversation = async (e) => {
    e.preventDefault()
    if (!selectedStudentId) {
      setModalError('Please select a student')
      return
    }

    setCreatingConv(true)
    setModalError('')

    try {
      const body = {
        studentId: Number.parseInt(selectedStudentId, 10),
      }

      if (user?.role === 'parent') {
        if (!selectedTeacherId) {
          setModalError('Please select a teacher')
          setCreatingConv(false)
          return
        }
        body.teacherId = Number.parseInt(selectedTeacherId, 10)
      } else if (user?.role === 'teacher') {
        if (!selectedParentId) {
          setModalError('Please select a parent')
          setCreatingConv(false)
          return
        }
        body.parentId = Number.parseInt(selectedParentId, 10)
      }

      const conv = await createConversation(body)
      setShowNewModal(false)
      await fetchConversations(false)
      setActiveConvId(conv.id)
      await fetchThread(conv.id, false)
    } catch (err) {
      setModalError(err.message || 'Failed to start conversation')
    } finally {
      setCreatingConv(false)
    }
  }

  const getCounterpartName = (conv) => {
    if (user?.role === 'parent') return conv.teacher?.name || 'Teacher'
    return conv.parent?.name || 'Parent'
  }

  const getCounterpartRole = (conv) => {
    if (user?.role === 'parent') return 'Teacher'
    return 'Parent'
  }

  return (
    <div className="container" style={{ padding: '1.5rem 1rem', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Direct Messages</h1>
          <p style={{ color: 'var(--color-text-secondary, #64748b)', margin: '0.25rem 0 0' }}>
            Private communications between teachers and parents
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={handleOpenNewModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span className="material-symbols-outlined">add_comment</span>
          New Message
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: activeConvId ? '320px 1fr' : '1fr', gap: '1.5rem', minHeight: '520px' }}>
        {/* Conversation List Sidebar */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
            Conversations ({conversations.length})
          </h2>

          {loadingConvs ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>Loading conversations…</p>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', opacity: 0.5 }}>chat_bubble_outline</span>
              <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>No conversations yet</p>
              <p style={{ fontSize: '0.875rem' }}>Click "New Message" to start a thread.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '500px' }}>
              {conversations.map((conv) => {
                const isActive = conv.id === activeConvId
                const counterpart = getCounterpartName(conv)
                const roleTag = getCounterpartRole(conv)
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      padding: '0.85rem',
                      borderRadius: '0.5rem',
                      border: '1px solid',
                      borderColor: isActive ? 'var(--color-primary, #2563eb)' : '#e2e8f0',
                      background: isActive ? 'var(--color-primary-light, #eff6ff)' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{counterpart}</span>
                      <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontWeight: 500 }}>
                        {roleTag}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 500 }}>
                      Student: {conv.student?.name} {conv.student?.class?.name ? `(${conv.student.class.name})` : ''}
                    </div>

                    {conv.lastMessage && (
                      <div style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.lastMessage.content}
                      </div>
                    )}

                    {conv.unreadCount > 0 && (
                      <span style={{ alignSelf: 'flex-start', background: '#ef4444', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>
                        {conv.unreadCount} unread
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Thread View Window */}
        {activeConvId ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: 0, overflow: 'hidden' }}>
            {/* Thread Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  {activeConvData ? getCounterpartName(activeConvData) : 'Chat Thread'}
                </h3>
                {activeConvData?.student && (
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Child: <strong>{activeConvData.student.name}</strong> {activeConvData.student.class ? `(${activeConvData.student.class.name})` : ''}
                  </p>
                )}
              </div>
              <button
                className="button button-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                onClick={() => setActiveConvId(null)}
              >
                Close Thread
              </button>
            </div>

            {/* Messages Scroll Panel */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#ffffff' }}>
              {loadingMessages && messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', margin: 'auto' }}>Loading messages…</p>
              ) : messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', margin: 'auto' }}>No messages yet. Send a message to start the conversation!</p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderUserId === user?.id
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem', padding: '0 0.25rem' }}>
                        {isMine ? 'You' : msg.sender?.name} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: isMine ? '1rem 1rem 0.2rem 1rem' : '1rem 1rem 1rem 0.2rem',
                          background: isMine ? 'var(--color-primary, #2563eb)' : '#f1f5f9',
                          color: isMine ? '#ffffff' : '#1e293b',
                          fontSize: '0.95rem',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Type your message (max 1000 characters)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={1000}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="button button-primary"
                disabled={sending || !inputText.trim()}
                style={{ padding: '0.75rem 1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>send</span>
                {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#64748b', height: '400px' }}>
            <div>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.4 }}>forum</span>
              <h3 style={{ margin: '0.5rem 0 0.25rem', color: '#334155' }}>Select a conversation</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Choose an existing conversation from the list or create a new message thread.</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ background: '#ffffff', width: '100%', maxWidth: '500px', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Start New Conversation</h3>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {modalError && (
              <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.65rem 0.85rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateConversation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {user?.role === 'parent' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                      Select Child (Student):
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                      required
                    >
                      {modalChildren.map((kid) => (
                        <option key={kid.id} value={kid.id}>
                          {kid.name} {kid.class ? `(${kid.class.name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                      Select Teacher:
                    </label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
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
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                      Select Student:
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => handleTeacherStudentChange(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                      required
                    >
                      {modalStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                      Select Parent:
                    </label>
                    <select
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1' }}
                      required
                    >
                      {modalParents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="button button-outline" onClick={() => setShowNewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={creatingConv}>
                  {creatingConv ? 'Starting…' : 'Start Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
