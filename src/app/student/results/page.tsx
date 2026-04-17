// app/student/results/page.tsx - FULL FIXED VERSION
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, Award, Clock, CheckCircle, XCircle, Search,
  TrendingUp, Target, Trophy, Eye, ChevronRight, BookOpen,
  GraduationCap, Calendar, BarChart3, Filter, ArrowUpDown,
  FileText, Download, Printer, RefreshCw, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface StudentProfile {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
}

interface ExamResult {
  id: string
  exam_id: string
  exam_title: string
  exam_subject: string
  status: string
  percentage: number
  total_score: number
  total_marks: number
  objective_score?: number
  theory_score?: number
  is_passed: boolean
  started_at: string
  completed_at?: string
  attempt_number: number
  passing_percentage?: number
}

interface SubjectPerformance {
  subject: string
  averageScore: number
  examsTaken: number
  bestScore: number
  lowestScore: number
  grade: string
}

export default function StudentResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  
  const [results, setResults] = useState<ExamResult[]>([])
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([])
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  
  const [stats, setStats] = useState({
    totalExams: 0,
    passedExams: 0,
    failedExams: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 100,
    pendingResults: 0
  })

  const formatProfileForHeader = (profile: StudentProfile | null) => {
    if (!profile) return undefined
    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: 'student' as const,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  const getFirstName = (fullName: string): string => {
    if (!fullName) return 'Student'
    return fullName.split(' ')[0]
  }

  const getInitials = (name: string): string => {
    if (!name) return 'S'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  }

  const calculateGrade = (percentage: number): { grade: string; color: string } => {
    if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' }
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' }
    if (percentage >= 60) return { grade: 'C', color: 'text-amber-600' }
    if (percentage >= 50) return { grade: 'P', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }

  const getGradeFromPercentage = (percentage: number): string => {
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B'
    if (percentage >= 60) return 'C'
    if (percentage >= 50) return 'P'
    return 'F'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'MMM dd, yyyy • hh:mm a')
  }

  // Auth check
  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          console.log('No active session, redirecting to portal')
          if (isMounted) window.location.replace('/portal')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (!profileData || profileData.role !== 'student') {
          toast.error('Access denied')
          router.push('/portal')
          return
        }

        if (isMounted) {
          setProfile({
            id: session.user.id,
            full_name: profileData.full_name || session.user.user_metadata?.full_name || 'Student',
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            email: profileData.email || session.user.email || '',
            class: profileData.class || 'Not Assigned',
            department: profileData.department || 'General',
            vin_id: profileData.vin_id,
            photo_url: profileData.photo_url
          })
          setAuthChecking(false)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        if (isMounted) setAuthChecking(false)
      }
    }

    checkAuth()
    return () => { isMounted = false }
  }, [router])

  const loadResults = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      // Load exam attempts with exam details
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          exams:exam_id (
            title,
            subject,
            total_marks,
            passing_percentage
          )
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })

      if (attemptsError) {
        console.error('Error loading results:', attemptsError)
        toast.error('Failed to load results')
        return
      }

      const completedResults: ExamResult[] = []
      const subjects: string[] = []
      const subjectScores: Record<string, number[]> = {}
      
      let totalScore = 0
      let passedCount = 0
      let failedCount = 0
      let highestScore = 0
      let lowestScore = 100
      let pendingCount = 0

      // FIXED: Proper check before forEach
      if (attemptsData && Array.isArray(attemptsData)) {
        attemptsData.forEach((attempt: any) => {
          const exam = attempt.exams
          
          if (attempt.status === 'completed' || attempt.status === 'graded') {
            const percentage = attempt.percentage || 0
            const isPassed = attempt.is_passed || percentage >= (exam?.passing_percentage || 50)
            
            completedResults.push({
              id: attempt.id,
              exam_id: attempt.exam_id,
              exam_title: exam?.title || 'Unknown Exam',
              exam_subject: exam?.subject || 'Unknown Subject',
              status: attempt.status,
              percentage: percentage,
              total_score: attempt.total_score || 0,
              total_marks: exam?.total_marks || 100,
              objective_score: attempt.objective_score,
              theory_score: attempt.theory_score,
              is_passed: isPassed,
              started_at: attempt.started_at,
              completed_at: attempt.submitted_at || attempt.completed_at,
              attempt_number: attempt.attempt_number || 1,
              passing_percentage: exam?.passing_percentage || 50
            })
            
            // Track subjects
            if (exam?.subject) {
              subjects.push(exam.subject)
              if (!subjectScores[exam.subject]) {
                subjectScores[exam.subject] = []
              }
              subjectScores[exam.subject].push(percentage)
            }
            
            totalScore += percentage
            if (isPassed) passedCount++ 
            else failedCount++
            if (percentage > highestScore) highestScore = percentage
            if (percentage < lowestScore) lowestScore = percentage
          } else if (attempt.status === 'submitted' || attempt.status === 'pending_theory') {
            pendingCount++
          }
        })
      }

      // Calculate subject performance
      const performance: SubjectPerformance[] = []
      Object.entries(subjectScores).forEach(([subject, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        const best = Math.max(...scores)
        const lowest = Math.min(...scores)
        performance.push({
          subject,
          averageScore: Math.round(avg),
          examsTaken: scores.length,
          bestScore: best,
          lowestScore: lowest,
          grade: getGradeFromPercentage(avg)
        })
      })

      // Sort performance by average score
      performance.sort((a, b) => b.averageScore - a.averageScore)

      setResults(completedResults)
      setFilteredResults(completedResults)
      setAvailableSubjects([...new Set(subjects)].sort())
      setSubjectPerformance(performance)
      
      setStats({
        totalExams: completedResults.length,
        passedExams: passedCount,
        failedExams: failedCount,
        averageScore: completedResults.length > 0 ? Math.round(totalScore / completedResults.length) : 0,
        highestScore: completedResults.length > 0 ? highestScore : 0,
        lowestScore: completedResults.length > 0 ? lowestScore : 0,
        pendingResults: pendingCount
      })

    } catch (error) {
      console.error('Error loading results:', error)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    if (!authChecking && profile) {
      loadResults()
    }
  }, [authChecking, profile, loadResults])

  // Filter and sort results
  useEffect(() => {
    let filtered = [...results]
    
    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(r => r.exam_subject === subjectFilter)
    }
    
    // Tab filter
    if (activeTab === 'passed') {
      filtered = filtered.filter(r => r.is_passed)
    } else if (activeTab === 'failed') {
      filtered = filtered.filter(r => !r.is_passed)
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.exam_title.toLowerCase().includes(query) ||
        r.exam_subject.toLowerCase().includes(query)
      )
    }
    
    // Sort
    switch (sortOrder) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.completed_at || '').getTime() - new Date(a.completed_at || '').getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.completed_at || '').getTime() - new Date(b.completed_at || '').getTime())
        break
      case 'highest':
        filtered.sort((a, b) => b.percentage - a.percentage)
        break
      case 'lowest':
        filtered.sort((a, b) => a.percentage - b.percentage)
        break
    }
    
    setFilteredResults(filtered)
  }, [results, subjectFilter, activeTab, searchQuery, sortOrder])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    window.location.replace('/portal')
  }

  const handleViewDetails = (resultId: string) => {
    router.push(`/student/results/${resultId}`)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    toast.info('Export feature coming soon')
  }

  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-4 text-slate-600">Loading your results...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const firstName = profile ? getFirstName(profile.full_name) : 'Student'
  const gradeInfo = calculateGrade(stats.averageScore)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="results"
          setActiveTab={() => {}}
        />

        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-4 lg:px-6 py-6 max-w-7xl">
            
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-primary/20 shadow-lg">
                    <AvatarImage src={profile?.photo_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-xl font-bold">
                      {profile?.full_name ? getInitials(profile.full_name) : 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      My Results
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      View and analyze your exam performance
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadResults}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6"
            >
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Total Exams</p>
                      <p className="text-2xl font-bold">{stats.totalExams}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Passed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.passedExams}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{stats.failedExams}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Average Score</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.averageScore}%</p>
                    </div>
                    <Target className="h-8 w-8 text-amber-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Current Grade</p>
                      <p className={cn("text-2xl font-bold", gradeInfo.color)}>
                        {stats.totalExams > 0 ? gradeInfo.grade : '-'}
                      </p>
                    </div>
                    <Trophy className="h-8 w-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subject Performance - Only show if there are results */}
            {subjectPerformance.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-6"
              >
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                      Subject Performance
                    </CardTitle>
                    <CardDescription>Your performance across different subjects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {subjectPerformance.slice(0, 6).map((perf) => {
                        const gradeInfo = calculateGrade(perf.averageScore)
                        return (
                          <div key={perf.subject} className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium truncate">{perf.subject}</p>
                              <Badge className={cn("text-xs", gradeInfo.color.replace('text', 'bg').replace('600', '100'))}>
                                <span className={gradeInfo.color}>{perf.grade}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-2xl font-bold">{perf.averageScore}%</span>
                              <span className="text-xs text-slate-500">{perf.examsTaken} exam{perf.examsTaken !== 1 ? 's' : ''}</span>
                            </div>
                            <Progress value={perf.averageScore} className="h-2" />
                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                              <span>Best: {perf.bestScore}%</span>
                              <span>Lowest: {perf.lowestScore}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Filters Bar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="bg-white p-1 rounded-xl shadow-sm border">
                  <TabsTrigger value="all" className="rounded-lg">
                    All ({stats.totalExams})
                  </TabsTrigger>
                  <TabsTrigger value="passed" className="rounded-lg">
                    Passed ({stats.passedExams})
                  </TabsTrigger>
                  <TabsTrigger value="failed" className="rounded-lg">
                    Failed ({stats.failedExams})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search results..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 h-9 w-40 sm:w-48 lg:w-56 bg-white"
                  />
                </div>
                
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-[130px] h-9 bg-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {availableSubjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger className="w-[130px] h-9 bg-white">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="highest">Highest Score</SelectItem>
                    <SelectItem value="lowest">Lowest Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Results List */}
            <AnimatePresence mode="wait">
              {filteredResults.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="border-0 shadow-lg bg-white">
                    <CardContent className="text-center py-16">
                      <Award className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {results.length === 0 ? 'No results yet' : 'No matching results'}
                      </h3>
                      <p className="text-muted-foreground">
                        {results.length === 0 
                          ? 'Complete exams to see your results here!'
                          : 'Try adjusting your filters'}
                      </p>
                      {results.length === 0 && (
                        <Button 
                          className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => router.push('/student/exams')}
                        >
                          Browse Available Exams
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {filteredResults.map((result, index) => {
                    const gradeInfo = calculateGrade(result.percentage)
                    
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={cn(
                          "border-0 shadow-sm bg-white hover:shadow-md transition-shadow",
                          result.is_passed ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"
                        )}>
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                                    result.is_passed ? "bg-green-100" : "bg-red-100"
                                  )}>
                                    <BookOpen className={cn(
                                      "h-6 w-6",
                                      result.is_passed ? "text-green-600" : "text-red-600"
                                    )} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                      {result.exam_title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {result.exam_subject}
                                      </Badge>
                                      <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(result.completed_at)}
                                      </span>
                                      {result.attempt_number > 1 && (
                                        <Badge variant="secondary" className="text-xs">
                                          Attempt #{result.attempt_number}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 sm:gap-6">
                                <div className="text-right">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "text-2xl font-bold",
                                      gradeInfo.color
                                    )}>
                                      {result.percentage}%
                                    </span>
                                    <Badge className={cn(
                                      "text-xs",
                                      result.is_passed 
                                        ? "bg-green-100 text-green-700" 
                                        : "bg-red-100 text-red-700"
                                    )}>
                                      {result.is_passed ? 'Passed' : 'Failed'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Score: {result.total_score}/{result.total_marks}
                                    {result.passing_percentage && ` (Pass: ${result.passing_percentage}%)`}
                                  </p>
                                </div>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewDetails(result.id)}
                                  className="shrink-0"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  )
}