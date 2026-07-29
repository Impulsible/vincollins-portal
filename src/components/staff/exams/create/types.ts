// src/components/staff/exams/create/types.ts

export interface Question {
  id: string
  type: "mcq" | "true_false" | "fill_blank"
  question: string
  options?: string[]
  correct_answer: string
  marks: number
}

export interface TheorySubQuestion {
  text: string
  marks: number
  sub_sub_questions?: TheorySubQuestion[]
}

export interface TheoryQuestion {
  id: string
  question: string
  marks: number
  sub_questions?: TheorySubQuestion[]
  image_url?: string
  image_caption?: string
}

export interface ExamDetails {
  title: string
  subject: string
  class: string
  duration: number
  instructions: string
  pass_mark: number
  randomize_questions: boolean
  randomize_options: boolean
  term: string
  session_year: string
  passage_text?: string
  description?: string
}

export interface TeacherProfile {
  id: string
  full_name?: string
  department?: string
  email?: string
  photo_url?: string | null
  avatar_url?: string | null
  role?: string
  title?: string
  first_name?: string
  last_name?: string
}

export interface DraftData {
  activeStep: string
  hasTheory: boolean
  examDetails: ExamDetails
  questions: Question[]
  theoryQuestions: TheoryQuestion[]
  objectiveMax: number
  theoryMax: number
  theoryQuestionsTotal: number
  theoryQuestionsToAnswer: number | null
  theoryMarksPerQuestion: number
  scoringRule: ScoringRule
  defaultMark: number
  bulkQuestionsText: string
  bulkTheoryText: string
  passageText: string
  hasPassage: boolean
  savedAt: string
  theoryTotalMarks: number
}

export interface ParseResult<T> {
  items: T[]
  warnings: string[]
  skipped: number
}

export type ScoringRule = "standard" | "best_of" | "choose_any"
export type StepId = "details" | "questions" | "theory" | "preview"

export interface CreateExamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  teacherProfile: TeacherProfile | null
  defaultTerm?: string
  defaultSession?: string
}

export interface TermOption {
  value: string
  label: string
  session_year: string
  is_current: boolean
}

// ✅ Mark distribution types
export interface MarkDistribution {
  objectiveTotal: number
  theoryTotal: number
  examTotal: number
  ca1Max: number
  ca2Max: number
  caTotal: number
  grandTotal: number
  questionCount: number
  theoryQuestionCount: number
  marksPerTheoryQuestion: number
  isBalanced: boolean
  theoryMarksPerQuestion: number
}

// ✅ Step Props
export interface ExamDetailsStepProps {
  examDetails: ExamDetails
  onExamDetailsChange: (details: ExamDetails) => void
  hasTheory: boolean
  onHasTheoryChange: (v: boolean) => void
  objectiveMax: number
  onObjectiveMaxChange: (v: number) => void
  theoryMax: number
  onTheoryMaxChange: (v: number) => void
  defaultMark: number
  onDefaultMarkChange: (v: number) => void
  questionCount?: number
  markDistribution?: MarkDistribution
}

export interface ObjectiveQuestionsStepProps {
  questions: Question[]
  onQuestionsChange: (q: Question[]) => void
  objectiveMax: number
  defaultMark: number
  bulkText: string
  onBulkTextChange: (v: string) => void
  onParse: (text: string) => ParseResult<Question>
  passageText: string
  onPassageTextChange: (v: string) => void
  hasPassage: boolean
  onHasPassageChange: (v: boolean) => void
  markDistribution?: MarkDistribution
  onDefaultMarkChange?: (mark: number) => void
}

export interface TheoryQuestionsStepProps {
  questions: TheoryQuestion[]
  onQuestionsChange: (q: TheoryQuestion[]) => void
  hasTheory: boolean
  onHasTheoryChange: (v: boolean) => void
  theoryMax: number
  bulkText: string
  onBulkTextChange: (v: string) => void
  onParse: (text: string) => ParseResult<TheoryQuestion>
  markDistribution?: MarkDistribution
  defaultMark?: number
  theoryTotalMarks: number
  onTheoryTotalMarksChange: (value: number) => void
  objectiveTotal: number
}

export interface PreviewStepProps {
  examDetails: ExamDetails
  questions: Question[]
  theoryQuestions: TheoryQuestion[]
  hasTheory: boolean
  objectiveMax: number
  theoryMax: number
  passageText?: string
  defaultMark?: number
  markDistribution?: MarkDistribution
  theoryTotalMarks?: number
}

export interface SubmitOptions {
  examDetails: ExamDetails
  questions: Question[]
  theoryQuestions: TheoryQuestion[]
  hasTheory: boolean
  objectiveMax: number
  theoryMax: number
  theoryQuestionsTotal: number
  theoryQuestionsToAnswer: number | null
  theoryMarksPerQuestion: number
  scoringRule: ScoringRule
  teacherProfile: TeacherProfile | null
  submitForApproval: boolean
  passageText: string | null
  defaultMark: number
  markDistribution: MarkDistribution
  theoryTotalMarks: number
}