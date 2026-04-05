/**
 * Question Types Enum
 */
export enum QuestionType {
  OBJECTIVE = 'objective',
  THEORY = 'theory',
  TRUE_FALSE = 'true-false',
  MATCHING = 'matching',
  FILL_BLANK = 'fill-blank'
}

/**
 * Question Difficulty Levels
 */
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

/**
 * Exam Status Enum
 */
export enum ExamStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed'
}

/**
 * Submission Status Enum
 */
export enum SubmissionStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  SUBMITTED = 'submitted',
  GRADING = 'grading',
  GRADED = 'graded',
  EXPIRED = 'expired'
}

/**
 * Grade Scale Configuration
 */
export interface GradeScale {
  letter: string
  minPercentage: number
  maxPercentage: number
  description: string
  gpa: number
}

/**
 * Standard Grade Scales
 */
export const GRADE_SCALES: GradeScale[] = [
  { letter: 'A', minPercentage: 90, maxPercentage: 100, description: 'Excellent', gpa: 4.0 },
  { letter: 'B', minPercentage: 80, maxPercentage: 89, description: 'Very Good', gpa: 3.0 },
  { letter: 'C', minPercentage: 70, maxPercentage: 79, description: 'Good', gpa: 2.0 },
  { letter: 'D', minPercentage: 60, maxPercentage: 69, description: 'Pass', gpa: 1.0 },
  { letter: 'F', minPercentage: 0, maxPercentage: 59, description: 'Fail', gpa: 0.0 }
]

/**
 * Enhanced Question Interface
 */
export interface Question {
  /** Unique identifier for the question */
  id: string
  
  /** Reference to the exam this question belongs to */
  exam_id: string
  
  /** The actual question text */
  question_text: string
  
  /** Type of question (objective, theory, etc.) */
  type: QuestionType
  
  /** Options for multiple choice questions */
  options?: string[]
  
  /** Correct answer(s) for the question */
  correct_answer?: string | string[]
  
  /** Points awarded for correct answer */
  points: number
  
  /** Optional image URL for visual questions */
  image_url?: string
  
  /** Difficulty level of the question */
  difficulty?: DifficultyLevel
  
  /** Explanation for the correct answer */
  explanation?: string
  
  /** Tags for categorization */
  tags?: string[]
  
  /** Time limit in seconds (optional override from exam) */
  time_limit?: number
  
  /** Order in the exam */
  order?: number
  
  /** Metadata for additional information */
  metadata?: Record<string, unknown>
  
  /** Creation timestamp */
  created_at?: Date
  
  /** Last update timestamp */
  updated_at?: Date
}

/**
 * Enhanced Exam Interface
 */
export interface Exam {
  /** Unique identifier for the exam */
  id: string
  
  /** Title/Name of the exam */
  title: string
  
  /** Subject/Department name */
  subject: string
  
  /** Class/Level (e.g., JSS1, SS2) */
  class: string
  
  /** Duration in minutes */
  duration: number
  
  /** Total number of questions */
  total_questions: number
  
  /** Current status of the exam */
  status: ExamStatus
  
  /** Scheduled start date and time */
  start_date?: Date
  
  /** Scheduled end date and time */
  end_date?: Date
  
  /** Instructions for students */
  instructions: string
  
  /** Minimum passing score percentage (optional) */
  passing_score?: number
  
  /** Maximum attempts allowed */
  max_attempts?: number
  
  /** Whether questions are randomized */
  shuffle_questions?: boolean
  
  /** Whether options are randomized */
  shuffle_options?: boolean
  
  /** Show results immediately after submission */
  show_results_immediately?: boolean
  
  /** Show correct answers after submission */
  show_answers_after_submission?: boolean
  
  /** Time limit per question in seconds */
  time_per_question?: number
  
  /** Tags for categorization */
  tags?: string[]
  
  /** Created by (teacher/admin ID) */
  created_by?: string
  
  /** Creation timestamp */
  created_at?: Date
  
  /** Last update timestamp */
  updated_at?: Date
  
