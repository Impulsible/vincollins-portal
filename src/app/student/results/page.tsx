// app/student/results/page.tsx - COMPLETE FIXED VERSION

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  FileText, Download, Printer, RefreshCw, Home, ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

// ============================================
// TYPES
// ============================================
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
  objective_total?: number
  theory_score?: number
  theory_total?: number
  ca1_score?: number
  ca2_score?: number
  has_ca?: boolean
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

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatProfileForHeader = (profile: StudentProfile | null) => {
  if (!profile) return undefined
  return {
    id: profile.id,
    name: profile.full_name,
    firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'Student',
    email: profile.email,
    role: 'student' as const,
    avatar: profile.photo_url || undefined,
    isAuthenticated: true
  }
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
  if (percentage >= 60) return { grade: 'C', color: 'text-cyan-600' }
  if (percentage >= 50) return { grade: 'P', color: 'text-amber-600' }
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

// ============================================
// MAIN COMPONENT
// ============================================
export default function StudentResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
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

  // ============================================
  // AUTH CHECK
  // ============================================
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

  // ============================================
  // ✅ FIXED: LOAD RESULTS - INCLUDES PENDING THEORY
  // ============================================
  const loadResults = useCallback(async (showToast = false) => {
    if (!profile?.id) return
    
    if (showToast) setRefreshing(true)
    else setLoading(true)
    
    try {
      console.log('📊 Loading results for student:', profile.id)

      // Query 1: Get exam attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })

      if (attemptsError) {
        console.error('Error loading attempts:', attemptsError)
        toast.error('Failed to load results')
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (!attemptsData || attemptsData.length === 0) {
        setResults([])
        setFilteredResults([])
        setSubjectPerformance([])
        setAvailableSubjects([])
        setStats({
          totalExams: 0,
          passedExams: 0,
          failedExams: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 100,
          pendingResults: 0
        })
        setLoading(false)
        setRefreshing(false)
        return
      }

      console.log('📊 Found attempts:', attemptsData.length)

      // Query 2: Get exam details separately
      const examIds = [...new Set(attemptsData.map(a => a.exam_id))]
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, title, subject, total_marks, passing_percentage')
        .in('id', examIds)

      const examMap: Record<string, any> = {}
      if (examsData) {
        examsData.forEach(exam => {
          examMap[exam.id] = exam
        })
      }

      // Query 3: Get CA scores
      const { data: caScoresData } = await supabase
        .from('ca_scores')
        .select('exam_id, ca1_score, ca2_score')
        .eq('student_id', profile.id)

      const caScoresMap: Record<string, any> = {}
      if (caScoresData) {
        caScoresData.forEach(ca => {
          caScoresMap[ca.exam_id] = ca
        })
      }

      // Process results
      const completedResults: ExamResult[] = []
      const subjectScores: Record<string, number[]> = {}
      
      let totalPercentage = 0
      let passedCount = 0
      let failedCount = 0
      let highestScore = 0
      let lowestScore = 100
      let pendingCount = 0

      for (const attempt of attemptsData) {
        const exam = examMap[attempt.exam_id]
        const ca = caScoresMap[attempt.exam_id]
        
        // ✅ FIXED: Include pending_theory as well
        if (attempt.status === 'completed' || attempt.status === 'graded' || attempt.status === 'pending_theory') {
          // Use percentage from database (calculated by trigger)
          const percentage = attempt.percentage || 0
          const passingScore = exam?.passing_percentage || 50
          const isPassed = percentage >= passingScore
          
          console.log(`📊 ${exam?.subject || 'Unknown'}: ${percentage}% (from DB), Passed: ${isPassed}, Status: ${attempt.status}`)
          
          const result: ExamResult = {
            id: attempt.id,
            exam_id: attempt.exam_id,
            exam_title: exam?.title || 'Unknown Exam',
            exam_subject: exam?.subject || 'Unknown Subject',
            status: attempt.status,
            percentage: percentage,
            total_score: attempt.total_score || 0,
            total_marks: attempt.total_marks || 100,
            objective_score: attempt.objective_score,
            objective_total: attempt.objective_total || 20,
            theory_score: attempt.theory_score,
            theory_total: attempt.theory_total || 40,
            ca1_score: ca?.ca1_score,
            ca2_score: ca?.ca2_score,
            has_ca: !!(ca?.ca1_score || ca?.ca2_score),
            is_passed: isPassed,
            started_at: attempt.started_at || attempt.created_at,
            completed_at: attempt.submitted_at,
            attempt_number: attempt.attempt_number || 1,
            passing_percentage: passingScore
          }
          
          completedResults.push(result)
          
          // Track subject performance
          const subject = exam?.subject || 'Unknown'
          if (!subjectScores[subject]) {
            subjectScores[subject] = []
          }
          subjectScores[subject].push(percentage)
          
          // Update stats
          totalPercentage += percentage
          if (isPassed) passedCount++ 
          else failedCount++
          if (percentage > highestScore) highestScore = percentage
          if (percentage < lowestScore) lowestScore = percentage
        } else if (attempt.status === 'submitted') {
          pendingCount++
        }
      }

      // Calculate subject performance
      const performance: SubjectPerformance[] = []
      Object.entries(subjectScores).forEach(([subject, scores]) => {
        if (scores.length === 0) return
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

      performance.sort((a, b) => b.averageScore - a.averageScore)

      const avgScore = completedResults.length > 0 ? Math.round(totalPercentage / completedResults.length) : 0

      console.log('📊 Final Stats:', {
        totalExams: completedResults.length,
        passedExams: passedCount,
        failedExams: failedCount,
        averageScore: avgScore,
        highestScore: highestScore,
        lowestScore: lowestScore,
        pendingResults: pendingCount
      })

      setResults(completedResults)
      setFilteredResults(completedResults)
      setAvailableSubjects([...new Set(Object.keys(subjectScores))].sort())
      setSubjectPerformance(performance)
      
      setStats({
        totalExams: completedResults.length,
        passedExams: passedCount,
        failedExams: failedCount,
        averageScore: avgScore,
        highestScore: highestScore,
        lowestScore: lowestScore,
        pendingResults: pendingCount
      })

      if (showToast) {
        toast.success('Results refreshed!')
      }

    } catch (error) {
      console.error('Error loading results:', error)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [profile?.id])

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    if (!authChecking && profile) {
      loadResults()
    }
  }, [authChecking, profile, loadResults])

  // ============================================
  // REAL-TIME SYNC
  // ============================================
  useEffect(() => {
    if (!profile?.id) return

    console.log('📡 Setting up real-time subscriptions for results...')

    const attemptsChannel = supabase
      .channel('results-attempts-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_attempts',
          filter: `student_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('🔄 Exam attempt changed, refreshing results...', payload.eventType)
          loadResults(true)
        }
      )
      .subscribe()

    const caScoresChannel = supabase
      .channel('results-ca-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ca_scores',
          filter: `student_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('🔄 CA scores changed, refreshing results...', payload.eventType)
          loadResults(true)
        }
      )
      .subscribe()

    return () => {
      console.log('📡 Cleaning up results subscriptions')
      attemptsChannel.unsubscribe()
      caScoresChannel.unsubscribe()
    }
  }, [profile?.id, loadResults])

  // ============================================
  // FILTER AND SORT
  // ============================================
  useEffect(() => {
    let filtered = [...results]
    
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(r => r.exam_subject === subjectFilter)
    }
    
    if (activeTab === 'passed') {
      filtered = filtered.filter(r => r.is_passed)
    } else if (activeTab === 'failed') {
      filtered = filtered.filter(r => !r.is_passed)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.exam_title.toLowerCase().includes(query) ||
        r.exam_subject.toLowerCase().includes(query)
      )
    }
    
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

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    window.location.replace('/portal')
  }

  const handleViewDetails = (examId: string) => {
    router.push(`/student/results/${examId}`)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    if (filteredResults.length === 0) {
      toast.error('No data to export')
      return
    }
    
    const csv = [
      ['Exam Title', 'Subject', 'Score', 'Percentage', 'Grade', 'Status', 'Date'],
      ...filteredResults.map(r => [
        r.exam_title,
        r.exam_subject,
        `${r.total_score}/${r.total_marks}`,
        `${r.percentage}%`,
        getGradeFromPercentage(r.percentage),
        r.is_passed ? 'Passed' : 'Failed',
        r.completed_at ? format(new Date(r.completed_at), 'MMM dd, yyyy') : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `my_results_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Results exported successfully!')
  }

  const handleRefresh = () => {
    loadResults(true)
  }

  // ============================================
  // LOADING STATE
  // ============================================
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
      </div>
    )
  }

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
          "flex-1 pt-16 lg:pt-20 pb-24 lg:pb-8 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
            
            {/* Refresh indicator */}
            {refreshing && (
              <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating results...
              </div>
            )}

            {/* Breadcrumb */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/student" className="hover:text-primary flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-foreground font-medium">My Results</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/student')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            </motion.div>
            
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-12 w-12 sm:h-14 md:h-16 sm:w-14 md:w-16 ring-2 ring-primary/20 shadow-lg">
                    <AvatarImage src={profile?.photo_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-lg sm:text-xl font-bold">
                      {profile?.full_name ? getInitials(profile.full_name) : 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                      My Results
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      View and analyze your exam performance
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-1.5 sm:gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 sm:h-9">
                    <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Print</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport} className="h-8 sm:h-9">
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6"
            >
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500">Total Exams</p>
                      <p className="text-xl sm:text-2xl font-bold">{stats.totalExams}</p>
                    </div>
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500">Passed</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.passedExams}</p>
                    </div>
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500">Failed</p>
                      <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.failedExams}</p>
                    </div>
                    <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500">Avg Score</p>
                      <p className="text-xl sm:text-2xl font-bold text-amber-600">{stats.averageScore}%</p>
                    </div>
                    <Target className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-2 sm:col-span-1 border-0 shadow-sm bg-white">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500">Grade</p>
                      <p className={cn("text-xl sm:text-2xl font-bold", gradeInfo.color)}>
                        {stats.totalExams > 0 ? gradeInfo.grade : '-'}
                      </p>
                    </div>
                    <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subject Performance */}
            {subjectPerformance.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-0 shadow-sm bg-white">
                  <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                      Subject Performance
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your performance across different subjects</CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                    <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {subjectPerformance.slice(0, 6).map((perf) => {
                        const perfGrade = calculateGrade(perf.averageScore)
                        return (
                          <div key={perf.subject} className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-sm sm:text-base truncate">{perf.subject}</p>
                              <Badge className={cn("text-[10px] sm:text-xs", perfGrade.color.replace('text', 'bg').replace('600', '100'), perfGrade.color)}>
                                {perf.grade}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xl sm:text-2xl font-bold">{perf.averageScore}%</span>
                              <span className="text-[10px] sm:text-xs text-slate-500">{perf.examsTaken} exam{perf.examsTaken !== 1 ? 's' : ''}</span>
                            </div>
                            <Progress value={perf.averageScore} className="h-1.5 sm:h-2" />
                            <div className="flex justify-between mt-2 text-[10px] sm:text-xs text-slate-500">
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
              className="flex flex-col gap-3 mb-4 sm:mb-5"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white p-1 rounded-xl shadow-sm border w-full justify-start overflow-x-auto">
                  <TabsTrigger value="all" className="rounded-lg text-xs sm:text-sm whitespace-nowrap">
                    All ({stats.totalExams})
                  </TabsTrigger>
                  <TabsTrigger value="passed" className="rounded-lg text-xs sm:text-sm whitespace-nowrap">
                    Passed ({stats.passedExams})
                  </TabsTrigger>
                  <TabsTrigger value="failed" className="rounded-lg text-xs sm:text-sm whitespace-nowrap">
                    Failed ({stats.failedExams})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                  <Input
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 h-9 text-sm bg-white w-full"
                  />
                </div>
                
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-[110px] sm:w-[130px] h-9 text-sm bg-white">
                    <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                  <SelectTrigger className="w-[110px] sm:w-[130px] h-9 text-sm bg-white">
                    <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                    <CardContent className="text-center py-12 sm:py-16">
                      <Award className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {results.length === 0 ? 'No results yet' : 'No matching results'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {results.length === 0 
                          ? 'Complete exams to see your results here!'
                          : 'Try adjusting your filters'}
                      </p>
                      {results.length === 0 && (
                        <Button 
                          className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-sm"
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
                  className="space-y-2 sm:space-y-3"
                >
                  {filteredResults.map((result, index) => {
                    const gradeInfo = calculateGrade(result.percentage)
                    const hasCA = result.has_ca || (result.ca1_score && result.ca1_score > 0) || (result.ca2_score && result.ca2_score > 0)
                    
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={cn(
                          "border-0 shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer",
                          result.is_passed ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"
                        )}
                        onClick={() => handleViewDetails(result.exam_id)}>
                          <CardContent className="p-3 sm:p-4 lg:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-2 sm:gap-3">
                                  <div className={cn(
                                    "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0",
                                    result.is_passed ? "bg-green-100" : "bg-red-100"
                                  )}>
                                    <BookOpen className={cn(
                                      "h-5 w-5 sm:h-6 sm:w-6",
                                      result.is_passed ? "text-green-600" : "text-red-600"
                                    )} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                      {result.exam_title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 mt-1">
                                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                                        {result.exam_subject}
                                      </Badge>
                                      {/* ✅ FIXED: Status Badge - Shows "Theory Pending" */}
                                      <Badge className={cn(
                                        "text-[10px] sm:text-xs",
                                        result.status === 'graded' ? "bg-green-100 text-green-700" :
                                        result.status === 'pending_theory' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                                        result.is_passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                      )}>
                                        {result.status === 'pending_theory' ? '⏳ Theory Pending' :
                                         result.status === 'graded' ? '✅ Graded' :
                                         result.is_passed ? '✅ Passed' : '❌ Failed'}
                                      </Badge>
                                      {hasCA && (
                                        <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs">
                                          CA: {result.ca1_score || 0}/{result.ca2_score || 0}
                                        </Badge>
                                      )}
                                      <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(result.completed_at)}
                                      </span>
                                      {result.attempt_number > 1 && (
                                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                          Attempt #{result.attempt_number}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] sm:text-xs text-slate-500">
                                      {result.objective_score !== undefined && (
                                        <span>Objective: {result.objective_score?.toFixed(1) || 0}/{result.objective_total}</span>
                                      )}
                                      {result.theory_score !== undefined && result.theory_score > 0 && (
                                        <span>Theory: {result.theory_score?.toFixed(1) || 0}/{result.theory_total}</span>
                                      )}
                                      {hasCA && (
                                        <span>Total: {result.total_score?.toFixed(1) || 0}/{result.total_marks}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 lg:gap-6">
                                <div className="text-right">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "text-xl sm:text-2xl font-bold",
                                      gradeInfo.color
                                    )}>
                                      {result.percentage}%
                                    </span>
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-slate-500">
                                    {result.total_score}/{result.total_marks} marks
                                  </div>
                                </div>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="shrink-0 h-8 w-8 p-0 rounded-full"
                                >
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
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
    </div>
  )
}