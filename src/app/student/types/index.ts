// All TypeScript interfaces
export interface StudentProfile {
  id: string
  first_name: string | null
  middle_name?: string | null
  last_name: string | null
  full_name: string
  display_name?: string | null
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string | null
  admission_year?: number
  role?: string
  subject_count?: number
}

export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  status: string
  created_at: string
  starts_at?: string
  ends_at?: string
  has_theory?: boolean
  passing_percentage?: number
  term?: string
  session_year?: string
}

export interface ExamAttempt {
  id: string
  exam_id: string
  exam_title?: string
  exam_subject?: string
  status: string
  percentage: number
  is_passed: boolean
  total_score?: number
  term?: string
  session_year?: string
}

export interface Assignment {
  id: string
  title: string
  subject: string
  description: string
  due_date: string
  total_marks: number
  file_url?: string | null
  created_at: string
  teacher_name?: string | null
  class?: string | null
}

export interface StudyNote {
  id: string
  title: string
  subject: string
  description: string
  file_url?: string | null
  created_at: string
  teacher_name?: string | null
  class?: string | null
}

export interface Classmate {
  id: string
  first_name: string | null
  middle_name?: string | null
  last_name: string | null
  full_name: string
  display_name?: string | null
  email: string
  photo_url?: string | null
  vin_id?: string
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
  id: string
  term: string
  session_year: string
  completed_exams: number
  total_subjects: number
  average_score: number
  grade: string
  term_completed: boolean
  class: string
}

export interface ReportCardStatus {
  status: 'pending' | 'approved' | 'published' | 'rejected' | null
  term: string
  academic_year: string
  average_score?: number
  grade?: string
  id?: string
}

export interface WelcomeBannerProfile {
  full_name: string
  display_name?: string | null
  class: string
  department?: string
  photo_url?: string
  subject_count?: number
}