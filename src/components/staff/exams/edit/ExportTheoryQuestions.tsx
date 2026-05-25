// src/components/staff/exams/edit/ExportTheoryQuestions.tsx
'use client'

import { Button } from '@/components/ui/button'
import { saveAs } from 'file-saver'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'

interface ExportTheoryQuestionsProps {
  questions: any[]
  examTitle: string
}

export function ExportTheoryQuestions({ questions, examTitle }: ExportTheoryQuestionsProps) {
  const exportToWord = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${examTitle} - Theory Questions</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            margin: 2cm;
            line-height: 1.5;
          }
          h1 {
            text-align: center;
            margin-bottom: 30px;
          }
          .question {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          .question-number {
            font-weight: bold;
            font-size: 16px;
          }
          .question-text {
            margin: 10px 0;
          }
          .sub-question {
            margin-left: 25px;
            margin-top: 10px;
          }
          .marks {
            color: #666;
            font-size: 12px;
            margin-top: 5px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <h1>${examTitle}</h1>
        <h2>Theory Questions (${questions.length} questions)</h2>
        <p><strong>Total Marks: ${questions.reduce((sum, q) => sum + (q.points || 0), 0)}</strong></p>
        
        ${questions.map((q, idx) => `
          <div class="question">
            <div class="question-number">${idx + 1}. </div>
            <div class="question-text">${q.question_text}</div>
            ${q.sub_questions && q.sub_questions.length > 0 ? `
              ${q.sub_questions.map((sq: any, sqIdx: number) => `
                <div class="sub-question">
                  <strong>${String.fromCharCode(97 + sqIdx)}.</strong> ${sq.text}
                  <div class="marks">[${sq.points} marks]</div>
                </div>
              `).join('')}
              <div class="marks">[Total: ${q.points} marks]</div>
            ` : `
              <div class="marks">[${q.points} marks]</div>
            `}
            ${q.model_answer ? `
              <div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #4CAF50;">
                <strong>Model Answer:</strong>
                <div>${q.model_answer}</div>
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        <div class="footer">
          <p>© Vincollins Schools - Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `
    
    const blob = new Blob([html], { type: 'application/msword' })
    saveAs(blob, `${examTitle.replace(/[^a-z0-9]/gi, '_')}_theory_questions.doc`)
    toast.success('Questions exported to Word successfully!')
  }

  return (
    <Button onClick={exportToWord} variant="outline" size="sm">
      <FileText className="mr-2 h-4 w-4" /> Export to Word
    </Button>
  )
}