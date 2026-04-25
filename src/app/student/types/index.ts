// src/app/student/types/index.ts

// Student Profile Interface
export interface StudentProfile {
  id: string
  full_name: string
  first_name?: string | null
  last_name?: string | null
  middle_name?: string | null
  display_name?: string | null
  email?: string
  class: string
  department?: string | null
  photo_url?: string | null
  vin_id?: string | null
  admission_year?: number | null
  subject_count?: number | null
  role: string
  phone?: string | null
  address?: string | null
  parent_email?: string | null
  parent_phone?: string | null
  date_of_birth?: string | null
  gender?: string | null
  current_term?: string | null
  session_year?: string | null
  created_at?: string
  updated_at?: string
}

// Exam Attempt Interface
export interface ExamAttempt {
  id: string
  exam_id: string
  exam_title: string
  exam_subject: string
  status: string
  percentage: number
  is_passed: boolean
  total_score: number
  term: string
  session_year: string
  started_at?: string
  completed_at?: string
  student_id?: string
}

// Classmate Interface
export interface Classmate {
  id: string
  full_name: string
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  email?: string
  photo_url?: string | null
  class?: string
  department?: string | null
  vin_id?: string | null
  role?: string
}

// Study Note Interface
export interface StudyNote {
  id: string
  title: string
  description?: string
  subject: string
  class?: string
  term?: string
  session_year?: string
  file_url?: string
  teacher_name?: string
  teacher_id?: string
  status?: string
  views?: number
  downloads?: number
  created_at?: string
  updated_at?: string
}

// Assignment Interface - ADD THIS
export interface Assignment {
  id: string
  title: string
  description?: string
  subject: string
  class?: string
  term?: string
  session_year?: string
  due_date?: string
  status?: string
  total_marks?: number
  file_url?: string
  teacher_name?: string
  teacher_id?: string
  created_at?: string
  updated_at?: string
}

// Welcome Banner Profile
export interface WelcomeBannerProfile {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  email?: string
  photo_url?: string | null
  class?: string
  department?: string
  vin_id?: string
  role?: string
}

// Report Card Status
export interface ReportCardStatus {
  term: string
  session_year: string
  is_published: boolean
  total_subjects: number
  subjects_passed: number
  subjects_failed: number
  average_score: number
  position?: number
  total_students?: number
  remark?: string
  principal_comment?: string
  form_teacher_comment?: string
}

// Term Progress Interface
export interface TermProgress {
  term: string
  session_year: string
  completed_exams: number
  total_exams: number
  average_score: number
  subjects_passed: number
  subjects_failed: number
  total_subjects?: number
}