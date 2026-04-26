// src/components/student/exam/question/QuestionNavigation.tsx
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Send, LayoutGrid } from 'lucide-react'

interface QuestionNavigationProps {
  currentIndex: number
  totalQuestions: number
  onPrevious: () => void
  onNext: () => void
  onTogglePalette: () => void
  onSubmit: () => void
}

export function QuestionNavigation({
  currentIndex, totalQuestions, onPrevious, onNext, onTogglePalette, onSubmit,
}: QuestionNavigationProps) {
  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalQuestions - 1

  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={isFirst}
        className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      <div className="text-sm text-slate-400 font-medium">
        {currentIndex + 1} <span className="text-slate-300">/</span> {totalQuestions}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onTogglePalette}
        className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Palette</span>
      </Button>

      {isLast ? (
        <Button size="sm" onClick={onSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
          <Send className="h-4 w-4 mr-1" />
          Submit
        </Button>
      ) : (
        <Button size="sm" onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}