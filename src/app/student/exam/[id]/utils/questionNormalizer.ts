// src/app/student/exam/[id]/utils/questionNormalizer.ts

import type { RawQuestion, Question, Exam, TheorySubQuestion } from "../types"

/**
 * Cleans trailing "Marks: 0.5", "(0.5 marks)", "[Marks: 1]" from question text.
 */
function cleanQuestionText(text?: string | null): string {
  if (!text) return ""
  return text
    .replace(/\s*[\(\[]?\s*Marks?:\s*[\d.]+\s*[\)\]]?\s*$/i, "")
    .replace(/\s*[\(\[]?\s*[\d.]+\s*marks?\s*[\)\]]?\s*$/i, "")
    .trim()
}

/**
 * Extracts options whether stored as a JSON array, JSON string, or legacy column fallbacks.
 */
function extractOptions(q: any): string[] {
  let opts: string[] = []

  if (Array.isArray(q.options)) {
    opts = q.options.map((opt: any) => {
      if (typeof opt === "string") return opt
      if (typeof opt === "object" && opt !== null && "text" in opt) {
        return typeof opt.text === "string" ? opt.text : String(opt.text ?? "")
      }
      return String(opt ?? "")
    })
  } else if (typeof q.options === "string") {
    try {
      const parsed = JSON.parse(q.options)
      if (Array.isArray(parsed)) {
        opts = parsed.map((opt: any) => {
          if (typeof opt === "string") return opt
          if (typeof opt === "object" && opt !== null && "text" in opt) {
            return typeof opt.text === "string" ? opt.text : String(opt.text ?? "")
          }
          return String(opt ?? "")
        })
      }
    } catch {
      opts = []
    }
  }

  // Fallback to column-based options if array was empty
  if (opts.length === 0) {
    const colOptions = [
      q.option_a ?? q.optionA ?? q.opt_a,
      q.option_b ?? q.optionB ?? q.opt_b,
      q.option_c ?? q.optionC ?? q.opt_c,
      q.option_d ?? q.optionD ?? q.opt_d,
      q.option_e ?? q.optionE ?? q.opt_e,
    ].filter((val) => val !== undefined && val !== null && String(val).trim() !== "")

    if (colOptions.length >= 2) {
      opts = colOptions.map(String)
    }
  }

  return opts
}

/**
 * Robust check if a question is Theory.
 * Prevents theory questions from leaking into Section A objectives.
 */
function isTheoryQuestion(q: any): boolean {
  if (q.is_theory === true) return true

  const typeStr = String(q.type || q.question_type || "").toLowerCase().trim()
  if (typeStr === "theory" || typeStr === "essay") return true
  if (Array.isArray(q.sub_questions) && q.sub_questions.length > 0) return true

  const opts = extractOptions(q)
  // If it has 2 or more options, it is definitely an objective MCQ
  if (opts.length >= 2) return false

  // If it has fewer than 2 options and order > 40, it is Theory
  const orderNum = Number(
    q.order_number ??
      q.order_index ??
      q.order ??
      q.q_index ??
      q.question_number ??
      0
  )
  if (orderNum > 40) return true

  // If it has fewer than 2 options and no objective indicator, treat as theory
  if (typeStr !== "objective" && typeStr !== "mcq" && opts.length < 2) {
    return true
  }

  return false
}

/**
 * Parses objective marks accurately (preserves 0.5, 0.25, 1.0, etc.)
 * Dynamically reconciles with teacher's objective_max if present.
 */
function parseObjectiveMarks(
  q: any,
  defaultMark: number,
  hasTeacherObjMax: boolean
): number {
  const val =
    q.marks ?? q.points ?? (q as any).default_mark_at_creation ?? (q as any).score
  const num =
    val !== undefined && val !== null && val !== "" ? parseFloat(String(val)) : NaN

  // If teacher configured objective_max (e.g. 20 for 40 questions -> 0.5)
  // and DB had missing, 0, or legacy default 1.0 while default is 0.5, prioritize balanced defaultMark
  if (hasTeacherObjMax && defaultMark > 0) {
    if (isNaN(num) || num <= 0 || (num === 1 && defaultMark !== 1)) {
      return defaultMark
    }
  }

  if (!isNaN(num) && num > 0) return num
  return defaultMark
}

/**
 * Parses theory marks accurately (preserves 10, 15, etc.)
 * Prevents theory questions from inheriting accidental 0.5 marks.
 */
function parseTheoryMarks(
  q: any,
  defaultMark: number,
  hasTeacherTheoryMax: boolean
): number {
  const val =
    q.marks ?? q.points ?? (q as any).default_mark_at_creation ?? (q as any).score
  const num =
    val !== undefined && val !== null && val !== "" ? parseFloat(String(val)) : NaN

  // If theory question accidentally inherited 0.5 or has 0/NaN, use calculated default
  if (hasTeacherTheoryMax && defaultMark > 0) {
    if (isNaN(num) || num <= 0 || num < 1) {
      return defaultMark
    }
  }

  if (!isNaN(num) && num > 0) return num
  return defaultMark
}

