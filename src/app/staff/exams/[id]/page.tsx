// app/staff/exams/[id]/page.tsx - COMPLETE FIXED VERSION

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Eye, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  BookOpen,
  Award,
  BarChart3,
  FileText,
  Settings,
  Download,
  Share2,
  Loader2,
  RefreshCw,
  Pencil,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface Exam {
  id: string
  title: string
  subject: string
  class: string
  total_marks: number
  total_questions: number
  objective_max: number
  theory_max: number
  duration: number
  start_date: string
  end_date: string
  status: 'draft' | 'published' | 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

interface SubmissionStats {
  total: number
  completed: number
  inProgress: number
  pendingTheory: number
  graded: number
  averageScore: number
  passRate: number
  highestScore: number
  lowestScore: number
}

export default function ExamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string

  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exam, setExam] = useState<Exam | null>(null)
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pendingTheory: 0,
    graded: 0,
    averageScore: 0,
    passRate: 0,
    highestScore: 0,
    lowestScore: 0
  })
  const [submissionCount, setSubmissionCount] = useState(0)
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])

  // Load data
  const loadData = useCallback(async (showToast = false) => {
    if (!examId) {
      console.error('❌ No examId in loadData')
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('❌ No session')
        toast.error('Please log in again')
        setLoading(false)
        return
      }

      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError
      setExam(examData)

      const { data: submissions, error: submissionsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)

      if (submissionsError) throw submissionsError

      const total = submissions?.length || 0
      const completed = submissions?.filter(s => s.status === 'completed' || s.status === 'graded').length || 0
      const inProgress = submissions?.filter(s => s.status === 'in_progress').length || 0
      const pendingTheory = submissions?.filter(s => s.status === 'pending_theory').length || 0
      const graded = submissions?.filter(s => s.status === 'graded').length || 0

      let totalScore = 0
      let highest = 0
      let lowest = 100
      let passed = 0

      submissions?.forEach(sub => {
        const score = sub.objective_score || 0
        const theory = sub.theory_score || 0
        const total = score + theory
        totalScore += total
        if (total > highest) highest = total
        if (total < lowest && total > 0) lowest = total
        if (total >= 50) passed++
      })

      const average = total > 0 ? Math.round(totalScore / total) : 0
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

      setStats({
        total,
        completed,
        inProgress,
        pendingTheory,
        graded,
        averageScore: average,
        passRate,
        highestScore: highest,
        lowestScore: lowest === 100 ? 0 : lowest
      })

      setSubmissionCount(total)

      const recent = submissions
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5) || []
      
      const enrichedRecent = await Promise.all(recent.map(async (sub) => {
        const { data: student } = await supabase
          .from('profiles')
          .select('full_name, email, photo_url')
          .eq('id', sub.student_id)
          .single()
        
        return {
          ...sub,
          student_name: student?.full_name || 'Unknown',
          student_email: student?.email || '',
          photo_url: student?.photo_url || null
        }
      }))

      setRecentSubmissions(enrichedRecent)

      if (showToast) {
        toast.success('Data refreshed successfully')
      }

    } catch (error: any) {
      console.error('Error loading exam data:', error)
      toast.error(error.message || 'Failed to load exam data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [examId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData(true)
  }

  // ✅ FIXED: Navigation with fallback
  const handleViewSubmissions = () => {
    if (!examId) {
      toast.error('Exam ID not found')
      return
    }
    
    const targetPath = `/staff/exams/${examId}/submissions`
    console.log('🔍 Navigating to submissions:', targetPath)
    
    try {
      router.push(targetPath)
    } catch (error) {
      console.error('❌ Router push failed, using fallback:', error)
      window.location.href = targetPath
    }
  }

  const handleEditExam = () => {
    router.push(`/staff/exams/${examId}/edit`)
  }

  const handleDeleteExam = async () => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId)
      
      if (error) throw error
      
      toast.success('Exam deleted successfully')
      router.push('/staff/exams')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete exam')
    }
  }

  const formatDate = (date?: string) => {
    if (!date) return 'N/A'
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Draft</Badge>
      case 'published':
        return <Badge className="bg-blue-100 text-blue-700">Published</Badge>
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-700">Completed</Badge>
      case 'archived':
        return <Badge variant="outline" className="bg-gray-100 text-gray-500">Archived</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="mt-4 text-sm text-slate-500">Loading exam details...</p>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
        <AlertCircle className="h-12 w-12 text-slate-400" />
        <h2 className="mt-4 text-xl font-semibold text-slate-700">Exam Not Found</h2>
        <p className="text-sm text-slate-500">The exam you're looking for doesn't exist or has been deleted.</p>
        <Button className="mt-4" onClick={() => router.push('/staff/exams')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/staff/exams')}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">{exam.title}</h1>
                  {getStatusBadge(exam.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                  <span>{exam.subject}</span>
                  <span>•</span>
                  <span>{exam.class}</span>
                  <span>•</span>
                  <span>{exam.total_questions} Questions</span>
                  <span>•</span>
                  <span>{exam.total_marks} Marks</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1.5", refreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEditExam}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteExam}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500">Total Submissions</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500">In Progress</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500">Graded</p>
              <p className="text-2xl font-bold mt-1 text-purple-600">{stats.graded}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500">Average Score</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{stats.averageScore}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500">Pass Rate</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{stats.passRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border rounded-lg p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-50">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-emerald-50">
              <Users className="h-4 w-4 mr-2" />
              Submissions
              {stats.total > 0 && (
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">
                  {stats.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-50">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    Exam Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Subject</p>
                      <p className="text-sm font-medium mt-0.5">{exam.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Class</p>
                      <p className="text-sm font-medium mt-0.5">{exam.class}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Total Marks</p>
                      <p className="text-sm font-medium mt-0.5">{exam.total_marks}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Questions</p>
                      <p className="text-sm font-medium mt-0.5">{exam.total_questions}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Objective Marks</p>
                      <p className="text-sm font-medium mt-0.5">{exam.objective_max}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Theory Marks</p>
                      <p className="text-sm font-medium mt-0.5">{exam.theory_max}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Duration</p>
                      <p className="text-sm font-medium mt-0.5">{exam.duration} minutes</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Status</p>
                      <div className="mt-0.5">{getStatusBadge(exam.status)}</div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Start Date</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm">{formatDate(exam.start_date)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">End Date</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm">{formatDate(exam.end_date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleViewSubmissions}
                    disabled={stats.total === 0}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View All Submissions
                    {stats.total > 0 && (
                      <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
                        {stats.total}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push(`/staff/exams/${examId}/results`)}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push(`/staff/exams/${examId}/analytics`)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Exam
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    Submissions
                  </CardTitle>
                  <Button 
                    size="sm"
                    onClick={handleViewSubmissions}
                    disabled={stats.total === 0}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-lg font-bold">{stats.total}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600">Completed</p>
                    <p className="text-lg font-bold text-green-700">{stats.completed}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600">In Progress</p>
                    <p className="text-lg font-bold text-blue-700">{stats.inProgress}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-600">Graded</p>
                    <p className="text-lg font-bold text-purple-700">{stats.graded}</p>
                  </div>
                </div>

                {recentSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700">Recent Submissions</p>
                    {recentSubmissions.map((sub) => (
                      <div 
                        key={sub.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-xs shrink-0">
                            {sub.student_name?.charAt(0) || 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{sub.student_name}</p>
                            <p className="text-xs text-slate-500 truncate">{sub.student_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="outline" className="text-xs">
                            Score: {sub.objective_score || 0}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/staff/exams/${examId}/submissions/${sub.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No submissions yet</p>
                    <p className="text-sm text-slate-400">Students haven't started this exam</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-emerald-600" />
                  Exam Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-3">Exam Options</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Allow retakes</span>
                        <Badge variant="outline">Disabled</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Show results instantly</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Randomize questions</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-3">Grading Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Passing score</span>
                        <span className="font-medium">50%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Grading system</span>
                        <span className="font-medium">WAEC</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Auto-grade objective</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1.5" />
                      Export Settings
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1.5" />
                      Reset to Default
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}