// Simple mock API to allow local UI testing without backend.
const now = new Date();

export async function listNotifications({ parentUserId }){
  return [
    { id: 1, type: 'absence', readAt: null, createdAt: now.toISOString(), message: 'Alice was marked absent', student: { id: 201, name: 'Alice', class: { id: 10, name: '1A' } }, attendance: { id: 11, date: now.toISOString(), status: 'absent' } },
    { id: 2, type: 'late', readAt: now.toISOString(), createdAt: new Date(now.getTime()-86400000).toISOString(), message: 'Bob arrived late', student: { id: 202, name: 'Bob', class: { id: 10, name: '1A' } }, attendance: { id: 12, date: new Date(now.getTime()-86400000).toISOString(), status: 'late' } }
  ]
}

export async function markNotificationRead({ notificationId }){
  return { id: Number(notificationId), readAt: new Date().toISOString() }
}

export async function getChildAttendanceHistory({ studentId }){
  const today = new Date();
  const arr = [];
  for(let i=0;i<7;i++){ const d=new Date(today.getTime()-i*86400000); arr.push({ id: i+1, date: d.toISOString(), status: i===2?'absent':'present', marked: { id: 1, name: 'Ms. Jane' } }) }
  return { student: { id: Number(studentId), name: `Student ${studentId}`, class: { id: 10, name: '1A' } }, range: { from: arr[arr.length-1].date.slice(0,10), to: arr[0].date.slice(0,10) }, attendance: arr }
}

export async function getAttendanceByClass({ classId, date }){
  return [ { id: 1, student: { id: 201, name: 'Alice' }, status: 'present' }, { id: 2, student: { id: 202, name: 'Bob' }, status: 'late' } ]
}

export async function markAttendanceBatch({ classId, date, marks }){
  return { created: marks.length, updated: 0, notificationsCreated: marks.filter(m=>m.status==='absent').length }
}
