// types/index.ts
export interface StudentProfile {
  id: string
  full_name: string
  first_name?: string | null
  last_name?: string | null
  middle_name?: string | null
  display_name?: string | null
  email: string
  class: string
  department?: string
  photo_url?: string | null
  vin_id?: string
  admission_year?: number
  subject_count?: number
  role?: string
}

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
}

export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  status: string
  total_questions?: number
  total_marks?: number
  pass_mark?: number
  starts_at?: string
  ends_at?: string
  created_at: string
}

export interface Assignment {
  id: string
  title: string
  subject: string
  description?: string
  due_date: string
  total_marks?: number
  file_url?: string | null
  created_at: string
  teacher_name?: string | null
  class?: string | null
}

export interface StudyNote {
  id: string
  title: string
  subject: string
  description?: string
  file_url?: string | null
  created_at: string
  teacher_name?: string | null
  class?: string | null
}

export interface Classmate {
  id: string
  first_name?: string | null
  last_name?: string | null
  full_name: string
  display_name?: string | null
  email: string
  class: string
  vin_id?: string
  photo_url?: string | null
  department?: string
  admission_year?: number
}

export interface PerformanceStats {
  totalExams: number
  completedExams: number
  averageScore: number
  passedExams: number
  failedExams: number
  pendingResults: number
  recentAttempts: ExamAttempt[]
  availableExams: Exam[]
  recentAssignments: Assignment[]
  recentNotes: StudyNote[]
  allAssignments: Assignment[]
  allNotes: StudyNote[]
  classmates: Classmate[]
}

export interface BannerStats {
  completedExams: number
  averageScore: number
  availableExams: number
  totalExams: number
  totalSubjects: number
  currentGrade: string
  gradeColor: string
  currentTerm: string
  sessionYear: string
}

export interface TermProgressData {
  completed_exams: number
  average_score: number
  grade: string
  total_subjects: number
  term: string
  session_year: string
  student_id: string
}