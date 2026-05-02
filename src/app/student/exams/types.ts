// src/app/student/exams/types.ts - UPDATED
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
}

export interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  photo_url?: string
  subject_count?: number
}

export interface ExamAttempt {
  id: string
  exam_id: string
  status: 'completed' | 'in_progress' | 'abandoned' | 'graded' | 'pending_theory' | 'terminated'
  percentage?: number
  total_score?: number
  total_marks?: number
  objective_score?: number
  theory_feedback?: any
  term?: string
  session_year?: string
  ca_total_score?: number
  ca_percentage?: number
}

export interface TermProgress {
  id: string
  term: string
  session_year: string
  total_subjects: number
  completed_exams: number
  average_score: number
  grade: string
}

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
}

export type ViewMode = 'grid' | 'list'
export type TabType = 'available' | 'upcoming' | 'completed'
export type ExamStatus = 'available' | 'upcoming' | 'completed' | 'expired'

export interface SubjectConfig {
  icon: any
  color: string
  bgColor: string
}

export interface TermOption {
  term: string
  session_year: string
  label: string
}

export interface TermSession {
  term: string
  session_year: string
}