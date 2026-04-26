// src/components/student/exam/palette/QuestionPalette.tsx
import { cn } from '@/lib/utils'
import type { Question } from '@/app/student/exam/[id]/types'

interface QuestionPaletteProps {
  questions: Question[]
  currentIndex: number
  answers: Record<string, string>
  flaggedQuestions: Set<string>
  onGoToQuestion: (index: number) => void
}

export function QuestionPalette({
  questions, currentIndex, answers, flaggedQuestions, onGoToQuestion,
}: QuestionPaletteProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <h4 className="font-semibold text-slate-700 text-sm mb-3">Question Palette</h4>
      
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-48 overflow-y-auto">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id]
          const isFlagged = flaggedQuestions.has(q.id)
          const isCurrent = idx === currentIndex

          return (
            <button
              key={q.id}
              onClick={() => onGoToQuestion(idx)}
              className={cn(
                "h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all",
                isCurrent && "ring-2 ring-blue-400 ring-offset-1",
                isAnswered && !isFlagged && "bg-emerald-100 text-emerald-700",
                isFlagged && "bg-amber-100 text-amber-700",
                isCurrent && "bg-blue-600 text-white",
                !isAnswered && !isFlagged && !isCurrent && "bg-slate-100 text-slate-400 hover:bg-slate-200"
              )}
            >
              {idx + 1}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-100" /> Answered</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-100" /> Flagged</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-100" /> Unanswered</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-600" /> Current</div>
      </div>
    </div>
  )
}