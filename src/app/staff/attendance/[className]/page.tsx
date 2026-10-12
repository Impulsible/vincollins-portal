'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft, Users, Calendar,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Loader2, AlertCircle, UserCheck, UserX,
  Clock, Shield, TrendingUp, BookOpen, Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  student_id: string
  student_name: string
  photo_url?: string | null
  avatar_url?: string | null
}

interface AttendanceRecord {
  student_id: string
  date: string
  status: 'present' | 'absent' | null
  locked: boolean
}

interface TermInfo {
  term_code: string
  term_name: string
  session_year: string
  start_date: string
  end_date: string
}

interface WeekDay {
  date: Date
  dateStr: string
  dayName: string
  dayShort: string
  isToday: boolean
}

interface Week {
  weekNumber: number
  weekLabel: string
  days: WeekDay[]
  startDate: Date
  endDate: Date
}

const normalizeClassName = (name: string): string => {
  if (!name) return ''
  let n = name.trim().replace(/\s+/g, ' ')
  n = n.replace(/JSS\s+(\d+)/i, 'JSS$1')
  n = n.replace(/SS\s+(\d+)/i, 'SS$1')
  return n.toUpperCase().trim()
}

const classNamesMatch = (a: string, b: string) =>
  !!a && !!b && normalizeClassName(a) === normalizeClassName(b)

const toDateStr = (d: Date) => d.toISOString().split('T')[0]

const DAY_NAMES  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_SHORTS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function buildTermWeeks(startDate: Date, endDate: Date): Week[] {
  const weeks: Week[] = []
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)
  const dow = cursor.getDay()
  cursor.setDate(cursor.getDate() + (dow === 0 ? -6 : 1 - dow))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let weekNum = 1
  while (cursor <= endDate) {
    const days: WeekDay[] = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(cursor)
      d.setDate(cursor.getDate() + i)
      days.push({
        date: d,
        dateStr: toDateStr(d),
        dayName: DAY_NAMES[i],
        dayShort: DAY_SHORTS[i],
        isToday: toDateStr(d) === toDateStr(today),
      })
    }
    const weekEnd = new Date(cursor)
    weekEnd.setDate(cursor.getDate() + 4)
    weeks.push({ weekNumber: weekNum, weekLabel: `Week ${weekNum}`, days, startDate: new Date(cursor), endDate: weekEnd })
    cursor.setDate(cursor.getDate() + 7)
    weekNum++
  }
  return weeks
}

function getRecord(records: AttendanceRecord[], studentId: string, dateStr: string) {
  return records.find(r => r.student_id === studentId && r.date === dateStr)
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200">Loading attendance...</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Fetching student records</p>
      </div>
    </div>
  )
}

