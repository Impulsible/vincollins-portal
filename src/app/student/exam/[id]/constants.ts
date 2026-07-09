// src/app/student/exam/constants.ts

// ============================================
// ✅ ACADEMIC TERM
// ============================================
export const CURRENT_TERM = "third" as const
export const CURRENT_SESSION = "2025/2026" as const

export type Term = 'first' | 'second' | 'third'
export const TERMS: Term[] = ['first', 'second', 'third']

export const TERM_NAMES: Record<Term, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
} as const

// ============================================
// ✅ SECURITY LIMITS
// ============================================
export const TAB_SWITCH_LIMIT = 3
export const FULLSCREEN_EXIT_LIMIT = 3

// ============================================
// ✅ TIMING
// ============================================
export const AUTO_SAVE_INTERVAL = 30000 // 30 seconds
export const TIME_WARNING_THRESHOLD = 300 // 5 minutes
export const TIME_SYNC_INTERVAL = 60000 // 60 seconds

// ============================================
// ✅ EXAM STATUS
// ============================================
export const EXAM_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PENDING_THEORY: 'pending_theory',
  GRADED: 'graded',
  TERMINATED: 'terminated',
} as const

export type ExamStatus = typeof EXAM_STATUS[keyof typeof EXAM_STATUS]

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  in_progress: 'In Progress',
  completed: 'Completed',
  pending_theory: 'Pending Theory Grading',
  graded: 'Graded',
  terminated: 'Terminated',
} as const

// ============================================
// ✅ QUESTION TYPES
// ============================================
export const QUESTION_TYPES = {
  OBJECTIVE: 'objective',
  THEORY: 'theory',
} as const

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES]

// ============================================
// ✅ GRADES
// ============================================
export const GRADES = {
  A: 'A',
  B: 'B',
  C: 'C',
  P: 'P',
  F: 'F',
} as const

export type Grade = typeof GRADES[keyof typeof GRADES]

export const WAEC_GRADES = {
  A1: 'A1',
  B2: 'B2',
  B3: 'B3',
  C4: 'C4',
  C5: 'C5',
  C6: 'C6',
  D7: 'D7',
  E8: 'E8',
  F9: 'F9',
} as const

export type WAECGrade = typeof WAEC_GRADES[keyof typeof WAEC_GRADES]

// ============================================
// ✅ GRADE THRESHOLDS
// ============================================
export const GRADE_THRESHOLDS = {
  A: 80,
  B: 70,
  C: 60,
  P: 50,
  F: 0,
} as const

export const WAEC_GRADE_THRESHOLDS = {
  A1: 75,
  B2: 70,
  B3: 65,
  C4: 60,
  C5: 55,
  C6: 50,
  D7: 45,
  E8: 40,
  F9: 0,
} as const

// ============================================
// ✅ GRADE REMARKS
// ============================================
export const GRADE_REMARKS: Record<string, string> = {
  A: 'Excellent',
  B: 'Very Good',
  C: 'Good',
  P: 'Pass',
  F: 'Fail',
  A1: 'Excellent',
  B2: 'Very Good',
  B3: 'Good',
  C4: 'Credit',
  C5: 'Credit',
  C6: 'Credit',
  D7: 'Pass',
  E8: 'Pass',
  F9: 'Fail',
} as const

// ============================================
// ✅ GRADE COLORS
// ============================================
export const GRADE_COLORS = {
  A: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  B: 'text-blue-600 bg-blue-50 border-blue-200',
  C: 'text-amber-600 bg-amber-50 border-amber-200',
  P: 'text-purple-600 bg-purple-50 border-purple-200',
  F: 'text-red-600 bg-red-50 border-red-200',
} as const

export const WAEC_GRADE_COLORS = {
  A1: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  B2: 'bg-blue-100 text-blue-700 border-blue-300',
  B3: 'bg-blue-50 text-blue-600 border-blue-200',
  C4: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  C5: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  C6: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  D7: 'bg-amber-100 text-amber-700 border-amber-300',
  E8: 'bg-amber-50 text-amber-600 border-amber-200',
  F9: 'bg-red-100 text-red-700 border-red-300',
} as const

// ============================================
// ✅ DEFAULT VALUES
// ============================================
export const DEFAULT_PASSING_PERCENTAGE = 50
export const DEFAULT_MAX_ATTEMPTS = 1
export const DEFAULT_EXAM_DURATION = 30 // minutes
export const DEFAULT_OBJECTIVE_MARKS = 0.5
export const DEFAULT_THEORY_MARKS = 10

// ============================================
// ✅ HELPER FUNCTIONS
// ============================================

/**
 * Get the display name for a term
 */
export function getTermName(term: string): string {
  return TERM_NAMES[term as Term] || term
}

/**
 * Get exam status label
 */
export function getExamStatusLabel(status: string): string {
  return EXAM_STATUS_LABELS[status as ExamStatus] || status
}

/**
 * Check if a grade is a passing grade
 */
export function isPassingGrade(grade: string): boolean {
  const passingGrades = ['A', 'B', 'C', 'P', 'A1', 'B2', 'B3', 'C4', 'C5', 'C6']
  return passingGrades.includes(grade)
}

/**
 * Check if a WAEC grade is a passing grade
 */
export function isPassingWAECGrade(grade: string): boolean {
  const passingGrades = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6']
  return passingGrades.includes(grade)
}