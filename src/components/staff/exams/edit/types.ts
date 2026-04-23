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
  negative_marking: boolean
  negative_marking_value: number
  pass_mark: number
  term?: string
  session_year?: string
  created_at: string
  published_at: string | null
  created_by: string
}

export interface Question {
  id: string
  question_text: string
  type: string
  options: string[]
  correct_answer: string
  points: number
  order_number: number
}

export interface TheoryQuestion {
  id: string
  question_text: string
  points: number
  order_number: number
}

export interface StaffProfile {
  id: string
  full_name: string
  email: string
  department: string
  position: string
  photo_url?: string
}

export interface ExamDetailsForm {
  title: string
  subject: string
  class: string
  duration: number
  instructions: string
  pass_mark: number
  shuffle_questions: boolean
  shuffle_options: boolean
  negative_marking: boolean
  negative_marking_value: number
  term: string
  session_year: string
}