'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Users, CheckCircle2, XCircle, Clock, Loader2,
  Calendar, ChevronLeft, ChevronRight, Lock,
  AlertCircle, UserCheck, UserX, BarChart3, RefreshCw,
  BookOpen, Shield, TrendingUp, ArrowRight, Briefcase,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClassAttendance {
  name: string
  studentCount: number
  presentToday: number
  absentToday: number
  totalMarked: number
  percentage: number
  isLocked: boolean
  lastMarkedDate?: string
}

interface TermInfo {
  term_code: string
  term_name: string
  session_year: string
  start_date: string
  end_date: string
}

// ── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>
        <p className="font-semibold text-slate-700">Loading attendance...</p>
        <p className="text-sm text-slate-400 mt-1">Fetching class records</p>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'emerald' | 'rose' | 'amber' | 'slate'
}) {
  const map = {
    blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-500',    text: 'text-blue-700'    },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-700' },
    rose:    { bg: 'bg-rose-50',    icon: 'bg-rose-500',    text: 'text-rose-700'    },
    amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-500',   text: 'text-amber-700'   },
    slate:   { bg: 'bg-slate-100',  icon: 'bg-slate-500',   text: 'text-slate-700'   },
  }
  const c = map[color]

  return (
    <div className={cn('rounded-2xl p-4 border border-white/60 shadow-sm', c.bg)}>
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shadow-sm mb-3', c.icon)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  )
}

// ── Class Card ────────────────────────────────────────────────────────────────

