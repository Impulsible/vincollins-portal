/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertTriangle,
  Shield,
  Eye,
  Loader2,
  Search,
  RefreshCw,
  Download,
  XCircle,
  CheckCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Violation {
  id: string
  student_name: string
  student_id: string
  student_photo: string | null
  exam_title: string
  exam_id: string
  total_score: number
  percentage_score: number
  is_passed: boolean
  status: string
  created_at: string
}

export function CbtViolations() {
  const [loading, setLoading] = useState(true)
  const [violations, setViolations] = useState<Violation[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadViolations()
  }, [])

  async function loadViolations() {
    setLoading(true)
    try {
      // Fetch exam attempts using your actual column names
      const { data: attempts, error } = await supabase
        .from('exam_attempts')
        .select(`
          id,
          student_id,
          exam_id,
          total_score,
          percentage_score,
          is_passed,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Supabase error:', error)
        setViolations([])
        setLoading(false)
        return
      }

      if (!attempts || attempts.length === 0) {
        setViolations([])
        setLoading(false)
        return
      }

      // Get student profiles
      const studentIds = [...new Set(attempts.map(a => a.student_id).filter(Boolean))]
      let students: any[] = []
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from('profiles')
          .select('id, full_name, photo_url')
          .in('id', studentIds)
        students = studentsData || []
      }

      // Get exam details
      const examIds = [...new Set(attempts.map(a => a.exam_id).filter(Boolean))]
      let exams: any[] = []
      if (examIds.length > 0) {
        const { data: examsData } = await supabase
          .from('exams')
          .select('id, title')
          .in('id', examIds)
        exams = examsData || []
      }

      // Create maps
      const studentMap = new Map(students.map(s => [s.id, s]))
      const examMap = new Map(exams.map(e => [e.id, e]))

      const formattedViolations: Violation[] = attempts.map((attempt) => {
        const student = studentMap.get(attempt.student_id)
        const exam = examMap.get(attempt.exam_id)

        return {
          id: attempt.id,
          student_name: student?.full_name || 'Unknown Student',
          student_id: attempt.student_id,
          student_photo: student?.photo_url || null,
          exam_title: exam?.title || 'Unknown Exam',
          exam_id: attempt.exam_id,
          total_score: attempt.total_score || 0,
          percentage_score: attempt.percentage_score || 0,
          is_passed: attempt.is_passed || false,
          status: attempt.status || 'unknown',
          created_at: attempt.created_at
        }
      })

      setViolations(formattedViolations)
    } catch (error) {
      console.error('Error loading violations:', error)
      setViolations([])
    } finally {
      setLoading(false)
    }
  }

  const filteredViolations = violations.filter(v =>
    v.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.exam_title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getSeverityBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-100 text-green-700">Excellent</Badge>
    if (percentage >= 60) return <Badge className="bg-blue-100 text-blue-700">Good</Badge>
    if (percentage >= 50) return <Badge className="bg-yellow-100 text-yellow-700">Average</Badge>
    if (percentage >= 40) return <Badge className="bg-orange-100 text-orange-700">Poor</Badge>
    return <Badge className="bg-red-100 text-red-700">Very Poor</Badge>
  }

  const getStatusIcon = (isPassed: boolean) => {
    if (isPassed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Exam Results & Violations
          </h1>
          <p className="text-muted-foreground text-sm">Student exam performance and results</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadViolations}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Results History</CardTitle>
          <CardDescription>All student exam attempts and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student or exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No exam attempts found</p>
              <p className="text-sm text-muted-foreground mt-1">When students take exams, their results will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredViolations.map((violation) => (
                  <TableRow key={violation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={violation.student_photo || undefined} />
                          <AvatarFallback>{violation.student_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{violation.student_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{violation.exam_title}</TableCell>
                    <TableCell>{violation.total_score}</TableCell>
                    <TableCell>{Math.round(violation.percentage_score)}%</TableCell>
                    <TableCell>{getSeverityBadge(violation.percentage_score)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(violation.is_passed)}
                        <span className="text-sm">
                          {violation.is_passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(violation.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}