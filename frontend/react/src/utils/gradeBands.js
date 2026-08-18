export const GRADE_BANDS = [
  { id: 'all', label: 'All Levels', shortLabel: 'All', icon: 'apps' },
  { id: 'kg', label: 'Kindergarten (KG 1–3)', shortLabel: 'KG 1–3', icon: 'child_care' },
  { id: 'primary', label: 'Primary & Middle (Grades 1–8)', shortLabel: 'Grades 1–8', icon: 'school' },
  { id: 'high', label: 'High School (Grades 9–10)', shortLabel: 'Grades 9–10', icon: 'menu_book' },
  { id: 'prep', label: 'Preparatory Streams (Grades 11–12)', shortLabel: 'Grades 11–12', icon: 'psychology' },
]

export function getGradeBandForClass(className = '') {
  const name = String(className).trim().toUpperCase()
  if (name.startsWith('KG')) return 'kg'
  if (/^GRADE\s*([1-8])([^\d]|$)/i.test(name)) return 'primary'
  if (/^GRADE\s*(9|10)([^\d]|$)/i.test(name)) return 'high'
  if (/^GRADE\s*(11|12)([^\d]|$)/i.test(name)) return 'prep'
  return 'primary'
}

export function groupClassesByGradeBand(classes = []) {
  const groups = {
    kg: { label: 'Kindergarten (KG 1–3)', classes: [] },
    primary: { label: 'Primary & Middle (Grades 1–8)', classes: [] },
    high: { label: 'High School (Grades 9–10)', classes: [] },
    prep: { label: 'Preparatory Streams (Grades 11–12)', classes: [] },
    other: { label: 'Other Sections', classes: [] },
  }

  classes.forEach((cls) => {
    const band = getGradeBandForClass(cls.name)
    if (groups[band]) {
      groups[band].classes.push(cls)
    } else {
      groups.other.classes.push(cls)
    }
  })

  return groups
}
