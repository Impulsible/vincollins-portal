// app/staff/exams/[id]/submissions/page.tsx - SIMPLIFIED SCORE DISPLAY
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Search, CheckCircle, Clock, AlertCircle,
  Loader2, RefreshCw, Users, Award, Eye
} from 'lucide-react'

const getWAECGrade = (pct: number): string => {
  if (pct >= 75) return 'A1'
  if (pct >= 70) return 'B2'
  if (pct >= 65) return 'B3'
  if (pct >= 60) return 'C4'
  if (pct >= 55) return 'C5'
  if (pct >= 50) return 'C6'
  if (pct >= 45) return 'D7'
  if (pct >= 40) return 'E8'
  return 'F9'
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'in_progress': 
      return <Badge className="bg-blue-100 text-blue-700 text-xs"><Clock className="mr-1 h-3 w-3" />In Progress</Badge>
    case 'completed': 
      return <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>
    case 'pending_theory': 
      return <Badge className="bg-amber-100 text-amber-700 text-xs"><AlertCircle className="mr-1 h-3 w-3" />Pending Theory</Badge>
    case 'graded': 
      return <Badge className="bg-purple-100 text-purple-700 text-xs"><Award className="mr-1 h-3 w-3" />Graded</Badge>
    default: 
      return <Badge variant="outline" className="text-xs">{status || 'Unknown'}</Badge>
  }
}

const getInitials = (name: string) => {
  if (!name) return 'ST'
  const parts = name.split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

export default function ExamSubmissionsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exam, setExam] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async (showToast = false) => {
    if (!examId) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }

      // Get exam details
      const { data: examData } = await supabase
        .from('exams')
        .select('id, title, subject, class, total_marks, total_questions, objective_max, theory_max')
        .eq('id', examId)
        .single()
      setExam(examData)

      // Get ALL submissions
      const { data: subs } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .order('submitted_at', { ascending: false })

      // Enrich with student photos and calculate scores
      const enriched = await Promise.all((subs || []).map(async (sub: any) => {
        const { data: student } = await supabase
          .from('profiles')
          .select('full_name, email, photo_url, class')
          .eq('id', sub.student_id)
          .single()

        const objectiveMax = sub.objective_max || examData?.objective_max || 20
        const theoryMax = sub.theory_max || examData?.theory_max || 40
        const examTotal = objectiveMax + theoryMax
        
        const objScore = sub.objective_score || 0
        const theoryScore = sub.theory_score || 0
        const totalScore = objScore + theoryScore
        const percentage = examTotal > 0 ? Math.round((totalScore / examTotal) * 100) : 0
        
        return {
          ...sub,
          student_name: student?.full_name || sub.student_name || 'Unknown',
          student_email: student?.email || sub.student_email || '',
          photo_url: student?.photo_url || null,
          student_class: student?.class || sub.student_class || '—',
          display_score: totalScore,
          display_percentage: percentage,
          display_grade: getWAECGrade(percentage),
        }
      }))

      setSubmissions(enriched)
      
      if (showToast) {
        toast.success(`Updated! ${enriched.length} submissions`)
      }
    } catch (e: any) {
      console.error('Load error:', e)
      if (showToast) {
        toast.error(e.message || 'Failed to load submissions')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [examId, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData(true)
  }

  const filtered = submissions.filter(s => {
    const q = searchQuery.toLowerCase()
    return s.student_name?.toLowerCase().includes(q) || s.student_email?.toLowerCase().includes(q)
  })

  const formatDate = (d?: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return '—' }
  }

  if (loading && submissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    )
  }

  const completedCount = submissions.filter(s => s.status === 'completed' || s.status === 'graded').length
  const gradedCount = submissions.filter(s => s.status === 'graded').length
  const pendingCount = submissions.filter(s => s.status === 'pending_theory' || (s.status === 'completed' && !s.theory_score)).length
  const averageScore = submissions.length > 0 
    ? Math.round(submissions.reduce((sum, s) => sum + (s.display_percentage || 0), 0) / submissions.length)
    : 0

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="sm" onClick={() => router.push('/staff/exams')} className="shrink-0">
            <ArrowLeft className="mr-1.5 h-4 w-4" />Back
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">{exam?.title || 'Submissions'}</h1>
            <p className="text-xs sm:text-sm text-slate-500 truncate">
              {exam?.subject && `${exam.subject} • `}
              {exam?.class && `${exam.class} • `}
              {submissions.length} students
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="h-8 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[11px] text-slate-500">Total</p>
            <p className="text-lg font-bold">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[11px] text-slate-500">Completed</p>
            <p className="text-lg font-bold text-green-600">{completedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[11px] text-slate-500">Graded</p>
            <p className="text-lg font-bold text-purple-600">{gradedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[11px] text-slate-500">Pending</p>
            <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[11px] text-slate-500">Avg Score</p>
            <p className="text-lg font-bold text-blue-600">{averageScore}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9 text-sm bg-white"
        />
      </div>

      {/* Submissions Table */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="text-center py-12">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No submissions found</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs sm:text-sm">Student</TableHead>
                    <TableHead className="text-xs sm:text-sm text-center">Score</TableHead>
                    <TableHead className="text-xs sm:text-sm text-center">%</TableHead>
                    <TableHead className="text-xs sm:text-sm text-center">Grade</TableHead>
                    <TableHead className="text-xs sm:text-sm text-center">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm text-center">Submitted</TableHead>
                    <TableHead className="text-xs sm:text-sm text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(submission => {
                    const score = submission.display_score
                    const percentage = submission.display_percentage
                    const grade = submission.display_grade
                    
                    return (
                      <TableRow key={submission.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-7 w-7 shrink-0 hidden sm:flex">
                              <AvatarImage src={submission.photo_url || undefined} />
                              <AvatarFallback className="text-[10px]">{getInitials(submission.student_name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">{submission.student_name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{submission.student_class}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn("font-semibold text-xs sm:text-sm", 
                            percentage >= 50 ? 'text-emerald-600' : 'text-red-600')}>
                            {score}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-xs sm:text-sm">
                          <span className={cn("font-medium",
                            percentage >= 70 ? 'text-emerald-600' :
                            percentage >= 50 ? 'text-amber-600' : 'text-red-600')}>
                            {percentage}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-xs", 
                            percentage >= 75 ? 'bg-emerald-100 text-emerald-700' :
                            percentage >= 50 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}>
                            {grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(submission.status)}</TableCell>
                        <TableCell className="text-center text-[10px] sm:text-xs text-slate-500">
                          {formatDate(submission.submitted_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push(`/staff/exams/${examId}/submissions/${submission.id}`)}
                            className="h-7 text-xs"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            {submission.status === 'graded' ? 'View' : 'Grade'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}