function ClassCard({
  cls,
  isWeekend,
  onMark,
}: {
  cls: ClassAttendance
  isWeekend: boolean
  onMark: (name: string) => void
}) {
  const pct = Math.round(cls.percentage)
  const statusColor =
    pct >= 80 ? 'emerald' :
    pct >= 60 ? 'blue' :
    pct >= 40 ? 'amber' : 'rose'

  const barColor =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-blue-500' :
    pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'

  const isComplete  = cls.totalMarked === cls.studentCount && cls.studentCount > 0
  const isInProgress = cls.totalMarked > 0 && cls.totalMarked < cls.studentCount
  const isPending   = cls.totalMarked === 0

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">

      {/* Top accent bar */}
      <div className={cn(
        'h-1 w-full',
        cls.isLocked ? 'bg-amber-400' :
        isComplete   ? 'bg-emerald-500' :
        isInProgress ? 'bg-blue-500' : 'bg-slate-200'
      )} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-none">{cls.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{cls.studentCount} students</p>
            </div>
          </div>

          {/* Status badge */}
          <div className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold',
            cls.isLocked
              ? 'bg-amber-100 text-amber-700'
              : isComplete
              ? 'bg-emerald-100 text-emerald-700'
              : isInProgress
              ? 'bg-blue-100 text-blue-700'
              : 'bg-slate-100 text-slate-500'
          )}>
            {cls.isLocked  && <><Shield className="h-3 w-3" /> Locked</>}
            {!cls.isLocked && isComplete   && <><CheckCircle2 className="h-3 w-3" /> Done</>}
            {!cls.isLocked && isInProgress && <><Clock className="h-3 w-3" /> In Progress</>}
            {!cls.isLocked && isPending    && <><Clock className="h-3 w-3" /> Pending</>}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-emerald-50 rounded-xl">
            <p className="text-lg font-bold text-emerald-700 leading-none">{cls.presentToday}</p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Present</p>
          </div>
          <div className="text-center p-2 bg-rose-50 rounded-xl">
            <p className="text-lg font-bold text-rose-600 leading-none">{cls.absentToday}</p>
            <p className="text-[10px] text-rose-500 font-medium mt-0.5">Absent</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-xl">
            <p className="text-lg font-bold text-slate-600 leading-none">
              {cls.studentCount - cls.totalMarked}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Unmarked</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-medium">Attendance rate</span>
            <span className={cn(
              'text-xs font-bold',
              pct >= 80 ? 'text-emerald-600' :
              pct >= 60 ? 'text-blue-600' :
              pct >= 40 ? 'text-amber-600' : 'text-rose-600'
            )}>
              {pct}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={cn('h-2 rounded-full transition-all', barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {cls.totalMarked} of {cls.studentCount} marked
          </p>
        </div>

        {/* Action button */}
        {isWeekend ? (
          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            No school today
          </div>
        ) : cls.isLocked ? (
          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 text-sm font-medium">
            <Lock className="h-4 w-4" />
            Attendance Locked
          </div>
        ) : (
          <button
            onClick={() => onMark(cls.name)}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
              isPending
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200'
                : 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
            )}
          >
            {isPending ? (
              <><Users className="h-4 w-4" /> Mark Attendance</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Update Attendance</>
            )}
            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffAttendancePage() {
  const router  = useRouter()
  const { user } = useUser()

  const [classes,     setClasses]     = useState<ClassAttendance[]>([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [termInfo,    setTermInfo]    = useState<TermInfo | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stats, setStats] = useState({
    totalStudents: 0, totalPresent: 0,
    totalAbsent: 0,   totalMarked: 0,
    unmarked: 0,      overallPercentage: 0,
  })

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (showToast = false) => {
    if (!user?.id) return
    if (showToast) setRefreshing(true)
    else setLoading(true)

    try {
      const { data: settings } = await supabase
        .from('school_settings')
        .select('current_term, current_session')
        .single()

      let term: TermInfo | null = null
      if (settings) {
        const { data: termData } = await supabase
          .from('terms')
          .select('*')
          .eq('term_code', settings.current_term)
          .eq('session_year', settings.current_session)
          .single()
        term = termData
        setTermInfo(termData)
      }

      const { data: teacherClasses } = await supabase
        .from('teacher_classes')
        .select('class_name')
        .eq('teacher_id', user.id)

      const classNames = teacherClasses?.map((tc: any) => tc.class_name) || []

      if (classNames.length === 0) {
        setClasses([])
        if (showToast) toast.warning('No classes assigned. Contact admin.')
        return
      }

      const { data: students } = await supabase
        .from('profiles')
        .select('id, display_name, class')
        .eq('role', 'student')
        .eq('is_active', true)
        .in('class', classNames)

      const classStudentCount: Record<string, number> = {}
      students?.forEach((s: any) => {
        if (s.class) classStudentCount[s.class] = (classStudentCount[s.class] || 0) + 1
      })

      const todayStr = currentDate.toISOString().split('T')[0]
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('student_id, class_name, status, locked')
        .eq('date', todayStr)
        .eq('term_code', term?.term_code || '')
        .eq('session_year', term?.session_year || '')

      const classData: ClassAttendance[] = classNames.map((className: string) => {
        const studentCount    = classStudentCount[className] || 0
        const classAttendance = attendance?.filter((a: any) => a.class_name === className) || []
        const present         = classAttendance.filter((a: any) => a.status === 'present').length
        const absent          = classAttendance.filter((a: any) => a.status === 'absent').length
        return {
          name: className,
          studentCount,
          presentToday: present,
          absentToday: absent,
          totalMarked: present + absent,
          percentage: studentCount > 0 ? (present / studentCount) * 100 : 0,
          isLocked: classAttendance.some((a: any) => a.locked),
          lastMarkedDate: classAttendance.length > 0 ? todayStr : undefined,
        }
      })

      setClasses(classData)

      const totalStudents = classData.reduce((s, c) => s + c.studentCount,  0)
      const totalPresent  = classData.reduce((s, c) => s + c.presentToday,  0)
      const totalAbsent   = classData.reduce((s, c) => s + c.absentToday,   0)
      const totalMarked   = classData.reduce((s, c) => s + c.totalMarked,   0)

      setStats({
        totalStudents,
        totalPresent,
        totalAbsent,
        totalMarked,
        unmarked: totalStudents - totalMarked,
        overallPercentage: totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0,
      })

      if (showToast) toast.success('Attendance refreshed')
    } catch {
      if (showToast) toast.error('Failed to refresh data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id, currentDate])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const changeDate = (days: number) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + days)
    setCurrentDate(d)
  }

  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6

  const isToday = (d: Date) => {
    const t = new Date()
    return d.getDate() === t.getDate() &&
           d.getMonth() === t.getMonth() &&
           d.getFullYear() === t.getFullYear()
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const isWeekendDay = isWeekend(currentDate)
  const isTodayDate  = isToday(currentDate)
  const pct          = Math.round(stats.overallPercentage)

  if (loading) return <LoadingScreen />

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* ── Sticky Top Bar ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Left: title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 leading-none">Attendance</p>
                {termInfo && (
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                    {termInfo.term_name} · {termInfo.session_year}
                  </p>
                )}
              </div>
            </div>

            {/* Right: date controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeDate(-1)}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>

              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm text-sm font-medium',
                isWeekendDay
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : isTodayDate
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700'
              )}>
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {currentDate.toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                </span>
                <span className="sm:hidden">
                  {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {isTodayDate && !isWeekendDay && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    TODAY
                  </span>
                )}
                {isWeekendDay && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full">
                    WEEKEND
                  </span>
                )}
              </div>

              <button
                onClick={() => changeDate(1)}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>

              {!isTodayDate && (
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Today
                </button>
              )}

              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm"
              >
                <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500', refreshing && 'animate-spin')} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Summary Hero ──────────────────────────────────────────────── */}
        {classes.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-5 shadow-lg">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-indigo-400/10 blur-2xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-blue-200 text-xs font-medium mb-1">
                  {currentDate.toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </p>
                <h2 className="text-white text-xl font-bold mb-1">
                  {isWeekendDay ? 'No School Today' : 'Daily Attendance Overview'}
                </h2>
                <p className="text-blue-200 text-sm">
                  {classes.length} class{classes.length !== 1 ? 'es' : ''} ·{' '}
                  {stats.totalStudents} students total
                </p>
              </div>

              {!isWeekendDay && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[160px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-200">Overall Rate</span>
                    <span className="text-base font-bold text-white">{pct}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                    <div
                      className="h-1.5 rounded-full bg-white transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-blue-300">
                    {stats.totalPresent} present · {stats.totalAbsent} absent
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Stat Cards ────────────────────────────────────────────────── */}
        {!isWeekendDay && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Students"   value={stats.totalStudents}              icon={Users}      color="blue"    />
            <StatCard label="Present Today"    value={stats.totalPresent}               icon={UserCheck}  color="emerald" />
            <StatCard label="Absent Today"     value={stats.totalAbsent}                icon={UserX}      color="rose"    />
            <StatCard label="Unmarked"         value={stats.unmarked}                   icon={Clock}      color="amber"   />
          </div>
        )}

        {/* ── Weekend Banner ────────────────────────────────────────────── */}
        {isWeekendDay && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar className="h-10 w-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' })} — No School
            </h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Attendance is only taken on school days (Monday – Friday).
            </p>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Calendar className="h-4 w-4" /> Back to Today
            </button>
          </div>
        )}

        {/* ── No Classes Assigned ───────────────────────────────────────── */}
        {!isWeekendDay && classes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Classes Assigned</h3>
            <p className="text-slate-400 text-sm max-w-xs mb-6">
              You haven't been assigned to any classes yet. Contact your admin to get set up.
            </p>
            <button
              onClick={() => router.push('/admin/teacher-classes')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Briefcase className="h-4 w-4" /> Manage Class Assignments
            </button>
          </div>
        )}

        {/* ── Class Cards Grid ──────────────────────────────────────────── */}
        {!isWeekendDay && classes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => (
              <ClassCard
                key={cls.name}
                cls={cls}
                isWeekend={isWeekendDay}
                onMark={(name) => router.push(`/staff/attendance/${encodeURIComponent(name)}`)}
              />
            ))}
          </div>
        )}

        {/* ── Footer Legend ─────────────────────────────────────────────── */}
        {!isWeekendDay && classes.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-white rounded-xl border border-slate-100 shadow-sm text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{classes.filter(c => c.isLocked).length} locked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{classes.filter(c => c.totalMarked > 0 && !c.isLocked).length} in progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <span>{classes.filter(c => c.totalMarked === 0).length} pending</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>
                {stats.totalMarked ?? (stats.totalPresent + stats.totalAbsent)} of {stats.totalStudents} students marked today
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating refresh indicator */}
      {refreshing && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full shadow-xl text-xs font-medium">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
          Refreshing...
        </div>
      )}
    </div>
  )
}