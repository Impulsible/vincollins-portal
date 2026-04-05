// types/exam.ts
export interface Exam {
  id: string
  title: string
  subject: string
  category: 'junior' | 'senior-science' | 'senior-arts'
  class: string
  duration: number
  total_questions: number
  status: 'draft' | 'published' | 'archived'
  instructions: string
  passing_score: number
  passingScore?: number
  averageScore?: number
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  created_by: string
  teacher_name?: string
  published_at?: string
  attempts?: number
  average_score?: number
  requires_access_code?: boolean
  isPractice?: boolean
}