/**
 * Sorts raw questions by their natural authoring sequence from the database.
 */
function sortRawQuestions(questions: RawQuestion[]): RawQuestion[] {
  return [...questions].sort((a: any, b: any) => {
    const numA = Number(
      a.order_number ??
        a.order_index ??
        a.order ??
        a.q_index ??
        a.question_number ??
        a.question_index ??
        a.display_order
    )
    const numB = Number(
      b.order_number ??
        b.order_index ??
        b.order ??
        b.q_index ??
        b.question_number ??
        b.question_index ??
        b.display_order
    )

    if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) {
      return numA - numB
    }
    if (a.created_at && b.created_at) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    return 0
  })
}

function normalizeObjective(
  q: RawQuestion,
  index: number,
  defaultMark: number,
  hasTeacherObjMax: boolean
): Question {
  const marks = parseObjectiveMarks(q, defaultMark, hasTeacherObjMax)
  const normalizedOptions = extractOptions(q)
  const rawText = q.question_text ?? q.question ?? (q as any).text ?? ""
  const cleanText = cleanQuestionText(rawText)

  return {
    id: q.id,
    question: cleanText,
    question_text: cleanText,
    type: "objective",
    options: normalizedOptions,
    correct_answer: q.correct_answer ?? (q as any).answer ?? "",
    marks,
    points: marks,
    order_number: index + 1,
    is_theory: false,
    image_url: q.image_url ?? null,
    image_caption: q.image_caption ?? null,
  }
}

function normalizeTheory(
  q: RawQuestion,
  index: number,
  defaultMark: number,
  hasTeacherTheoryMax: boolean
): Question {
  const marks = parseTheoryMarks(q, defaultMark, hasTeacherTheoryMax)
  const rawText = q.question_text ?? q.question ?? (q as any).text ?? ""
  const cleanText = cleanQuestionText(rawText)

  return {
    id: q.id,
    question: cleanText,
    question_text: cleanText,
    type: "theory",
    options: [],
    correct_answer: "",
    marks,
    points: marks,
    order_number: index + 1,
    is_theory: true,
    sub_questions: (q.sub_questions as TheorySubQuestion[] | undefined) ?? [],
    image_url: q.image_url ?? null,
    image_caption: q.image_caption ?? null,
  }
}

export interface NormalizationResult {
  questions: Question[]
  objectiveCount: number
  theoryCount: number
}

export function normalizeExamQuestions(exam: Exam): NormalizationResult {
  const allFromDB = exam.questions ?? []
  const theoryFromDB = exam.theory_questions ?? []

  const objectiveRaw: RawQuestion[] = []
  const theoryRaw: RawQuestion[] = []
  const seenTheoryIds = new Set<string>()

  // 1. Separate questions from the primary exam question pool
  for (const q of allFromDB) {
    if (isTheoryQuestion(q)) {
      theoryRaw.push(q)
      if (q.id) seenTheoryIds.add(String(q.id))
    } else {
      objectiveRaw.push(q)
    }
  }

  // 2. Include questions from exam.theory_questions (deduplicating if needed)
  for (const tq of theoryFromDB) {
    if (!tq.id || !seenTheoryIds.has(String(tq.id))) {
      theoryRaw.push(tq)
      if (tq.id) seenTheoryIds.add(String(tq.id))
    }
  }

  // 3. Compute accurate objective mark (e.g., 20 marks / 40 questions = 0.5)
  const teacherObjMax = Number((exam as any).objective_max)
  const hasTeacherObjMax = Number.isFinite(teacherObjMax) && teacherObjMax > 0
  const defaultObjMark =
    hasTeacherObjMax && objectiveRaw.length > 0
      ? Number((teacherObjMax / objectiveRaw.length).toFixed(2))
      : 0.5

  // 4. Compute accurate theory mark (e.g., 40 marks / 4 questions = 10, or 60 marks / 6 questions = 10)
  const teacherTheoryMax = Number((exam as any).theory_max)
  const hasTeacherTheoryMax =
    Number.isFinite(teacherTheoryMax) && teacherTheoryMax > 0
  const defaultTheoryMark =
    hasTeacherTheoryMax && theoryRaw.length > 0
      ? Number((teacherTheoryMax / theoryRaw.length).toFixed(2))
      : 10

  // 5. Section A: Sort and normalize Objective questions (Q1 to Q40)
  const sortedObjectives = sortRawQuestions(objectiveRaw)
  const objectives = sortedObjectives.map((q, idx) =>
    normalizeObjective(q, idx, defaultObjMark, hasTeacherObjMax)
  )

  // 6. Section B: Sort and normalize Theory questions (Q41 to Q46)
  const sortedTheories = sortRawQuestions(theoryRaw)
  const theories = sortedTheories.map((q, idx) =>
    normalizeTheory(
      q,
      objectives.length + idx,
      defaultTheoryMark,
      hasTeacherTheoryMax
    )
  )

  // Section A strictly comes first, followed by Section B
  return {
    questions: [...objectives, ...theories],
    objectiveCount: objectives.length,
    theoryCount: theories.length,
  }
}