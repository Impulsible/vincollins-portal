// ============================================
// STAFF DASHBOARD CONSTANTS
// ============================================

export const CURRENT_TERM = 'third'
export const CURRENT_SESSION = '2025/2026'

export const TERM_NAMES: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term'
}

export const MOBILE_NAV_ITEMS = [
  { id: 'overview' as const, icon: 'Home', label: 'Home' },
  { id: 'exams' as const, icon: 'MonitorPlay', label: 'Exams' },
  { id: 'assignments' as const, icon: 'FileText', label: 'Assign' },
  { id: 'notes' as const, icon: 'BookOpen', label: 'Notes' },
  { id: 'students' as const, icon: 'Users', label: 'Students' }
] as const

export const QUICK_ACTIONS = [
  {
    id: 'exam',
    title: 'Create Exam',
    description: 'CBT or Theory',
    icon: 'MonitorPlay',
    color: 'blue',
    action: 'createExam'
  },
  {
    id: 'assignment',
    title: 'Assignment',
    description: 'Upload work',
    icon: 'FileText',
    color: 'emerald',
    action: 'uploadAssignment'
  },
  {
    id: 'note',
    title: 'Study Note',
    description: 'Upload material',
    icon: 'BookOpen',
    color: 'purple',
    action: 'uploadNote'
  },
  {
    id: 'students',
    title: 'Students',
    description: 'View roster',
    icon: 'Users',
    color: 'amber',
    action: 'viewStudents'
  }
] as const