/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
 
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Award,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Calendar,
  FileText,
  Loader2,
  Download,
  Share2,
  Printer,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

interface AttemptResult {
  id: string
  exam_title: string
  exam_subject: string
  score: number
  total_points: number
  percentage: number
  grade: string
  time_spent: number
  tab_switches: number
  submitted_at: string
  is_auto_submitted: boolean
  correct_count: number
  incorrect_count: number
  answer_results: Array<{
    question_id: string
    is_correct: boolean
    correct_answer: string
    user_answer: string
    points_earned: number
    points_possible: number
  }>
}

export default function ExamResultsPage() {
  const router = useRouter()
  const params = useParams()
  const attemptId = params.attemptId as string
  
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [studentName, setStudentName] = useState('')
  const [userId, setUserId] = useState('') // ✅ Added userId state

  useEffect(() => {
    loadResults()
  }, [])

  async function loadResults() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal')
        return
      }

      setUserId(user.id) // ✅ Store user ID

      const { data: attempt, error } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exam:exams(title, subject)
        `)
        .eq('id', attemptId)
        .single()

      if (error) throw error

      // Get student name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setStudentName(profile?.full_name || 'Student')

      setResult({
        id: attempt.id,
        exam_title: attempt.exam?.title || 'Unknown',
        exam_subject: attempt.exam?.subject || 'Unknown',
        score: attempt.score || 0,
        total_points: attempt.total_points || 0,
        percentage: attempt.percentage || 0,
        grade: attempt.grade || 'F',
        time_spent: attempt.time_spent || 0,
        tab_switches: attempt.tab_switches || 0,
        submitted_at: attempt.submitted_at,
        is_auto_submitted: attempt.is_auto_submitted || false,
        correct_count: attempt.correct_count || 0,
        incorrect_count: attempt.incorrect_count || 0,
        answer_results: attempt.answer_results || []
      })

    } catch (error) {
      console.error('Error loading results:', error)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100'
      case 'B': return 'text-blue-600 bg-blue-100'
      case 'C': return 'text-yellow-600 bg-yellow-100'
      case 'D': return 'text-orange-600 bg-orange-100'
      default: return 'text-red-600 bg-red-100'
    }
  }

  if (loading) {
    return (
      <>
        <Header user={{ id: userId || 'student', isAuthenticated: true, name: 'Student', role: 'student', email: '' }} />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    )
  }

  if (!result) return null

  return (
    <>
      <Header user={{ id: userId, isAuthenticated: true, name: studentName, role: 'student', email: '' }} />
      
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold">Exam Results</h1>
            <p className="text-muted-foreground mt-1">{result.exam_title} • {result.exam_subject}</p>
          </div>

          {/* Score Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Your Score</p>
                <p className="text-3xl font-bold text-primary">{result.score}/{result.total_points}</p>
                <Progress value={result.percentage} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="text-3xl font-bold">{Math.round(result.percentage)}%</p>
                <p className="text-sm text-muted-foreground mt-1">{result.grade} Grade</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-3xl font-bold">{formatTime(result.time_spent)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Performance</p>
                <div className="flex items-center justify-center gap-4 mt-1">
                  <div className="text-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                    <p className="text-sm font-bold">{result.correct_count}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="text-center">
                    <XCircle className="h-6 w-6 text-red-500 mx-auto" />
                    <p className="text-sm font-bold">{result.incorrect_count}</p>
                    <p className="text-xs text-muted-foreground">Incorrect</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grade Card */}
          <Card className="mb-8 bg-gradient-to-r from-primary to-primary/80 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-sm opacity-90">Final Grade</p>
              <p className="text-6xl font-bold">{result.grade}</p>
              <p className="text-sm opacity-90 mt-2">
                {result.percentage >= 80 ? 'Excellent! Outstanding performance!' :
                 result.percentage >= 70 ? 'Good job! Well done!' :
                 result.percentage >= 60 ? 'Satisfactory! Keep improving!' :
                 result.percentage >= 50 ? 'Passed! Room for improvement' :
                 'Needs improvement. Keep studying!'}
              </p>
            </CardContent>
          </Card>

          {/* Detailed Answer Review */}
          <Card>
            <CardHeader>
              <CardTitle>Answer Review</CardTitle>
              <CardDescription>Review your answers and see where you can improve</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.answer_results.map((answer, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Q{idx + 1}</Badge>
                        {answer.is_correct ? (
                          <Badge className="bg-green-100 text-green-700">Correct</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">Incorrect</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {answer.points_earned}/{answer.points_possible} pts
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Your Answer:</p>
                        <p className="text-sm">{answer.user_answer || 'No answer provided'}</p>
                      </div>
                      
                      {!answer.is_correct && answer.correct_answer && (
                        <div>
                          <p className="text-sm font-medium text-green-600">Correct Answer:</p>
                          <p className="text-sm">{answer.correct_answer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button variant="outline" onClick={() => router.push('/student')}>
              Back to Dashboard
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Results
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}