// src/app/student/exam/[id]/types.ts

// ── Exam ───────────────────────────────────────────────────────────────────

export interface Exam {
  id: string
  title?: string
  subject?: string
  duration: number
  max_attempts: number
  passing_percentage: number
  has_theory: boolean
  objective_max?: number
  theory_max?: number
  required_theory_count?: number
  shuffle_questions?: boolean
  randomize_questions?: boolean
  questions: RawQuestion[]
  theory_questions: RawQuestion[]
  term?: string
  session_year?: string
  [key: string]: unknown
}

// ── Profile ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name?: string
  class?: string
  email?: string
  [key: string]: unknown
}

// ── Theory Sub-Question ────────────────────────────────────────────────────

export interface TheorySubQuestion {
  id?: string
  text: string
  marks: number
  [key: string]: unknown
}

// ── Raw Question (shape as stored in DB JSON) ──────────────────────────────

export interface RawQuestion {
  id: string
  question?: string
  question_text?: string
  type?: string | null
  options?: string[]
  correct_answer?: string
  marks?: number
  points?: number
  order?: number
  order_number?: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string | null
  image_caption?: string | null
  [key: string]: unknown
}

// ── Question (canonical normalized shape — used EVERYWHERE) ────────────────

export interface Question {
  id: string
  question: string
  question_text: string
  type: "objective" | "theory" | "mcq" | string
  options: string[]
  correct_answer: string
  marks: number
  points: number
  order_number: number
  is_theory: boolean
  sub_questions?: TheorySubQuestion[]
  image_url?: string | null
  image_caption?: string | null
}

// Alias kept for backward compatibility with normalizer return type
export type NormalizedQuestion = Question

// ── Attempt ────────────────────────────────────────────────────────────────

export type AttemptStatus =
  | "in_progress"
  | "completed"
  | "pending_theory"
  | "graded"
  | "terminated"
  | "submitted"

export interface ExamAttempt {
  id: string
  exam_id: string
  student_id: string
  status: AttemptStatus
  started_at: string | null
  created_at: string
  submitted_at: string | null
  answers: Record<string, string>
  theory_answers?: Record<string, string>
  tab_switches: number
  fullscreen_exits: number
  unload_count: number
  attempt_number: number
  objective_score: number
  objective_total: number
  theory_score: number
  theory_total: number
  total_score: number
  total_marks: number
  percentage: number
  is_passed: boolean
  correct_count: number
  incorrect_count: number
  unanswered_count: number
  is_auto_submitted: boolean
  auto_submit_reason: string | null
  graded_by?: string | null
  graded_at?: string | null
  current_index?: number
  flagged_questions?: string[]
  [key: string]: unknown
}

// ── Resume ─────────────────────────────────────────────────────────────────

export interface ResumeData {
  attemptId: string
  answers: Record<string, string>
  started_at: string
  duration: number
  tabSwitches: number
  fullscreenExits: number
  unloadCount: number
  currentIndex: number
  flaggedQuestions: string[]
}

// ── Result ─────────────────────────────────────────────────────────────────

export interface ExamResult {
  [x: string]: unknown
  score: number
  total: number
  percentage: number
  correct: number
  incorrect: number
  unanswered: number
  is_passed: boolean
  passing_percentage: number
  status: string
  objective_score: number
  objective_total: number
  theory_score: number
  theory_total: number
  attempts_used: number
  max_attempts: number
  submitted_at: string | null
  graded_by?: string | null
  graded_at?: string | null
  // Enriched by submission service
  ca_score?: number
  ca1_score?: number
  ca2_score?: number
  grade?: string
  total_score?: number
  total_marks?: number
}

// ── Start Attempt ──────────────────────────────────────────────────────────

export interface StartAttemptResult {
  attemptId: string
  isResuming: boolean
  attemptNumber: number
  started_at: string
}

// ── Hook Return Types ──────────────────────────────────────────────────────

export interface UseExamLoaderReturn {
  loading: boolean
  loadError: string | null
  exam: Exam | null
  profile: Profile | null
  allQuestions: Question[]
  hasCompletedAttempt: boolean
  examResult: ExamResult | null
  setExamResult: React.Dispatch<React.SetStateAction<ExamResult | null>>
  attemptId: string | null
  setAttemptId: React.Dispatch<React.SetStateAction<string | null>>
  attemptsUsed: number
  resumeData: ResumeData | null
  showResumeDialog: boolean
  setShowResumeDialog: React.Dispatch<React.SetStateAction<boolean>>
  examTerminated: boolean
  handleResumeExam: () => Promise<ResumeData | null>
  startNewAttempt: () => Promise<StartAttemptResult | null>
}