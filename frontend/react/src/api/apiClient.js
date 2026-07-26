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
    body: { email, password, schoolId },
  });
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
