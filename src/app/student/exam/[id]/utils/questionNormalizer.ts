// src/app/student/exam/[id]/utils/questionNormalizer.ts

import type { RawQuestion, Question, Exam, TheorySubQuestion } from "../types"

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

function normalizeObjective(q: RawQuestion, index: number): Question {
  const marks = Number(q.marks ?? q.points ?? (q as any).score ?? 1)
  const orderNum = Number(
    q.order_number ??
      q.order_index ??
      q.order ??
      q.q_index ??
      index + 1
  )

  let normalizedOptions: string[] = []
  if (Array.isArray(q.options)) {
    normalizedOptions = q.options.map((opt: any) => {
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
        normalizedOptions = parsed.map((opt: any) => {
          if (typeof opt === "string") return opt
          if (typeof opt === "object" && opt !== null && "text" in opt) {
            return typeof opt.text === "string" ? opt.text : String(opt.text ?? "")
          }
          return String(opt ?? "")
        })
      }
    } catch {
      normalizedOptions = []
    }
  }

  return {
    id: q.id,
    question: q.question ?? q.question_text ?? (q as any).text ?? "",
    question_text: q.question_text ?? q.question ?? (q as any).text ?? "",
    type: "objective",
    options: normalizedOptions,
    correct_answer: q.correct_answer ?? (q as any).answer ?? "",
    marks,
    points: marks,
    order_number: orderNum,
    is_theory: false,
    image_url: q.image_url ?? null,
    image_caption: q.image_caption ?? null,
  }
}

function normalizeTheory(q: RawQuestion, index: number): Question {
  const marks = Number(q.marks ?? q.points ?? (q as any).score ?? 10)
  const orderNum = Number(
    q.order_number ??
      q.order_index ??
      q.order ??
      q.q_index ??
      index + 1
  )

  return {
    id: q.id,
    question: q.question ?? q.question_text ?? (q as any).text ?? "",
    question_text: q.question_text ?? q.question ?? (q as any).text ?? "",
    type: "theory",
    options: [],
    correct_answer: "",
    marks,
    points: marks,
    order_number: orderNum,
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

  let objectiveRaw: RawQuestion[]
  let theoryRaw: RawQuestion[]

  if (theoryFromDB.length > 0) {
    theoryRaw = theoryFromDB
    objectiveRaw = allFromDB.filter((q) => q.type !== "theory")
  } else {
    objectiveRaw = allFromDB.filter(
      (q) => q.type === "mcq" || q.type === "objective" || !q.type,
    )
    theoryRaw = allFromDB.filter((q) => q.type === "theory")
  }

  // Preserve true authoring sequence
  const sortedObjectives = sortRawQuestions(objectiveRaw)
  const sortedTheories = sortRawQuestions(theoryRaw)

  // Map into standardized question structures without premature shuffling
  const objectives = sortedObjectives.map((q, idx) => normalizeObjective(q, idx))
  const theories = sortedTheories.map((q, idx) =>
    normalizeTheory(q, sortedObjectives.length + idx),
  )

  return {
    questions: [...objectives, ...theories],
    objectiveCount: objectives.length,
    theoryCount: theories.length,
  }
}