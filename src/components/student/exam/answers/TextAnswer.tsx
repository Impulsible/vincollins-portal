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
      className="w-full bg-[#0a0f1a] border-gray-700 text-gray-200 rounded-md focus:border-[#c41e3a] focus:ring-[#c41e3a] resize-none text-base"
    />
  )
}
