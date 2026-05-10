/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
 
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save, ChevronLeft, ChevronRight, Award, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface TheoryAnswer {
  id: string
  question_text: string
  answer_text: string
  points: number
  points_awarded: number
  teacher_feedback: string
}

interface Attempt {
  id: string
  student_name: string
  student_class: string
  exam_title: string
  exam_subject: string
  objective_score: number
  theory_score: number
  total_score: number
  percentage: number
}

export default function GradeTheoryPage() {
  const router = useRouter()
  const params = useParams()
  const attemptId = params.attemptId as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [theoryAnswers, setTheoryAnswers] = useState<TheoryAnswer[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [pointsAwarded, setPointsAwarded] = useState(0)

  useEffect(() => {
    loadTheoryAnswers()
  }, [])

  async function loadTheoryAnswers() {
    setLoading(true)
    try {
      // Get attempt details with student and exam info
      const { data: attemptData, error: attemptError } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          student:profiles!student_id(full_name, class),
          exam:exams(title, subject)
        `)
        .eq('id', attemptId)
        .single()

      if (attemptError) throw attemptError

      setAttempt({
        id: attemptData.id,
        student_name: attemptData.student?.full_name,
        student_class: attemptData.student?.class,
        exam_title: attemptData.exam?.title,
        exam_subject: attemptData.exam?.subject,
        objective_score: attemptData.score || 0,
        theory_score: 0,
        total_score: 0,
        percentage: 0
      })

      // Get theory answers
      const { data: theoryData, error: theoryError } = await supabase
        .from('theory_answers')
        .select(`
          *,
          question:questions(question_text, points)
        `)
        .eq('attempt_id', attemptId)

      if (theoryError) throw theoryError

      const formatted = (theoryData || []).map(t => ({
        id: t.id,
        question_text: t.question?.question_text || '',
        answer_text: t.answer_text || '',
        points: t.question?.points || 1,
        points_awarded: t.points_awarded || 0,
        teacher_feedback: t.teacher_feedback || ''
      }))

      setTheoryAnswers(formatted)
      
      if (formatted.length > 0) {
        setPointsAwarded(formatted[0].points_awarded)
        setFeedback(formatted[0].teacher_feedback)
      }

    } catch (error) {
      console.error('Error loading theory answers:', error)
      toast.error('Failed to load answers')
    } finally {
      setLoading(false)
    }
  }

  async function saveCurrentGrading() {
    const current = theoryAnswers[currentIndex]
    if (!current) return

    try {
      const { error } = await supabase
        .from('theory_answers')
        .update({
          points_awarded: pointsAwarded,
          teacher_feedback: feedback,
          graded_at: new Date().toISOString()
        })
        .eq('id', current.id)

      if (error) throw error

      // Update local state
      const updated = [...theoryAnswers]
      updated[currentIndex] = {
        ...current,
        points_awarded: pointsAwarded,
        teacher_feedback: feedback
      }
      setTheoryAnswers(updated)

      toast.success('Answer saved')

    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Failed to save')
    }
  }

  async function finalizeGrading() {
    setSaving(true)
    try {
      // Save current if any changes
      await saveCurrentGrading()

      // Calculate total theory score
      const totalTheoryPoints = theoryAnswers.reduce((sum, t) => sum + t.points, 0)
      const earnedTheoryPoints = theoryAnswers.reduce((sum, t) => sum + (t.points_awarded || 0), 0)
      
      const totalScore = (attempt?.objective_score || 0) + earnedTheoryPoints
      const totalPoints = totalTheoryPoints + (attempt?.objective_score || 0)
      const percentage = (totalScore / totalPoints) * 100
      
      let grade = 'F'
      if (percentage >= 80) grade = 'A'
      else if (percentage >= 70) grade = 'B'
      else if (percentage >= 60) grade = 'C'
      else if (percentage >= 50) grade = 'D'

      // Update exam attempt
      const { error } = await supabase
        .from('exam_attempts')
        .update({
          score: totalScore,
          percentage,
          grade,
          status: 'graded',
          theory_score: earnedTheoryPoints
        })
        .eq('id', attemptId)

      if (error) throw error

      toast.success('Grading completed successfully!')
      router.push('/staff/exams')

    } catch (error) {
      console.error('Error finalizing:', error)
      toast.error('Failed to finalize grading')
    } finally {
      setSaving(false)
    }
  }

  const current = theoryAnswers[currentIndex]
  const isLast = currentIndex === theoryAnswers.length - 1

  if (loading) {
    return (
      <>
        <Header user={{ id: 'staff', isAuthenticated: true, name: 'Staff', firstName: 'Staff', role: 'teacher', email: '' }} />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <Footer />
      </>
    )
  }

  if (theoryAnswers.length === 0) {
    return (
      <>
        <Header user={{ id: 'staff', isAuthenticated: true, name: 'Staff', firstName: 'Staff', role: 'teacher', email: '' }} />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <Card className="text-center p-8">
            <p className="text-muted-foreground">No theory questions to grade</p>
            <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
          </Card>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header user={{ id: 'staff', isAuthenticated: true, name: 'Staff', firstName: 'Staff', role: 'teacher', email: '' }} />
      
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </Button>
          </div>

          {/* Exam Info */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">{attempt?.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{attempt?.student_class}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exam</p>
                  <p className="font-medium">{attempt?.exam_title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{attempt?.exam_subject}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Question List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Theory Questions</CardTitle>
                <CardDescription>{theoryAnswers.length} questions to grade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {theoryAnswers.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        saveCurrentGrading()
                        setCurrentIndex(idx)
                        setPointsAwarded(theoryAnswers[idx].points_awarded)
                        setFeedback(theoryAnswers[idx].teacher_feedback)
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        idx === currentIndex
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>Question {idx + 1}</span>
                        {item.points_awarded > 0 && (
                          <Badge variant={idx === currentIndex ? 'outline' : 'secondary'} className={idx === currentIndex ? 'border-white' : ''}>
                            {item.points_awarded}/{item.points} pts
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Grading Area */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Grade Question {currentIndex + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Question</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{current?.question_text}</p>
                </div>
                
                <div>
                  <Label>Student's Answer</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">{current?.answer_text || 'No answer provided'}</p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Points Awarded</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={pointsAwarded}
                        onChange={(e) => setPointsAwarded(parseInt(e.target.value) || 0)}
                        max={current?.points}
                        min={0}
                      />
                      <span className="text-sm text-muted-foreground">/ {current?.points} pts</span>
                    </div>
                  </div>
                  <div>
                    <Label>Score Percentage</Label>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-center">
                      {Math.round((pointsAwarded / (current?.points || 1)) * 100)}%
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Feedback (Optional)</Label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={saveCurrentGrading}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  
                  {isLast ? (
                    <Button onClick={finalizeGrading} disabled={saving}>
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Award className="mr-2 h-4 w-4" />
                      )}
                      Complete Grading
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        saveCurrentGrading()
                        setCurrentIndex(prev => prev + 1)
                        setPointsAwarded(theoryAnswers[currentIndex + 1]?.points_awarded)
                        setFeedback(theoryAnswers[currentIndex + 1]?.teacher_feedback)
                      }}
                    >
                      Next Question
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}