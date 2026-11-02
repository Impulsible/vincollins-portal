// src/components/staff/exams/create/types.ts

/* ═══════════════════════════════════════════════════════════
   MARK CONSTANTS — single source of truth
   CA1 = 20, CA2 = 20, Exam = 60, Grand = 100
   ═══════════════════════════════════════════════════════════ */

export const MARK_CONSTANTS = {
  EXAM_TOTAL: 60,
  CA1_MAX: 20,
  CA2_MAX: 20,
  CA_TOTAL: 40, // 20 + 20
  GRAND_TOTAL: 100, // 20 + 20 + 60
  DEFAULT_MARK: 1,
  PASS_MARK_DEFAULT: 40, // 40 / 100
} as const;

/* ═══════════════════════════════════════════════════════════
   QUESTION MODELS
   ═══════════════════════════════════════════════════════════ */

export type QuestionType = "mcq" | "true_false" | "fill_blank";

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct_answer: string;
  marks: number;
  /** optional per-question image (objective) */
  image_url?: string;
  /** optional per-question explanation shown after grading */
  explanation?: string;
}

export interface TheorySubQuestion {
  text: string;
  marks: number;
  sub_sub_questions?: TheorySubQuestion[];
}

export interface TheoryQuestion {
  id: string;
  question: string;
  marks: number;
  sub_questions?: TheorySubQuestion[];
  image_url?: string;
  image_caption?: string;
}

/* ═══════════════════════════════════════════════════════════
   EXAM METADATA (step 1)
   ═══════════════════════════════════════════════════════════ */

export interface ExamDetails {
  title: string;
  subject: string;
  class: string;
  duration: number; // minutes — free choice, NOT tied to EXAM_TOTAL
  instructions: string;
  pass_mark: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  term: string;
  session_year: string;
  passage_text?: string;
  description?: string;
}

export const EMPTY_EXAM_DETAILS: ExamDetails = {
  title: "",
  subject: "",
  class: "",
  duration: MARK_CONSTANTS.EXAM_TOTAL, // 60 min default (coincidental, not coupled)
  instructions: "",
  pass_mark: MARK_CONSTANTS.PASS_MARK_DEFAULT,
  randomize_questions: false,
  randomize_options: false,
  term: "",
  session_year: "",
  passage_text: "",
  description: "",
};

/* ═══════════════════════════════════════════════════════════
   TEACHER / AUTH
   ═══════════════════════════════════════════════════════════ */

export interface TeacherProfile {
  id: string;
  full_name?: string;
  department?: string;
  email?: string;
  photo_url?: string | null;
  avatar_url?: string | null;
  role?: string;
  title?: string;
  first_name?: string;
  last_name?: string;
}

export interface TermOption {
  value: string;
  label: string;
  session_year: string;
  is_current: boolean;
}

/* ═══════════════════════════════════════════════════════════
   DRAFT / PARSER
   ═══════════════════════════════════════════════════════════ */

export type ScoringRule = "standard" | "best_of" | "choose_any";
export type StepId = "details" | "questions" | "theory" | "preview";

export interface ParseResult<T> {
  items: T[];
  warnings: string[];
  skipped: number;
}

export interface DraftData {
  activeStep: StepId;
  hasTheory: boolean;
  examDetails: ExamDetails;
  questions: Question[];
  theoryQuestions: TheoryQuestion[];
  objectiveMax: number;
  theoryMax: number;
  theoryQuestionsTotal: number;
  theoryQuestionsToAnswer: number | null;
  theoryMarksPerQuestion: number;
  scoringRule: ScoringRule;
  defaultMark: number;
  bulkQuestionsText: string;
  bulkTheoryText: string;
  passageText: string;
  hasPassage: boolean;
  savedAt: string;
  theoryTotalMarks: number;
}

/* ═══════════════════════════════════════════════════════════
   MARK DISTRIBUTION — CA1=20, CA2=20, Exam=60, Grand=100
   ═══════════════════════════════════════════════════════════ */

export interface MarkDistribution {
  /** Sum of objective question marks */
  objectiveTotal: number;
  /** effectiveN × marksPerTheoryQuestion (0 if no theory) */
  theoryTotal: number;
  /** objectiveTotal + theoryTotal — must equal EXAM_TOTAL (60) */
  examTotal: number;

  /** 20 — CA 1 maximum */
  ca1Max: number;
  /** 20 — CA 2 maximum */
  ca2Max: number;
  /** 40 — CA 1 + CA 2 */
  caTotal: number;
  /** 100 — CA + Exam */
  grandTotal: number;

  /** Number of objective questions */
  questionCount: number;
  /** Number of theory questions in the pool */
  theoryQuestionCount: number;
  /** Marks per theory question (all must be equal for fairness) */
  theoryMarksPerQuestion: number;
  /** Alias kept for backward-compat with step components */
  marksPerTheoryQuestion: number;