  /** Metadata for additional information */
  metadata?: Record<string, unknown>
}

/**
 * Answer Detail Interface
 */
export interface AnswerDetail {
  student_answer: string | string[] | null
  correct_answer: string | string[]
  is_correct: boolean
  points_awarded: number
  max_points: number
}

/**
 * Enhanced Submission Interface
 */
export interface Submission {
  /** Unique identifier for the submission */
  id: string
  
  /** Reference to the student */
  student_id: string
  
  /** Reference to the exam */
  exam_id: string
  
  /** Student's answers indexed by question ID */
  answers: Record<string, AnswerDetail>
  
  /** Total score achieved */
  score: number
  
  /** Timestamp when exam started */
  started_at: Date
  
  /** Timestamp when exam was submitted */
  submitted_at: Date
  
  /** Current submission status */
  status: SubmissionStatus
  
  /** Time spent in seconds */
  time_spent?: number
  
  /** Detailed answer feedback per question */
  feedback?: Record<string, {
    is_correct: boolean
    feedback_message?: string
    points_awarded?: number
  }>
  
  /** IP address of the student during submission */
  ip_address?: string
  
  /** User agent for security tracking */
  user_agent?: string
  
  /** Flag for academic integrity */
  flagged?: boolean
  
  /** Flag reasons if flagged */
  flag_reasons?: string[]
  
  /** Graded by (teacher ID) if manually graded */
  graded_by?: string
  
  /** Grading timestamp */
  graded_at?: Date
  
  /** Attempt number (1-based) */
  attempt_number?: number
  
  /** Metadata for additional information */
  metadata?: Record<string, unknown>
}

/**
 * Performance by Type Interface
 */
export interface PerformanceByType {
  total: number
  correct: number
  percentage: number
}

/**
 * Time Analysis Interface
 */
export interface TimeAnalysis {
  fastest: number
  slowest: number
  average: number
}

/**
 * Question Statistics Interface
 */
export interface QuestionStatistic {
  question_id: string
  correct_count: number
  incorrect_count: number
  skipped_count: number
  average_time: number
  difficulty_index: number
}

/**
 * Enhanced CBT Result Interface
 */
export interface CBTResult {
  /** Final score achieved */
  score: number
  
  /** Maximum possible score */
  total: number
  
  /** Percentage score (0-100) */
  percentage: number
  
  /** Letter grade based on percentage */
  grade: string
  
  /** Time spent in seconds */
  timeSpent: number
  
  /** Detailed answers record */
  answers: Record<string, AnswerDetail>
  
  /** Number of correct answers */
  correctAnswers: number
  
  /** Number of wrong answers */
  wrongAnswers: number
  
  /** Number of unanswered questions */
  unanswered?: number
  
  /** Performance by question type */
  performance_by_type?: Record<QuestionType, PerformanceByType>
  
  /** Time analysis per question */
  time_analysis?: TimeAnalysis
  
  /** Pass/Fail status */
  passed: boolean
  
  /** Feedback summary */
  feedback_summary?: string
  
  /** Recommendations for improvement */
  recommendations?: string[]
  
  /** Rank among all participants (if applicable) */
  rank?: number
  
  /** Percentile score */
  percentile?: number
}

/**
 * Exam Statistics Interface
 */
export interface ExamStatistics {
  /** Total number of participants */
  total_participants: number
  
  /** Average score */
  average_score: number
  
  /** Highest score */
  highest_score: number
  
  /** Lowest score */
  lowest_score: number
  
  /** Median score */
  median_score: number
  
  /** Standard deviation */
  standard_deviation?: number
  
  /** Score distribution */
  score_distribution: Record<string, number>
  
  /** Pass rate percentage */
  pass_rate: number
  
  /** Average completion time */
  average_completion_time: number
  
  /** Question-wise statistics */
  question_statistics: QuestionStatistic[]
}

/**
 * Quiz/Exam Session Interface
 */
export interface ExamSession {
  /** Unique session identifier */
  session_id: string
  
  /** Reference to the exam */
  exam_id: string
  
