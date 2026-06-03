// app/student/types.ts
export interface StudentProfile {
  id: string
  full_name: string
  display_name?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  email: string
  vin_id: string
  admission_number?: string
  class: string
  department: string
  phone: string
  address: string
  admission_year: number
  photo_url: string | null
  cover_photo_url?: string | null
  avatar_url?: string | null
  is_active: boolean
  created_at: string
  bio?: string
  role?: string
}

export interface Assignment {
  id: string
  title: string
  subject: string
  class: string
  classes?: string[]
  description: string
  instructions?: string
  due_date: string
  total_marks: number
  total_points?: number
  attachment_urls?: string[]
  attachment_names?: string[]
  file_count?: number
  file_url?: string
  file_name?: string
  teacher_name?: string
  created_by?: string
  created_by_name?: string
  status: string
  created_at: string
  submission?: {
    id: string
    file_url: string
    submitted_at: string
    score?: number
    feedback?: string
    status: string
  }
}

export interface ExamAttempt {
  id: string
  exam_id: string
  student_id: string
  status: string
  score?: number
  percentage?: number
  is_passed?: boolean
  submitted_at?: string
  created_at: string
  exam_title?: string
  exam_subject?: string
  ca_score?: any
  has_ca?: boolean
}

// ✅ ADD THIS - StudyNote interface
export interface StudyNote {
  id: string
  title: string
  subject: string
  class: string
  description?: string
  file_url?: string
  attachment_urls?: string[]
  attachment_names?: string[]
  file_count?: number
  teacher_name?: string
  created_by?: string
  created_by_name?: string
  created_at: string
  updated_at?: string
  status: string
}