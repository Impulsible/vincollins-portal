// app/student/exam/[id]/types.ts

export interface ExamResult {
  [x: string]: any
  score: number
  total: number
  percentage: number
  correct: number
  incorrect: number
  unanswered: number
  is_passed: boolean
  passing_percentage: number
  status: string
  theory_score: number
  theory_total: number
  attempts_used: number
  max_attempts: number
  submitted_at: string
  total_score?: number
  total_marks?: number
  objective_score?: number
  objective_total?: number
  grade?: string
  remark?: string
  graded_by?: string
  graded_at?: string
  is_auto_submitted?: boolean
  auto_submit_reason?: string
  ca_score?: number
  ca1_score?: number
  ca2_score?: number
}

export interface ExamState {
  currentIndex: number
  answers: Record<string, string>
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
}

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
  image_url?: string
  image_caption?: string
}

export interface TheorySubQuestion {
  text: string
  marks: number
  sub_sub_questions?: TheorySubQuestion[]
}

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
  status: string
  description?: string
  instructions?: string
  created_at: string
  starts_at?: string
  ends_at?: string
  objective_max?: number
  theory_max?: number
  theory_questions_total?: number
  theory_questions_to_answer?: number
  theory_marks_per_question?: number
  scoring_rule?: string
  max_attempts?: number
  term?: string
  session_year?: string
  passage_text?: string
}

export interface ExamAttempt {
  id: string
  exam_id: string
  student_id: string
  status: 'in_progress' | 'completed' | 'pending_theory' | 'graded' | 'terminated'
  objective_score: number
  objective_total: number
  theory_score: number
  theory_total: number
  total_score: number
  total_marks: number
  percentage: number
  is_passed: boolean
  started_at: string
  submitted_at?: string
  completed_at?: string
  answers?: Record<string, string>
  theory_answers?: Record<string, string>
  tab_switches: number
  fullscreen_exits: number
  unload_count: number
  attempt_number: number
  term: string
  session_year: string
  grade?: string
  remark?: string
  graded_by?: string
  graded_at?: string
}

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
}

export interface TheoryQuestionData {
  id: string
  question: string
  marks: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string
  image_caption?: string
}