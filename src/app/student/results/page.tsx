// app/student/results/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Loader2, Award, CheckCircle2, XCircle, Search, TrendingUp, TrendingDown,
  Target, Trophy, ChevronRight, GraduationCap, BarChart3, Filter,
  ArrowUpDown, FileText, RefreshCw, Home, ArrowLeft, Activity, Clock,
  Sparkles, ArrowUpRight, ChevronDown,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────
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

// ─── Grading ─────────────────────────────────────────
const getWAECGrade = (p: number): string => {
  const percentage = Number(p) || 0
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

type GradeStyle = {
  grade: string
  label: string
  text: string
  textDark: string
  bg: string
  bgSolid: string
  border: string
  ring: string
  gradient: string
  shadow: string
}

const getGrade = (p: number): GradeStyle => {
  const percentage = Number(p) || 0
  if (percentage >= 75) return {
    grade: 'A1', label: 'Excellent',
    text: 'text-emerald-700', textDark: 'text-emerald-300',
    bg: 'bg-emerald-100', bgSolid: 'bg-emerald-500',
    border: 'border-emerald-300', ring: 'ring-emerald-200',
    gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25'
  }
  if (percentage >= 70) return {
    grade: 'B2', label: 'Very Good',
    text: 'text-blue-700', textDark: 'text-blue-300',
    bg: 'bg-blue-100', bgSolid: 'bg-blue-500',
    border: 'border-blue-300', ring: 'ring-blue-200',
    gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25'
  }
  if (percentage >= 65) return {
    grade: 'B3', label: 'Good',
    text: 'text-sky-700', textDark: 'text-sky-300',
    bg: 'bg-sky-100', bgSolid: 'bg-sky-500',
    border: 'border-sky-300', ring: 'ring-sky-200',
    gradient: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/25'
  }
  if (percentage >= 60) return {
    grade: 'C4', label: 'Credit',
    text: 'text-cyan-700', textDark: 'text-cyan-300',
    bg: 'bg-cyan-100', bgSolid: 'bg-cyan-500',
    border: 'border-cyan-300', ring: 'ring-cyan-200',
    gradient: 'from-cyan-500 to-teal-600', shadow: 'shadow-cyan-500/25'
  }
  if (percentage >= 55) return {
    grade: 'C5', label: 'Credit',
    text: 'text-teal-700', textDark: 'text-teal-300',
    bg: 'bg-teal-100', bgSolid: 'bg-teal-500',
    border: 'border-teal-300', ring: 'ring-teal-200',
    gradient: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/25'
  }
  if (percentage >= 50) return {
    grade: 'C6', label: 'Credit',
    text: 'text-amber-700', textDark: 'text-amber-300',
    bg: 'bg-amber-100', bgSolid: 'bg-amber-500',
    border: 'border-amber-300', ring: 'ring-amber-200',
    gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/25'
  }
  if (percentage >= 45) return {
    grade: 'D7', label: 'Pass',
    text: 'text-orange-700', textDark: 'text-orange-300',
    bg: 'bg-orange-100', bgSolid: 'bg-orange-500',
    border: 'border-orange-300', ring: 'ring-orange-200',
    gradient: 'from-orange-500 to-red-600', shadow: 'shadow-orange-500/25'
  }
  if (percentage >= 40) return {
    grade: 'E8', label: 'Pass',
    text: 'text-yellow-700', textDark: 'text-yellow-300',
    bg: 'bg-yellow-100', bgSolid: 'bg-yellow-500',
    border: 'border-yellow-300', ring: 'ring-yellow-200',
    gradient: 'from-yellow-500 to-amber-600', shadow: 'shadow-yellow-500/25'
  }
  return {
    grade: 'F9', label: 'Needs Work',
    text: 'text-red-700', textDark: 'text-red-300',
    bg: 'bg-red-100', bgSolid: 'bg-red-500',
    border: 'border-red-300', ring: 'ring-red-200',
    gradient: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/25'
  }
}

const getSimpleGrade = (p: number) => {
  const percentage = Number(p) || 0
  if (percentage >= 80) return { grade: 'A', label: 'Excellent', gradient: 'from-emerald-400 to-teal-500', text: 'text-emerald-300', border: 'border-emerald-400/50' }
  if (percentage >= 70) return { grade: 'B', label: 'Very Good', gradient: 'from-blue-400 to-indigo-500', text: 'text-blue-300', border: 'border-blue-400/50' }
  if (percentage >= 60) return { grade: 'C', label: 'Good', gradient: 'from-amber-400 to-orange-500', text: 'text-amber-300', border: 'border-amber-400/50' }
  if (percentage >= 50) return { grade: 'P', label: 'Pass', gradient: 'from-orange-400 to-red-500', text: 'text-orange-300', border: 'border-orange-400/50' }
  return { grade: 'F', label: 'Needs Work', gradient: 'from-red-400 to-rose-500', text: 'text-red-300', border: 'border-red-400/50' }
}

const formatProfileForHeader = (profile: StudentProfile | null) => {
  if (!profile) return undefined
  return {
    id: profile.id,
    name: profile.full_name,
    firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'Student',
    email: profile.email,
    role: 'student' as const,
    avatar: profile.photo_url || undefined,
    isAuthenticated: true,
  }
}

const getInitials = (name: string) => {
  if (!name) return 'S'
  const p = name.split(' ')
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[1][0]).toUpperCase()
}

