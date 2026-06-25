// src/components/staff/exams/edit/types.ts

export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  instructions: string
  status: string
  total_questions: number
  total_marks: number
  has_theory: boolean
  shuffle_questions: boolean
  shuffle_options: boolean
  pass_mark: number
  term?: string
  session_year?: string
  target_audience?: string
  description?: string
  starts_at?: string
  ends_at?: string
  created_at: string
  published_at: string | null
  created_by: string
  updated_at?: string
}

export interface Question {
  id: string
  exam_id?: string
  question_text: string
  type: 'objective' | 'theory'
  options: string[]
  correct_answer: string
  points: number
  order_number: number
  is_draft?: boolean
  created_at?: string
  updated_at?: string
}

export interface TheoryQuestion {
  id: string
  exam_id?: string
  question_text: string
  type: 'theory'
  points: number
  order_number: number
  is_draft?: boolean
  created_at?: string
  updated_at?: string
  sub_questions?: TheorySubQuestion[]
  keywords?: string[]
  model_answer?: string
}

export interface TheorySubQuestion {
  id: string
  text: string
  points: number
  keywords?: string[]
  model_answer?: string
  sub_sub_questions?: TheorySubQuestion[]
}

export interface StaffProfile {
  id: string
  full_name: string
  email: string
  department: string
  position: string
  photo_url?: string
}

// ✅ FIXED: Added shuffle_questions and shuffle_options
export interface ExamDetailsForm {
  title: string
  subject: string
  class: string
  duration: number
  instructions: string
  pass_mark: number
  shuffle_questions: boolean    // ✅ Added
  shuffle_options: boolean      // ✅ Added
  term: string
  session_year: string
  target_audience: string
  // Optional fields that might be used
  randomize_questions?: boolean
  randomize_options?: boolean
  negative_marking?: boolean
  negative_marking_value?: number
  show_correct_answers?: boolean
  allow_review?: boolean
  [key: string]: any            // Allow any additional properties
}

export interface ExamAttempt {
  id: string
  exam_id: string
  student_id: string
  status: 'in_progress' | 'completed' | 'graded' | 'pending_theory'
  started_at?: string
  submitted_at?: string
  completed_at?: string
  score?: number
  percentage?: number
  total_score?: number
  total_marks?: number
  objective_score?: number
  theory_feedback?: any
  ca_total_score?: number
  ca_percentage?: number
}

export interface Subject {
  id: string
  name: string
  code?: string
}

export interface Class {
  id: string
  name: string
  department?: string
}