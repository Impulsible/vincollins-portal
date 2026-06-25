// src/components/staff/exams/create/types.ts

export interface Question {
  id: string;
  type: "mcq" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correct_answer: string;
  marks: number;
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

export interface ExamDetails {
  title: string;
  subject: string;
  class: string;
  duration: number;
  instructions: string;
  pass_mark: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  term: string;
  session_year: string;
}

export interface TeacherProfile {
  id: string;
  full_name: string;
  department: string;
  email: string;
}

export interface DraftData {
  activeStep: string;
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
  savedAt: string;
}

export type ScoringRule = "standard" | "best_of" | "choose_any";
export type ObjectiveMode = "bulk" | "manual";
export type TheoryMode = "smart" | "manual";
export type StepId = "details" | "questions" | "theory" | "preview";

export interface ParseResult<T> {
  items: T[];
  warnings: string[];
  skipped: number;
}

export interface CreateExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  teacherProfile: TeacherProfile;
}