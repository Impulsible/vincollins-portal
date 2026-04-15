/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Award,
  Calendar,
  Loader2,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  totalExams: number
  totalAttempts: number
  avgScore: number
  passRate: number
  topPerformers: Array<{ name: string; score: number }>
  subjectPerformance: Array<{ subject: string; avgScore: number }>
  dailyActivity: Array<{ date: string; count: number }>
}

// Interface for Supabase response
interface ExamAttempt {
  score: any
  total_points: any
  percentage: any
  exam: { subject: any }[] | { subject: any }
  student: { full_name: any }[] | { full_name: any }
}

export function CbtAnalytics() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData>({
    totalExams: 0,
    totalAttempts: 0,
    avgScore: 0,
    passRate: 0,
    topPerformers: [],
    subjectPerformance: [],
    dailyActivity: []
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    setLoading(true)
    try {
      // Get exam attempts
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select(`
          score,
          total_points,
          percentage,
          exam:exams(subject),
          student:profiles!student_id(full_name)
        `)
        .eq('status', 'graded')

      if (!attempts || attempts.length === 0) {
        setLoading(false)
        return
      }

      const totalAttempts = attempts.length
      const avgScore = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts
      const passRate = (attempts.filter(a => (a.percentage || 0) >= 50).length / totalAttempts) * 100

      // Helper function to extract nested value
      const extractName = (student: any): string => {
        if (!student) return 'Unknown'
        if (Array.isArray(student)) {
          return student[0]?.full_name || 'Unknown'
        }
        return student.full_name || 'Unknown'
      }

      const extractSubject = (exam: any): string => {
        if (!exam) return 'Unknown'
        if (Array.isArray(exam)) {
          return exam[0]?.subject || 'Unknown'
        }
        return exam.subject || 'Unknown'
      }

      // Top performers - group by student name
      const studentScores = new Map<string, { total: number; count: number }>()
      attempts.forEach((attempt: ExamAttempt) => {
        const name = extractName(attempt.student)
        const percentage = attempt.percentage || 0
        
        const current = studentScores.get(name) || { total: 0, count: 0 }
        studentScores.set(name, {
          total: current.total + percentage,
          count: current.count + 1
        })
      })
      
      const topPerformers = Array.from(studentScores.entries())
        .map(([name, { total, count }]) => ({ 
          name, 
          score: total / count 
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      // Subject performance - group by subject
      const subjectScores = new Map<string, { total: number; count: number }>()
      attempts.forEach((attempt: ExamAttempt) => {
        const subject = extractSubject(attempt.exam)
        const percentage = attempt.percentage || 0
        
        const current = subjectScores.get(subject) || { total: 0, count: 0 }
        subjectScores.set(subject, {
          total: current.total + percentage,
          count: current.count + 1
        })
      })
      
      const subjectPerformance = Array.from(subjectScores.entries())
        .map(([subject, { total, count }]) => ({ 
          subject, 
          avgScore: total / count 
        }))
        .sort((a, b) => b.avgScore - a.avgScore)

      setData({
        totalExams: 0,
        totalAttempts,
        avgScore: Math.round(avgScore),
        passRate: Math.round(passRate),
        topPerformers,
        subjectPerformance,
        dailyActivity: []
      })

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          CBT Analytics
        </h1>
        <p className="text-muted-foreground text-sm">Performance insights and statistics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Attempts</p>
                <p className="text-2xl font-bold">{data.totalAttempts}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{data.avgScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={data.avgScore} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{data.passRate}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={data.passRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">{data.topPerformers.length}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Students with highest average scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPerformers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                data.topPerformers.map((student, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {idx + 1}
                      </Badge>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{Math.round(student.score)}%</span>
                      {student.score > 80 ? (
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average scores by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.subjectPerformance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              ) : (
                data.subjectPerformance.map((subject) => (
                  <div key={subject.subject}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{subject.subject}</span>
                      <span>{Math.round(subject.avgScore)}%</span>
                    </div>
                    <Progress value={subject.avgScore} className="h-2" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}