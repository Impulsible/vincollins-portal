/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  Loader2,
  X,
  Eye,
  Save
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import mammoth from 'mammoth'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Question {
  id?: string
  text: string
  type: 'objective' | 'theory'
  options?: string[]
  answer?: string | string[]
  points: number
}

interface ExamData {
  title: string
  subject: string
  class: string
  duration: number
  instructions: string
  questions: Question[]
}

interface ExamUploadProps {
  onUploadSuccess?: (examData: ExamData) => void
  onSave?: (examData: ExamData) => Promise<void>
}

export function ExamUpload({ onUploadSuccess, onSave }: ExamUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const parseWordDocument = async (file: File) => {
    setIsProcessing(true)
    setProgress(10)
    setError(null)
    setFileName(file.name)

    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer()
      setProgress(30)

      // Parse with mammoth
      const result = await mammoth.extractRawText({ arrayBuffer })
      const text = result.value
      setProgress(50)

      // Parse the extracted text into questions
      const parsedData = parseExamText(text, file.name)
      setProgress(80)

      // Validate parsed data
      if (parsedData.questions.length === 0) {
        throw new Error('No questions found in the document')
      }

      setExamData(parsedData)
      setProgress(100)
      
      toast.success(`Successfully parsed ${parsedData.questions.length} questions`)
      
      if (onUploadSuccess) {
        onUploadSuccess(parsedData)
      }
    } catch (err) {
      console.error('Parse error:', err)
      setError(err instanceof Error ? err.message : 'Failed to parse document')
      toast.error('Failed to parse document')
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const parseExamText = (text: string, filename: string): ExamData => {
    const lines = text.split('\n').filter(line => line.trim())
    
    // Extract exam metadata from filename or content
    const examTitle = extractExamTitle(filename, lines)
    const subject = extractSubject(lines)
    const examClass = extractClass(lines)
    const duration = extractDuration(lines)
    const instructions = extractInstructions(lines)
    
    // Parse questions
    const questions = parseQuestions(lines)
    
    return {
      title: examTitle,
      subject: subject,
      class: examClass,
      duration: duration,
      instructions: instructions,
      questions: questions,
    }
  }

  const extractExamTitle = (filename: string, lines: string[]): string => {
    // Try to get title from first line or filename
    const firstLine = lines[0]?.trim()
    if (firstLine && !firstLine.toLowerCase().includes('question')) {
      return firstLine
    }
    return filename.replace(/\.docx?$/, '').replace(/[-_]/g, ' ')
  }

  const extractSubject = (lines: string[]): string => {
    const subjectPattern = /subject:?\s*(.+)/i
    for (const line of lines) {
      const match = line.match(subjectPattern)
      if (match) return match[1].trim()
    }
    return 'General'
  }

  const extractClass = (lines: string[]): string => {
    const classPattern = /class:?\s*(.+)/i
    for (const line of lines) {
      const match = line.match(classPattern)
      if (match) return match[1].trim()
    }
    return 'All Levels'
  }

  const extractDuration = (lines: string[]): number => {
    const durationPattern = /duration:?\s*(\d+)\s*(?:minutes?|mins?)/i
    for (const line of lines) {
      const match = line.match(durationPattern)
      if (match) return parseInt(match[1])
    }
    return 60 // Default 60 minutes
  }

  const extractInstructions = (lines: string[]): string => {
    const instructions: string[] = []
    let inInstructions = false
    
    for (const line of lines) {
      if (line.toLowerCase().includes('instruction')) {
        inInstructions = true
        continue
      }
      if (inInstructions && line.match(/^\d+\./)) {
        break
      }
      if (inInstructions && line.trim()) {
        instructions.push(line.trim())
      }
    }
    
    return instructions.length > 0 
      ? instructions.join(' ') 
      : 'Answer all questions to the best of your ability.'
  }

  const parseQuestions = (lines: string[]): Question[] => {
    const questions: Question[] = []
    let currentQuestion: Partial<Question> = {}
    let isParsingOptions = false
    let currentOptions: string[] = []
    let questionNumber = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Match question numbers (1., 1), etc.)
      const questionMatch = line.match(/^(\d+)[\.\)]\s*(.+)/)
      
      if (questionMatch && !currentQuestion.text) {
        // New question starts
        if (currentQuestion.text) {
          // Save previous question
          questions.push(currentQuestion as Question)
        }
        
        questionNumber = parseInt(questionMatch[1])
        currentQuestion = {
          text: questionMatch[2],
          type: 'objective',
          points: 1,
        }
        isParsingOptions = false
        currentOptions = []
      } 
      else if (currentQuestion.text && line.match(/^[A-D][\.\)]\s*(.+)/i)) {
        // Parse options (A., B., etc.)
        isParsingOptions = true
        const optionMatch = line.match(/^[A-D][\.\)]\s*(.+)/i)
        if (optionMatch) {
          currentOptions.push(optionMatch[1])
        }
      }
      else if (currentQuestion.text && line.toLowerCase().match(/answer:?\s*(.+)/i)) {
        // Parse answer
        const answerMatch = line.match(/answer:?\s*(.+)/i)
        if (answerMatch) {
          currentQuestion.answer = answerMatch[1].trim()
        }
      }
      else if (currentQuestion.text && line.toLowerCase().match(/points:?\s*(\d+)/i)) {
        // Parse points
        const pointsMatch = line.match(/points:?\s*(\d+)/i)
        if (pointsMatch) {
          currentQuestion.points = parseInt(pointsMatch[1])
        }
      }
      else if (currentQuestion.text && line.toLowerCase().includes('theory')) {
        // Theory question
        currentQuestion.type = 'theory'
        isParsingOptions = false
      }
    }
    
    // Add last question
    if (currentQuestion.text) {
      if (currentOptions.length > 0) {
        currentQuestion.options = currentOptions
      }
      questions.push(currentQuestion as Question)
    }
    
    return questions
  }

  const handleSaveExam = async () => {
    if (!examData) return
    
    setIsSaving(true)
    try {
      if (onSave) {
        await onSave(examData)
      }
      toast.success('Exam saved successfully!')
    } catch (err) {
      toast.error('Failed to save exam')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx'))) {
      parseWordDocument(file)
    } else {
      setError('Please upload a valid .docx file')
      toast.error('Invalid file type. Please upload a .docx file')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isProcessing
  })

  const resetUpload = () => {
    setExamData(null)
    setError(null)
    setFileName(null)
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!examData && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300",
            isDragActive 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-gray-300 hover:border-primary hover:bg-gray-50",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Upload className="h-12 w-12 text-primary" />
            </div>
            
            <div>
              <p className="text-lg font-semibold text-gray-700">
                {isDragActive ? "Drop your Word file here" : "Upload Exam Document"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop or click to select a .docx file
              </p>
            </div>
            
            <Button variant="outline" disabled={isProcessing}>
              <FileText className="mr-2 h-4 w-4" />
              Select File
            </Button>
            
            {fileName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>{fileName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Processing Progress */}
      {isProcessing && progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing document...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Parsed Exam Preview */}
      <AnimatePresence>
        {examData && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-primary">Exam Preview</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Review and confirm the parsed exam content
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetUpload}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Exam Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Title</p>
                  <p className="font-medium">{examData.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Subject</p>
                  <p className="font-medium">{examData.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Class</p>
                  <p className="font-medium">{examData.class}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-medium">{examData.duration} minutes</p>
                </div>
              </div>

              {/* Questions Preview */}
              <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Questions ({examData.questions.length})
                </h4>
                {examData.questions.map((q, idx) => (
                  <div key={idx} className="border-l-4 border-primary/30 pl-4 py-2">
                    <p className="font-medium">
                      {idx + 1}. {q.text}
                    </p>
                    {q.type === 'objective' && q.options && (
                      <div className="mt-2 ml-4 space-y-1">
                        {q.options.map((opt, optIdx) => (
                          <p key={optIdx} className="text-sm text-gray-600">
                            {String.fromCharCode(65 + optIdx)}. {opt}
                          </p>
                        ))}
                      </div>
                    )}
                    {q.answer && (
                      <p className="text-sm text-green-600 mt-2">
                        Answer: {q.answer}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {q.points} {q.points === 1 ? 'point' : 'points'} • {q.type}
                    </p>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Instructions</p>
                <p className="text-sm text-blue-700">{examData.instructions}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={resetUpload}>
                  <Eye className="mr-2 h-4 w-4" />
                  Edit Manually
                </Button>
                <Button onClick={handleSaveExam} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save to Database
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>Supported format: .docx (Microsoft Word)</p>
        <p className="mt-1">Document should contain questions numbered 1., 2., etc. with options A., B., etc.</p>
      </div>
    </div>
  )
}