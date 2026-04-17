/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/exams/page.tsx - WITH WELCOME BANNER & FIRST NAME FIX
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { StudentWelcomeBanner } from '@/components/student/StudentWelcomeBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Loader2, MonitorPlay, FileText, Award, Clock,
  BookOpen, GraduationCap, Filter, Search, ChevronRight,
  CheckCircle2, Timer, Shield, PenTool, Hash, Target, Zap,
  TrendingUp, BarChart3, LayoutGrid, List, Lock, Unlock,
  ArrowRight, CheckCircle, History, Calendar, RefreshCw,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// Types
interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  status: string
  description?: string
  passing_percentage?: number
  created_at: string
  starts_at?: string
  ends_at?: string
  has_theory?: boolean
  proctoring_enabled?: boolean
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  term?: string
  session_year?: string
}

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
}

interface ExamAttempt {
  id: string
  exam_id: string
  status: 'completed' | 'in_progress' | 'abandoned'
  percentage?: number
  started_at: string
  completed_at?: string
}

// Constants
const TERMS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const SESSIONS = [
  { value: '2023/2024', label: '2023/2024' },
  { value: '2024/2025', label: '2024/2025' },
  { value: '2025/2026', label: '2025/2026' },
]

const SUBJECT_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Mathematics': { icon: Hash, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'English Language': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'English Studies': { icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Physics': { icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'Chemistry': { icon: Sparkles, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Biology': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Economics': { icon: TrendingUp, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Civic Education': { icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Data Processing': { icon: MonitorPlay, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Agricultural Science': { icon: Target, color: 'text-green-600', bgColor: 'bg-green-50' },
  'Further Mathematics': { icon: Hash, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  'Government': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50' },
  'Literature in English': { icon: PenTool, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'Commerce': { icon: BarChart3, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Financial Accounting': { icon: FileText, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'bg-green-100 text-green-700 border-green-200' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  advanced: { label: 'Advanced', color: 'bg-red-100 text-red-700 border-red-200' },
}

type ViewMode = 'grid' | 'compact'

export default function StudentExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [filteredExams, setFilteredExams] = useState<Exam[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [activeTab, setActiveTab] = useState('available')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [examAttempts, setExamAttempts] = useState<Record<string, ExamAttempt>>({})
  
  const [selectedTerm, setSelectedTerm] = useState<string>('first')
  const [selectedSession, setSelectedSession] = useState<string>('2024/2025')
  
  const [stats, setStats] = useState({
    available: 0,
    completed: 0,
    averageScore: 0,
    currentGrade: '-',
    gradeColor: 'text-gray-400',
    totalSubjects: 17,
    progressPercentage: 0
  })

  // Banner stats - synced with welcome banner
  const [bannerStats, setBannerStats] = useState({
    completedExams: 0,
    averageScore: 0,
    availableExams: 0,
    totalExams: 0,
    totalSubjects: 17,
    currentGrade: 'N/A',
    gradeColor: 'text-gray-400'
  })

  // Helper to get first name properly (not surname)
  const getFirstName = (fullName: string): string => {
    if (!fullName || fullName === 'Student') return 'Student'
    const parts = fullName.trim().split(/\s+/)
    return parts[0] // Always return first part as first name
  }

  const getCurrentTermSession = useCallback(() => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    
    if (month >= 9 && month <= 12) {
      return { term: 'first', session: `${year}/${year + 1}` }
    } else if (month >= 1 && month <= 4) {
      return { term: 'second', session: `${year - 1}/${year}` }
    } else {
      return { term: 'third', session: `${year - 1}/${year}` }
    }
  }, [])

  useEffect(() => {
    const current = getCurrentTermSession()
    setSelectedTerm(current.term)
    setSelectedSession(current.session)
  }, [getCurrentTermSession])

  const getSubjectCountForClass = (className: string): number => {
    if (className?.startsWith('JSS')) return 17
    if (className?.startsWith('SS')) return 10
    return 17
  }

  const calculateGrade = (percentage: number): { grade: string; color: string } => {
    if (percentage >= 80) return { grade: 'A', color: 'text-emerald-600' }
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' }
    if (percentage >= 60) return { grade: 'C', color: 'text-amber-600' }
    if (percentage >= 50) return { grade: 'P', color: 'text-orange-600' }
    return { grade: 'F', color: 'text-red-600' }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Please log in to continue')
        router.push('/portal')
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

      const { data: userData } = await supabase
        .from('users')
        .select('vin_id')
        .eq('id', profileData.id)
        .maybeSingle()

      const studentProfile: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || session.user.user_metadata?.full_name || 'Student',
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        vin_id: userData?.vin_id,
        photo_url: profileData.photo_url
      }

      setProfile(studentProfile)
      console.log('👤 Student:', studentProfile.full_name, 'Class:', studentProfile.class)

      const totalSubjects = getSubjectCountForClass(studentProfile.class)

      // Load ALL published exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (examsError) {
        console.error('Error loading exams:', examsError)
        toast.error('Failed to load exams')
        return
      }

      console.log('📚 Total published exams:', examsData?.length || 0)

      // Filter by class
      let filteredExamsData = (examsData || []).filter(exam => {
        if (!exam.class || exam.class === 'all') return true
        return exam.class === studentProfile.class
      })

      console.log('📚 After class filter:', filteredExamsData.length)

      // Department filtering for SSS
      if (studentProfile.class?.startsWith('SS') && studentProfile.department && studentProfile.department !== 'General') {
        const deptLower = studentProfile.department.toLowerCase()
        let allowedSubjects: string[] = []
        
        if (deptLower.includes('science')) {
          allowedSubjects = ['English Language', 'Mathematics', 'Civic Education', 'Physics', 'Chemistry', 'Biology', 'Data Processing', 'Agricultural Science', 'Economics', 'Further Mathematics']
        } else if (deptLower.includes('art')) {
          allowedSubjects = ['English Language', 'Mathematics', 'Civic Education', 'Literature in English', 'Government', 'Biology', 'Christian Religious Studies', 'Economics', 'Data Processing', 'Agricultural Science']
        } else if (deptLower.includes('commercial')) {
          allowedSubjects = ['English Language', 'Mathematics', 'Civic Education', 'Economics', 'Commerce', 'Financial Accounting', 'Data Processing', 'Agricultural Science', 'Biology', 'Government']
        }
        
        if (allowedSubjects.length > 0) {
          filteredExamsData = filteredExamsData.filter(exam => allowedSubjects.includes(exam.subject))
          console.log('📚 After department filter:', filteredExamsData.length)
        }
      }

      setExams(filteredExamsData)
      setFilteredExams(filteredExamsData)

      const subjects = [...new Set(filteredExamsData.map(e => e.subject))]
      setAvailableSubjects(subjects.sort())

      // Load attempts
      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', studentProfile.id)
        .in('exam_id', filteredExamsData.map(e => e.id))

      const attemptsMap: Record<string, ExamAttempt> = {}
      let completedCount = 0
      let totalScore = 0

      attemptsData?.forEach(attempt => {
        attemptsMap[attempt.exam_id] = attempt
        if (attempt.status === 'completed') {
          completedCount++
          totalScore += attempt.percentage || 0
        }
      })

      setExamAttempts(attemptsMap)

      const isExamAvailable = (exam: Exam) => {
        const now = new Date()
        if (attemptsMap[exam.id]?.status === 'completed') return false
        if (!exam.starts_at && !exam.ends_at) return true
        if (exam.starts_at && new Date(exam.starts_at) > now) return false
        if (exam.ends_at && new Date(exam.ends_at) < now) return false
        return true
      }

      const availableCount = filteredExamsData.filter(e => isExamAvailable(e)).length
      const avgScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0
      const gradeInfo = calculateGrade(avgScore)
      const progressPercentage = totalSubjects > 0 ? Math.round((completedCount / totalSubjects) * 100) : 0

      setStats({
        available: availableCount,
        completed: completedCount,
        averageScore: avgScore,
        currentGrade: completedCount > 0 ? gradeInfo.grade : '-',
        gradeColor: gradeInfo.color,
        totalSubjects: totalSubjects,
        progressPercentage: progressPercentage
      })

      // Update banner stats for sync
      setBannerStats({
        completedExams: completedCount,
        averageScore: avgScore,
        availableExams: availableCount,
        totalExams: filteredExamsData.length,
        totalSubjects: totalSubjects,
        currentGrade: completedCount > 0 ? gradeInfo.grade : 'N/A',
        gradeColor: gradeInfo.color
      })

    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Real-time subscription for live updates
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('exam-attempts-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_attempts',
          filter: `student_id=eq.${profile.id}`
        },
        () => {
          console.log('🔄 Exam attempt changed, refreshing...')
          loadData()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [profile?.id, loadData])

  useEffect(() => {
    let filtered = [...exams]
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(e => e.subject === selectedSubject)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.subject.toLowerCase().includes(query)
      )
    }
    setFilteredExams(filtered)
  }, [selectedSubject, searchQuery, exams])

  const getExamStatus = (exam: Exam): 'available' | 'upcoming' | 'completed' | 'expired' => {
    const attempt = examAttempts[exam.id]
    if (attempt?.status === 'completed') return 'completed'
    const now = new Date()
    if (exam.starts_at && new Date(exam.starts_at) > now) return 'upcoming'
    if (exam.ends_at && new Date(exam.ends_at) < now) return 'expired'
    return 'available'
  }

  const getDisplayedExams = () => {
    switch (activeTab) {
      case 'available': return filteredExams.filter(e => getExamStatus(e) === 'available')
      case 'completed': return filteredExams.filter(e => getExamStatus(e) === 'completed')
      case 'upcoming': return filteredExams.filter(e => getExamStatus(e) === 'upcoming')
      default: return filteredExams
    }
  }

  const displayedExams = getDisplayedExams()

  const handleTakeExam = (examId: string) => {
    const attempt = examAttempts[examId]
    if (attempt?.status === 'in_progress') {
      router.push(`/student/exam/${examId}?resume=true`)
    } else {
      router.push(`/student/exam/${examId}`)
    }
  }

  const handleViewResult = (examId: string) => {
    router.push(`/student/results/${examId}`)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Always available'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTimeRemaining = (dateString?: string) => {
    if (!dateString) return null
    const now = new Date()
    const target = new Date(dateString)
    const diff = target.getTime() - now.getTime()
    if (diff < 0) return null
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const getSubjectConfig = (subject: string) => {
    return SUBJECT_CONFIG[subject] || { 
      icon: BookOpen, 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-50' 
    }
  }

  if (loading) {
    return (
      <>
        <Header onLogout={handleLogout} />
        <div className="min-h-screen flex items-center justify-center pt-20 bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading your exams...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header onLogout={handleLogout} />
      
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          
          {/* WELCOME BANNER - Synced with live stats */}
          <StudentWelcomeBanner profile={profile} stats={bannerStats} />

          {/* FILTER BAR */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {availableSubjects.length > 0 && (
                <ScrollArea className="w-full sm:flex-1 whitespace-nowrap pb-2">
                  <div className="flex gap-2">
                    <Badge
                      variant={selectedSubject === 'all' ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer hover:bg-primary/10 transition-all px-4 py-2 text-sm",
                        selectedSubject === 'all' && "bg-primary text-white"
                      )}
                      onClick={() => setSelectedSubject('all')}
                    >
                      All ({exams.length})
                    </Badge>
                    {availableSubjects.map(subject => {
                      const config = getSubjectConfig(subject)
                      const SubjectIcon = config.icon
                      const count = exams.filter(e => e.subject === subject).length
                      const hasCompleted = exams.filter(e => e.subject === subject)
                        .some(e => examAttempts[e.id]?.status === 'completed')
                      
                      return (
                        <Badge
                          key={subject}
                          variant={selectedSubject === subject ? 'default' : 'outline'}
                          className={cn(
                            "cursor-pointer hover:bg-primary/10 transition-all px-3 py-2 text-sm flex items-center gap-1.5",
                            selectedSubject === subject && "bg-primary text-white",
                            hasCompleted && "border-green-300"
                          )}
                          onClick={() => setSelectedSubject(subject)}
                        >
                          <SubjectIcon className="h-3.5 w-3.5" />
                          {subject} ({count})
                          {hasCompleted && <CheckCircle2 className="h-3 w-3 text-green-500 ml-0.5" />}
                        </Badge>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 h-9 w-40 sm:w-48 bg-white"
                  />
                </div>
                
                <div className="flex items-center bg-white rounded-lg border p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'compact' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('compact')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* TABS */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="bg-white p-1 rounded-xl shadow-sm border">
              <TabsTrigger value="available" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <Unlock className="h-4 w-4 mr-2" />
                Available
                <Badge variant="secondary" className="ml-2">
                  {filteredExams.filter(e => getExamStatus(e) === 'available').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <Clock className="h-4 w-4 mr-2" />
                Upcoming
                <Badge variant="secondary" className="ml-2">
                  {filteredExams.filter(e => getExamStatus(e) === 'upcoming').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Completed
                <Badge variant="secondary" className="ml-2">
                  {filteredExams.filter(e => getExamStatus(e) === 'completed').length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* EXAMS GRID */}
          {displayedExams.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="text-center py-16">
                <MonitorPlay className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No exams available</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'available' 
                    ? `No exams found for ${profile?.class}. Check back later!`
                    : activeTab === 'completed'
                      ? 'Start taking exams to see your results here!'
                      : 'No upcoming exams scheduled.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-3"
            )}>
              {displayedExams.map((exam) => {
                const status = getExamStatus(exam)
                const attempt = examAttempts[exam.id]
                const config = getSubjectConfig(exam.subject)
                const SubjectIcon = config.icon
                const difficulty = exam.difficulty || 'intermediate'
                
                return (
                  <Card key={exam.id} className={cn(
                    "shadow-lg hover:shadow-xl transition-all",
                    status === 'completed' && "border-green-200 bg-green-50/30",
                    status === 'upcoming' && "border-amber-200 bg-amber-50/30"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", config.bgColor)}>
                          <SubjectIcon className={cn("h-6 w-6", config.color)} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{exam.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{exam.subject}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge variant="outline" className={cn("text-xs", DIFFICULTY_CONFIG[difficulty]?.color)}>
                          {DIFFICULTY_CONFIG[difficulty]?.label || 'Intermediate'}
                        </Badge>
                        {exam.has_theory && (
                          <Badge variant="outline" className="text-xs bg-purple-50">
                            <PenTool className="h-3 w-3 mr-1" />
                            Theory
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{exam.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{exam.total_questions} Qs</span>
                        </div>
                      </div>

                      {exam.starts_at && status === 'upcoming' && (
                        <div className="mb-3 p-2 bg-amber-50 rounded-lg">
                          <p className="text-xs text-amber-700">
                            Starts {formatDate(exam.starts_at)}
                          </p>
                          {formatTimeRemaining(exam.starts_at) && (
                            <p className="text-xs text-amber-600">
                              ⏰ {formatTimeRemaining(exam.starts_at)} remaining
                            </p>
                          )}
                        </div>
                      )}

                      {status === 'completed' && attempt && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Score</span>
                            <span className="font-bold text-green-600">{attempt.percentage}%</span>
                          </div>
                          <Progress value={attempt.percentage || 0} className="h-2" />
                        </div>
                      )}

                      {status === 'completed' ? (
                        <Button onClick={() => handleViewResult(exam.id)} variant="outline" className="w-full border-green-200 text-green-700">
                          <Award className="mr-2 h-4 w-4" />
                          View Result
                        </Button>
                      ) : status === 'available' ? (
                        <Button onClick={() => handleTakeExam(exam.id)} className="w-full">
                          <MonitorPlay className="mr-2 h-4 w-4" />
                          {attempt?.status === 'in_progress' ? 'Resume' : 'Start'} Exam
                        </Button>
                      ) : (
                        <Button disabled variant="outline" className="w-full">
                          <Lock className="mr-2 h-4 w-4" />
                          Not Available
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  )
}