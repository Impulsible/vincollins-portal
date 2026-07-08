// app/student/results/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, Award, CheckCircle, XCircle, Search, TrendingUp,
  Target, Trophy, ChevronRight, BookOpen, GraduationCap,
  Calendar, BarChart3, Filter, ArrowUpDown, FileText,
  RefreshCw, Home, ArrowLeft, Star, Zap, Medal,
  TrendingDown, Activity, Clock, Eye,
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
  grade?: string
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
// GRADING HELPERS
// ============================================
const getWAECGrade = (percentage: number): string => {
  if (percentage >= 75) return 'A1'
  if (percentage >= 70) return 'B2'
  if (percentage >= 65) return 'B3'
  if (percentage >= 60) return 'C4'
  if (percentage >= 55) return 'C5'
  if (percentage >= 50) return 'C6'
  if (percentage >= 45) return 'D7'
  if (percentage >= 40) return 'E8'
  return 'F9'
}

const getWAECGradeConfig = (percentage: number) => {
  if (percentage >= 75) return { grade: 'A1', label: 'Excellent',  color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', bar: 'bg-emerald-500', ring: 'ring-emerald-200' }
  if (percentage >= 70) return { grade: 'B2', label: 'Very Good',  color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    bar: 'bg-blue-500',    ring: 'ring-blue-200' }
  if (percentage >= 65) return { grade: 'B3', label: 'Good',       color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-200',     bar: 'bg-sky-500',     ring: 'ring-sky-200' }
  if (percentage >= 60) return { grade: 'C4', label: 'Credit',     color: 'text-cyan-600',    bg: 'bg-cyan-50',    border: 'border-cyan-200',    bar: 'bg-cyan-500',    ring: 'ring-cyan-200' }
  if (percentage >= 55) return { grade: 'C5', label: 'Credit',     color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-200',    bar: 'bg-teal-500',    ring: 'ring-teal-200' }
  if (percentage >= 50) return { grade: 'C6', label: 'Credit',     color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500',   ring: 'ring-amber-200' }
  if (percentage >= 45) return { grade: 'D7', label: 'Pass',       color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200',  bar: 'bg-orange-500',  ring: 'ring-orange-200' }
  if (percentage >= 40) return { grade: 'E8', label: 'Pass',       color: 'text-yellow-600',  bg: 'bg-yellow-50',  border: 'border-yellow-200',  bar: 'bg-yellow-500',  ring: 'ring-yellow-200' }
  return               { grade: 'F9', label: 'Fail',       color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     bar: 'bg-red-500',     ring: 'ring-red-200' }
}

const getSimplifiedGradeConfig = (percentage: number) => {
  if (percentage >= 80) return { grade: 'A', label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-500', soft: 'bg-emerald-50', border: 'border-emerald-200' }
  if (percentage >= 70) return { grade: 'B', label: 'Very Good', color: 'text-blue-600',    bg: 'bg-blue-500',    soft: 'bg-blue-50',    border: 'border-blue-200' }
  if (percentage >= 60) return { grade: 'C', label: 'Good',      color: 'text-amber-600',   bg: 'bg-amber-500',   soft: 'bg-amber-50',   border: 'border-amber-200' }
  if (percentage >= 50) return { grade: 'P', label: 'Pass',      color: 'text-orange-600',  bg: 'bg-orange-500',  soft: 'bg-orange-50',  border: 'border-orange-200' }
  return               { grade: 'F', label: 'Fail',      color: 'text-red-600',     bg: 'bg-red-500',     soft: 'bg-red-50',     border: 'border-red-200' }
}

const formatProfileForHeader = (profile: StudentProfile | null) => {
  if (!profile) return undefined
  return {
    id: profile.id, name: profile.full_name,
    firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'Student',
    email: profile.email, role: 'student' as const,
    avatar: profile.photo_url || undefined, isAuthenticated: true,
  }
}

const getInitials = (name: string): string => {
  if (!name) return 'S'
  const parts = name.split(' ')
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase()
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return format(new Date(dateString), 'MMM dd, yyyy • hh:mm a')
}

// ============================================
// RADIAL SCORE RING
// ============================================
function ScoreRing({ percentage, size = 64 }: { percentage: number; size?: number }) {
  const cfg = getWAECGradeConfig(percentage)
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          className={cfg.bar.replace('bg-', 'stroke-')}
          strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className={cn('font-bold z-10', size < 60 ? 'text-[10px]' : 'text-xs', cfg.color)}>
        {percentage}%
      </span>
    </div>
  )
}

// ============================================
// STAT CARD
// ============================================
function StatCard({
  label, value, icon: Icon, color, subtitle, delay = 0,
}: {
  label: string; value: string | number; icon: any
  color: string; subtitle?: string; delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white overflow-hidden group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
              <p className={cn('text-2xl font-bold mt-1 leading-none', color)}>{value}</p>
              {subtitle && <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>}
            </div>
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ml-2 transition-transform duration-200 group-hover:scale-110',
              color.replace('text-', 'bg-').replace('-600', '-100').replace('-700', '-100')
            )}>
              <Icon className={cn('h-5 w-5', color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============================================
// SUBJECT PERFORMANCE CARD
// ============================================
function SubjectCard({ perf, index }: { perf: SubjectPerformance; index: number }) {
  const cfg = getWAECGradeConfig(perf.averageScore)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className={cn(
        'relative p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-md group overflow-hidden',
        cfg.border, cfg.bg
      )}
    >
      {/* decorative blob */}
      <div className={cn('absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-10', cfg.bar)} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="font-semibold text-sm text-slate-800 truncate">{perf.subject}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{perf.examsTaken} exam{perf.examsTaken !== 1 ? 's' : ''} taken</p>
        </div>
        <div className={cn('px-2 py-0.5 rounded-lg text-[11px] font-bold border', cfg.bg, cfg.color, cfg.border)}>
          {perf.grade}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-2xl font-black', cfg.color)}>{perf.averageScore}%</span>
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
          {cfg.label}
        </span>
      </div>

      <div className="w-full bg-white/60 rounded-full h-2 mb-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${perf.averageScore}%` }}
          transition={{ delay: 0.3 + index * 0.05, duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', cfg.bar)}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-0.5"><TrendingUp className="h-2.5 w-2.5 text-emerald-500" /> {perf.bestScore}%</span>
        <span className="flex items-center gap-0.5"><TrendingDown className="h-2.5 w-2.5 text-red-400" /> {perf.lowestScore}%</span>
      </div>
    </motion.div>
  )
}

// ============================================
// RESULT ROW CARD
// ============================================
function ResultCard({ result, index, onClick }: { result: ExamResult; index: number; onClick: () => void }) {
  const cfg = getWAECGradeConfig(result.percentage)
  const isPending = result.status === 'pending_theory'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          'border-0 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer bg-white group',
          'hover:-translate-y-0.5'
        )}
      >
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Left accent bar */}
            <div className={cn(
              'w-1 rounded-l-xl shrink-0 transition-all duration-200 group-hover:w-1.5',
              result.is_passed ? 'bg-emerald-500' : isPending ? 'bg-amber-400' : 'bg-red-500'
            )} />

            <div className="flex-1 p-3 sm:p-4">
              <div className="flex items-center gap-3">

                {/* Score ring */}
                <div className="shrink-0 hidden xs:block">
                  <ScoreRing percentage={result.percentage} size={52} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-slate-900 truncate leading-snug">
                        {result.exam_title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <Badge variant="outline" className="text-[10px] py-0 h-4 px-1.5 bg-slate-50">
                          {result.exam_subject}
                        </Badge>
                        <Badge className={cn(
                          'text-[10px] py-0 h-4 px-1.5 font-semibold',
                          isPending
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : result.is_passed
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                        )}>
                          {isPending ? '⏳ Pending' : result.is_passed ? '✓ Passed' : '✗ Failed'}
                        </Badge>
                        <Badge className={cn(
                          'text-[10px] py-0 h-4 px-1.5 font-bold border',
                          cfg.bg, cfg.color, cfg.border
                        )}>
                          {result.grade}
                        </Badge>
                        {result.has_ca && (
                          <Badge className="text-[10px] py-0 h-4 px-1.5 bg-purple-100 text-purple-700 border border-purple-200">
                            CA: {result.ca1_score}/{result.ca2_score}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(result.completed_at)}
                      </p>
                    </div>

                    {/* Score block */}
                    <div className="shrink-0 text-right">
                      <div className={cn('text-2xl font-black leading-none', cfg.color)}>
                        {result.percentage}%
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {result.total_score}/100
                      </div>
                      <div className={cn('text-[10px] font-semibold mt-1', cfg.color)}>
                        {cfg.label}
                      </div>
                    </div>
                  </div>

                  {/* Score breakdown bar */}
                  <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${result.percentage}%` }}
                      transition={{ delay: 0.2 + index * 0.04, duration: 0.6, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', cfg.bar)}
                    />
                  </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 hidden sm:flex items-center">
                  <div className="h-7 w-7 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-all duration-200">
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
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
    totalExams: 0, passedExams: 0, failedExams: 0,
    averageScore: 0, highestScore: 0, lowestScore: 100, pendingResults: 0,
  })

  // ── AUTH ─────────────────────────────────────────
  useEffect(() => {
    let isMounted = true
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) { if (isMounted) window.location.replace('/portal'); return }
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (!profileData || profileData.role !== 'student') { toast.error('Access denied'); router.push('/portal'); return }
        if (isMounted) {
          setProfile({
            id: session.user.id, full_name: profileData.full_name || 'Student',
            first_name: profileData.first_name, last_name: profileData.last_name,
            email: profileData.email || '', class: profileData.class || 'Not Assigned',
            department: profileData.department || 'General', vin_id: profileData.vin_id,
            photo_url: profileData.photo_url,
          })
          setAuthChecking(false)
        }
      } catch (err) { console.error(err); if (isMounted) setAuthChecking(false) }
    }
    checkAuth()
    return () => { isMounted = false }
  }, [router])

  // ── LOAD RESULTS ─────────────────────────────────
  const loadResults = useCallback(async (showToast = false) => {
    if (!profile?.id) return
    if (showToast) setRefreshing(true); else setLoading(true)

    try {
      const { data: attemptsData } = await supabase
        .from('exam_attempts').select('*').eq('student_id', profile.id)
        .order('created_at', { ascending: false })

      if (!attemptsData?.length) {
        setResults([]); setFilteredResults([]); setSubjectPerformance([])
        setAvailableSubjects([])
        setStats({ totalExams: 0, passedExams: 0, failedExams: 0, averageScore: 0, highestScore: 0, lowestScore: 100, pendingResults: 0 })
        setLoading(false); setRefreshing(false)
        return
      }

      const examIds = [...new Set(attemptsData.map(a => a.exam_id))]
      const { data: examsData } = await supabase
        .from('exams')
        .select('id, title, subject, passing_percentage, objective_max, theory_max, total_marks')
        .in('id', examIds)
      
      const examMap: Record<string, any> = {}
      if (examsData) examsData.forEach(e => { examMap[e.id] = e })

      // ✅ Get CA scores
      const { data: caScoresData } = await supabase
        .from('ca_scores')
        .select('exam_id, ca1_score, ca2_score, total_score, percentage, grade, subject, term, academic_year')
        .eq('student_id', profile.id)

      // Build CA scores map
      const caScoresMap: Record<string, any> = {}
      if (caScoresData) {
        caScoresData.forEach(ca => {
          if (ca.exam_id) {
            caScoresMap[ca.exam_id] = ca
          }
          if (ca.subject) {
            const key = `${ca.subject}_${ca.term || 'third'}_${ca.academic_year || '2025/2026'}`
            caScoresMap[key] = ca
          }
        })
      }

      const completedResults: ExamResult[] = []
      const subjectScores: Record<string, number[]> = {}
      let totalPct = 0, passedCount = 0, failedCount = 0, highestScore = 0, lowestScore = 100

      for (const attempt of attemptsData) {
        if (!['completed', 'graded', 'pending_theory'].includes(attempt.status)) continue
        const exam = examMap[attempt.exam_id]
        
        // ✅ Find CA
        let ca = caScoresMap[attempt.exam_id]
        if (!ca && exam) {
          const key = `${exam.subject}_third_2025/2026`
          ca = caScoresMap[key]
        }
        
        const hasCA = !!(ca?.ca1_score || ca?.ca2_score)
        const objectiveMax = exam?.objective_max || 30
        const theoryMax = exam?.theory_max || 30
        
        const objectiveScore = Number(attempt.objective_score) || 0
        const theoryScore = Number(attempt.theory_score) || 0
        const caTotal = (ca?.ca1_score || 0) + (ca?.ca2_score || 0)
        
        // ✅ CORRECT CALCULATION - Scale everything to 100
        let percentage: number
        let totalScore: number
        let totalMarks: number = 100  // Always 100
        let grade: string
        
        if (hasCA) {
          // ✅ Stage 3: CA + Objective + Theory = out of 100
          totalScore = caTotal + objectiveScore + theoryScore
          percentage = Math.round((totalScore / 100) * 100)
          grade = ca?.grade || getWAECGrade(percentage)
        } else if (theoryScore > 0) {
          // ✅ Stage 2: Objective + Theory = out of 60, scaled to 100
          const examTotal = objectiveScore + theoryScore
          totalScore = Math.round((examTotal / 60) * 100)
          percentage = totalScore
          grade = getWAECGrade(percentage)
        } else {
          // ✅ Stage 1: Only Objective = out of objectiveMax, scaled to 100
          totalScore = Math.round((objectiveScore / objectiveMax) * 100)
          percentage = totalScore
          grade = getWAECGrade(percentage)
        }
        
        // Safety cap
        if (percentage > 100) percentage = 100
        
        const isPassed = percentage >= 40

        completedResults.push({
          id: attempt.id, 
          exam_id: attempt.exam_id,
          exam_title: exam?.title || 'Unknown Exam', 
          exam_subject: exam?.subject || 'Unknown Subject',
          status: attempt.status, 
          percentage, 
          total_score: totalScore, 
          total_marks: totalMarks,  // ✅ Always 100
          objective_score: objectiveScore, 
          objective_total: objectiveMax,
          theory_score: attempt.theory_score || 0, 
          theory_total: theoryMax,
          ca1_score: ca?.ca1_score || null, 
          ca2_score: ca?.ca2_score || null, 
          has_ca: hasCA,
          is_passed: isPassed, 
          started_at: attempt.started_at || attempt.created_at,
          completed_at: attempt.submitted_at, 
          attempt_number: attempt.attempt_number || 1,
          passing_percentage: exam?.passing_percentage || 40, 
          grade: grade,
        })

        const subj = exam?.subject || 'Unknown'
        if (!subjectScores[subj]) subjectScores[subj] = []
        subjectScores[subj].push(percentage)

        totalPct += percentage
        if (isPassed) passedCount++; else failedCount++
        if (percentage > highestScore) highestScore = percentage
        if (percentage < lowestScore) lowestScore = percentage
      }

      const performance: SubjectPerformance[] = Object.entries(subjectScores)
        .filter(([, s]) => s.length > 0)
        .map(([subject, scores]) => {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length
          return {
            subject, 
            averageScore: Number(avg.toFixed(2)),
            examsTaken: scores.length, 
            bestScore: Math.max(...scores),
            lowestScore: Math.min(...scores), 
            grade: getWAECGrade(avg),
          }
        })
        .sort((a, b) => b.averageScore - a.averageScore)

      const avgScore = completedResults.length > 0
        ? Number((totalPct / completedResults.length).toFixed(2)) : 0

      setResults(completedResults); 
      setFilteredResults(completedResults)
      setAvailableSubjects([...new Set(Object.keys(subjectScores))].sort())
      setSubjectPerformance(performance)
      setStats({ 
        totalExams: completedResults.length, 
        passedExams: passedCount, 
        failedExams: failedCount, 
        averageScore: avgScore, 
        highestScore, 
        lowestScore: lowestScore === 100 ? 0 : lowestScore, 
        pendingResults: 0 
      })
      if (showToast) toast.success('Results refreshed!')
    } catch (error) {
      console.error(error); toast.error('Failed to load results')
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [profile?.id])

  useEffect(() => { if (!authChecking && profile) loadResults() }, [authChecking, profile, loadResults])

  // ── REAL-TIME ─────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return
    const ch1 = supabase.channel('results-attempts-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts', filter: `student_id=eq.${profile.id}` }, () => loadResults(true))
      .subscribe()
    const ch2 = supabase.channel('results-ca-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ca_scores', filter: `student_id=eq.${profile.id}` }, () => loadResults(true))
      .subscribe()
    return () => { ch1.unsubscribe(); ch2.unsubscribe() }
  }, [profile?.id, loadResults])

  // ── FILTER + SORT ─────────────────────────────────
  useEffect(() => {
    let f = [...results]
    if (subjectFilter !== 'all') f = f.filter(r => r.exam_subject === subjectFilter)
    if (activeTab === 'passed') f = f.filter(r => r.is_passed)
    else if (activeTab === 'failed') f = f.filter(r => !r.is_passed)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      f = f.filter(r => r.exam_title.toLowerCase().includes(q) || r.exam_subject.toLowerCase().includes(q))
    }
    switch (sortOrder) {
      case 'newest': f.sort((a, b) => new Date(b.completed_at || '').getTime() - new Date(a.completed_at || '').getTime()); break
      case 'oldest': f.sort((a, b) => new Date(a.completed_at || '').getTime() - new Date(b.completed_at || '').getTime()); break
      case 'highest': f.sort((a, b) => b.percentage - a.percentage); break
      case 'lowest': f.sort((a, b) => a.percentage - b.percentage); break
    }
    setFilteredResults(f)
  }, [results, subjectFilter, activeTab, searchQuery, sortOrder])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    window.location.replace('/portal')
  }

  const simplifiedGrade = getSimplifiedGradeConfig(stats.averageScore)
  const passRate = stats.totalExams > 0 ? Math.round((stats.passedExams / stats.totalExams) * 100) : 0

  // ── LOADING ───────────────────────────────────────
  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-200">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Loading your results</p>
              <p className="text-sm text-slate-400 mt-1">Please wait a moment...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />

      <div className="flex">
        <StudentSidebar
          profile={profile} onLogout={handleLogout}
          collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="results" setActiveTab={() => {}}
        />

        <main className={cn(
          'flex-1 pt-16 lg:pt-20 pb-24 lg:pb-8 min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        )}>
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">

            {/* Refreshing toast */}
            <AnimatePresence>
              {refreshing && (
                <motion.div
                  initial={{ opacity: 0, y: -10, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: -10, x: '-50%' }}
                  className="fixed top-20 left-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-xl text-xs font-medium"
                >
                  <RefreshCw className="h-3 w-3 animate-spin" /> Syncing results...
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── BREADCRUMB ─────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Link href="/student" className="hover:text-slate-600 flex items-center gap-1 transition-colors">
                  <Home className="h-3.5 w-3.5" /> Dashboard
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-slate-700 font-medium">My Results</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => loadResults(true)}
                  className="h-8 text-xs gap-1.5 border-slate-200 hover:border-slate-300">
                  <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} /> Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/student')}
                  className="h-8 text-xs gap-1.5 border-slate-200">
                  <ArrowLeft className="h-3 w-3" /> Back
                </Button>
              </div>
            </motion.div>

            {/* ── HERO HEADER ────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 sm:p-6 text-white overflow-hidden relative shadow-xl">
              {/* decorative circles */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-blue-500/10 rounded-full translate-y-1/2" />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-white/20 shadow-xl shrink-0">
                  <AvatarImage src={profile?.photo_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xl font-bold">
                    {profile?.full_name ? getInitials(profile.full_name) : 'S'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                    {profile?.first_name || profile?.full_name?.split(' ')[0] || 'Student'}&apos;s Academic Results
                  </h1>
                  <p className="text-blue-200/80 text-xs sm:text-sm mt-1">
                    {profile?.class} · {profile?.department || 'General'}
                  </p>
                </div>

                {/* Overall grade badge */}
                {stats.totalExams > 0 && (
                  <div className="shrink-0 text-center bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
                    <p className="text-[10px] text-blue-200/70 uppercase tracking-wide font-medium">Overall</p>
                    <p className={cn('text-3xl font-black mt-0.5', simplifiedGrade.color)}>
                      {simplifiedGrade.grade}
                    </p>
                    <p className="text-[10px] text-blue-200/70 mt-0.5">{simplifiedGrade.label}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── STATS GRID ─────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
              <StatCard label="Total Exams"   value={stats.totalExams}    icon={FileText}      color="text-blue-600"    delay={0.05} />
              <StatCard label="Passed"        value={stats.passedExams}   icon={CheckCircle}   color="text-emerald-600" delay={0.08} subtitle={`${passRate}% rate`} />
              <StatCard label="Failed"        value={stats.failedExams}   icon={XCircle}       color="text-red-600"     delay={0.11} />
              <StatCard label="Average"       value={`${stats.averageScore}%`} icon={Target}   color="text-amber-600"   delay={0.14} />
              <StatCard label="Highest"       value={`${stats.highestScore}%`} icon={Trophy}   color="text-purple-600"  delay={0.17} />
              <StatCard label="Lowest"        value={`${stats.lowestScore}%`}  icon={Activity} color="text-slate-500"   delay={0.20} />
            </div>

            {/* ── SUBJECT PERFORMANCE ────────────────── */}
            {subjectPerformance.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-emerald-500" />
                    Subject Performance
                    <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      WAEC Grades
                    </span>
                  </h2>
                  {subjectPerformance.length > 6 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-slate-500 hover:text-slate-700">
                      View all <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {subjectPerformance.slice(0, 6).map((perf, i) => (
                    <SubjectCard key={perf.subject} perf={perf} index={i} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── FILTERS ────────────────────────────── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              className="mb-4 space-y-3">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white border border-slate-200 shadow-sm p-1 rounded-xl h-auto gap-1">
                  {[
                    { value: 'all',    label: 'All Results', count: stats.totalExams },
                    { value: 'passed', label: 'Passed',      count: stats.passedExams,  dot: 'bg-emerald-500' },
                    { value: 'failed', label: 'Failed',      count: stats.failedExams,  dot: 'bg-red-500' },
                  ].map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value}
                      className="rounded-lg text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white px-3 py-1.5 flex items-center gap-1.5">
                      {tab.dot && <span className={cn('h-1.5 w-1.5 rounded-full', tab.dot)} />}
                      {tab.label}
                      <span className={cn(
                        'text-[10px] px-1.5 py-0 rounded-full font-medium',
                        activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      )}>
                        {tab.count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Search + filters row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search exams or subjects..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm bg-white border-slate-200 rounded-xl"
                  />
                </div>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-xs bg-white border-slate-200 rounded-xl gap-1">
                    <Filter className="h-3 w-3 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                  <SelectTrigger className="w-[110px] h-9 text-xs bg-white border-slate-200 rounded-xl gap-1">
                    <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest">Highest Score</SelectItem>
                    <SelectItem value="lowest">Lowest Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active filter chips */}
              {(searchQuery || subjectFilter !== 'all') && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400">Filters:</span>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}
                      className="flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full transition-colors">
                      "{searchQuery}" ×
                    </button>
                  )}
                  {subjectFilter !== 'all' && (
                    <button onClick={() => setSubjectFilter('all')}
                      className="flex items-center gap-1 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full transition-colors">
                      {subjectFilter} ×
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* ── RESULTS LIST ───────────────────────── */}
            <AnimatePresence mode="wait">
              {filteredResults.length === 0 ? (
                <motion.div key="empty"
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}>
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="py-16 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Award className="h-8 w-8 text-slate-300" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-700 mb-2">
                        {results.length === 0 ? 'No results yet' : 'No matching results'}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {results.length === 0 ? 'Complete exams to see your results here!' : 'Try adjusting your filters or search query'}
                      </p>
                      {results.length > 0 && (
                        <Button variant="outline" size="sm" className="mt-4 text-xs"
                          onClick={() => { setSearchQuery(''); setSubjectFilter('all'); setActiveTab('all') }}>
                          Clear all filters
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-2">
                  {/* Results count */}
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-[11px] text-slate-400">
                      Showing <span className="font-semibold text-slate-600">{filteredResults.length}</span> result{filteredResults.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {filteredResults.map((result, i) => (
                    <ResultCard key={result.id} result={result} index={i}
                      onClick={() => router.push(`/student/results/${result.exam_id}`)} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
      </div>
    </div>
  )
}