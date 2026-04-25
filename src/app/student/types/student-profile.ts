// src/app/student/types/student-profile.ts
export interface StudentProfile {
  id: string
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  photo_url?: string
  class?: string
  department?: string
  role?: string
  vin_id?: string
  display_name?: string
  phone?: string
  address?: string
  parent_email?: string
  parent_phone?: string
  date_of_birth?: string
  gender?: string
  admission_no?: string
  current_term?: string
  session_year?: string
  created_at?: string
  updated_at?: string
}

export interface Exam {
  id: string
  title: string
  subject: string
  status: string
  description?: string
  duration?: number
  total_marks?: number
  term?: string
  session_year?: string
  start_date?: string
  end_date?: string
  created_at?: string
}

export interface Assignment {
  id: string
  title: string
  subject: string
  description?: string
  due_date?: string
  status?: string
  total_marks?: number
  term?: string
  session_year?: string
  file_url?: string
  created_at?: string
}

export interface Note {
  id: string
  title: string
  subject: string
  content?: string
  file_url?: string
  term?: string
  session_year?: string
  created_at?: string
}