/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SecureExamInterface, Question as SecureExamQuestion } from '@/components/cbt/secure-exam-interface'
import { ResultCard } from '@/components/cbt/result-card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

// Define the API response question type
interface ApiQuestion {
  id: string
  exam_id: string
  question_text: string
  type: 'objective' | 'theory' | 'true-false' | 'matching' | 'fill-blank'
  options?: string[]
  correct_answer?: string | string[]
  points: number
  image_url?: string
  explanation?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  order?: number
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  status: 'draft' | 'published' | 'archived' | 'scheduled' | 'in-progress' | 'completed'
  instructions: string
  passing_score?: number
  max_attempts?: number
  shuffle_questions?: boolean
  shuffle_options?: boolean
  start_date?: string
  end_date?: string
}

interface ExamResult {
  exam_title: string
  score: number
  total: number
  percentage: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  time_spent: number
  correct_answers: number
  wrong_answers: number
  submitted_at: string
  answers?: Record<string, any>
}

const isAnswerCorrect = (question: ApiQuestion, userAnswer: any): boolean => {
  switch (question.type) {
    case 'objective':
    case 'true-false':
      return question.correct_answer === userAnswer

    case 'theory':
      // Theory questions need manual grading
      return false

    case 'matching':
      if (typeof question.correct_answer === 'object' && typeof userAnswer === 'object') {
        return JSON.stringify(question.correct_answer) === JSON.stringify(userAnswer)
      }
      return false

    case 'fill-blank':
      const correct = typeof question.correct_answer === 'string' 
        ? question.correct_answer.toLowerCase().trim() 
        : ''
      const answer = typeof userAnswer === 'string' 
        ? userAnswer.toLowerCase().trim() 
        : ''
      return correct === answer

    default:
      return false
  }
}

