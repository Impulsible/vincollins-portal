export interface Question {
  id: string
  question_text?: string
  question?: string
  type: "objective" | "theory" | "mcq"
  options?: string[]
  correct_answer?: string
  answer?: string
  points?: number
  marks?: number
  order_number?: number
}

export interface Exam {
  id: string
  title: string
  subject: string
  class?: string
  duration: number
  instructions?: string
  total_questions: number
  total_marks?: number
  passing_percentage?: number
  has_theory?: boolean
  teacher_name?: string
  max_attempts?: number
  term?: string
  session_year?: string
}

export interface StudentProfile {
  id: string
  full_name: string
  email: string
  class?: string
  department?: string
  photo_url?: string | null
  vin_id?: string
  admission_number?: string
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

export interface ExamResult {
  score: number
  total: number
  percentage: number
  correct: number
  incorrect: number
  unanswered: number
  theory_score: number
  theory_total: number
  objective_score?: number
  objective_total?: number
  is_passed: boolean
  passing_percentage: number
  status: string
  attempts_used: number
  max_attempts: number
  graded_by?: string
  graded_at?: string
  submitted_at: string
}

export interface ResumeData {
  attemptId: string
  answers: Record<string, string>
  timeLeft: number
  tabSwitches: number
  fullscreenExits: number
}