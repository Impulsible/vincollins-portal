import type { Question } from "../types"

export function calculateScore(questions: Question[], answers: Record<string, string>) {
  if (!questions.length) return { score: 0, total: 0, percentage: 0, correct: 0, incorrect: 0, unanswered: 0 }
  const obj = questions.filter(q => q.type !== "theory")
  let score = 0, tp = 0, correct = 0, incorrect = 0, unanswered = 0
  obj.forEach(q => {
    const pts = Number(q.points || 1)
    tp += pts
    const ans = answers[q.id]
    const ca = String(q.correct_answer || "").trim()
    if (ans?.trim()) {
      if (ans.trim().toLowerCase() === ca.toLowerCase()) { score += pts; correct++ }
      else { incorrect++ }
    } else { unanswered++ }
  })
  return { score, total: tp, percentage: tp > 0 ? Math.round((score / tp) * 100) : 0, correct, incorrect, unanswered }
}

export function formatTime(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0 ? h + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0") : m + ":" + String(sec).padStart(2, "0")
}

export function formatPoints(p: number): string { return p === 0.5 ? "Half Point" : p + " Point" + (p !== 1 ? "s" : "") }

export function calculateTheoryTotal(q: Question[]): number { return q.filter(x => x.type === "theory").reduce((s, x) => s + Number(x.points || 1), 0) }