// Convert API question to SecureExamInterface question format
const convertToSecureExamQuestion = (apiQuestion: ApiQuestion): SecureExamQuestion => {
  return {
    id: apiQuestion.id,
    exam_id: apiQuestion.exam_id,
    question_text: apiQuestion.question_text,
    type: apiQuestion.type,
    options: apiQuestion.options,
    correct_answer: typeof apiQuestion.correct_answer === 'string' 
      ? apiQuestion.correct_answer 
      : undefined,
    points: apiQuestion.points,
    image_url: apiQuestion.image_url,
    explanation: apiQuestion.explanation,
    difficulty: apiQuestion.difficulty,
    order: apiQuestion.order
  }
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const examId = params?.id as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<ApiQuestion[]>([])
  const [secureQuestions, setSecureQuestions] = useState<SecureExamQuestion[]>([])
  const [result, setResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check authentication
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login')
    }
  }, [sessionStatus, router])

  // Fetch exam data from API
  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId || sessionStatus !== 'authenticated') return

      setLoading(true)
      setError(null)

      try {
        // Fetch exam details
        const examResponse = await fetch(`/api/exams/${examId}`)

        if (!examResponse.ok) {
          if (examResponse.status === 404) {
            setError('Exam not found')
          } else if (examResponse.status === 403) {
            setError('You do not have permission to access this exam')
          } else {
            throw new Error('Failed to fetch exam')
          }
          return
        }

        const examData = await examResponse.json()
        
        // Check exam availability
        const now = new Date()
        const startDate = examData.start_date ? new Date(examData.start_date) : null
        const endDate = examData.end_date ? new Date(examData.end_date) : null

        if (startDate && now < startDate) {
          setError(`This exam has not started yet. It will be available on ${startDate.toLocaleString()}`)
          setLoading(false)
          return
        }

        if (endDate && now > endDate) {
          setError('This exam has ended')
          setLoading(false)
          return
        }

        if (examData.status !== 'published') {
          setError('This exam is not available')
          setLoading(false)
          return
        }

        // Check attempts
        const attemptsResponse = await fetch(`/api/exams/${examId}/attempts`)
        if (attemptsResponse.ok) {
          const attemptsData = await attemptsResponse.json()
          if (examData.max_attempts && attemptsData.count >= examData.max_attempts) {
            setError('You have exceeded the maximum number of attempts for this exam')
            setLoading(false)
            return
          }
        }

        setExam(examData)

        // Fetch exam questions
        const questionsResponse = await fetch(`/api/exams/${examId}/questions`)

        if (!questionsResponse.ok) {
          throw new Error('Failed to fetch questions')
        }

        const questionsData = await questionsResponse.json()

        if (!questionsData || questionsData.length === 0) {
          setError('This exam does not have any questions. Please contact your instructor.')
          setLoading(false)
          return
        }

        // Shuffle questions if enabled
        let processedQuestions = questionsData
        if (examData.shuffle_questions) {
          processedQuestions = [...questionsData].sort(() => Math.random() - 0.5)
        }

        // Shuffle options if enabled
        if (examData.shuffle_options) {
          processedQuestions = processedQuestions.map((q: ApiQuestion) => ({
            ...q,
            options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : q.options
          }))
        }

        setQuestions(processedQuestions)
        
        // Convert to SecureExamQuestion format
        const convertedQuestions = processedQuestions.map(convertToSecureExamQuestion)
        setSecureQuestions(convertedQuestions)
      } catch (err) {
        console.error('Error fetching exam:', err)
        setError('Failed to load exam. Please try again.')
        toast.error('Failed to load exam')
      } finally {
        setLoading(false)
      }
    }

    fetchExamData()
  }, [examId, sessionStatus])

  const handleSubmitExam = async (answers: Record<string, any>, timeSpent: number) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // Calculate results
      let correctCount = 0
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
      let earnedPoints = 0

      for (const question of questions) {
        const answer = answers[question.id]
        const isCorrect = isAnswerCorrect(question, answer)

        if (isCorrect) {
          correctCount++
          earnedPoints += question.points
        }
      }

      const percentage = (earnedPoints / totalPoints) * 100

      let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F'
      if (percentage >= 80) grade = 'A'
      else if (percentage >= 70) grade = 'B'
      else if (percentage >= 60) grade = 'C'
      else if (percentage >= 50) grade = 'D'

      const resultData: ExamResult = {
        exam_title: exam?.title || 'Exam',
        score: earnedPoints,
        total: totalPoints,
        percentage,
        grade,
        time_spent: timeSpent,
        correct_answers: correctCount,
        wrong_answers: questions.length - correctCount,
        submitted_at: new Date().toISOString(),
        answers,
      }

      // Submit answers to API
      const response = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          timeSpent,
          submittedAt: new Date().toISOString(),
          result: resultData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit exam')
      }

      const submittedData = await response.json()
      setResult({
        ...resultData,
        answers: submittedData.answers,
      })

      // Clear saved answers
      localStorage.removeItem(`exam-${examId}-answers`)
      
      toast.success('Exam submitted successfully!')
    } catch (err) {
      console.error('Error submitting exam:', err)
      toast.error('Failed to submit exam. Please try again.')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadCertificate = async () => {
    if (!result) return

    try {
      const response = await fetch(`/api/exams/${examId}/certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate certificate')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${exam?.title}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Certificate downloaded successfully!')
    } catch (err) {
      console.error('Error downloading certificate:', err)
      toast.error('Failed to download certificate')
    }
  }

  const handleRetake = () => {
    setResult(null)
    router.push('/cbt')
  }

  const handleBack = () => {
    router.back()
  }

  // Loading state
  if (loading || sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6" />
            <p className="text-gray-600 text-lg">Loading your exam...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your questions</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Available</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={handleBack} className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Exams
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Result state
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <ResultCard 
            result={result} 
            onDownload={handleDownloadCertificate}
          />
          <div className="text-center mt-8">
            <Button
              onClick={handleRetake}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              ← Back to Exams
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // No exam found
  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-yellow-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Found</h1>
            <p className="text-gray-600 mb-6">The exam you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Button onClick={handleBack} className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Exams
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Secure exam interface
  return (
    <SecureExamInterface
      examId={exam.id}
      userId={session?.user?.id as string}
      examTitle={exam.title}
      duration={exam.duration}
      questions={secureQuestions}
      onSubmit={handleSubmitExam}
      isSubmitting={isSubmitting}
    />
  )
}