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
  
  // Auto-submit info
  is_auto_submitted?: boolean
  auto_submit_reason?: string | null
  
  // Computed
  total_score?: number  // Alias for score (backward compatibility)
  total_marks?: number  // Alias for total (backward compatibility)
}

// ============================================
// EXAM STATE
// ============================================

export interface ExamState {
  // Navigation
  currentIndex: number
  
  // Answers
  answers: Record<string, string>           // All answers by question ID
  theoryAnswers: Record<string, string>     // Theory answers separately (optional)
  
  // UI State
  flaggedQuestions: Set<string>
  examStarted: boolean
  examEnded: boolean
  showInstructions: boolean
  showQuestionPalette: boolean
  showSubmitDialog: boolean
  showResultDialog: boolean
  showFullscreenPrompt: boolean
  
  // Loading/Submitting
  startingExam: boolean
  isSubmitting: boolean
  isAutoSubmitting?: boolean
  
  // Error state
  error?: string | null
}

// ============================================
// QUESTION
// ============================================

export interface Question {
  id: string
  
  // Content
  question: string
  question_text?: string
  type: 'objective' | 'theory'
  
  // Options (for objective)
  options?: string[]
  correct_answer?: string
  
  // Scoring
  marks: number
  points?: number
  
  // Ordering
  order_number?: number
  is_theory?: boolean
  
  // Theory specific
  sub_questions?: TheorySubQuestion[]
  image_url?: string | null
  image_caption?: string | null
  
  // For resume
  student_answer?: string  // Saved answer from previous attempt
}

// ============================================
// THEORY SUB-QUESTION
// ============================================

export interface TheorySubQuestion {
  id?: string
  text: string
  marks: number
  sub_sub_questions?: TheorySubQuestion[]
  image_url?: string
  image_caption?: string
}

// ============================================
// EXAM
// ============================================

export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  
  // Timing
  duration: number  // in minutes
  
  // Scoring
  total_marks: number
  total_questions: number
  passing_percentage: number
  
  // Theory settings
  has_theory: boolean
  theory_questions_total?: number
  theory_questions_to_answer?: number
  theory_marks_per_question?: number
  
  // Objective settings
  objective_max?: number
  theory_max?: number
  
  // Attempts
  max_attempts?: number
  
  // Metadata
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived'
  description?: string
  instructions?: string
  passage_text?: string
  
  // Timestamps
  created_at: string
  starts_at?: string
  ends_at?: string
  
  // Academic info
  term?: string
  session_year?: string
  
  // Scoping
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
  
  // Status
  status: 'in_progress' | 'completed' | 'pending_theory' | 'graded' | 'terminated'
  attempt_number: number
  
  // Scores
  objective_score: number
  objective_total: number
  theory_score: number
  theory_total: number
  total_score: number
  total_marks: number
  percentage: number
  is_passed: boolean
  
  // Answers
  answers?: Record<string, string>
  theory_answers?: Record<string, string>
  attempt_questions?: any[]  // Stored questions for versioning
  
  // Security
  tab_switches: number
  fullscreen_exits: number
  unload_count: number
  
  // Timestamps
  started_at: string
  submitted_at?: string | null
  completed_at?: string | null
  
  // Academic info
  term: string
  session_year: string
  
  // Grading
  grade?: string
  remark?: string
  graded_by?: string
  graded_at?: string | null
  
  // Auto-submit
  is_auto_submitted?: boolean
  auto_submit_reason?: string | null
  
  // Versioning
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
// THEORY QUESTION DATA
// ============================================

export interface TheoryQuestionData {
  id: string
  question: string
  marks: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string | null
  image_caption?: string | null
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
  }
}