function AttendanceCell({
  record,
  isLocked,
  isFuture,
  onChange,
}: {
  record: AttendanceRecord | undefined
  isLocked: boolean
  isFuture: boolean
  onChange: (status: 'present' | 'absent' | null) => void
}) {
  const status = record?.status ?? null
  const cellLocked = isLocked || record?.locked || isFuture

  const cycle = () => {
    if (cellLocked) return
    if (status === null) onChange('present')
    else if (status === 'present') onChange('absent')
    else onChange(null)
  }

  if (cellLocked && status === null) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className={cn(
          'w-10 h-10 rounded-2xl flex items-center justify-center',
          isFuture
            ? 'bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-700'
            : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
        )}>
          {isFuture
            ? <Clock className="h-4 w-4 text-slate-300 dark:text-slate-600" />
            : <Shield className="h-4 w-4 text-slate-300 dark:text-slate-600" />}
        </div>
        <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600 leading-none">
          {isFuture ? 'Soon' : 'Locked'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={cycle}
        disabled={cellLocked}
        title={
          cellLocked
            ? 'Locked'
            : status === null
            ? 'Click to mark present'
            : status === 'present'
            ? 'Click to mark absent'
            : 'Click to clear'
        }
        className={cn(
          'relative w-10 h-10 rounded-2xl border-2 flex items-center justify-center',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'dark:focus-visible:ring-offset-slate-950',

          status === null && !cellLocked && [
            'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700',
            'hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-950/30',
            'hover:scale-105 active:scale-95',
            'focus-visible:ring-blue-300',
          ],

          status === 'present' && [
            'bg-emerald-500 border-emerald-600 dark:bg-emerald-600 dark:border-emerald-500',
            'shadow-md shadow-emerald-200/70 dark:shadow-emerald-950/50',
            !cellLocked && 'hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:scale-105 active:scale-95',
            'focus-visible:ring-emerald-400',
          ],

          status === 'absent' && [
            'bg-rose-500 border-rose-600 dark:bg-rose-600 dark:border-rose-500',
            'shadow-md shadow-rose-200/70 dark:shadow-rose-950/50',
            !cellLocked && 'hover:bg-rose-600 dark:hover:bg-rose-500 hover:scale-105 active:scale-95',
            'focus-visible:ring-rose-400',
          ],

          cellLocked && status !== null && 'opacity-80 cursor-not-allowed',
          cellLocked && status === null && 'cursor-not-allowed',
        )}
      >
        {status === 'present' && !cellLocked && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-emerald-400 opacity-20" />
        )}

        {status === 'present' && (
          <CheckCircle2 className="h-5 w-5 text-white drop-shadow-sm" />
        )}
        {status === 'absent' && (
          <XCircle className="h-5 w-5 text-white drop-shadow-sm" />
        )}
        {status === null && (
          <div className={cn(
            'w-2.5 h-2.5 rounded-full transition-colors duration-200',
            'bg-slate-200 dark:bg-slate-600 group-hover:bg-blue-300'
          )} />
        )}

        {cellLocked && status !== null && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <Shield className="h-2.5 w-2.5 text-slate-400 dark:text-slate-500" />
          </span>
        )}
      </button>

      <span className={cn(
        'text-[10px] font-semibold leading-none tracking-wide',
        status === 'present' && 'text-emerald-600 dark:text-emerald-400',
        status === 'absent'  && 'text-rose-500 dark:text-rose-400',
        status === null      && 'text-slate-300 dark:text-slate-600',
      )}>
        {status === 'present' ? 'P' : status === 'absent' ? 'A' : '·'}
      </span>
    </div>
  )
}

