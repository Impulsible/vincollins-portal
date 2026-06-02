// app/student/types.ts
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
  file_url?: string  // Legacy support
  file_name?: string  // Legacy support
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