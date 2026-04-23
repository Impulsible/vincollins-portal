// src/components/staff/types.ts

export interface StaffProfile {
  id: string
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  role?: string
  avatar_url?: string
  photo_url?: string | null
  department?: string
  position?: string
}

export interface StaffStats {
  totalExams: number
  publishedExams: number
  pendingExams: number
  draftExams: number
  totalStudents?: number
  totalClasses?: number
}

export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  status: string
  total_questions: number
  total_marks: number
  has_theory: boolean
  created_at: string
  instructions: string
  description: string
  shuffle_questions: boolean
  shuffle_options: boolean
  pass_mark: number
  created_by?: string
  teacher_name?: string
  term?: string
  session_year?: string
}

export interface Question {
  id: string
  question_text: string
  question_type: string
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

export interface StudentProfile {
  id: string
  full_name: string
  email: string
  class?: string
  vin_id?: string
  photo_url?: string
}