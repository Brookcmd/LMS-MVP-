const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

function getToken() {
  return localStorage.getItem("rollcall_token");
}

function buildHeaders(json = true) {
  const headers = {};

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok || payload?.success === false) {
    const errorMessage = (payload?.error?.message ?? payload?.message ?? response.statusText) || "Request failed";
    throw new Error(errorMessage);
  }

  return payload?.data ?? null;
}

export async function login({ email, password, schoolId }) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password, ...(schoolId ? { schoolId } : {}) },
  });
}

export async function signup({ name, email, password, role }) {
  const result = await request("/auth/signup", {
    method: "POST",
    body: { name, email, password, role },
  });
  return result?.user ?? result;
}

export async function listNotifications() {
  return request("/parent/notifications");
}

export async function listParentStudents() {
  return request("/parent/students");
}

export async function markNotificationRead(notificationId) {
  return request(`/parent/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function getChildAttendanceHistory({ studentId, from, to }) {
  const query = new URLSearchParams({ studentId });
  if (from) query.set("from", from);
  if (to) query.set("to", to);

  return request(`/parent/attendance?${query.toString()}`);
}

export async function getAttendanceByClass({ classId, date }) {
  const query = new URLSearchParams({ classId, date });
  return request(`/attendance?${query.toString()}`);
}

export async function markAttendanceBatch({ classId, date, marks }) {
  return request("/attendance/batch", {
    method: "POST",
    body: { classId, date, marks },
  });
}

export async function listTeachingAssignments() { return request('/grades/teaching-assignments/mine') }
export async function getGradeRoster({ assignmentId, academicYear, quarter }) { return request(`/grades/assignments/${assignmentId}?academicYear=${encodeURIComponent(academicYear)}&quarter=${quarter}`) }
export async function saveGrades({ assignmentId, academicYear, quarter, grades }) { return request(`/grades/assignments/${assignmentId}`, { method: 'PUT', body: { academicYear, quarter, grades } }) }
export async function getParentGrades({ studentId, academicYear, quarter }) { return request(`/grades/parent?studentId=${studentId}&academicYear=${encodeURIComponent(academicYear)}&quarter=${quarter}`) }

export async function downloadGradeTemplate({ assignmentId, academicYear, quarter }) {
  const url = `${BASE_URL}/grades/assignments/${assignmentId}/template?academicYear=${encodeURIComponent(academicYear)}&quarter=${quarter}`
  const response = await fetch(url, { headers: buildHeaders(false) })
  if (!response.ok) {
    const text = await response.text()
    let msg = response.statusText
    try { const json = JSON.parse(text); msg = json?.error?.message ?? msg } catch {}
    throw new Error(msg)
  }
  const blob = await response.blob()
  const disposition = response.headers.get('content-disposition') || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : 'grade-template.xlsx'
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

export async function uploadGradeFile({ assignmentId, academicYear, quarter, file }) {
  const url = `${BASE_URL}/grades/assignments/${assignmentId}/upload?academicYear=${encodeURIComponent(academicYear)}&quarter=${quarter}`
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(url, { method: 'POST', headers: buildHeaders(false), body: formData })
  const text = await response.text()
  let payload = null
  if (text) {
    try { payload = JSON.parse(text) } catch { payload = { message: text } }
  }
  // Return the full payload so the caller can inspect success/error/details
  return payload
}

export async function listClasses(params = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.gradeBand) query.set('gradeBand', params.gradeBand)
  const qs = query.toString()
  return request(`/classes${qs ? `?${qs}` : ''}`)
}
export async function createClass(body) { return request('/classes', { method: 'POST', body }) }
export async function updateClass(classId, body) { return request(`/classes/${classId}`, { method: 'PUT', body }) }
export async function deleteClass(classId) { return request(`/classes/${classId}`, { method: 'DELETE' }) }
export async function getClassSchedule(classId) { return request(`/schedule/class/${classId}`) }

export async function listStudents(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  if (params.classId) query.set('classId', params.classId)
  if (params.gradeBand) query.set('gradeBand', params.gradeBand)
  const qs = query.toString()
  return request(`/students${qs ? `?${qs}` : ''}`)
}
export async function createStudent(body) { return request('/students', { method: 'POST', body }) }
export async function updateStudent(studentId, body) { return request(`/students/${studentId}`, { method: 'PUT', body }) }
export async function deleteStudent(studentId) { return request(`/students/${studentId}`, { method: 'DELETE' }) }

export async function listTeachers(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  return request(`/teachers${qs ? `?${qs}` : ''}`)
}

export async function listParents(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  return request(`/parents${qs ? `?${qs}` : ''}`)
}

export async function listSubjects() { return request('/grades/subjects') }
export async function createSubject(body) { return request('/grades/subjects', { method: 'POST', body }) }
export async function createTeachingAssignment(body) { return request('/grades/teaching-assignments', { method: 'POST', body }) }
export async function listAllTeachingAssignments() { return request('/grades/teaching-assignments') }

export async function listParentStudentLinks(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.search) query.set('search', params.search)
  if (params.studentId) query.set('studentId', params.studentId)
  if (params.parentUserId) query.set('parentUserId', params.parentUserId)
  const qs = query.toString()
  return request(`/parent-students${qs ? `?${qs}` : ''}`)
}
export async function upsertParentStudentLink(body) { return request('/parent-students', { method: 'POST', body }) }
export async function deleteParentStudentLink(parentUserId, studentId) { return request(`/parent-students/${parentUserId}/${studentId}`, { method: 'DELETE' }) }

export async function createAssessment(body) { return request('/assessments', { method: 'POST', body }) }
export async function listTeacherAssessments() { return request('/assessments/teacher') }
export async function deleteAssessment(id) { return request(`/assessments/${id}`, { method: 'DELETE' }) }
export async function listParentAssessments(studentId) { return request(`/assessments/parent${studentId ? `?studentId=${studentId}` : ''}`) }

// Schedule (Feature 19)
export async function createScheduleSlot(body) { return request('/schedule', { method: 'POST', body }) }
export async function updateScheduleSlot(id, body) { return request(`/schedule/${id}`, { method: 'PUT', body }) }
export async function deleteScheduleSlot(id) { return request(`/schedule/${id}`, { method: 'DELETE' }) }
export async function getTeacherSchedule() { return request('/schedule/teacher') }
export async function getParentSchedule(studentId) {
  return request(`/schedule/parent${studentId ? `?studentId=${studentId}` : ''}`)
}

// Messaging & Notifications (Feature 15)
export async function listConversations() { return request('/messages/conversations') }
export async function createConversation(body) { return request('/messages/conversations', { method: 'POST', body }) }
export async function getConversationDetails(id, page = 1, limit = 50) { return request(`/messages/conversations/${id}?page=${page}&limit=${limit}`) }
export async function sendMessage(conversationId, content) { return request(`/messages/conversations/${conversationId}/messages`, { method: 'POST', body: { content } }) }
export async function markConversationRead(conversationId) { return request(`/messages/conversations/${conversationId}/read`, { method: 'PATCH' }) }
export async function listUserNotifications() { return request('/notifications') }
export async function markUserNotificationRead(id) { return request(`/notifications/${id}/read`, { method: 'PATCH' }) }

// Student Endpoints
export async function getStudentGrades({ academicYear, quarter }) {
  return request(`/grades/student?academicYear=${encodeURIComponent(academicYear)}&quarter=${quarter}`)
}
export async function getStudentAttendance({ from, to }) {
  const query = new URLSearchParams()
  if (from) query.set("from", from)
  if (to) query.set("to", to)
  return request(`/student/attendance?${query.toString()}`)
}
export async function getStudentAssessments() {
  return request('/assessments/student')
}
// User Profile Management
export async function getMyProfile() {
  return request('/profile/me')
}

export async function updateMyProfile(body) {
  return request('/profile/me', { method: 'PUT', body })
}

export async function changeMyPassword(body) {
  return request('/profile/change-password', { method: 'POST', body })
}

// Admin Analytics (Feature 17)
export async function getAdminAnalytics({ classId, quarter, academicYear, gradeBand } = {}) {
  const query = new URLSearchParams()
  if (classId) query.set('classId', classId)
  if (quarter) query.set('quarter', quarter)
  if (academicYear) query.set('academicYear', academicYear)
  if (gradeBand) query.set('gradeBand', gradeBand)
  const queryString = query.toString()
  return request(`/analytics/admin${queryString ? `?${queryString}` : ''}`)
}

// Course Materials (Feature 14)
export async function uploadMaterial({ title, description, classId, subjectId, file }) {
  const formData = new FormData()
  formData.append('title', title)
  if (description) formData.append('description', description)
  formData.append('classId', classId)
  formData.append('subjectId', subjectId)
  if (file) formData.append('file', file)

  const response = await fetch(`${BASE_URL}/materials`, {
    method: 'POST',
    headers: buildHeaders(false),
    body: formData,
  })
  const text = await response.text()
  let payload = null
  if (text) {
    try { payload = JSON.parse(text) } catch { payload = { message: text } }
  }
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message || payload?.message || 'Failed to upload course material')
  }
  return payload?.data
}

export async function listTeacherMaterials() {
  return request('/materials/teacher')
}

export async function listStudentMaterials({ studentId, subjectId } = {}) {
  const query = new URLSearchParams()
  if (studentId) query.set('studentId', studentId)
  if (subjectId) query.set('subjectId', subjectId)
  const queryString = query.toString()
  return request(`/materials/student${queryString ? `?${queryString}` : ''}`)
}

export async function listClassMaterials(classId, subjectId) {
  const query = new URLSearchParams()
  if (subjectId) query.set('subjectId', subjectId)
  const queryString = query.toString()
  return request(`/materials/class/${classId}${queryString ? `?${queryString}` : ''}`)
}

export async function deleteMaterial(materialId) {
  return request(`/materials/${materialId}`, { method: 'DELETE' })
}

// Assignment Submissions (Feature 16)
export async function submitAssignment(assessmentId, { content, file, studentId }) {
  const formData = new FormData()
  if (content) formData.append('content', content)
  if (studentId) formData.append('studentId', studentId)
  if (file) formData.append('file', file)

  const response = await fetch(`${BASE_URL}/submissions/assessment/${assessmentId}`, {
    method: 'POST',
    headers: buildHeaders(false),
    body: formData,
  })
  const text = await response.text()
  let payload = null
  if (text) {
    try { payload = JSON.parse(text) } catch { payload = { message: text } }
  }
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message || payload?.message || 'Failed to submit assignment')
  }
  return payload?.data
}

export async function getMySubmission(assessmentId, studentId) {
  const query = new URLSearchParams()
  if (studentId) query.set('studentId', studentId)
  const queryString = query.toString()
  return request(`/submissions/assessment/${assessmentId}/my${queryString ? `?${queryString}` : ''}`)
}

export async function listAssessmentSubmissions(assessmentId) {
  return request(`/submissions/assessment/${assessmentId}`)
}

export async function gradeSubmission(submissionId, { gradeScore, feedback }) {
  return request(`/submissions/${submissionId}/grade`, {
    method: 'PATCH',
    body: { gradeScore, feedback },
  })
}



