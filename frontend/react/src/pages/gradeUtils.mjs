export function getGradeStats(roster = []) {
  const numericScores = roster
    .map((student) => student.score)
    .filter((value) => value !== '' && value !== null && value !== undefined)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

  const enteredCount = numericScores.length
  const blankCount = roster.length - enteredCount
  const average = enteredCount
    ? numericScores.reduce((total, value) => total + value, 0) / enteredCount
    : null

  return {
    enteredCount,
    blankCount,
    average,
    totalStudents: roster.length,
  }
}

export function filterRosterBySearch(roster = [], searchTerm = '') {
  const normalized = searchTerm.trim().toLowerCase()
  if (!normalized) return roster

  return roster.filter((student) => student.name?.toLowerCase().includes(normalized))
}
