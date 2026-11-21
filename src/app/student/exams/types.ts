// src/app/student/exams/types.ts - COMPLETE FIXED VERSION (NO HARDCODED VALUES)

// ============================================
// ✅ EXAM
// ============================================
export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  status: string
  description?: string
  passing_percentage?: number
  created_at: string
  starts_at?: string
  ends_at?: string
  has_theory?: boolean
  proctoring_enabled?: boolean
  term?: string
  session_year?: string
  max_attempts?: number
  // Additional fields
  objective_max?: number
  theory_max?: number
  is_locked?: boolean
  version?: number
  shuffle_questions?: boolean
  /** ✅ ADDED — read by useExamLoader.processExamQuestions() */
  shuffle_options?: boolean
  randomize_questions?: boolean
  required_theory_count?: number
}

// ============================================
// ✅ STUDENT PROFILE
// ✅ useExamLoader imports this as `Profile`
// ============================================
export interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  photo_url?: string
  subject_count?: number
  // Additional fields
  display_name?: string
  first_name?: string
  last_name?: string
  vin_id?: string
  admission_number?: string
  role?: string
  gender?: string
}

/** ✅ ADDED — alias so `import type { Profile } from "../types"` resolves */
export type Profile = StudentProfile

// ============================================
// ✅ QUESTION
// ✅ useExamLoader imports this as `Question`
//    and the normalizer/scoring utils operate on it
// ============================================
export interface Question {
  id: string
  type: string
  question: string
  /** may arrive as array, JSON string, or object[]; the parser tolerates all */
  options?: string[] | string
  correct_answer: string
  marks: number
  /** injected by processExamQuestions() for display ordering */
  display_number?: number
  /** optional diagram / figure attached to the question */
  image_url?: string
  /** optional caption rendered beneath the image */
  image_caption?: string
  /** optional explanation shown after grading */
  explanation?: string
}

// ============================================
// ✅ EXAM ATTEMPT
// ============================================
export interface ExamAttempt {
  id: string
  exam_id: string
  status: 'completed' | 'in_progress' | 'abandoned' | 'graded' | 'pending_theory' | 'terminated'
  percentage?: number
  total_score?: number
  total_marks?: number
  objective_score?: number
  objective_total?: number
  theory_score?: number
  theory_total?: number
  theory_feedback?: any
  term?: string
  session_year?: string
  ca_total_score?: number
  ca_percentage?: number
  ca1_score?: number
  ca2_score?: number
  // Additional fields
  attempted_at?: string
  started_at?: string
  submitted_at?: string | null
  completed_at?: string | null
  attempt_number?: number
  is_auto_submitted?: boolean
  auto_submit_reason?: string | null
  unload_count?: number
  tab_switches?: number
  fullscreen_exits?: number
  grade?: string
  remark?: string
  graded_by?: string
  graded_at?: string | null
  // ✅ ADDED — runtime attempt state used by useExamLoader
  answers?: Record<string, string>
  current_index?: number
  flagged_questions?: string[]
}

// ============================================
// ✅ TERM PROGRESS
// ============================================
export interface TermProgress {
  id: string
  term: string
  session_year: string
  total_subjects: number
  completed_exams: number
  average_score: number
  grade: string
  pending_theory_count?: number
  updated_at?: string
  created_at?: string
}

// ============================================
// ✅ SUBJECT STAT
// ============================================
export interface SubjectStat {
  subject: string
  score: number
  grade: string
  status: 'completed' | 'pending' | 'not_started'
}

// ============================================
// ✅ STATS STATE
// ============================================
export interface StatsState {
  available: number
  completed: number
  upcoming: number
  averageScore: number
  currentGrade: string
  gradeColor: string
  totalSubjects: number
  termName: string
  sessionYear: string
  pendingTheoryCount?: number
  subjectStats?: SubjectStat[]
}

// ============================================
// ✅ VIEW MODES
// ============================================
export type ViewMode = 'grid' | 'list'
export type TabType = 'available' | 'upcoming' | 'completed' | 'expired'

// ✅ FIXED: Single ExamStatus definition with all possible statuses
export type ExamStatus = 'available' | 'upcoming' | 'completed' | 'expired' | 'in_progress' | 'graded' | 'pending_theory'

// ============================================
// ✅ SUBJECT CONFIG
// ============================================
export interface SubjectConfig {
  icon: any
  color: string
  bgColor: string
  label?: string
}

// ============================================
// ✅ TERM OPTIONS
// ============================================
export interface TermOption {
  term: string
  session_year: string
  label: string
  is_current?: boolean
}

export interface TermSession {
  term: string
  session_year: string
}

// ============================================
// ✅ GRADE TYPES
// ============================================
export type Grade = 'A' | 'B' | 'C' | 'P' | 'F'
export type WAECGrade = 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9'

// ============================================
// ✅ QUESTION TYPES
// ============================================
export type QuestionType = 'objective' | 'theory'
export type QuestionStatus = 'answered' | 'flagged' | 'current' | 'not-answered'

// ============================================
// ✅ EXAM RESULT
// ============================================
export interface ExamResult {
  // Core scores
  score: number
  total: number
  percentage: number
  
  // Breakdown
  objective_score: number
  objective_total: number
  theory_score: number
  theory_total: number
  
  // Statistics
  correct: number
  incorrect: number
  unanswered: number
  
