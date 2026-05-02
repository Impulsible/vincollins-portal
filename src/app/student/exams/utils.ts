// src/app/student/exams/utils.ts
import { SUBJECT_CONFIG, DEFAULT_SUBJECT_CONFIG } from "./constants"
import type { SubjectConfig } from "./types"

export function getSubjectCountForClass(className: string): number {
  if (!className) return 17
  const c = className.toString().toUpperCase().replace(/\s+/g, "")
  if (c.startsWith("JSS")) return 17
  if (c.startsWith("SS")) return 10
  return 17
}

// Overall Term Grade (used in dashboard banner & term progress)
export function calculateGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 80) return { grade: "A", color: "text-emerald-600" }
  if (percentage >= 70) return { grade: "B", color: "text-blue-600" }
  if (percentage >= 60) return { grade: "C", color: "text-amber-600" }
  if (percentage >= 50) return { grade: "P", color: "text-orange-600" }
  return { grade: "F", color: "text-red-600" }
}

// WAEC Subject Grade (used in result detail page & staff CA scores)
export function calculateWAECGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 75) return { grade: "A1", color: "text-emerald-600" }
  if (percentage >= 70) return { grade: "B2", color: "text-blue-600" }
  if (percentage >= 65) return { grade: "B3", color: "text-sky-600" }
  if (percentage >= 60) return { grade: "C4", color: "text-teal-600" }
  if (percentage >= 55) return { grade: "C5", color: "text-amber-600" }
  if (percentage >= 50) return { grade: "C6", color: "text-orange-500" }
  if (percentage >= 45) return { grade: "D7", color: "text-yellow-600" }
  if (percentage >= 40) return { grade: "E8", color: "text-red-400" }
  return { grade: "F9", color: "text-red-600" }
}

export function getSubjectConfig(subject: string): SubjectConfig {
  return SUBJECT_CONFIG[subject] || DEFAULT_SUBJECT_CONFIG
}

export function getCurrentTermSession(): { term: string; session: string } {
  const now = new Date()
  const month = now.getMonth() + 1
  if (month >= 9 && month <= 12) return { term: "first", session: "2025/2026" }
  if (month >= 1 && month <= 4) return { term: "second", session: "2025/2026" }
  return { term: "third", session: "2025/2026" }
}

export function getTermLabel(term: string, sessionYear: string): string {
  const names: Record<string, string> = { first: "First Term", second: "Second Term", third: "Third Term" }
  return (names[term] || term) + " " + sessionYear
}

export function normalizeClassName(className: string): string {
  return className.replace(/\s+/g, "").toUpperCase()
}