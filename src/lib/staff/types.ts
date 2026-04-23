// ============================================
// STAFF TYPES - Complete Type Definitions
// ============================================

export type TabType = 
  | 'overview' 
  | 'exams' 
  | 'assignments' 
  | 'notes' 
  | 'students'
  | 'ca-scores'
  | 'grade'
  | 'attendance'
  | 'report-cards'
  | 'results'
  | 'schedule'
  | 'calendar'
  | 'analytics'
  | 'achievements'
  | 'notifications'
  | 'settings'
  | 'help'

// ============================================
// TERM INFO - FIXED: Made properties required
// ============================================
export interface TermInfo {
  term: any
  termCode: 'first' | 'second' | 'third'
  termName: string
  sessionYear: string
  startDate: string
  endDate: string
  isActive: boolean
  currentWeek: number
  totalWeeks: number
  weekProgress: number
  weeksRemaining?: number
}

// ============================================
// DASHBOARD TYPES
// ============================================
export interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalSubjects: number
  averageAttendance: number
  upcomingExams: number
  pendingGrading: number
  recentActivities: Activity[]
  totalExams?: number
  publishedExams?: number
  totalAssignments?: number
  totalNotes?: number
  activeStudents?: number
  pendingSubmissions?: number
  averageScore?: number
  pendingAssignments?: number
}

export interface Activity {
  id: string
  type: 'attendance' | 'exam' | 'assignment' | 'announcement' | 'note' | 'result'
  title: string
  description: string
  timestamp: string
  user: string
  link?: string
}

export interface StaffProfile {
  id: string
  full_name: string
  email: string
  role: 'teacher' | 'admin' | 'principal' | 'staff'
  department?: string
  subjects?: string[]
  classes?: string[]
  photo_url?: string
  phone?: string
  joined_date?: string
  employee_id?: string
  qualifications?: string[]
  name?: string
  avatar_url?: string
}

// ============================================
// EXAM TYPES
// ============================================
export interface Exam {
  id: string
  title: string
  subject: string
  class: string
  date: string
  duration: number
  total_marks: number
  total_questions?: number
  has_theory?: boolean
  passing_percentage?: number
  status: 'scheduled' | 'ongoing' | 'completed' | 'graded' | 'published' | 'active'
  question_count?: number
  student_count?: number
  created_at?: string
  updated_at?: string
  term?: string
  academic_year?: string
  teacher_name?: string
  created_by?: string
}

// ============================================
// ASSIGNMENT TYPES
// ============================================
export interface Assignment {
  id: string
  title: string
  subject: string
  class: string
  due_date: string
  description?: string
  total_points: number
  total_marks: number
  status: 'draft' | 'published' | 'closed'
  submission_count?: number
  graded_count?: number
  created_at?: string
  updated_at?: string
  term?: string
  academic_year?: string
}

// ============================================
// NOTE TYPES
// ============================================
export interface Note {
  id: string
  title: string
  content: string
  description?: string
  subject?: string
  class?: string
  type: 'lesson_note' | 'scheme_of_work' | 'general'
  status: 'draft' | 'published'
  created_by?: string
  created_at?: string
  updated_at?: string
  author_name?: string
  term?: string
  academic_year?: string
  week?: number
  topic?: string
}

// ============================================
// STUDENT TYPES
// ============================================
export interface Student {
  id: string
  full_name: string
  vin_id: string
  class: string
  email: string
  phone?: string
  photo_url?: string
  status: 'active' | 'inactive' | 'suspended'
  is_active?: boolean
  attendance_rate?: number
  average_score?: number
  enrolled_date?: string
  parent_name?: string
  parent_phone?: string
  address?: string
}

// ============================================
// CA SCORES TYPES
// ============================================
export interface CAScore {
  id: string
  student_id: string
  student_name: string
  vin_id: string
  subject: string
  class: string
  term: string
  academic_year: string
  ca1_score: number
  ca2_score: number
  total_ca: number
  submitted_by?: string
  submitted_at?: string
  updated_at?: string
}

// ============================================
// LESSON NOTE TYPES
// ============================================
export interface LessonNote {
  id: string
  title: string
  subject: string
  class: string
  week: number
  term: string
  academic_year: string
  topic: string
  sub_topic?: string
  objectives: string[]
  materials: string[]
  content: string
  evaluation: string
  homework?: string
  status: 'draft' | 'submitted' | 'approved'
  created_by: string
  created_at: string
  updated_at: string
  approved_by?: string
  approved_at?: string
  teacher_name?: string
}

// ============================================
// SCHEME OF WORK TYPES
// ============================================
export interface SchemeOfWork {
  id: string
  subject: string
  class: string
  term: string
  academic_year: string
  weeks: SchemeWeek[]
  status: 'draft' | 'submitted' | 'approved'
  created_by: string
  created_at: string
  updated_at: string
  teacher_name?: string
}

export interface SchemeWeek {
  week: number
  topic: string
  sub_topics: string[]
  objectives: string[]
  activities: string[]
  resources: string[]
  evaluation: string
}

// ============================================
// ATTENDANCE TYPES
// ============================================
export interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  vin_id: string
  class: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  marked_by?: string
  marked_at?: string
  remark?: string
}

export interface AttendanceStats {
  present: number
  absent: number
  late: number
  excused: number
  total: number
  percentage: number
}

// ============================================
// RESULT/GRADING TYPES
// ============================================
export interface StudentScore {
  id: string
  student_id: string
  student_name: string
  vin_id: string
  subject: string
  class: string
  term: string
  academic_year: string
  ca1_score: number
  ca2_score: number
  exam_score: number
  total_score: number
  grade: string
  remark: string
  submitted_by?: string
  submitted_at?: string
}

export interface ClassResult {
  class: string
  subject: string
  term: string
  academic_year: string
  scores: StudentScore[]
  statistics: {
    highest: number
    lowest: number
    average: number
    grade_distribution: Record<string, number>
  }
}

// ============================================
// REPORT CARD TYPES
// ============================================
export interface SubjectScore {
  subject: string
  ca1: number
  ca2: number
  exam: number
  total: number
  grade: string
  remark: string
  position?: number
  class_highest?: number
  class_lowest?: number
  class_average?: number
}

export interface ReportCard {
  id: string
  student_id: string
  class: string
  term: string
  academic_year: string
  session_year: string
  subject_scores: SubjectScore[]
  total_score: number
  average_score: number
  grade: string
  teacher_comments: string
  principal_comments: string
  admin_comments: string
  status: 'draft' | 'pending' | 'approved' | 'published'
  published_at: string | null
  generated_by: string
  generated_at: string
  attendance_summary: { total_days: number; present: number; absent: number }
  affective_traits: Record<string, string>
  psychomotor_skills: Record<string, string>
  student?: { full_name: string; vin_id: string }
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================
export interface TabProps {
  staffProfile: StaffProfile
  termInfo: TermInfo
  onRefresh?: () => void
}