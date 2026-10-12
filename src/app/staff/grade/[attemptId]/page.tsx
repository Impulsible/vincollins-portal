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
import { Loader2, Save, ChevronLeft, ChevronRight, Award } from 'lucide-react'
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
      await saveCurrentGrading()

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
        <div className="min-h-screen flex items-center justify-center pt-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        </div>
        <Footer />
      </>
    )
  }

  if (theoryAnswers.length === 0) {
    return (
      <>
        <Header user={{ id: 'staff', isAuthenticated: true, name: 'Staff', firstName: 'Staff', role: 'teacher', email: '' }} />
        <div className="min-h-screen flex items-center justify-center pt-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <Card className="text-center p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400">No theory questions to grade</p>
            <Button 
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500" 
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </Card>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header user={{ id: 'staff', isAuthenticated: true, name: 'Staff', firstName: 'Staff', role: 'teacher', email: '' }} />
      
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </Button>
          </div>

          {/* Exam Info */}
          <Card className="mb-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Student</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{attempt?.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Class</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{attempt?.student_class}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Exam</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{attempt?.exam_title}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Subject</p>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{attempt?.exam_subject}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Question List */}
            <Card className="lg:col-span-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-white">Theory Questions</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  {theoryAnswers.length} questions to grade
                </CardDescription>
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
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>Question {idx + 1}</span>
                        {item.points_awarded > 0 && (
                          <Badge 
                            className={idx === currentIndex 
                              ? 'bg-white/20 text-white border-0' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0'
                            }
                          >
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
            <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-white">
                  Grade Question {currentIndex + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Question</Label>
                  <p className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200">
                    {current?.question_text}
                  </p>
                </div>
                
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Student's Answer</Label>
                  <p className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                    {current?.answer_text || 'No answer provided'}
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Points Awarded</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        value={pointsAwarded}
                        onChange={(e) => setPointsAwarded(parseInt(e.target.value) || 0)}
                        max={current?.points}
                        min={0}
                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                      <span className="text-sm text-slate-500 dark:text-slate-400">/ {current?.points} pts</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Score Percentage</Label>
                    <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded text-center text-slate-800 dark:text-slate-200">
                      {Math.round((pointsAwarded / (current?.points || 1)) * 100)}%
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Feedback (Optional)</Label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback to the student..."
                    rows={3}
                    className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={saveCurrentGrading}
                    className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  
                  {isLast ? (
                    <Button 
                      onClick={finalizeGrading} 
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
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
                      className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
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