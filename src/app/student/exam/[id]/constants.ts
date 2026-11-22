// src/app/student/exam/constants.ts

// ============================================
// ACADEMIC TERM & SESSION
// ============================================

export type Term = 'first' | 'second' | 'third'
export const TERMS: Term[] = ['first', 'second', 'third']

export const TERM_NAMES: Record<Term, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
} as const

// ============================================
// SECURITY LIMITS
// ============================================

export const TAB_SWITCH_LIMIT = 3
export const FULLSCREEN_EXIT_LIMIT = 3

// ============================================
// TIMING
// ============================================

export const AUTO_SAVE_INTERVAL = 30000
export const TIME_WARNING_THRESHOLD = 300
export const TIME_SYNC_INTERVAL = 60000

// ============================================
// EXAM STATUS
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
// QUESTION TYPES
// ============================================

export const QUESTION_TYPES = {
  OBJECTIVE: 'objective',
  THEORY: 'theory',
} as const

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES]

// ============================================
// GRADES
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
// GRADE THRESHOLDS
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
// GRADE REMARKS
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
// GRADE COLORS
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
// DEFAULT VALUES
// ============================================

export const DEFAULT_PASSING_PERCENTAGE = 50
export const DEFAULT_MAX_ATTEMPTS = 1
export const DEFAULT_EXAM_DURATION = 30
export const DEFAULT_OBJECTIVE_MARKS = 0.5
export const DEFAULT_THEORY_MARKS = 10

// ============================================
// EXAM CONFIG (aggregate for runtime use)
// ============================================

export const EXAM_CONFIG = {
  EXAM_PORTION_MAX: 60,
  CA_PORTION_MAX: 40,
  DEFAULT_DURATION_MINUTES: DEFAULT_EXAM_DURATION,
  DEFAULT_PASSING_PERCENTAGE,
  DEFAULT_MAX_ATTEMPTS,
  TIMER_INTERVAL_MS: 1000,
  FULLSCREEN_RESTORE_DELAY_MS: 200,
  FULLSCREEN_PROMPT_DISMISS_MS: 300,
  AUTO_SUBMIT_TOAST_DURATION_MS: 6000,
  AUTO_SAVE_INTERVAL_MS: AUTO_SAVE_INTERVAL,
  TIME_SYNC_INTERVAL_MS: TIME_SYNC_INTERVAL,
  TIME_WARNING_THRESHOLD_S: TIME_WARNING_THRESHOLD,
} as const

// ============================================
// TERMINAL STATUSES
// ============================================

export const TERMINAL_STATUSES = [
  EXAM_STATUS.COMPLETED,
  EXAM_STATUS.GRADED,
  EXAM_STATUS.PENDING_THEORY,
  EXAM_STATUS.TERMINATED,
  "submitted",
] as const

export type TerminalStatus = (typeof TERMINAL_STATUSES)[number]

// ============================================
// SHUFFLE EXCLUSION RULES
// ============================================

/**
 * Normalizes text by stripping diacritical marks/accents:
 * "Français" -> "Francais"
 * "Yorùbá"   -> "Yoruba"
 * "Èdè"      -> "Ede"
 * "Ásụ̀sụ̀"   -> "Asusu"
 */
