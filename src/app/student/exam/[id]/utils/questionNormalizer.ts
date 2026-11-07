// src/app/student/exam/[id]/utils/questionNormalizer.ts

import type { RawQuestion, Question, Exam, TheorySubQuestion } from "../types"

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function normalizeObjective(q: RawQuestion, index: number): Question {
  const marks = Number(q.marks ?? q.points ?? 0.5)
  return {
    id: q.id,
    question: q.question ?? q.question_text ?? "",
    question_text: q.question_text ?? q.question ?? "",
    type: "objective",
    options: q.options ?? [],
    correct_answer: q.correct_answer ?? "",
    marks,
    points: marks,
    order_number: q.order ?? q.order_number ?? index + 1,
    is_theory: false,
  }
}

function normalizeTheory(q: RawQuestion, index: number): Question {
  const marks = Number(q.marks ?? q.points ?? 10)
  return {
    id: q.id,
    question: q.question ?? q.question_text ?? "",
    question_text: q.question_text ?? q.question ?? "",
    type: "theory",
    options: [],
    correct_answer: "",
    marks,
    points: marks,
    order_number: q.order ?? q.order_number ?? index + 1,
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

  const shouldShuffle =
    exam.shuffle_questions !== false && exam.randomize_questions !== false

  const objectives = objectiveRaw.map(normalizeObjective)
  const theories = theoryRaw.map(normalizeTheory)
  const orderedObjectives = shouldShuffle ? shuffleArray(objectives) : objectives

  return {
    questions: [...orderedObjectives, ...theories],
    objectiveCount: objectives.length,
    theoryCount: theories.length,
  }
}