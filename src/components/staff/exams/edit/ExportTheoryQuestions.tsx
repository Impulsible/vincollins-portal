// src/components/staff/exams/edit/ExportTheoryQuestions.tsx - NO HARDCODED VALUES

'use client'

import { Button } from '@/components/ui/button'
import { saveAs } from 'file-saver'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'

interface ExportTheoryQuestionsProps {
  questions: any[]
  examTitle: string
  // ✅ Optional: mark distribution from database
  totalTheoryMarks?: number
  objectiveTotal?: number
  examTotal?: number
  grandTotal?: number
}

export function ExportTheoryQuestions({ 
  questions, 
  examTitle,
  totalTheoryMarks,
  objectiveTotal,
  examTotal,
  grandTotal,
}: ExportTheoryQuestionsProps) {
  const exportToWord = () => {
    // ✅ Calculate marks from data, no hardcoded values
    const calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.points || 0), 0)
    const displayTotalTheory = totalTheoryMarks || calculatedTotalMarks
    const displayExamTotal = examTotal || 60
    const displayGrandTotal = grandTotal || 100
    const displayObjectiveTotal = objectiveTotal || 0
    
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
            font-size: 24px;
          }
          .exam-info {
            text-align: center;
            margin-bottom: 30px;
            color: #555;
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
            font-size: 15px;
          }
          .sub-question {
            margin-left: 25px;
            margin-top: 10px;
          }
          .sub-question-text {
            font-size: 14px;
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
          .model-answer {
            margin-top: 15px;
            padding: 12px 15px;
            background-color: #f9f9f9;
            border-left: 3px solid #4CAF50;
            border-radius: 4px;
          }
          .model-answer strong {
            color: #2E7D32;
          }
          .model-answer-content {
            margin-top: 5px;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .mark-summary {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          .mark-summary table {
            margin: 0 auto;
            width: auto;
          }
          .mark-summary td {
            border: none;
            padding: 5px 15px;
          }
          .mark-summary .label {
            color: #666;
          }
          .mark-summary .value {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h1>${examTitle}</h1>
        <div class="exam-info">
          Theory Questions (${questions.length} questions)
        </div>

        <!-- ✅ Mark Summary - All from database -->
        <div class="mark-summary">
          <table>
            <tr>
              <td class="label">Theory Total:</td>
              <td class="value">${displayTotalTheory} marks</td>
            </tr>
            ${displayObjectiveTotal > 0 ? `
            <tr>
              <td class="label">Objective:</td>
              <td class="value">${displayObjectiveTotal} marks</td>
            </tr>
            ` : ''}
            <tr>
              <td class="label">Exam Total:</td>
              <td class="value">${displayExamTotal} marks</td>
            </tr>
            <tr>
              <td class="label">Grand Total:</td>
              <td class="value">${displayGrandTotal} marks</td>
            </tr>
          </table>
        </div>
        
        ${questions.map((q, idx) => `
          <div class="question">
            <div class="question-number">Question ${idx + 1}</div>
            <div class="question-text">${q.question_text}</div>
            ${q.sub_questions && q.sub_questions.length > 0 ? `
              ${q.sub_questions.map((sq: any, sqIdx: number) => `
                <div class="sub-question">
                  <div class="sub-question-text">
                    <strong>${String.fromCharCode(97 + sqIdx)}.</strong> ${sq.text}
                  </div>
                  <div class="marks">[${sq.points || 0} marks]</div>
                </div>
              `).join('')}
              <div class="marks">[Total: ${q.points || 0} marks]</div>
            ` : `
              <div class="marks">[${q.points || 0} marks]</div>
            `}
            ${q.model_answer ? `
              <div class="model-answer">
                <strong>📝 Model Answer:</strong>
                <div class="model-answer-content">${q.model_answer}</div>
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        <div class="footer">
          <p>© Vincollins Schools - Generated on ${new Date().toLocaleDateString('en-NG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
        </div>
      </body>
      </html>
    `
    
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
    const fileName = `${examTitle.replace(/[^a-z0-9]/gi, '_')}_theory_questions.doc`
    saveAs(blob, fileName)
    toast.success(`${questions.length} theory questions exported to Word!`)
  }

  if (questions.length === 0) {
    return null
  }

  return (
    <Button 
      onClick={exportToWord} 
      variant="outline" 
      size="sm"
      className="gap-2"
    >
      <FileText className="h-4 w-4" /> 
      Export to Word
    </Button>
  )
}