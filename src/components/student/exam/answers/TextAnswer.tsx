// src/components/student/exam/answers/TextAnswer.tsx
import { Textarea } from '@/components/ui/textarea'

interface TextAnswerProps {
  answer: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function TextAnswer({
  answer,
  onChange,
  placeholder = 'Type your answer here...',
  rows = 8,
}: TextAnswerProps) {
  return (
    <Textarea
      value={answer}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors duration-300"
    />
  )
}