export default function MarkAttendancePage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useUser()
  const classNameFromUrl = decodeURIComponent(params.className as string)

  const [students,         setStudents]         = useState<Student[]>([])
  const [records,          setRecords]          = useState<AttendanceRecord[]>([])
  const [termInfo,         setTermInfo]         = useState<TermInfo | null>(null)
  const [termWeeks,        setTermWeeks]        = useState<Week[]>([])
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [loading,          setLoading]          = useState(true)
  const [saving,           setSaving]           = useState<string | null>(null)
  const [lockedDates,      setLockedDates]      = useState<Set<string>>(new Set())
  const [matchedClassName, setMatchedClassName] = useState(classNameFromUrl)

  const fetchAll = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const { data: settings } = await supabase
        .from('school_settings').select('current_term, current_session').single()
      if (!settings) { toast.error('No school settings found'); return }

      const { data: termData } = await supabase
        .from('terms').select('*')
        .eq('term_code', settings.current_term)
        .eq('session_year', settings.current_session).single()
      if (!termData) { toast.error('Term not found'); return }
      setTermInfo(termData)

      const weeks = buildTermWeeks(new Date(termData.start_date), new Date(termData.end_date))
      setTermWeeks(weeks)
      const todayStr = toDateStr(new Date())
      const idx = weeks.findIndex(w => w.days.some(d => d.dateStr === todayStr))
      setCurrentWeekIndex(idx >= 0 ? idx : weeks.length - 1)

      const { data: allStudents } = await supabase
        .from('profiles').select('id, display_name, class, photo_url, avatar_url')
        .eq('role', 'student').eq('is_active', true)

      let matched = classNameFromUrl
      if (allStudents) {
        const classNames = [...new Set(allStudents.map((s: any) => s.class).filter(Boolean))]
        const found = classNames.find((c: any) => classNamesMatch(c, classNameFromUrl))
        if (found) matched = found as string
      }
      setMatchedClassName(matched)

      const { data: studentsData } = await supabase
        .from('profiles').select('id, display_name, photo_url, avatar_url')
        .eq('role', 'student').eq('class', matched).eq('is_active', true)
        .order('display_name')

      setStudents(
        (studentsData ?? []).map((s: any) => ({
          id: s.id, student_id: s.id,
          student_name: s.display_name || 'Unknown',
          photo_url: s.photo_url || s.avatar_url || null,
        }))
      )

      const studentIds = (studentsData ?? []).map((s: any) => s.id)
      if (studentIds.length > 0) {
        const { data: recs } = await supabase
          .from('attendance_records').select('student_id, date, status, locked')
          .in('student_id', studentIds)
          .eq('term_code', termData.term_code)
          .eq('session_year', termData.session_year)

        const typedRecs: AttendanceRecord[] = (recs ?? []).map((r: any) => ({
          student_id: r.student_id, date: r.date,
          status: r.status, locked: r.locked ?? false,
        }))
        setRecords(typedRecs)
        setLockedDates(new Set(typedRecs.filter(r => r.locked).map(r => r.date)))
      }
    } catch (err) {
      toast.error('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }, [classNameFromUrl, user?.id])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCellChange = (studentId: string, dateStr: string, status: 'present' | 'absent' | null) => {
    setRecords(prev => {
      const existing = prev.find(r => r.student_id === studentId && r.date === dateStr)
      if (existing) {
        if (status === null) return prev.filter(r => !(r.student_id === studentId && r.date === dateStr))
        return prev.map(r => r.student_id === studentId && r.date === dateStr ? { ...r, status } : r)
      }
      if (status === null) return prev
      return [...prev, { student_id: studentId, date: dateStr, status, locked: false }]
    })
  }

  const saveDay = async (dateStr: string) => {
    if (!termInfo || !user?.id) return
    setSaving(dateStr)
    try {
      const dayRecords = students
        .map(s => {
          const r = getRecord(records, s.student_id, dateStr)
          return r ? { student_id: s.student_id, date: dateStr, status: r.status } : null
        })
        .filter(Boolean)

      if (dayRecords.length > 0) {
        const { error } = await supabase.from('attendance_records').upsert(
          dayRecords.map(r => ({
            student_id: r!.student_id,
            class_name: matchedClassName,
            term_code: termInfo.term_code,
            session_year: termInfo.session_year,
            date: dateStr,
            status: r!.status,
            teacher_id: user.id,
            locked: true,
            locked_at: new Date().toISOString(),
            locked_by: user.id,
          })),
          { onConflict: 'student_id,date,term_code,session_year' }
        )
        if (error) throw error
      }

      setLockedDates(prev => new Set([...prev, dateStr]))
      setRecords(prev => prev.map(r => r.date === dateStr ? { ...r, locked: true } : r))
      toast.success(`Locked: ${new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`)
    } catch {
      toast.error('Failed to save attendance')
    } finally {
      setSaving(null)
    }
  }

  const markAllForDay = (dateStr: string, status: 'present' | 'absent') => {
    students.forEach(s => {
      const r = getRecord(records, s.student_id, dateStr)
      if (!r || r.status === null) handleCellChange(s.student_id, dateStr, status)
    })
  }

  const todayStr   = toDateStr(new Date())
  const currentWeek = termWeeks[currentWeekIndex]

  const getDayStats = (dateStr: string) => ({
    present: students.filter(s => getRecord(records, s.student_id, dateStr)?.status === 'present').length,
    absent:  students.filter(s => getRecord(records, s.student_id, dateStr)?.status === 'absent').length,
    unmarked: students.filter(s => !getRecord(records, s.student_id, dateStr)?.status).length,
  })

  const getWeekStats = (week: Week) =>
    week.days.reduce((acc, d) => {
      const s = getDayStats(d.dateStr)
      return { totalPresent: acc.totalPresent + s.present, totalAbsent: acc.totalAbsent + s.absent, totalUnmarked: acc.totalUnmarked + s.unmarked }
    }, { totalPresent: 0, totalAbsent: 0, totalUnmarked: 0 })

  const getStudentWeekCount = (studentId: string, week: Week) =>
    week.days.reduce((acc, d) => acc + (getRecord(records, studentId, d.dateStr)?.status === 'present' ? 1 : 0), 0)

  if (loading) return <LoadingScreen />

  const weekStats = currentWeek ? getWeekStats(currentWeek) : null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* Sticky Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            <button
              onClick={() => router.push('/staff/attendance')}
              className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{classNameFromUrl}</p>
                {termInfo && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">
                    {termInfo.term_name} · {termInfo.session_year}
                  </p>
                )}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold">
                {students.length} Students
              </span>
              <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                {termWeeks.length} Weeks
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Week Navigator */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeekIndex(i => Math.max(0, i - 1))}
              disabled={currentWeekIndex === 0}
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </button>

            <div className="flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{currentWeek?.weekLabel ?? '—'}</span>
              {currentWeek?.days.some(d => d.isToday) && (
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-full text-[10px] font-bold">
                  Current
                </span>
              )}
              {currentWeek && (
                <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                  {currentWeek.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' – '}
                  {currentWeek.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            <button
              onClick={() => setCurrentWeekIndex(i => Math.min(termWeeks.length - 1, i + 1))}
              disabled={currentWeekIndex === termWeeks.length - 1}
              className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
            >
              <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {weekStats && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-full">
                <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{weekStats.totalPresent}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-full">
                <UserX className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{weekStats.totalAbsent}</span>
              </div>
              {weekStats.totalUnmarked > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-full">
                  <Clock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{weekStats.totalUnmarked}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Empty State */}
        {students.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No students found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No active students assigned to <strong>{classNameFromUrl}</strong>
            </p>
          </div>
        )}

        {/* Attendance Table */}
        {students.length > 0 && currentWeek && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">

            {/* Column headers */}
            <div
              className="grid border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
              style={{ gridTemplateColumns: `minmax(180px,1fr) repeat(5, minmax(96px,1fr)) 90px` }}
            >
              <div className="px-5 py-4 border-r border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student</span>
              </div>

              {currentWeek.days.map(day => {
                const stats    = getDayStats(day.dateStr)
                const isToday  = day.isToday
                const isLocked = lockedDates.has(day.dateStr)
                const isFuture = day.dateStr > todayStr
                const isSaving = saving === day.dateStr
                const total    = students.length
                const pct      = total > 0 ? Math.round((stats.present / total) * 100) : 0

                return (
                  <div
                    key={day.dateStr}
                    className={cn(
                      'px-3 py-3 border-r border-slate-100 dark:border-slate-800 last:border-r-0',
                      isToday && 'bg-blue-50/50 dark:bg-blue-950/20',
                    )}
                  >
                    <div className="text-center mb-2.5">
                      <p className={cn(
                        'text-xs font-bold uppercase tracking-widest',
                        isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400',
                      )}>
                        {day.dayShort}
                      </p>
                      <p className={cn(
                        'text-[11px] font-semibold mt-0.5',
                        isToday ? 'text-blue-400 dark:text-blue-500' : 'text-slate-400 dark:text-slate-500',
                      )}>
                        {day.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                      </p>
                      {isToday && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500 dark:bg-blue-600 text-white rounded-full text-[9px] font-bold tracking-wide">
                          TODAY
                        </span>
                      )}
                    </div>

                    {!isFuture && (
                      <div className="mb-2.5">
                        <div className="flex items-center justify-center gap-2 mb-1.5">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{stats.present}P</span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400">{stats.absent}A</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {isFuture ? (
                      <div className="flex items-center justify-center gap-1 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 text-[10px] font-semibold border border-dashed border-slate-200 dark:border-slate-700">
                        <Clock className="h-3 w-3" /> Upcoming
                      </div>
                    ) : isLocked ? (
                      <div className="flex items-center justify-center gap-1 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/50">
                        <Shield className="h-3 w-3" /> Saved
                      </div>
                    ) : (
                      <button
                        onClick={() => saveDay(day.dateStr)}
                        disabled={!!isSaving}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-95 text-white text-[10px] font-bold transition-all border border-blue-700 dark:border-blue-600 shadow-sm"
                      >
                        {isSaving
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Save className="h-3 w-3" />}
                        {isSaving ? 'Saving…' : 'Lock Day'}
                      </button>
                    )}

                    {!isFuture && !isLocked && (
                      <div className="flex gap-1 mt-1.5">
                        <button
                          onClick={() => markAllForDay(day.dateStr, 'present')}
                          className="flex-1 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-95 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold transition-all border border-emerald-100 dark:border-emerald-900/50"
                        >
                          All P
                        </button>
                        <button
                          onClick={() => markAllForDay(day.dateStr, 'absent')}
                          className="flex-1 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-95 text-rose-600 dark:text-rose-400 text-[9px] font-bold transition-all border border-rose-100 dark:border-rose-900/50"
                        >
                          All A
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="px-3 py-4 bg-slate-100/60 dark:bg-slate-800/40 flex flex-col items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Week</p>
              </div>
            </div>

            {/* Student rows */}
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {students.map((student, idx) => {
                const weekCount = getStudentWeekCount(student.student_id, currentWeek)
                const weekPct   = Math.round((weekCount / 5) * 100)
                const initials  = student.student_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

                return (
                  <div
                    key={student.student_id}
                    className="grid items-center hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                    style={{ gridTemplateColumns: `minmax(180px,1fr) repeat(5, minmax(96px,1fr)) 90px` }}
                  >
                    <div className="px-5 py-3 border-r border-slate-50 dark:border-slate-800 flex items-center gap-3">
                      <Avatar className="w-9 h-9 border-2 border-white dark:border-slate-900 shadow-sm flex-shrink-0">
                        {student.photo_url ? (
                          <AvatarImage src={student.photo_url} alt={student.student_name} className="object-cover" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
                          {student.student_name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">#{String(idx + 1).padStart(2, '0')}</p>
                      </div>
                    </div>

                    {currentWeek.days.map(day => {
                      const record   = getRecord(records, student.student_id, day.dateStr)
                      const isLocked = lockedDates.has(day.dateStr) || (record?.locked ?? false)
                      const isFuture = day.dateStr > todayStr

                      return (
                        <div
                          key={day.dateStr}
                          className={cn(
                            'flex items-center justify-center py-3 border-r border-slate-50 dark:border-slate-800 last:border-r-0',
                            day.isToday && 'bg-blue-50/20 dark:bg-blue-950/10',
                            isFuture  && 'bg-slate-50/10 dark:bg-slate-900/40',
                          )}
                        >
                          <AttendanceCell
                            record={record}
                            isLocked={isLocked}
                            isFuture={isFuture}
                            onChange={status => handleCellChange(student.student_id, day.dateStr, status)}
                          />
                        </div>
                      )
                    })}

                    <div className="px-3 py-3 bg-slate-50/40 dark:bg-slate-900/40 group-hover:bg-slate-100/40 dark:group-hover:bg-slate-800/40 flex flex-col items-center justify-center gap-1.5 transition-colors">
                      <span className={cn(
                        'text-sm font-bold leading-none tabular-nums',
                        weekCount === 5 ? 'text-emerald-600 dark:text-emerald-400' :
                        weekCount >= 3 ? 'text-blue-600 dark:text-blue-400' :
                        weekCount >  0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600',
                      )}>
                        {weekCount}/5
                      </span>
                      <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            weekPct === 100 ? 'bg-emerald-500' :
                            weekPct >= 60  ? 'bg-blue-500'    :
                            weekPct >  0   ? 'bg-amber-500'   : 'bg-transparent',
                          )}
                          style={{ width: `${weekPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer totals row */}
            <div
              className="grid border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40"
              style={{ gridTemplateColumns: `minmax(180px,1fr) repeat(5, minmax(96px,1fr)) 90px` }}
            >
              <div className="px-5 py-3 border-r border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Daily Total</p>
              </div>
              {currentWeek.days.map(day => {
                const s        = getDayStats(day.dateStr)
                const isFuture = day.dateStr > todayStr
                return (
                  <div
                    key={day.dateStr}
                    className={cn(
                      'px-3 py-3 border-r border-slate-100 dark:border-slate-800 last:border-r-0 text-center',
                      day.isToday && 'bg-blue-50/30 dark:bg-blue-950/20',
                    )}
                  >
                    {isFuture ? (
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{s.present} present</p>
                        <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400">{s.absent} absent</p>
                        {s.unmarked > 0 && (
                          <p className="text-[10px] text-amber-500 dark:text-amber-400">{s.unmarked} left</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="px-3 py-3 bg-slate-100/60 dark:bg-slate-800/60 text-center">
                {weekStats && (
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{weekStats.totalPresent}</p>
                    <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400">{weekStats.totalAbsent}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All Weeks Overview */}
        {termWeeks.length > 1 && students.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Term Overview — All Weeks
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {termWeeks.map((week, wi) => {
                const ws         = getWeekStats(week)
                const total      = ws.totalPresent + ws.totalAbsent
                const pct        = total > 0 ? Math.round((ws.totalPresent / total) * 100) : 0
                const isCurrent  = wi === currentWeekIndex
                const isFutureWk = week.startDate > new Date()
                const allLocked  = week.days.every(d => lockedDates.has(d.dateStr))

                return (
                  <button
                    key={wi}
                    onClick={() => setCurrentWeekIndex(wi)}
                    className={cn(
                      'relative p-3 rounded-2xl border text-left transition-all hover:shadow-md dark:hover:shadow-slate-950/50',
                      isCurrent
                        ? 'bg-blue-600 dark:bg-blue-600 border-blue-700 dark:border-blue-500 shadow-md shadow-blue-200 dark:shadow-blue-950/50'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={cn('text-xs font-bold', isCurrent ? 'text-white' : 'text-slate-700 dark:text-slate-200')}>
                        {week.weekLabel}
                      </p>
                      {allLocked && !isFutureWk && (
                        <Shield className={cn('h-3 w-3', isCurrent ? 'text-blue-200' : 'text-emerald-500 dark:text-emerald-400')} />
                      )}
                      {isFutureWk && (
                        <Clock className={cn('h-3 w-3', isCurrent ? 'text-blue-200' : 'text-slate-300 dark:text-slate-600')} />
                      )}
                    </div>
                    {!isFutureWk ? (
                      <>
                        <p className={cn('text-lg font-bold leading-none mb-1', isCurrent ? 'text-white' : 'text-slate-800 dark:text-slate-100')}>
                          {pct}%
                        </p>
                        <div className="w-full bg-white/20 dark:bg-white/10 rounded-full h-1 mb-1.5">
                          <div
                            className={cn('h-1 rounded-full transition-all', isCurrent ? 'bg-white' : 'bg-emerald-500')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className={cn('text-[10px]', isCurrent ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500')}>
                          {ws.totalPresent}P · {ws.totalAbsent}A
                        </p>
                      </>
                    ) : (
                      <p className={cn('text-[10px]', isCurrent ? 'text-blue-200' : 'text-slate-300 dark:text-slate-600')}>
                        {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 py-3 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold text-slate-600 dark:text-slate-300">Legend</span>

          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-2xl bg-emerald-500 dark:bg-emerald-600 border-2 border-emerald-600 dark:border-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-200 dark:shadow-emerald-950/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-300">Present</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-2xl bg-rose-500 dark:bg-rose-600 border-2 border-rose-600 dark:border-rose-500 flex items-center justify-center shadow-sm shadow-rose-200 dark:shadow-rose-950/50">
              <XCircle className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-300">Absent</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600" />
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-300">Unmarked</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-300">Locked</span>
          </div>

          <span className="ml-auto text-slate-300 dark:text-slate-600 italic hidden md:inline">
            Click to cycle: — → Present → Absent → —
          </span>
        </div>
      </div>
    </div>
  )
}