  /** True iff examTotal === 60 AND all theory marks are equal */
  isBalanced: boolean;

  /** NEW — fairness flag used by validateExam() and TheoryQuestionsStep */
  theoryMarksEqual: boolean;
}

/* ═══════════════════════════════════════════════════════════
   DB SCORING MODELS (mirror exam_submissions columns)
   ═══════════════════════════════════════════════════════════ */

export type MarkingStatus = "pending" | "auto_scored" | "fully_marked";

export interface ObjectiveAnswer {
  questionId: string;
  selectedOption: string; // "A" | "B" | "C" | "D" | "true" | "false" | fill text
}

export interface TheoryMark {
  questionId: string;
  awarded: number;
}

export interface ExamScoringSnapshot {
  objective_score: number;
  objective_max: number;
  theory_score: number;
  theory_max: number;
  total_score: number;
  total_max: number;
  marking_status: MarkingStatus;
}

/* ═══════════════════════════════════════════════════════════
   STEP PROPS
   ═══════════════════════════════════════════════════════════ */

export interface ExamDetailsStepProps {
  examDetails: ExamDetails;
  onExamDetailsChange: (details: ExamDetails) => void;
  hasTheory: boolean;
  onHasTheoryChange: (v: boolean) => void;
  objectiveMax: number;
  onObjectiveMaxChange: (v: number) => void;
  theoryMax: number;
  onTheoryMaxChange: (v: number) => void;
  defaultMark: number;
  onDefaultMarkChange: (v: number) => void;
  questionCount?: number;
  markDistribution?: MarkDistribution;
}

export interface ObjectiveQuestionsStepProps {
  questions: Question[];
  onQuestionsChange: (q: Question[]) => void;
  objectiveMax: number;
  defaultMark: number;
  bulkText: string;
  onBulkTextChange: (v: string) => void;
  onParse: (text: string) => ParseResult<Question>;
  passageText: string;
  onPassageTextChange: (v: string) => void;
  hasPassage: boolean;
  onHasPassageChange: (v: boolean) => void;
  markDistribution?: MarkDistribution;
  onDefaultMarkChange?: (mark: number) => void;
}

export interface TheoryQuestionsStepProps {
  questions: TheoryQuestion[];
  onQuestionsChange: (q: TheoryQuestion[]) => void;
  hasTheory: boolean;
  onHasTheoryChange: (v: boolean) => void;
  theoryMax: number;
  bulkText: string;
  onBulkTextChange: (v: string) => void;
  onParse: (text: string) => ParseResult<TheoryQuestion>;
  markDistribution?: MarkDistribution;
  defaultMark?: number;
  theoryTotalMarks: number;
  onTheoryTotalMarksChange: (value: number) => void;
  objectiveTotal: number;

  /* ── NEW: required for equal-marks enforcement ─────────── */
  /** How many theory questions each student must answer (N of M). */
  theoryQuestionsToAnswer: number | null;
  onTheoryQuestionsToAnswerChange: (v: number | null) => void;
  /** Single master marks value applied to ALL theory questions. */
  theoryMarksPerQuestion: number;
  onTheoryMarksPerQuestionChange: (v: number) => void;
}

export interface PreviewStepProps {
  examDetails: ExamDetails;
  questions: Question[];
  theoryQuestions: TheoryQuestion[];
  hasTheory: boolean;
  objectiveMax: number;
  theoryMax: number;
  passageText?: string;
  defaultMark?: number;
  markDistribution?: MarkDistribution;
  theoryTotalMarks?: number;

  /* ── NEW: shown in the preview breakdown ───────────────── */
  theoryQuestionsToAnswer?: number | null;
  theoryMarksPerQuestion?: number;
}

/* ═══════════════════════════════════════════════════════════
   SUBMIT OPTIONS
   ═══════════════════════════════════════════════════════════ */

export interface SubmitOptions {
  examDetails: ExamDetails;
  questions: Question[];
  theoryQuestions: TheoryQuestion[];
  hasTheory: boolean;
  objectiveMax: number;
  theoryMax: number;
  theoryQuestionsTotal: number;
  theoryQuestionsToAnswer: number | null;
  theoryMarksPerQuestion: number;
  scoringRule: ScoringRule;
  teacherProfile: TeacherProfile | null;
  submitForApproval: boolean;
  passageText: string | null;
  defaultMark: number;
  markDistribution: MarkDistribution;
  theoryTotalMarks: number;
}

/* ═══════════════════════════════════════════════════════════
   DIALOG PROPS
   ═══════════════════════════════════════════════════════════ */

export interface CreateExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  teacherProfile: TeacherProfile | null;
  defaultTerm?: string;
  defaultSession?: string;
}