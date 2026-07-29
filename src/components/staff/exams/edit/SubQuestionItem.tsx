// src/components/staff/exams/edit/SubQuestionItem.tsx - UPDATED WITH MARK SYSTEM

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { useState } from 'react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

interface SubQuestionData {
  id: string
  text: string
  points: number
  keywords?: string[]
  model_answer?: string
}

interface SubQuestionItemProps {
  subQuestion: SubQuestionData
  index: number
  onUpdate: (data: Partial<SubQuestionData>) => void
  onDelete: () => void
  // ✅ Added: mark configuration from database
  defaultMark?: number
  totalTheoryMarks?: number
  theoryQuestionCount?: number
}

export function SubQuestionItem({ 
  subQuestion, 
  index, 
  onUpdate, 
  onDelete,
  defaultMark = 0,
  totalTheoryMarks = 0,
  theoryQuestionCount = 0,
}: SubQuestionItemProps) {
  const [keywords, setKeywords] = useState<string[]>(subQuestion.keywords || [])
  const [keywordInput, setKeywordInput] = useState('')

  // ✅ Calculate marks per sub-question
  const marksPerSubQuestion = theoryQuestionCount > 0 && totalTheoryMarks > 0 
    ? totalTheoryMarks / theoryQuestionCount 
    : 0

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase()
    if (!keyword) return
    if (keywords.includes(keyword)) return
    if (keywords.length >= 5) return
    const newKeywords = [...keywords, keyword]
    setKeywords(newKeywords)
    setKeywordInput('')
    onUpdate({ keywords: newKeywords })
  }

  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = keywords.filter(k => k !== keyword)
    setKeywords(newKeywords)
    onUpdate({ keywords: newKeywords })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  return (
    <div className="border-l-4 border-purple-300 pl-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-purple-700">
            Sub-question {String.fromCharCode(96 + index)}.
          </Label>
          {marksPerSubQuestion > 0 && (
            <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200">
              {marksPerSubQuestion.toFixed(2)} marks each
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0 text-red-500">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <RichTextEditor
          content={subQuestion.text}
          onChange={(html) => onUpdate({ text: html })}
          placeholder="Enter sub-question text..."
          minHeight="100px"
        />
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Points</Label>
            <Input
              type="number"
              value={subQuestion.points}
              onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 0 })}
              min={0}
              max={30}
              className="mt-1"
              placeholder={marksPerSubQuestion > 0 ? marksPerSubQuestion.toFixed(2) : "0"}
            />
            {marksPerSubQuestion > 0 && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                Suggested: {marksPerSubQuestion.toFixed(2)} marks
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs">Keywords</Label>
            <div className="flex gap-1 mt-1">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add keyword"
                className="flex-1 text-sm"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddKeyword}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {keywords.map(k => (
                  <Badge key={k} variant="secondary" className="text-xs">
                    {k}
                    <button onClick={() => handleRemoveKeyword(k)} className="ml-1 hover:text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <Label className="text-xs">Model Answer (Optional)</Label>
          <RichTextEditor
            content={subQuestion.model_answer || ''}
            onChange={(html) => onUpdate({ model_answer: html })}
            placeholder="Enter model answer for this sub-question..."
            minHeight="80px"
          />
        </div>
      </div>
    </div>
  )
}