  /** Reference to the student */
  student_id: string
  
  /** Session start time */
  start_time: Date
  
  /** Session end time (if completed) */
  end_time?: Date
  
  /** Current question index */
  current_question_index: number
  
  /** Time remaining in seconds */
  time_remaining: number
  
  /** Paused state */
  is_paused: boolean
  
  /** Tab switches count (for integrity) */
  tab_switches: number
  
  /** Last activity timestamp */
  last_activity: Date
  
  /** Connection status */
  connection_status: 'connected' | 'disconnected' | 'reconnecting'
  
  /** Session status */
  status: 'active' | 'paused' | 'completed' | 'expired' | 'terminated'
}

/**
 * Utility type for creating a new question (omit system fields)
 */
export type CreateQuestion = Omit<Question, 'id' | 'created_at' | 'updated_at'>

/**
 * Utility type for creating a new exam (omit system fields)
 */
export type CreateExam = Omit<Exam, 'id' | 'created_at' | 'updated_at'>

/**
 * Utility type for exam with questions included
 */
export interface ExamWithQuestions extends Exam {
  questions: Question[]
  total_points?: number
}

/**
 * Utility type for submission with student and exam details
 */
export interface SubmissionWithDetails extends Submission {
  student?: {
    id: string
    name: string
    email: string
    class: string
  }
  exam?: Exam
}

/**
 * Helper function to calculate grade based on percentage
 */
export function calculateGrade(percentage: number, gradeScales: GradeScale[] = GRADE_SCALES): string {
  const grade = gradeScales.find(
    scale => percentage >= scale.minPercentage && percentage <= scale.maxPercentage
  )
  return grade?.letter || 'F'
}

/**
 * Helper function to calculate GPA
 */
export function calculateGPA(percentage: number, gradeScales: GradeScale[] = GRADE_SCALES): number {
  const grade = gradeScales.find(
    scale => percentage >= scale.minPercentage && percentage <= scale.maxPercentage
  )
  return grade?.gpa || 0
}

/**
 * Helper function to format time duration
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins} minutes`
}

/**
 * Helper function to calculate result from submission
 */
export function calculateResult(
  submission: Submission,
  exam: Exam,
  questions: Question[]
): CBTResult {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
  
  // Count correct answers from the answers object
  const correctAnswers = Object.values(submission.answers).filter(answer => answer.is_correct).length
  const wrongAnswers = Object.values(submission.answers).filter(answer => !answer.is_correct && answer.student_answer !== null).length
  const unanswered = questions.length - Object.keys(submission.answers).length
  const percentage = (submission.score / totalPoints) * 100

  // Calculate performance by type
  const performance_by_type: Record<QuestionType, PerformanceByType> = {} as Record<QuestionType, PerformanceByType>
  
  questions.forEach(question => {
    const answer = submission.answers[question.id]
    if (!performance_by_type[question.type]) {
      performance_by_type[question.type] = { total: 0, correct: 0, percentage: 0 }
    }
    performance_by_type[question.type].total++
    if (answer?.is_correct) {
      performance_by_type[question.type].correct++
    }
  })
  
  // Calculate percentages for each type
  Object.keys(performance_by_type).forEach(type => {
    const key = type as QuestionType
    performance_by_type[key].percentage = (performance_by_type[key].correct / performance_by_type[key].total) * 100
  })

  return {
    score: submission.score,
    total: totalPoints,
    percentage,
    grade: calculateGrade(percentage),
    timeSpent: submission.time_spent || 0,
    answers: submission.answers,
    correctAnswers,
    wrongAnswers,
    unanswered,
    performance_by_type,
    passed: percentage >= (exam.passing_score || 50),
    feedback_summary: percentage >= (exam.passing_score || 50) 
      ? 'Congratulations! You have passed the exam.'
      : 'Unfortunately, you did not pass. Please review the material and try again.',
    recommendations: percentage < (exam.passing_score || 50) 
      ? ['Review the material', 'Practice more questions', 'Focus on weak areas']
      : ['Great job!', 'Keep up the good work']
  }
}