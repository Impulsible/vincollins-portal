import { SUBJECT_CONFIG, DEFAULT_SUBJECT_CONFIG } from "./constants"
import type { SubjectConfig } from "./types"

export function getSubjectCountForClass(className: string): number {
  if (!className) return 17
  const c = className.toString().toUpperCase().replace(/\s+/g, "")
  if (c.startsWith("JSS")) return 17
  if (c.startsWith("SS")) return 10
  return 17
}

export function calculateGrade(percentage: number): { grade: string; color: string } {
  if (percentage >= 80) return { grade: "A", color: "text-emerald-600" }
  if (percentage >= 70) return { grade: "B", color: "text-blue-600" }
  if (percentage >= 60) return { grade: "C", color: "text-amber-600" }
  if (percentage >= 50) return { grade: "P", color: "text-orange-600" }
  return { grade: "F", color: "text-red-600" }
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