export function stripDiacritics(str: string): string {
  if (!str) return ''
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * TIER 1: STRICT SUBJECT EXCLUSION LIST
 * Subjects containing reading passages, comprehension blocks, oral tests,
 * or narrative sequences where question and option order must remain
 * 100% IDENTICAL across all students.
 */
export const SHUFFLE_EXCLUDED_SUBJECTS: string[] = [
  // English & Literature
  'english',
  'english language',
  'english studies',
  'use of english',
  'general english',
  'literature',
  'literature in english',
  'literature-in-english',
  'oral english',

  // French (Français) & Foreign Languages
  'french',
  'francais',
  'french language',
  'langue francaise',
  'french studies',
  'etudes francaises',

  // Nigerian Languages (Yoruba, Igbo, Hausa)
  'yoruba',
  'ede yoruba',
  'ede',
  'yoruba language',
  'yoruba studies',
  'igbo',
  'asusu igbo',
  'igbo language',
  'igbo studies',
  'hausa',
  'harshen hausa',
  'hausa language',
  'hausa studies',

  // Other Languages
  'arabic',
  'arabic language',
  'arabic studies',
  'german',
  'german language',

  // Aptitude & Reasoning
  'verbal reasoning',
  'verbal aptitude',

  // Context & Comprehension
  'reading comprehension',
  'comprehension',
]

/**
 * TIER 2: RELATIVE OPTION PHRASES (English & French)
 * If an individual question (in any subject) contains relative positional phrases,
 * its options (A, B, C, D) are locked in order.
 */
export const RELATIVE_OPTION_PHRASES: string[] = [
  // English Relative Phrases
  'all of the above',
  'none of the above',
  'both a and b',
  'both b and c',
  'both a and c',
  'a and b only',
  'b and c only',
  'neither a nor b',
  'all the options',
  'none of these',
  'a and c only',
  'all of these',
  'all the above',
  'none of the options',

  // French Relative Phrases (Normalised without accents)
  'toutes les reponses ci-dessus',
  'toutes les reponses ci dessus',
  'toutes les propositions ci-dessus',
  'toutes les options ci-dessus',
  'tous les elements ci-dessus',
  'aucune des reponses ci-dessus',
  'aucune des reponses',
  'aucune de ces reponses',
  'aucune des options',
  'aucun des elements ci-dessus',
  'les deux a et b',
  'a et b seulement',
  'b et c seulement',
  'a et c seulement',
  'ni a ni b',
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTermName(term: string): string {
  return TERM_NAMES[term as Term] || term
}

export function getExamStatusLabel(status: string): string {
  return EXAM_STATUS_LABELS[status as ExamStatus] || status
}

export function isPassingGrade(grade: string): boolean {
  const passingGrades = ['A', 'B', 'C', 'P', 'A1', 'B2', 'B3', 'C4', 'C5', 'C6']
  return passingGrades.includes(grade)
}

export function isPassingWAECGrade(grade: string): boolean {
  const passingGrades = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6']
  return passingGrades.includes(grade)
}

/**
 * Checks if a subject is in the excluded list (Languages, Verbal Reasoning, Comprehension).
 * Automatically normalizes diacritics/accents like "Français", "Yorùbá", "Èdè", "Ásụ̀sụ̀ Ị̀gbò".
 */
export function isSubjectExcludedFromShuffle(subjectName?: string | null, examTitle?: string | null | undefined): boolean {
  if (!subjectName) return false

  // 1. Strip all accents (Français -> Francais, Yorùbá -> Yoruba)
  const stripped = stripDiacritics(subjectName)

  // 2. Clean punctuation and whitespace
  const normalized = stripped
    .trim()
    .toLowerCase()
    .replace(/[._\-\/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')

  if (!normalized) return false

  // 3. Match against the excluded subjects list
  return SHUFFLE_EXCLUDED_SUBJECTS.some((excluded) => {
    const cleanExcluded = stripDiacritics(excluded).toLowerCase().trim()
    return (
      normalized === cleanExcluded ||
      normalized.startsWith(`${cleanExcluded} `) ||
      normalized.endsWith(` ${cleanExcluded}`) ||
      normalized.includes(` ${cleanExcluded} `) ||
      normalized.includes(cleanExcluded)
    )
  })
}

/**
 * Checks if options contain directional/relative phrases in English or French.
 */
export function hasRelativeOptions(options?: string[] | null): boolean {
  if (!Array.isArray(options) || options.length === 0) return false
  return options.some((opt) => {
    const text = stripDiacritics(String(opt || ''))
      .trim()
      .toLowerCase()
      .replace(/[._\-\/]/g, ' ')
      .replace(/\s+/g, ' ')
      
    return RELATIVE_OPTION_PHRASES.some((phrase) => text.includes(phrase))
  })
}

/**
 * Evaluates whether questions can be shuffled for a given subject.
 */
export function shouldShuffleQuestions(
  subjectName?: string | null,
  examSettingShuffleQuestions: boolean = true
): boolean {
  if (isSubjectExcludedFromShuffle(subjectName)) {
    return false // Languages & Reasoning subjects are strictly locked
  }
  return examSettingShuffleQuestions
}

/**
 * Evaluates whether options can be shuffled for a specific question.
 */
export function shouldShuffleOptions(
  subjectName?: string | null,
  options: string[] = [],
  examSettingShuffleOptions: boolean = true
): boolean {
  // 1. Subject-level lock (Languages / Reasoning)
  if (isSubjectExcludedFromShuffle(subjectName)) {
    return false
  }

  // 2. Relative phrase lock ("All of the above", "Toutes les réponses ci-dessus")
  if (hasRelativeOptions(options)) {
    return false
  }

  // 3. Exam setting toggle
  return examSettingShuffleOptions
}

/**
 * Dynamically resolves exam duration from all possible database alias columns
 * without defaulting to rigid numbers.
 */
export function resolveExamDuration(exam: any): number {
  if (!exam) return DEFAULT_EXAM_DURATION
  const candidate =
    exam.duration_minutes ??
    exam.duration ??
    exam.time_limit_minutes ??
    DEFAULT_EXAM_DURATION
  const parsed = Number(candidate)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_EXAM_DURATION
}