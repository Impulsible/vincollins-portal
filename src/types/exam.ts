export type QuestionType = 'mcq' | 'theory' | 'boolean' | 'short_answer' | 'essay';

export interface SubQuestion {
  id: string;
  label: string; // e.g., "(a)", "(b)", "i", "ii"
  question: string;
  marks: number;
  answer_guide?: string;
}

export interface Question {
  id: string;
  type: QuestionType | 'mcq' | 'theory';
  question: string;
  options?: string[];
  correct_answer?: string;
  marks: number;
  explanation?: string;
  image_url?: string;
  image_caption?: string;
  rubric?: string;
  instructions?: string;
  sub_questions?: SubQuestion[];
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  subject_id?: string;
  category?: 'junior' | 'senior-science' | 'senior-arts';
  class: string;
  class_id?: string;
  duration: number; // In minutes - dynamically set by teacher
  duration_minutes?: number; // Alias for Postgres column compatibility
  total_questions: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'completed' | 'archived';
  instructions: string;
  passing_score: number;
  passingScore?: number;
  averageScore?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  created_by: string;
  teacher_name?: string;
  published_at?: string;
  attempts?: number;
  average_score?: number;
  requires_access_code?: boolean;
  isPractice?: boolean;
  // 60-Mark Scoring Model & Delivery Config
  term?: string;
  session?: string;
  exam_type?: 'exam' | 'test' | 'quiz' | 'assessment';
  total_marks?: number; // Defaults to 60 (CA1=20, CA2=20, Exam=60 -> 100)
  objective_marks?: number;
  theory_marks?: number;
  theory_answer_count?: number; // e.g., "Answer any 3 out of 5"
  questions?: Question[];
  theory_questions?: Question[];
  excluded_student_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  student_name?: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  objective_answers: Record<string, string>;
  theory_answers: Record<string, string>;
  objective_score?: number;
  theory_score?: number;
  total_score?: number;
  started_at?: string;
  submitted_at?: string;
  time_remaining_seconds?: number;
  extra_time_minutes?: number;
}