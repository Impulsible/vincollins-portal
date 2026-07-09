// app/student/exam/[id]/types.ts

// ============================================
// EXAM RESULT
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
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | 'P' | null
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
// EXAM STATE
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
// QUESTION
// ============================================

export interface Question {
  id: string
  question: string
  question_text?: string
  type: 'objective' | 'theory'
  options?: string[]
  correct_answer?: string
  marks: number
  points?: number
  order_number?: number
  is_theory?: boolean
  sub_questions?: TheorySubQuestion[]
  image_url?: string | null
  image_caption?: string | null
  student_answer?: string
}

// ============================================
// THEORY SUB-QUESTION
// ============================================

export interface TheorySubQuestion {
  id?: string
  text: string
  marks: number
  sub_sub_questions?: TheorySubQuestion[]
  image_url?: string | null
  image_caption?: string | null
}

// ============================================
// THEORY QUESTION DATA - ✅ FIXED
// ============================================

export interface TheoryQuestionData {
  id: string
  question: string
  question_text?: string
  marks: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string | null
  image_caption?: string | null
}

// ============================================
// THEORY QUESTION - ✅ ADDED FOR RENDERER
// ============================================

export interface TheoryQuestion {
  id: string
  question: string
  question_text: string
  marks: number
  sub_questions: TheorySubQuestion[]
  image_url?: string | null
  image_caption?: string | null
}

// ============================================
// EXAM
// ============================================

export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_marks: number
  total_questions: number
  passing_percentage: number
  has_theory: boolean
  theory_questions_total?: number
  theory_questions_to_answer?: number
  theory_marks_per_question?: number
  objective_max?: number
  theory_max?: number
  max_attempts?: number
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived'
  description?: string
  instructions?: string
  passage_text?: string
  created_at: string
  starts_at?: string
  ends_at?: string
  term?: string
  session_year?: string
  scoring_rule?: 'standard' | 'custom'
  is_locked?: boolean
  version?: number
}

// ============================================
// EXAM ATTEMPT
// ============================================

export interface ExamAttempt {
  id: string
  exam_id: string
  student_id: string
  status: 'in_progress' | 'completed' | 'pending_theory' | 'graded' | 'terminated'
  attempt_number: number
  objective_score: number
  objective_total: number
  theory_score: number
  theory_total: number
  total_score: number
  total_marks: number
  percentage: number
  is_passed: boolean
  answers?: Record<string, string>
  theory_answers?: Record<string, string>
  attempt_questions?: any[]
  tab_switches: number
  fullscreen_exits: number
  unload_count: number
  started_at: string
  submitted_at?: string | null
  completed_at?: string | null
  term: string
  session_year: string
  grade?: string
  remark?: string
  graded_by?: string
  graded_at?: string | null
  is_auto_submitted?: boolean
  auto_submit_reason?: string | null
  question_version?: number
}

// ============================================
// STUDENT PROFILE
// ============================================

export interface StudentProfile {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  email: string
  class: string
  department: string
  photo_url?: string
  vin_id?: string
  admission_number?: string
  subject_count?: number
  role?: string
  gender?: string
  display_name?: string
}

// ============================================
// RESUME DATA
// ============================================

export interface ResumeData {
  attemptId: string
  answers: Record<string, string>
  timeLeft: number
  tabSwitches: number
  fullscreenExits: number
  unloadCount: number
  attemptNumber?: number
}

// ============================================
// SECURITY STATE
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
// UTILITY TYPES
// ============================================

export type QuestionStatus = 'answered' | 'flagged' | 'current' | 'not-answered'
export type ExamStatus = 'in_progress' | 'completed' | 'pending_theory' | 'graded' | 'terminated'
export type QuestionType = 'objective' | 'theory'

// ============================================
// TYPE GUARDS
// ============================================

export function isTheoryQuestionData(data: any): data is TheoryQuestionData {
  return data && typeof data === 'object' && 'id' in data && 'question' in data
}

// ============================================
// HELPERS - Create default states
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