  // CA scores
  ca_score: number
  ca1_score: number
  ca2_score: number
  
  // Status
  is_passed: boolean
  passing_percentage: number
  status: 'in_progress' | 'completed' | 'pending_theory' | 'graded' | 'terminated'
  grade: Grade | null
  remark?: string
  
  // Attempt info
  attempts_used: number
  max_attempts: number
  
  // Timestamps
  submitted_at: string | null
  graded_at?: string | null
  graded_by?: string | null
  
  // Time tracking
  time_spent?: number
  duration?: number
  started_at?: string | null
  ended_at?: string | null
  
  // Auto-submit info
  is_auto_submitted?: boolean
  auto_submit_reason?: string | null
  
  // Backward compatibility aliases
  total_score?: number
  total_marks?: number
}

// ============================================
// ✅ EXAM STATE
// ============================================
export interface ExamState {
  currentIndex: number
  answers: Record<string, string>
  theoryAnswers: Record<string, string>
  flaggedQuestions: Set<string>
  examStarted: boolean
  examEnded: boolean
  showInstructions: boolean
  showQuestionPalette: boolean
  showSubmitDialog: boolean
  showResultDialog: boolean
  showFullscreenPrompt: boolean
  startingExam: boolean
  isSubmitting: boolean
  isAutoSubmitting?: boolean
  error?: string | null
}

// ============================================
// ✅ RESUME DATA
// ============================================
export interface ResumeData {
  attemptId: string
  answers: Record<string, string>
  timeLeft: number
  tabSwitches: number
  fullscreenExits: number
  unloadCount: number
  attemptNumber?: number
  /** ✅ ADDED — written by useExamLoader resume flow */
  started_at?: string
  duration?: number
  currentIndex?: number
  flaggedQuestions?: string[]
}

// ============================================
// ✅ START ATTEMPT RESULT
// ✅ returned by useExamLoader.startNewAttempt()
// ============================================
export interface StartAttemptResult {
  attemptId: string
  isResuming: boolean
  attemptNumber?: number
  started_at?: string
}

// ============================================
// ✅ USE EXAM LOADER RETURN
// ✅ public API shape of the useExamLoader hook
// ============================================
export interface UseExamLoaderReturn {
  loading: boolean
  loadError: string | null
  exam: Exam | null
  profile: Profile | null
  allQuestions: Question[]
  hasCompletedAttempt: boolean
  examResult: ExamResult | null
  setExamResult: (r: ExamResult | null) => void
  attemptId: string | null
  setAttemptId: (id: string | null) => void
  attemptsUsed: number
  resumeData: ResumeData | null
  showResumeDialog: boolean
  setShowResumeDialog: (v: boolean) => void
  examTerminated: boolean
  handleResumeExam: () => Promise<ResumeData | null>
  startNewAttempt: () => Promise<StartAttemptResult | null>
}

// ============================================
// ✅ SECURITY STATE
// ============================================
export interface SecurityState {
  tabSwitches: number
  fullscreenExits: number
  networkWarnings: number
  displayOffCount: number
  reloadCount: number
  lastReloadTime: number
  timestamp: number
  isSystemSleeping: boolean
}

// ============================================
// ✅ HELPER FUNCTIONS - Create Default States (NO HARDCODED VALUES)
// ============================================
export function createDefaultExamState(): ExamState {
  return {
    currentIndex: 0,
    answers: {},
    theoryAnswers: {},
    flaggedQuestions: new Set(),
    examStarted: false,
    examEnded: false,
    showInstructions: true,
    showQuestionPalette: false,
    showSubmitDialog: false,
    showResultDialog: false,
    showFullscreenPrompt: false,
    startingExam: false,
    isSubmitting: false,
    isAutoSubmitting: false,
    error: null,
  }
}

export function createDefaultExamResult(): ExamResult {
  return {
    score: 0,
    total: 0,
    percentage: 0,
    objective_score: 0,
    objective_total: 0,
    theory_score: 0,
    theory_total: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    ca_score: 0,
    ca1_score: 0,
    ca2_score: 0,
    is_passed: false,
    passing_percentage: 50,
    status: 'in_progress',
    grade: null,
    submitted_at: null,
    attempts_used: 0,
    max_attempts: 1,
    is_auto_submitted: false,
    auto_submit_reason: null,
    time_spent: 0,
    duration: 0,
    started_at: null,
    ended_at: null,
  }
}

export function createDefaultStats(): StatsState {
  return {
    available: 0,
    completed: 0,
    upcoming: 0,
    averageScore: 0,
    currentGrade: 'N/A',
    gradeColor: 'text-gray-400',
    totalSubjects: 0,
    termName: '',
    sessionYear: '',
    pendingTheoryCount: 0,
    subjectStats: [],
  }
}

// ============================================
// ✅ TYPE GUARDS
// ============================================
export function isExamAttempt(attempt: any): attempt is ExamAttempt {
  return attempt && typeof attempt === 'object' && 'exam_id' in attempt && 'status' in attempt
}

export function isTermProgress(progress: any): progress is TermProgress {
  return progress && typeof progress === 'object' && 'term' in progress && 'session_year' in progress
}

export function isExamResult(result: any): result is ExamResult {
  return result && typeof result === 'object' && 'score' in result && 'total' in result && 'percentage' in result
}