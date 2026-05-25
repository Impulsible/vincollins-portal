// src/components/staff/exams/edit/QuestionPreviewModal.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, X } from 'lucide-react'

interface QuestionPreviewModalProps {
  question: any
  open: boolean
  onOpenChange: (open: boolean) => void
  index: number
}

export function QuestionPreviewModal({ question, open, onOpenChange, index }: QuestionPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Question {index} Preview</span>
            <Badge className="bg-purple-100 text-purple-700">{question.points} marks</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="prose prose-sm max-w-none">
          <div className="question-preview">
            <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
            
            {question.sub_questions && question.sub_questions.length > 0 && (
              <div className="mt-4 space-y-3">
                {question.sub_questions.map((sq: any, sqIdx: number) => (
                  <div key={sq.id} className="ml-6 border-l-2 border-purple-200 pl-4">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-purple-600">{String.fromCharCode(97 + sqIdx)}.</span>
                      <div dangerouslySetInnerHTML={{ __html: sq.text }} />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">[{sq.points} marks]</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {question.keywords && question.keywords.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <p className="text-sm font-semibold text-amber-800">Grading Keywords:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {question.keywords.map((k: string) => (
                <Badge key={k} variant="outline" className="text-xs bg-white">{k}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {question.model_answer && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold text-green-800">Model Answer:</p>
            <div className="text-sm mt-1" dangerouslySetInnerHTML={{ __html: question.model_answer }} />
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}