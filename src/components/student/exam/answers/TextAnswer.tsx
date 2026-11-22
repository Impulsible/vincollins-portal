'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Minimize2, Maximize2, PenLine } from 'lucide-react'

interface TextAnswerProps {
  answer: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  examId?: string
  questionId?: string
}

export function TextAnswer({
  answer,
  onChange,
  placeholder = 'Type your answer here...',
  rows = 8,
  examId,
  questionId,
}: TextAnswerProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const trimmed = answer?.trim() || ''
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0

  const storageKey = useMemo(() => {
    if (examId && questionId) return `cbt_text_min_${examId}_${questionId}`
    if (examId) return `cbt_text_min_${examId}`
    return 'cbt_text_min_default'
  }, [examId, questionId])

  // Restore persistence on load/change
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        setIsMinimized(JSON.parse(stored) === true)
      } else {
        setIsMinimized(false)
      }
    } catch {
      setIsMinimized(false)
    }
  }, [storageKey])

  const toggleMinimize = useCallback((targetState?: boolean) => {
    setIsMinimized((prev) => {
      const next = typeof targetState === 'boolean' ? targetState : !prev
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next))
        } catch (err) {
          console.warn('Could not persist textarea minimize state:', err)
        }
      }
      return next
    })
  }, [storageKey])

  return (
    <div className="space-y-2">
      {/* Header bar with controls */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {wordCount > 0 ? `${wordCount} words written` : 'Type your answer below'}
        </span>
        <button
          type="button"
          onClick={() => toggleMinimize()}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded transition-colors"
        >
          {isMinimized ? (
            <>
              <Maximize2 className="w-3 h-3 text-indigo-500" />
              <span>Expand Box</span>
            </>
          ) : (
            <>
              <Minimize2 className="w-3 h-3 text-slate-400" />
              <span>Minimize Box</span>
            </>
          )}
        </button>
      </div>

      {/* Minimized or Expanded View */}
      {isMinimized ? (
        <div
          onClick={() => toggleMinimize(false)}
          className="p-3 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <PenLine className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
              {trimmed ? `Draft: "${trimmed.slice(0, 100)}${trimmed.length > 100 ? '...' : ''}"` : 'Answer box collapsed. Click to expand and type.'}
            </span>
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
            Expand
          </span>
        </div>
      ) : (
        <Textarea
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors duration-300"
        />
      )}
    </div>
  )
}