const formatDate = (d?: string) => d ? format(new Date(d), 'MMM dd, yyyy') : 'N/A'
const formatTime = (d?: string) => d ? format(new Date(d), 'hh:mm a') : ''

// ═══════════════════════════════════════════════════
// STAT TILE - Fixed for mobile
// ═══════════════════════════════════════════════════
function StatTile({
  label, value, icon: Icon, tone, subtitle, delay = 0, trend,
}: {
  label: string
  value: string | number
  icon: any
  tone: 'blue' | 'emerald' | 'red' | 'amber' | 'purple' | 'slate'
  subtitle?: string
  delay?: number
  trend?: 'up' | 'down' | null
}) {
  const tones = {
    blue: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-slate-900', accent: 'bg-blue-500' },
    emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700', accent: 'bg-emerald-500' },
    red: { iconBg: 'bg-red-100', iconColor: 'text-red-600', valueColor: 'text-red-700', accent: 'bg-red-500' },
    amber: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueColor: 'text-amber-700', accent: 'bg-amber-500' },
    purple: { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', valueColor: 'text-purple-700', accent: 'bg-purple-500' },
    slate: { iconBg: 'bg-slate-100', iconColor: 'text-slate-500', valueColor: 'text-slate-700', accent: 'bg-slate-400' },
  }
  const t = tones[tone]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="h-full"
    >
      <div className="relative bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden group h-full">
        <div className={cn('h-0.5 w-full', t.accent, 'opacity-60 group-hover:opacity-100 transition-opacity')} />
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-1.5 mb-1.5">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-tight flex-1 min-w-0 truncate">
              {label}
            </p>
            <div className={cn(
              'h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center shrink-0',
              'group-hover:scale-110 transition-transform duration-200',
              t.iconBg
            )}>
              <Icon className={cn('w-3 h-3 sm:w-3.5 sm:h-3.5', t.iconColor)} />
            </div>
          </div>
          <p className={cn('text-lg sm:text-xl lg:text-2xl font-black leading-none tracking-tight', t.valueColor)}>
            {value}
          </p>
          {subtitle && (
            <div className="flex items-center gap-0.5 mt-1">
              {trend === 'up' && <ArrowUpRight className="h-2.5 w-2.5 text-emerald-500 shrink-0" />}
              <p className="text-[10px] text-slate-500 font-semibold truncate">{subtitle}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════
// SUBJECT TILE - Fixed for mobile
// ═══════════════════════════════════════════════════
function SubjectTile({
  perf, index, avgOverall, onClick,
}: {
  perf: SubjectPerformance
  index: number
  avgOverall: number
  onClick?: () => void
}) {
  const grade = getWAECGrade(perf.averageScore)
  const g = getGrade(perf.averageScore)
  const isAboveAvg = perf.averageScore >= avgOverall

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className="group cursor-pointer h-full"
    >
      <div className="relative bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-200 overflow-hidden h-full">
        <div className={cn('h-1 w-full bg-gradient-to-r', g.gradient)} />
        <div className="p-3">
          <div className="flex items-start justify-between gap-1.5 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs sm:text-sm text-slate-900 leading-tight line-clamp-2 break-words">
                {perf.subject}
              </p>
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                  {perf.examsTaken} exam{perf.examsTaken !== 1 ? 's' : ''}
                </p>
                <span className={cn(
                  'text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap',
                  isAboveAvg ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
                )}>
                  {isAboveAvg ? '↑' : '↓'}
                </span>
              </div>
            </div>
            <div className={cn(
              'shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border-2 shadow-sm',
              g.bg, g.border
            )}>
              <span className={cn('text-[10px] font-black leading-none', g.text)}>{grade}</span>
            </div>
          </div>

          <div className="flex items-baseline gap-0.5 mb-1.5">
            <span className={cn('text-xl font-black leading-none tracking-tight', g.text)}>
              {perf.averageScore}
            </span>
            <span className={cn('text-[10px] font-bold opacity-60', g.text)}>%</span>
          </div>

          <div className="relative w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${perf.averageScore}%` }}
              transition={{ delay: 0.3 + index * 0.04, duration: 0.8, ease: 'easeOut' }}
              className={cn('h-full rounded-full bg-gradient-to-r', g.gradient)}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-semibold">
            <div className="flex items-center gap-0.5 text-emerald-600">
              <TrendingUp className="h-2.5 w-2.5 shrink-0" />
              <span>{perf.bestScore}%</span>
            </div>
            <div className="flex items-center gap-0.5 text-red-500">
              <TrendingDown className="h-2.5 w-2.5 shrink-0" />
              <span>{perf.lowestScore}%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════
// RESULT ROW - Fixed mobile layout
// ═══════════════════════════════════════════════════
function ResultRow({ result, index, onClick }: { result: ExamResult; index: number; onClick: () => void }) {
  const percentage = Number(result.percentage) || 0
  const grade = getWAECGrade(percentage)
  const g = getGrade(percentage)
  const isPending = result.status === 'pending_theory'

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
    >
      <div
        onClick={onClick}
        className="relative bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 active:scale-[0.99] transition-all duration-200 cursor-pointer group overflow-hidden"
      >
        <div className="flex items-stretch">
          <div className={cn(
            'w-1 shrink-0',
            isPending ? 'bg-amber-400' : result.is_passed ? 'bg-emerald-500' : 'bg-red-500'
          )} />

          <div className="flex-1 p-3 sm:p-4 min-w-0">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="shrink-0">
                <div className={cn(
                  'h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex flex-col items-center justify-center border-2 shadow-sm',
                  g.bg, g.border
                )}>
                  <span className={cn('text-[8px] sm:text-[9px] font-bold uppercase leading-none opacity-70', g.text)}>
                    Grade
                  </span>
                  <span className={cn('text-sm sm:text-base font-black leading-none mt-0.5', g.text)}>
                    {grade}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-900 leading-snug mb-1 line-clamp-2 break-words pr-2">
                  {result.exam_title}
                </h3>

                <div className="flex items-center gap-1 flex-wrap mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">
                    {result.exam_subject}
                  </span>
                  <span className={cn(
                    'text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap',
                    isPending
                      ? 'bg-amber-100 text-amber-700'
                      : result.is_passed
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                  )}>
                    {isPending ? (
                      <><Clock className="h-2.5 w-2.5" />Pending</>
                    ) : result.is_passed ? (
                      <><CheckCircle2 className="h-2.5 w-2.5" />Passed</>
                    ) : (
                      <><XCircle className="h-2.5 w-2.5" />Failed</>
                    )}
                  </span>
                  {result.has_ca && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700 whitespace-nowrap">
                      CA: {result.ca1_score}+{result.ca2_score}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-baseline gap-0.5">
                    <span className={cn('text-lg sm:text-xl font-black leading-none', g.text)}>
                      {percentage}
                    </span>
                    <span className={cn('text-xs font-bold opacity-60', g.text)}>%</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-700 transition-colors">
                    <span className="text-[11px] font-semibold">View</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div className="relative w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.2 + index * 0.03, duration: 0.6, ease: 'easeOut' }}
                    className={cn('h-full rounded-full bg-gradient-to-r', g.gradient)}
                  />
                </div>

                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 flex-wrap">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>{formatDate(result.completed_at)}</span>
                  {formatTime(result.completed_at) && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{formatTime(result.completed_at)}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════
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
  const [showAllSubjects, setShowAllSubjects] = useState(false)
  const [stats, setStats] = useState({
    totalExams: 0,
    passedExams: 0,
    failedExams: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 100,
    pendingResults: 0,
  })

  // AUTH
  useEffect(() => {
    let m = true
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          if (m) window.location.replace('/portal')
          return
        }
        const { data: pd } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        if (!pd || pd.role !== 'student') {
          toast.error('Access denied')
          router.push('/portal')
          return
        }
        if (m) {
          setProfile({
            id: session.user.id,
            full_name: pd.full_name || 'Student',
            first_name: pd.first_name,
            last_name: pd.last_name,
            email: pd.email || '',
            class: pd.class || 'Not Assigned',
            department: pd.department || 'General',
            vin_id: pd.vin_id,
            photo_url: pd.photo_url,
          })
          setAuthChecking(false)
        }
      } catch (e) {
        console.error(e)
        if (m) setAuthChecking(false)
      }
    }
    check()
    return () => { m = false }
  }, [router])

  // LOAD RESULTS
  const loadResults = useCallback(async (showToast = false) => {
    if (!profile?.id) return
    if (showToast) setRefreshing(true)
    else setLoading(true)

    try {
      const { data: attemptsData } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })

      if (!attemptsData?.length) {
        setResults([])
        setFilteredResults([])
        setSubjectPerformance([])
        setAvailableSubjects([])
        setStats({ totalExams: 0, passedExams: 0, failedExams: 0, averageScore: 0, highestScore: 0, lowestScore: 100, pendingResults: 0 })
        setLoading(false)
        setRefreshing(false)
        return
      }

      const examIds = [...new Set(attemptsData.map((a) => a.exam_id))]
      const { data: examsData } = await supabase
        .from('exams')
        .select('id,title,subject,passing_percentage,objective_max,theory_max,total_marks')
        .in('id', examIds)
      const examMap: Record<string, any> = {}
      examsData?.forEach((e) => { examMap[e.id] = e })

      const { data: caScoresData } = await supabase
        .from('ca_scores')
        .select('exam_id,ca1_score,ca2_score,total_score,percentage,grade,subject,term,academic_year')
        .eq('student_id', profile.id)
      const caScoresMap: Record<string, any> = {}
      caScoresData?.forEach((ca) => {
        if (ca.exam_id) caScoresMap[ca.exam_id] = ca
        if (ca.subject) {
          const k = `${ca.subject}_${ca.term || 'third'}_${ca.academic_year || '2025/2026'}`
          caScoresMap[k] = ca
        }
      })

      const completedResults: ExamResult[] = []
      const subjectScores: Record<string, number[]> = {}
      let totalPct = 0, passedCount = 0, failedCount = 0, highestScore = 0, lowestScore = 100

      for (const attempt of attemptsData) {
        if (!['completed', 'graded', 'pending_theory'].includes(attempt.status)) continue
        const exam = examMap[attempt.exam_id]
        let ca = caScoresMap[attempt.exam_id]
        if (!ca && exam) ca = caScoresMap[`${exam.subject}_third_2025/2026`]

        const hasCA = !!(ca?.ca1_score || ca?.ca2_score)
        const objectiveMax = exam?.objective_max || 30
        const objectiveScore = Number(attempt.objective_score) || 0
        const theoryScore = Number(attempt.theory_score) || 0
        const caTotal = (ca?.ca1_score || 0) + (ca?.ca2_score || 0)

        let percentage: number
        let totalScore: number

        if (hasCA) {
          totalScore = caTotal + objectiveScore + theoryScore
          percentage = Math.round((totalScore / 100) * 100)
        } else if (theoryScore > 0) {
          const examTotal = objectiveScore + theoryScore
          totalScore = Math.round((examTotal / 60) * 100)
          percentage = totalScore
        } else {
          totalScore = Math.round((objectiveScore / objectiveMax) * 100)
          percentage = totalScore
        }

        percentage = Math.min(Math.max(Number(percentage) || 0, 0), 100)
        const isPassed = percentage >= 40

        completedResults.push({
          id: attempt.id,
          exam_id: attempt.exam_id,
          exam_title: exam?.title || 'Unknown Exam',
          exam_subject: exam?.subject || 'Unknown Subject',
          status: attempt.status,
          percentage,
          total_score: totalScore,
          total_marks: 100,
          objective_score: objectiveScore,
          objective_total: objectiveMax,
          theory_score: attempt.theory_score || 0,
          theory_total: exam?.theory_max || 30,
          ca1_score: ca?.ca1_score || null,
          ca2_score: ca?.ca2_score || null,
          has_ca: hasCA,
          is_passed: isPassed,
          started_at: attempt.started_at || attempt.created_at,
          completed_at: attempt.submitted_at,
          attempt_number: attempt.attempt_number || 1,
          passing_percentage: exam?.passing_percentage || 40,
          grade: getWAECGrade(percentage),
        })

        const subj = exam?.subject || 'Unknown'
        if (!subjectScores[subj]) subjectScores[subj] = []
        subjectScores[subj].push(percentage)
        totalPct += percentage
        if (isPassed) passedCount++
        else failedCount++
        if (percentage > highestScore) highestScore = percentage
        if (percentage < lowestScore) lowestScore = percentage
      }

      const performance = Object.entries(subjectScores)
        .filter(([, scores]) => scores.length > 0)
        .map(([subject, scores]) => {
          const latestScore = scores[scores.length - 1]
          return {
            subject,
            averageScore: Number(latestScore.toFixed(2)),
            examsTaken: scores.length,
            bestScore: Math.max(...scores),
            lowestScore: Math.min(...scores),
            grade: getWAECGrade(latestScore),
          }
        })
        .sort((a, b) => b.averageScore - a.averageScore)

      const avgScore = completedResults.length > 0
        ? Number((totalPct / completedResults.length).toFixed(2))
        : 0

      setResults(completedResults)
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
        pendingResults: 0,
      })
      if (showToast) toast.success('Results refreshed!')
    } catch (e) {
      console.error(e)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [profile?.id])

  useEffect(() => {
    if (!authChecking && profile) loadResults()
  }, [authChecking, profile, loadResults])

  useEffect(() => {
    if (!profile?.id) return
    const ch1 = supabase.channel('r-att')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts', filter: `student_id=eq.${profile.id}` }, () => loadResults(true))
      .subscribe()
    const ch2 = supabase.channel('r-ca')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ca_scores', filter: `student_id=eq.${profile.id}` }, () => loadResults(true))
      .subscribe()
    return () => { ch1.unsubscribe(); ch2.unsubscribe() }
  }, [profile?.id, loadResults])

  useEffect(() => {
    let f = [...results]
    if (subjectFilter !== 'all') f = f.filter((r) => r.exam_subject === subjectFilter)
    if (activeTab === 'passed') f = f.filter((r) => r.is_passed)
    else if (activeTab === 'failed') f = f.filter((r) => !r.is_passed)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      f = f.filter((r) => r.exam_title.toLowerCase().includes(q) || r.exam_subject.toLowerCase().includes(q))
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
    toast.success('Logged out')
    window.location.replace('/portal')
  }

  const overallGrade = getSimpleGrade(stats.averageScore)
  const passRate = stats.totalExams > 0 ? Math.round((stats.passedExams / stats.totalExams) * 100) : 0

  // LOADING
  if (authChecking || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-x-hidden">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center space-y-3">
            <div className="relative w-fit mx-auto">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Loading your results</p>
              <p className="text-xs text-slate-500 mt-0.5">Just a moment...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const visibleSubjects = showAllSubjects ? subjectPerformance : subjectPerformance.slice(0, 8)
  const hasMoreSubjects = subjectPerformance.length > 8

  return (
    // ✅ FIX: overflow-x-hidden on root prevents horizontal bleed
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 overflow-x-hidden">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />

      <div className="flex overflow-x-hidden">
        <StudentSidebar
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="results"
          setActiveTab={() => {}}
        />

        <main className={cn(
          'flex-1 min-h-screen transition-all duration-300 overflow-x-hidden',
          'pt-16 lg:pt-20',
          'pb-24 lg:pb-8',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        )}>
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl mx-auto">

            {/* Sync indicator */}
            <AnimatePresence>
              {refreshing && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-xl text-xs font-semibold pointer-events-none"
                >
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Syncing...
                </motion.div>
              )}
            </AnimatePresence>

            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5 text-sm text-slate-400 min-w-0">
                <Link href="/student" className="hover:text-slate-700 flex items-center gap-1 transition-colors shrink-0">
                  <Home className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Dashboard</span>
                </Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <span className="text-slate-800 font-bold text-xs sm:text-sm truncate">My Results</span>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadResults(true)}
                  className="h-8 text-xs gap-1 border-slate-200 hover:border-slate-300 rounded-lg font-semibold px-2 sm:px-3"
                >
                  <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/student')}
                  className="h-8 text-xs gap-1 border-slate-200 rounded-lg font-semibold px-2 sm:px-3"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </div>
            </motion.div>

            {/* ✅ FIXED HERO BANNER - No more static/glitch */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 sm:mb-6">
              {/* ✅ KEY FIX: isolate + transform-gpu + contain-paint prevent mobile GPU glitches */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-xl isolate"
                style={{
                  transform: 'translateZ(0)',
                  WebkitTransform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  contain: 'paint',
                }}
              >
                {/* Solid gradient background - no blur */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />

                {/* ✅ Decorative blurs - reduced size, pointer-events-none, contained */}
                <div
                  className="absolute top-0 right-0 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none"
                  style={{ transform: 'translateZ(0)' }}
                />
                <div
                  className="absolute bottom-0 left-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"
                  style={{ transform: 'translateZ(0)' }}
                />

                {/* Content */}
                <div className="relative p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">

                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Avatar - simplified, no blur glow */}
                      <div className="relative shrink-0">
                        <Avatar className={cn(
                          "relative h-14 w-14 sm:h-20 sm:w-20 ring-2 sm:ring-4 shadow-xl",
                          "ring-amber-400/40"
                        )}>
                          <AvatarImage src={profile?.photo_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-white text-lg sm:text-2xl font-black">
                            {profile?.full_name ? getInitials(profile.full_name) : 'S'}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-amber-300 shrink-0" />
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-200/80 truncate">
                            Academic Results
                          </span>
                        </div>
                        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                          {profile?.first_name || profile?.full_name?.split(' ')[0] || 'Hello'}&apos;s{' '}
                          <span className="text-amber-300">
                            Results
                          </span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                          {profile?.class && (
                            <span className="flex items-center gap-1 text-xs text-gray-300 font-medium">
                              <GraduationCap className="h-3 w-3 text-blue-300/60 shrink-0" />
                              <span className="truncate max-w-[120px]">{profile.class}</span>
                            </span>
                          )}
                          {profile?.department && (
                            <span className="flex items-center gap-1 text-xs text-gray-300 font-medium">
                              <span className="h-1 w-1 rounded-full bg-blue-300/40 shrink-0" />
                              <span className="truncate max-w-[100px]">{profile.department}</span>
                            </span>
                          )}
                          <span className="text-xs text-gray-300 font-medium">
                            {stats.totalExams} completed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ✅ Grade badge - replaced gradient p-[2px] wrapper with solid border */}
                    {stats.totalExams > 0 && (
                      <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1 shrink-0">
                        <div className={cn(
                          "relative rounded-xl border-2 shadow-xl bg-slate-900/95",
                          overallGrade.border
                        )}>
                          <div className="rounded-xl px-4 sm:px-6 py-2 sm:py-3 flex flex-col items-center min-w-[90px] sm:min-w-[110px]">
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5 sm:mb-1">
                              Overall
                            </p>
                            <p className={cn('text-3xl sm:text-4xl font-black leading-none', overallGrade.text)}>
                              {overallGrade.grade}
                            </p>
                            <p className={cn('text-xs sm:text-sm font-bold mt-0.5 sm:mt-1 opacity-80', overallGrade.text)}>
                              {stats.averageScore}%
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-blue-200/70 font-semibold sm:text-center">
                          {overallGrade.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pass rate */}
                  {stats.totalExams > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/15">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs sm:text-sm text-gray-300">Pass Rate</span>
                        <span className="text-xs sm:text-sm text-gray-300">
                          {stats.passedExams}/{stats.totalExams} passed
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${passRate}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 mb-5 sm:mb-6">
              <StatTile label="Total" value={stats.totalExams} icon={FileText} tone="blue" delay={0.05} />
              <StatTile
                label="Passed"
                value={stats.passedExams}
                icon={CheckCircle2}
                tone="emerald"
                delay={0.08}
                subtitle={`${passRate}%`}
                trend="up"
              />
              <StatTile label="Failed" value={stats.failedExams} icon={XCircle} tone="red" delay={0.11} />
              <StatTile label="Average" value={`${stats.averageScore}%`} icon={Target} tone="amber" delay={0.14} />
              <StatTile label="Highest" value={`${stats.highestScore}%`} icon={Trophy} tone="purple" delay={0.17} />
              <StatTile label="Lowest" value={`${stats.lowestScore}%`} icon={Activity} tone="slate" delay={0.2} />
            </div>

            {/* Subject Performance */}
            {subjectPerformance.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="mb-5 sm:mb-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 shrink-0" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">Subject Performance</h2>
                    <span className="text-xs text-slate-400 font-medium shrink-0">
                      ({subjectPerformance.length})
                    </span>
                  </div>
                  {hasMoreSubjects && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllSubjects(!showAllSubjects)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 gap-1 h-7 px-2 sm:px-3 shrink-0"
                    >
                      {showAllSubjects ? (
                        <>Less <ChevronDown className="h-3 w-3 rotate-180" /></>
                      ) : (
                        <>+{subjectPerformance.length - 8} more <ChevronDown className="h-3 w-3" /></>
                      )}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
                  {visibleSubjects.map((perf, i) => (
                    <SubjectTile
                      key={perf.subject}
                      perf={perf}
                      index={i}
                      avgOverall={stats.averageScore}
                      onClick={() => {
                        setSubjectFilter(perf.subject)
                        setActiveTab('all')
                        setShowAllSubjects(false)
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mb-4 space-y-2.5"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-white border border-slate-200 shadow-sm p-0.5 rounded-xl h-auto gap-0.5 w-full sm:w-auto">
                  {[
                    { value: 'all', label: 'All', count: stats.totalExams },
                    { value: 'passed', label: 'Passed', count: stats.passedExams, dot: 'bg-emerald-500' },
                    { value: 'failed', label: 'Failed', count: stats.failedExams, dot: 'bg-red-500' },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex-1 sm:flex-none rounded-lg text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white px-3 py-1.5 flex items-center justify-center gap-1 font-bold"
                    >
                      {tab.dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', tab.dot)} />}
                      {tab.label}
                      <span className={cn(
                        'text-[10px] px-1.5 py-0 rounded-full font-black min-w-[18px] text-center',
                        activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      )}>
                        {tab.count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm bg-white border-slate-200 rounded-lg font-medium w-full"
                  />
                </div>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-[100px] sm:w-[130px] h-9 text-xs bg-white border-slate-200 rounded-lg font-semibold shrink-0">
                    <Filter className="h-3 w-3 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                  <SelectTrigger className="w-[90px] sm:w-[110px] h-9 text-xs bg-white border-slate-200 rounded-lg font-semibold shrink-0">
                    <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="highest">Highest</SelectItem>
                    <SelectItem value="lowest">Lowest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(searchQuery || subjectFilter !== 'all') && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">Active:</span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full transition-colors font-bold"
                    >
                      &quot;{searchQuery}&quot; ×
                    </button>
                  )}
                  {subjectFilter !== 'all' && (
                    <button
                      onClick={() => setSubjectFilter('all')}
                      className="flex items-center gap-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full transition-colors font-bold max-w-[150px] truncate"
                    >
                      {subjectFilter} ×
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Results List */}
            <AnimatePresence mode="wait">
              {filteredResults.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm py-12 sm:py-14 text-center px-4">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
                      <Award className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-800 mb-2">
                      {results.length === 0 ? 'No results yet' : 'No matching results'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                      {results.length === 0
                        ? 'Complete some exams and your results will appear here!'
                        : 'Try adjusting your filters or search query'}
                    </p>
                    {results.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 text-xs h-8 rounded-lg font-semibold"
                        onClick={() => {
                          setSearchQuery('')
                          setSubjectFilter('all')
                          setActiveTab('all')
                        }}
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2 sm:space-y-2.5"
                >
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-xs text-slate-500 font-semibold">
                      <span className="font-black text-slate-800">{filteredResults.length}</span> result
                      {filteredResults.length !== 1 ? 's' : ''}
                    </p>
                    {activeTab !== 'all' && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {activeTab === 'passed' ? '✓ Passed' : '✗ Failed'}
                      </span>
                    )}
                  </div>
                  {filteredResults.map((result, i) => (
                    <ResultRow
                      key={result.id}
                      result={result}
                      index={i}
                      onClick={() => router.push(`/student/results/${result.exam_id}`)}
                    />
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