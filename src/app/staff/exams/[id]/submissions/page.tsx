/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/staff/exams/[id]/submissions/page.tsx - VIEW EXAM SUBMISSIONS
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StaffSidebar } from '@/components/staff/StaffSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Search,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Users,
  BookOpen,
  FileText,
  Award,
  ChevronRight,
  Download,
} from 'lucide-react'

interface Submission {
  id: string
  student_id: string
  student_name: string
  student_email: string
  student_class: string
  photo_url?: string
  status: 'in_progress' | 'completed' | 'pending_theory' | 'graded'
  started_at: string
  submitted_at: string | null
  objective_score: number
  objective_total: number
  theory_score: number | null
  theory_total: number
  total_score: number
  percentage: number
  grade?: string
  is_passed: boolean
  attempt_number: number
}

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  has_theory: boolean
  status: string
  teacher_name: string
}

interface StaffProfile {
  id: string
  full_name: string
  email: string
  department: string
  photo_url?: string
}

export default function ExamSubmissionsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [exam, setExam] = useState<Exam | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      // Load staff profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Load exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError
      setExam(examData)

      // Load submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .order('started_at', { ascending: false })

      if (submissionsError) throw submissionsError

      // Get student photos
      const submissionsWithPhotos = await Promise.all(
        (submissionsData || []).map(async (sub) => {
          const { data: studentData } = await supabase
            .from('profiles')
            .select('photo_url')
            .eq('id', sub.student_id)
            .single()

          return {
            ...sub,
            photo_url: studentData?.photo_url || null
          }
        })
      )

      setSubmissions(submissionsWithPhotos)

    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error(error.message || 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [examId, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const getInitials = (name: string) => {
    if (!name) return 'ST'
    const parts = name.split(' ')
    return parts.length >= 2 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700"><Clock className="mr-1 h-3 w-3" />In Progress</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>
      case 'pending_theory':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertCircle className="mr-1 h-3 w-3" />Pending Theory</Badge>
      case 'graded':
        return <Badge className="bg-purple-100 text-purple-700"><Award className="mr-1 h-3 w-3" />Graded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student_email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'completed') return matchesSearch && sub.status === 'completed'
    if (activeTab === 'pending_theory') return matchesSearch && sub.status === 'pending_theory'
    if (activeTab === 'graded') return matchesSearch && sub.status === 'graded'
    if (activeTab === 'in_progress') return matchesSearch && sub.status === 'in_progress'
    
    return matchesSearch
  })

  const stats = {
    total: submissions.length,
    completed: submissions.filter(s => s.status === 'completed').length,
    pendingTheory: submissions.filter(s => s.status === 'pending_theory').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    inProgress: submissions.filter(s => s.status === 'in_progress').length,
    averageScore: submissions.filter(s => s.status === 'completed' || s.status === 'graded').length > 0
      ? Math.round(submissions.filter(s => s.status === 'completed' || s.status === 'graded')
          .reduce((sum, s) => sum + s.percentage, 0) / 
          submissions.filter(s => s.status === 'completed' || s.status === 'graded').length)
      : 0
  }

  const handleEnterScores = () => {
    router.push(`/staff/exams/${examId}/scores`)
  }

  const handleViewSubmission = (submissionId: string) => {
    router.push(`/staff/exams/${examId}/submissions/${submissionId}`)
  }

  const handleExport = () => {
    const csvData = filteredSubmissions.map(s => ({
      Name: s.student_name,
      Email: s.student_email,
      Class: s.student_class,
      Status: s.status,
      'Objective Score': `${s.objective_score}/${s.objective_total}`,
      'Theory Score': s.theory_score ? `${s.theory_score}/${s.theory_total}` : 'Pending',
      'Total Score': `${s.total_score}/${s.objective_total + s.theory_total}`,
      Percentage: `${s.percentage}%`,
      Grade: s.grade || 'N/A',
      Passed: s.is_passed ? 'Yes' : 'No',
      Submitted: s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : 'N/A'
    }))

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exam?.title}_submissions.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Export complete!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header onLogout={handleLogout} />
        <div className="flex">
          <div className={cn("hidden lg:block transition-all duration-300", sidebarCollapsed ? "w-20" : "w-72")} />
          <main className={cn("flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Header onLogout={handleLogout} />
      
      <div className="flex">
        <StaffSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="exams"
          setActiveTab={() => {}}
        />

        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
            
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => router.push('/staff?tab=exams')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
                  </Button>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                      {exam?.title}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                      {exam?.subject} • {exam?.class} • {exam?.total_marks} marks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                  </Button>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                  <Button onClick={handleEnterScores} className="bg-primary hover:bg-primary/90">
                    <Edit className="mr-2 h-4 w-4" /> Enter Scores
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Pending Theory</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingTheory}</p>
                    </div>
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Graded</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.graded}</p>
                    </div>
                    <Award className="h-5 w-5 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Avg Score</p>
                      <p className="text-2xl font-bold">{stats.averageScore}%</p>
                    </div>
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Tabs */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by student name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
                  <TabsTrigger value="pending_theory">Pending Theory ({stats.pendingTheory})</TabsTrigger>
                  <TabsTrigger value="graded">Graded ({stats.graded})</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress ({stats.inProgress})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Submissions Table */}
            <Card>
              <CardContent className="p-0">
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No submissions found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Objective</TableHead>
                        <TableHead className="text-center">Theory</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={submission.photo_url || undefined} />
                                <AvatarFallback>{getInitials(submission.student_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{submission.student_name}</p>
                                <p className="text-xs text-gray-500">{submission.student_email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{submission.student_class}</TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell className="text-center">
                            {submission.objective_score}/{submission.objective_total}
                          </TableCell>
                          <TableCell className="text-center">
                            {submission.theory_score !== null 
                              ? `${submission.theory_score}/${submission.theory_total}`
                              : <span className="text-yellow-600">Pending</span>
                            }
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            <span className={getScoreColor(submission.percentage)}>
                              {submission.total_score}/{submission.objective_total + submission.theory_total}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">({submission.percentage}%)</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {submission.grade ? (
                              <Badge variant={submission.is_passed ? 'default' : 'destructive'}>
                                {submission.grade}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewSubmission(submission.id)}
                            >
                              <Eye className="mr-1 h-4 w-4" /> View
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Progress Summary */}
            {submissions.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Submission Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Completion</span>
                        <span>
                          {stats.completed + stats.graded + stats.pendingTheory} of {stats.total} students
                        </span>
                      </div>
                      <Progress 
                        value={((stats.completed + stats.graded + stats.pendingTheory) / stats.total) * 100} 
                        className="h-2" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Grading Progress</span>
                        <span>
                          {stats.graded} of {stats.completed + stats.pendingTheory} graded
                        </span>
                      </div>
                      <Progress 
                        value={stats.completed + stats.pendingTheory > 0 
                          ? (stats.graded / (stats.completed + stats.pendingTheory)) * 100 
                          : 0
                        } 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}