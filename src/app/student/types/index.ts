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

// Assignment Interface
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

// 🔥 ADDED: Banner Stats Interface
export interface BannerStats {
  availableExams: number
  totalExams: number
  completedExams: number
  averageScore: number
}

// 🔥 ADDED: Performance Stats Interface
export interface PerformanceStats {
  passedExams: number
  failedExams: number
  completedExams: number
  availableExams: number
  passRate: number
}

// 🔥 ADDED: Term Progress Data Interface
export interface TermProgressData {
  term: string
  session_year: string
  completed_exams: number
  total_exams: number
  average_score: number
  subjects_passed: number
  subjects_failed: number
}

// 🔥 ADDED: Exam Interface
export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  status: string
  duration: number
  total_questions: number
  total_points: number
  pass_mark: number
  description?: string
  instructions?: string
  has_theory?: boolean
  questions?: any
  theory_questions?: any
  is_published?: boolean
  published_at?: string
  published_by?: string
  starts_at?: string
  ends_at?: string
  created_by?: string
  teacher_name?: string
  department?: string
  created_at?: string
  updated_at?: string
  total_marks?: number
  tab_switch_limit?: number
  auto_submit_on_violation?: boolean
  proctoring_enabled?: boolean
  face_detection_required?: boolean
  fullscreen_required?: boolean
  total_attempts?: number
  average_score?: number
  passing_percentage?: number
  max_attempts?: number
  randomize_questions?: boolean
  randomize_options?: boolean
  term?: string
  session_year?: string
}