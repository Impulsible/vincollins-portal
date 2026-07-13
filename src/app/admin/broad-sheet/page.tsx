// app/admin/broad-sheet/page.tsx
'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Loader2, RefreshCw, Printer, Search, X, FileSpreadsheet,
  Users, FileDown, Sparkles, FileText, CheckCircle2,
  AlertCircle, Eye, Shield, Bell, Zap,
  TrendingUp, Award, GraduationCap, ChevronLeft, Send,
  BarChart3, Settings2, BookOpen, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────
const JSS_MIN_SUBJECTS = 16
const SS_MIN_SUBJECTS = 9

// ✅ Subject name mapping for display (short names)
const SUBJECT_DISPLAY_NAMES: Record<string, string> = {
  'Cultural and Creative Arts': 'CCA',
  'Physical and Health Education': 'PHE',
  'English Studies': 'English',
  'Basic Technology': 'Basic Tech',
  'Information Technology': 'Info Tech',
  'Agricultural Science': 'Agric',
  'Home Economics': 'Home Econ',
  'Security Education': 'Security',
  'Financial Accounting': 'Finance',
  'Literature in English': 'Literature',
  'Business Studies': 'Business',
  'Social Studies': 'Social',
  'Civic Education': 'Civic',
  'Christian Religious Studies': 'CRS',
}

// ✅ Subject order for consistent display
const SUBJECT_ORDER: Record<string, number> = {
  'English Language': 1, 
  'English Studies': 1, 
  'Mathematics': 2,
  'Physics': 3, 
  'Chemistry': 4, 
  'Further Mathematics': 5, 
  'Basic Science': 6,
  'Biology': 7, 
  'Agricultural Science': 8, 
  'Basic Technology': 9,
  'Economics': 10, 
  'Geography': 11, 
  'Social Studies': 12, 
  'Civic Education': 13,
  'Government': 14, 
  'History': 15, 
  'Commerce': 16, 
  'Financial Accounting': 17,
  'Business Studies': 18, 
  'Literature in English': 19, 
  'Christian Religious Studies': 20,
  'CRS': 20,
  'Cultural and Creative Arts': 21, 
  'Music': 22, 
  'Yoruba': 23, 
  'French': 24,
  'Data Processing': 25, 
  'Information Technology': 26, 
  'Home Economics': 27,
  'Physical and Health Education': 28, 
  'Security Education': 29,
}

const sortSubjectsByOrder = (subjects: string[]) =>
  [...subjects].sort((a, b) => (SUBJECT_ORDER[a] || 999) - (SUBJECT_ORDER[b] || 999))

const extractYear = (className: string): string => {
  if (!className) return ''
  const n = className.trim()
  if (n === 'JSS 1' || n === 'JSS1') return 'JSS 1'
  if (n === 'JSS 2' || n === 'JSS2') return 'JSS 2'
  if (n === 'JSS 3' || n === 'JSS3') return 'JSS 3'
  if (n.includes('SS1')) return 'SS1'
  if (n.includes('SS2')) return 'SS2'
  if (n.includes('SS3')) return 'SS3'
  return className
}

const getDisplaySubjectName = (subject: string): string => {
  return SUBJECT_DISPLAY_NAMES[subject] || subject
}

// ✅ Updated subject lists with FULL NAMES (match database)
const JSS_SUBJECTS = [
  'English Studies', 'Mathematics', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Business Studies', 'Information Technology',
  'Agricultural Science', 'Home Economics', 'Physical and Health Education', 'Christian Religious Studies',
  'French', 'Yoruba', 'Cultural and Creative Arts', 'Music', 'Security Education',
]
const SS_SUBJECTS_SCIENCE = ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'Further Mathematics', 'Agricultural Science', 'Data Processing', 'Civic Education', 'Economics']
const SS_SUBJECTS_ARTS = ['English Language', 'Mathematics', 'Literature in English', 'Government', 'Christian Religious Studies', 'Economics', 'Data Processing', 'Agricultural Science', 'Civic Education', 'Biology']
const SS_SUBJECTS_COMMERCIAL = ['English Language', 'Mathematics', 'Economics', 'Commerce', 'Financial Accounting', 'Government', 'Civic Education', 'Data Processing', 'Geography', 'Literature in English']

const getSubjectsForStudent = (cls: string, dept?: string | null) => {
  if (!cls) return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
  const year = extractYear(cls)
  if (year.startsWith('JSS')) return sortSubjectsByOrder(JSS_SUBJECTS)
  const d = (dept || cls).toLowerCase()
  if (d.includes('science')) return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
  if (d.includes('art')) return sortSubjectsByOrder(SS_SUBJECTS_ARTS)
  if (d.includes('commercial') || d.includes('comm')) return sortSubjectsByOrder(SS_SUBJECTS_COMMERCIAL)
  return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
}

const getAllSubjectsForClass = (cls: string) => {
  if (!cls) return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
  const year = extractYear(cls)
  if (year.startsWith('JSS')) return sortSubjectsByOrder(JSS_SUBJECTS)
  if (year.startsWith('SS')) return sortSubjectsByOrder(Array.from(new Set([...SS_SUBJECTS_SCIENCE, ...SS_SUBJECTS_ARTS, ...SS_SUBJECTS_COMMERCIAL])))
  return sortSubjectsByOrder(SS_SUBJECTS_SCIENCE)
}

const meetsMinimumSubjects = (cls: string, n: number) =>
  extractYear(cls).startsWith('JSS') ? n >= JSS_MIN_SUBJECTS : n >= SS_MIN_SUBJECTS

// ── Grading ───────────────────────────────────────────────────────────────────
const getSubjectGrade = (s: number) => s >= 75 ? 'A1' : s >= 70 ? 'B2' : s >= 65 ? 'B3' : s >= 60 ? 'C4' : s >= 55 ? 'C5' : s >= 50 ? 'C6' : s >= 45 ? 'D7' : s >= 40 ? 'E8' : 'F9'
const getOverallGrade = (p: number) => p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'P' : 'F'
const getSubjectGradeRemark = (g: string) => ({ A1: 'Excellent', B2: 'Very Good', B3: 'Good', C4: 'Credit', C5: 'Credit', C6: 'Credit', D7: 'Pass', E8: 'Pass', F9: 'Fail' }[g] || '')

const gradeChipClass = (g: string) => ({
  A1: 'bg-emerald-100 text-emerald-700', B2: 'bg-blue-100 text-blue-700', B3: 'bg-blue-100 text-blue-700',
  C4: 'bg-cyan-100 text-cyan-700', C5: 'bg-cyan-100 text-cyan-700', C6: 'bg-cyan-100 text-cyan-700',
  D7: 'bg-amber-100 text-amber-700', E8: 'bg-amber-100 text-amber-700', F9: 'bg-red-100 text-red-700',
}[g] || 'bg-slate-100 text-slate-600')

const overallChipClass = (g: string) => ({
  A: 'bg-emerald-100 text-emerald-700', B: 'bg-blue-100 text-blue-700',
  C: 'bg-cyan-100 text-cyan-700', P: 'bg-amber-100 text-amber-700', F: 'bg-red-100 text-red-700',
}[g] || 'bg-slate-100 text-slate-600')

// ── AI Comments ───────────────────────────────────────────────────────────────
const generateAIComments = async (firstName: string, avg: number, subjects: any[], cls: string, gender: string) => {
  try {
    const res = await fetch('/api/generate-comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName: firstName, averageScore: avg, subjects: subjects.map(s => ({ name: s.name, score: s.total })), className: cls, gender }),
    })
    if (res.ok) return await res.json()
  } catch { }
  return null
}

const getFallbackTeacherComment = (firstName: string, avg: number, best: string, bestScore: number, worst: string, worstScore: number, gender: string) => {
  const he = gender === 'female' ? 'She' : 'He', his = gender === 'female' ? 'her' : 'his'
  if (avg >= 90) return `Outstanding performance, ${firstName}! Scoring ${bestScore}% in ${best} is remarkable.`
  if (avg >= 80) return `Excellent work, ${firstName}! ${his} performance in ${best} shows strong understanding.`
  if (avg >= 70) return `Good effort, ${firstName}! ${his} performance in ${best} (${bestScore}%) was solid.`
  if (avg >= 60) return `Fair performance, ${firstName}. ${he} did well in ${best} (${bestScore}%).`
  if (avg >= 50) return `${firstName}, this was a close one. ${his} performance in ${best} helped.`
  return `${firstName}, unfortunately ${he} struggled this term. Please see your teacher.`
}

const getFallbackPrincipalComment = (avg: number, firstName: string, gender: string) => {
  const he = gender === 'female' ? 'She' : 'He'
  if (avg >= 80) return `Excellent performance. ${he} is promoted with honors.`
  if (avg >= 70) return `Good performance. Promoted to next class.`
  if (avg >= 60) return `Satisfactory performance. Promoted.`
  if (avg >= 50) return `Passed. Work harder next term. Promoted conditionally.`
  return `Failed. Needs to repeat class.`
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubjectScore { 
  subject: string; 
  ca1: number; 
  ca2: number; 
  exam_obj: number; 
  exam_theory: number;
  total: number; 
  grade: string; 
  status: string; 
  teacher_name: string 
}

interface StudentRecord { 
  id: string; 
  name: string; 
  admission_number: string; 
  vin_id: string; 
  class: string; 
  department: string | null; 
  subjectMap: Record<string, SubjectScore>; 
  totalScore: number; 
  averageScore: number; 
  grade: string; 
  completedSubjects: number; 
  totalSubjects: number; 
  expectedSubjects: string[]; 
  hasAllSubjects: boolean; 
  meetsMinimum: boolean; 
  allSubmitted: boolean; 
  reportCardStatus?: string | null 
}

const LOAD_TIMEOUT = 10000
const AUTO_REFRESH_INTERVAL = 30000
const TERMS = [{ value: 'first', label: 'First Term' }, { value: 'second', label: 'Second Term' }, { value: 'third', label: 'Third Term' }]
const YEARS = ['2024/2025', '2025/2026', '2026/2027']
const DEPARTMENTS = [{ value: 'all', label: 'All Departments' }, { value: 'Science', label: 'Science' }, { value: 'Arts', label: 'Arts' }, { value: 'Commercial', label: 'Commercial' }]
const ALL_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SS1 Science', 'SS1 Arts', 'SS1 Commercial', 'SS2 Science', 'SS2 Arts', 'SS2 Commercial', 'SS3 Science', 'SS3 Arts', 'SS3 Commercial', 'SS1', 'SS2', 'SS3']
const getTermLabel = (t: string) => TERMS.find(x => x.value === t)?.label || 'Third Term'

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, icon: Icon, sub }: { label: string; value: string | number; accent: string; icon: React.ElementType; sub?: string }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-slate-900">
      <div className={cn('absolute inset-y-0 left-0 w-1 rounded-l-lg', accent)} />
      <CardContent className="p-4 pl-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <Icon className={cn('h-4 w-4', accent.replace('bg-', 'text-'))} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Report status chip ────────────────────────────────────────────────────────
function ReportStatusChip({ status }: { status?: string | null }) {
  if (status === 'published') return <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-2.5 w-2.5" />Published</span>
  if (status === 'generated') return <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full"><FileText className="h-2.5 w-2.5" />Generated</span>
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full">None</span>
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BroadSheetPage() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [expectedSubjects, setExpectedSubjects] = useState<string[]>(sortSubjectsByOrder(SS_SUBJECTS_SCIENCE))
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 })
  const [newScoreAlert, setNewScoreAlert] = useState<string | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)

  const autoRefreshTimerRef = useRef<NodeJS.Timeout>()
  const isRefreshingRef = useRef(false)

  useEffect(() => { setIsMounted(true) }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const timeout = setTimeout(() => { setLoading(false); setLoadError(true) }, LOAD_TIMEOUT)
        const { data: { session } } = await supabase.auth.getSession()
        clearTimeout(timeout)
        if (!session) return
        const { data: pd } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (pd) setProfile(pd)
        if (ALL_CLASSES.length > 0 && !selectedClass) {
          setSelectedClass(ALL_CLASSES[0])
          setExpectedSubjects(getAllSubjectsForClass(ALL_CLASSES[0]))
        }
        setLoading(false)
      } catch { setLoading(false); setLoadError(true) }
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedClass) setExpectedSubjects(getAllSubjectsForClass(selectedClass))
    if (isMounted && selectedClass && selectedTerm && selectedYear) loadBroadSheet()
  }, [selectedClass, selectedTerm, selectedYear, isMounted])

  useEffect(() => {
    if (!autoRefreshEnabled || loading || students.length === 0) return
    if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current)
    autoRefreshTimerRef.current = setInterval(async () => {
      if (isRefreshingRef.current) return
      isRefreshingRef.current = true
      try { await loadBroadSheet() } catch { } finally { isRefreshingRef.current = false }
    }, AUTO_REFRESH_INTERVAL)
    return () => { if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current) }
  }, [autoRefreshEnabled, selectedClass, selectedTerm, selectedYear, loading, students.length])

  useEffect(() => {
    if (!selectedClass || !selectedTerm || !selectedYear) return
    const ch = supabase.channel('broadsheet-scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ca_scores', filter: `term=eq.${selectedTerm},academic_year=eq.${selectedYear}` },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const sub = payload.new?.subject
            setNewScoreAlert(`${getDisplaySubjectName(sub)} scores have been updated`)
            toast.info(`${getDisplaySubjectName(sub)} scores updated`, { duration: 3000 })
            await loadBroadSheet()
          }
        }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [selectedClass, selectedTerm, selectedYear])

  useEffect(() => {
    if (newScoreAlert) { const t = setTimeout(() => setNewScoreAlert(null), 5000); return () => clearTimeout(t) }
  }, [newScoreAlert])

  // ── FIXED: loadBroadSheet with proper exam score handling ──────────────────
  const loadBroadSheet = useCallback(async () => {
    if (!selectedClass || !selectedTerm || !selectedYear) return
    setLoading(true); setLoadError(false)
    try {
      const isJSS = selectedClass.toUpperCase().includes('JSS')
      const isSS = selectedClass.toUpperCase().includes('SS')
      let query = supabase.from('profiles').select('id, full_name, display_name, admission_number, vin_id, class, department, gender').eq('role', 'student').order('display_name').limit(500)
      if (isJSS) query = query.eq('class', selectedClass)
      else if (isSS) { const yp = extractYear(selectedClass); query = query.ilike('class', `%${yp}%`) }
      else query = query.eq('class', selectedClass)
      const { data: classStudents, error: se } = await query
      if (se) throw se
      if (!classStudents || classStudents.length === 0) { setStudents([]); setLoading(false); return }

      const ids = classStudents.map(s => s.id)
      const { data: allScores, error: scErr } = await supabase.from('ca_scores').select('*').in('student_id', ids).eq('term', selectedTerm).eq('academic_year', selectedYear).eq('status', 'approved').limit(5000)
      if (scErr) throw scErr

      const { data: existingRC } = await supabase.from('report_cards').select('student_id, status').in('student_id', ids).eq('term', selectedTerm).eq('academic_year', selectedYear)
      const rcMap: Record<string, string> = {}
      ;(existingRC || []).forEach(rc => { rcMap[rc.student_id] = rc.status })

      const records: StudentRecord[] = classStudents.map(student => {
        const subs = getSubjectsForStudent(student.class, student.department)
        const scores = (allScores || []).filter(s => s.student_id === student.id)
        const subjectMap: Record<string, SubjectScore> = {}
        
        scores.forEach(s => {
          // ✅ FIX: Get exam total from multiple possible sources
          // Priority: exam_score > exam_objective_score + exam_theory_score
          let examTotal = s.exam_score || 0
          if (examTotal === 0) {
            // If exam_score is 0, try the individual fields
            const objScore = s.exam_objective_score || 0
            const theoryScore = s.exam_theory_score || 0
            examTotal = objScore + theoryScore
          }
          
          // If still 0, try just exam_objective_score
          if (examTotal === 0) {
            examTotal = s.exam_objective_score || 0
          }
          
          const total = (s.ca1_score || 0) + (s.ca2_score || 0) + examTotal
          
          subjectMap[s.subject] = { 
            subject: s.subject, 
            ca1: s.ca1_score || 0, 
            ca2: s.ca2_score || 0, 
            exam_obj: s.exam_objective_score || 0, 
            exam_theory: s.exam_theory_score || 0,
            total, 
            grade: getSubjectGrade(Math.round((total / 100) * 100)), 
            status: s.status || 'approved', 
            teacher_name: s.teacher_name || '' 
          }
        })
        
        const scored = Object.keys(subjectMap).length
        const totalScore = Object.values(subjectMap).reduce((sum, x) => sum + x.total, 0)
        const avg = scored > 0 ? Math.round(totalScore / scored) : 0
        
        return { 
          id: student.id, 
          name: student.display_name || student.full_name || 'Student', 
          admission_number: student.admission_number || '—', 
          vin_id: student.vin_id || '—', 
          class: student.class, 
          department: student.department || (isJSS ? 'Junior' : 'General'), 
          subjectMap, 
          totalScore, 
          averageScore: avg, 
          grade: scored > 0 ? getOverallGrade(avg) : '—', 
          completedSubjects: scored, 
          totalSubjects: subs.length, 
          expectedSubjects: subs, 
          hasAllSubjects: scored >= subs.length, 
          meetsMinimum: meetsMinimumSubjects(student.class, scored), 
          allSubmitted: meetsMinimumSubjects(student.class, scored), 
          reportCardStatus: rcMap[student.id] || null 
        }
      })

      setStudents(selectedDepartment !== 'all' ? records.filter(s => s.department === selectedDepartment) : records)
    } catch (error) {
      console.error(error); toast.error('Failed to load broad sheet'); setLoadError(true)
    } finally { setLoading(false) }
  }, [selectedClass, selectedTerm, selectedYear, selectedDepartment])

  const handleGenerateReportCards = async () => {
    const ready = students.filter(s => s.meetsMinimum && s.allSubmitted)
    if (ready.length === 0) { toast.warning(`No students meet the minimum subject requirement.`); return }
    setGenerating(true); setGenProgress({ current: 0, total: ready.length })
    let count = 0
    try {
      for (const student of ready) {
        const formatted = student.expectedSubjects.map(sub => {
          const sc = student.subjectMap[sub]; if (!sc) return null
          return { name: sub, ca: sc.ca1 + sc.ca2, exam: sc.exam_obj + sc.exam_theory, total: sc.total, grade: sc.grade, remark: getSubjectGradeRemark(sc.grade) }
        }).filter(Boolean)
        const allAvgs = students.map(s => s.averageScore).filter(s => s > 0)
        const sorted = [...allAvgs].sort((a, b) => b - a)
        const pos = sorted.findIndex(s => s === student.averageScore) + 1
        const sortedByScore = [...formatted].sort((a, b) => (b?.total || 0) - (a?.total || 0))
        const best = sortedByScore[0], worst = sortedByScore[sortedByScore.length - 1]
        const { data: sp } = await supabase.from('profiles').select('gender').eq('id', student.id).single()
        const gender = sp?.gender || 'male', firstName = student.name.split(' ')[0]
        let teacherComment = '', principalComment = ''
        try {
          const ai = await generateAIComments(firstName, student.averageScore, formatted, selectedClass, gender)
          if (ai) { teacherComment = ai.teacher_comment; principalComment = ai.principal_comment }
          else { teacherComment = getFallbackTeacherComment(firstName, student.averageScore, best?.name || '', best?.total || 0, worst?.name || '', worst?.total || 0, gender); principalComment = getFallbackPrincipalComment(student.averageScore, firstName, gender) }
        } catch { teacherComment = getFallbackTeacherComment(firstName, student.averageScore, best?.name || '', best?.total || 0, worst?.name || '', worst?.total || 0, gender); principalComment = getFallbackPrincipalComment(student.averageScore, firstName, gender) }

        await supabase.from('report_cards').delete().eq('student_id', student.id).eq('term', selectedTerm).eq('academic_year', selectedYear)
        const { error } = await supabase.from('report_cards').insert({ 
          student_id: student.id, 
          student_name: student.name, 
          student_display_name: student.name, 
          student_vin: student.vin_id, 
          student_admission_number: student.admission_number, 
          term: selectedTerm, 
          academic_year: selectedYear, 
          class: selectedClass, 
          class_teacher: profile?.full_name || 'Class Teacher', 
          principal_name: 'Principal', 
          school_name: 'VINCOLLINS COLLEGE', 
          total_score: student.totalScore, 
          average_score: student.averageScore, 
          class_highest: allAvgs.length > 0 ? Math.max(...allAvgs) : 0, 
          class_lowest: allAvgs.length > 0 ? Math.min(...allAvgs) : 0, 
          class_average: allAvgs.length > 0 ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : 0, 
          position: pos, 
          total_students: students.length, 
          subjects_data: formatted, 
          teacher_comments: teacherComment, 
          principal_comments: principalComment, 
          status: 'generated', 
          generated_by: profile?.id, 
          generated_at: new Date().toISOString(), 
          session_year: selectedYear, 
          submitted_at: new Date().toISOString(), 
          published_at: null 
        }).select()
        if (error) throw error
        count++; setGenProgress({ current: count, total: ready.length })
      }
      toast.success(`Generated ${count} report cards. Click Publish to release to students.`)
      await loadBroadSheet()
    } catch (error) { console.error(error); toast.error('Failed to generate report cards') }
    finally { setGenerating(false); setGenProgress({ current: 0, total: 0 }) }
  }

  const handlePublishReportCards = async () => {
    const gen = students.filter(s => s.meetsMinimum && s.reportCardStatus === 'generated')
    if (gen.length === 0) { toast.warning('No generated report cards to publish.'); return }
    setPublishing(true)
    try {
      const { error } = await supabase.from('report_cards').update({ status: 'published', published_at: new Date().toISOString() }).in('student_id', gen.map(s => s.id)).eq('term', selectedTerm).eq('academic_year', selectedYear).eq('status', 'generated')
      if (error) throw error
      toast.success(`Published ${gen.length} report cards! Students can now view them.`)
      await loadBroadSheet()
    } catch { toast.error('Failed to publish report cards') }
    finally { setPublishing(false) }
  }

  const handleUnpublishReportCards = async () => {
    const pub = students.filter(s => s.reportCardStatus === 'published')
    if (pub.length === 0) { toast.warning('No published report cards.'); return }
    setPublishing(true)
    try {
      const { error } = await supabase.from('report_cards').update({ status: 'generated', published_at: null }).in('student_id', pub.map(s => s.id)).eq('term', selectedTerm).eq('academic_year', selectedYear).eq('status', 'published')
      if (error) throw error
      toast.success(`Unpublished ${pub.length} report cards.`)
      await loadBroadSheet()
    } catch { toast.error('Failed to unpublish') }
    finally { setPublishing(false) }
  }

  const handleViewReportCard = (s: StudentRecord) =>
    router.push(`/admin/report-cards/view?student=${s.id}&term=${selectedTerm}&year=${selectedYear}`)

  const handleExportCSV = () => {
    if (!students.length) { toast.error('No data to export'); return }
    const headers = ['Student Name', 'Department', 'Admission No', ...expectedSubjects.map(getDisplaySubjectName), 'Total', 'Average', 'Grade', 'Report Status']
    const rows = students.map(s => [
      s.name, 
      s.department || '—', 
      s.admission_number, 
      ...expectedSubjects.map(sub => { 
        const sc = s.subjectMap[sub]; 
        return sc ? `${sc.total}(${sc.grade})` : '—' 
      }), 
      s.totalScore, 
      `${s.averageScore}%`, 
      s.grade, 
      s.reportCardStatus || 'None'
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `BroadSheet_${selectedClass}_${selectedTerm}_${selectedYear.replace('/', '_')}.csv`; a.click()
    toast.success('Exported!')
  }

  const stats = useMemo(() => {
    const ready = students.filter(s => s.meetsMinimum && s.allSubmitted)
    const generated = students.filter(s => s.reportCardStatus === 'generated')
    const published = students.filter(s => s.reportCardStatus === 'published')
    const avgs = ready.map(s => s.averageScore).filter(a => a > 0)
    return {
      total: students.length, 
      complete: students.filter(s => s.hasAllSubjects).length,
      readyForReport: ready.length, 
      generated: generated.length, 
      published: published.length,
      incomplete: students.filter(s => !s.meetsMinimum).length,
      classAvg: avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0,
      topScore: ready.length ? Math.max(...ready.map(s => s.totalScore)) : 0,
      minRequired: selectedClass?.toUpperCase().startsWith('JSS') ? JSS_MIN_SUBJECTS : SS_MIN_SUBJECTS,
      deptBreakdown: students.reduce((acc, s) => { const d = s.department || 'Unknown'; acc[d] = (acc[d] || 0) + 1; return acc }, {} as Record<string, number>),
    }
  }, [students, selectedClass])

  const displayedStudents = useMemo(() => {
    if (!searchQuery) return students
    const q = searchQuery.toLowerCase()
    return students.filter(s => s.name.toLowerCase().includes(q) || s.admission_number.toLowerCase().includes(q) || s.vin_id.toLowerCase().includes(q))
  }, [students, searchQuery])

  const minRequired = selectedClass?.toUpperCase().startsWith('JSS') ? JSS_MIN_SUBJECTS : SS_MIN_SUBJECTS

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!isMounted || (loading && students.length === 0 && !loadError)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-2">
            <FileSpreadsheet className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-slate-500">Loading broad sheet…</p>
        </div>
      </div>
    )
  }

  if (loadError && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Failed to load broad sheet</p>
          <Button onClick={() => { setLoadError(false); setLoading(true); loadBroadSheet() }} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 min-h-screen print:bg-white">
      <div className="px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-4 max-w-[1800px] mx-auto">

        {/* ── Live alert banner ───────────────────────────────────────────── */}
        <AnimatePresence>
          {newScoreAlert && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="no-print flex items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{newScoreAlert}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { setNewScoreAlert(null); loadBroadSheet() }}
                className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 flex-shrink-0">
                Refresh <RefreshCw className="h-3 w-3 ml-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="no-print flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-2 transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              Broad Sheet
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Class performance overview · {isMounted ? selectedClass : ''} · {isMounted ? getTermLabel(selectedTerm) : ''} · {isMounted ? selectedYear : ''}
            </p>
          </div>

          {/* Utility actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline"
              onClick={() => { const p = new URLSearchParams({ class: selectedClass, term: selectedTerm, year: selectedYear }); router.push(`/admin/report-cards?${p}`) }}
              className="h-8 text-xs gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Report Cards
            </Button>
            <Button size="sm" variant={autoRefreshEnabled ? 'default' : 'outline'}
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={cn('h-8 text-xs gap-1.5', autoRefreshEnabled && 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600')}>
              <Zap className="h-3.5 w-3.5" /> {autoRefreshEnabled ? 'Live ON' : 'Live OFF'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setLoadError(false); loadBroadSheet() }} disabled={loading}
              className="h-8 text-xs gap-1.5 text-slate-500 hover:text-slate-700">
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExportCSV} className="h-8 text-xs gap-1.5 text-slate-500 hover:text-slate-700">
              <FileDown className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={() => window.print()} className="h-8 text-xs gap-1.5 text-slate-500 hover:text-slate-700">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Students" value={stats.total} icon={Users} accent="bg-slate-500" />
          <StatCard label="Ready for Report" value={stats.readyForReport} icon={CheckCircle2} accent="bg-emerald-500" sub={`min ${minRequired} subjects`} />
          <StatCard label="Incomplete" value={stats.incomplete} icon={AlertTriangle} accent="bg-amber-500" />
          <StatCard label="Class Average" value={`${stats.classAvg}%`} icon={TrendingUp} accent="bg-blue-500" />
          <StatCard label="Generated" value={stats.generated} icon={FileText} accent="bg-violet-500" sub="not yet visible" />
          <StatCard label="Published" value={stats.published} icon={Send} accent="bg-teal-500" sub="visible to students" />
        </div>

        {/* ── Config + actions card ────────────────────────────────────────── */}
        <Card className="no-print border-0 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                <Settings2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Filters & Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              {[
                { label: 'Class', value: selectedClass, onChange: setSelectedClass, items: ALL_CLASSES.map(c => ({ value: c, label: c })) },
                { label: 'Term', value: selectedTerm, onChange: setSelectedTerm, items: TERMS.map(t => ({ value: t.value, label: t.label })) },
                { label: 'Session', value: selectedYear, onChange: setSelectedYear, items: YEARS.map(y => ({ value: y, label: y })) },
                { label: 'Department', value: selectedDepartment, onChange: setSelectedDepartment, items: DEPARTMENTS.map(d => ({ value: d.value, label: d.label })) },
              ].map(({ label, value, onChange, items }) => (
                <div key={label} className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</Label>
                  <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="h-9 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input placeholder="Name, Admission No…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <Button onClick={handleGenerateReportCards} disabled={generating || publishing || stats.readyForReport === 0}
                className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm gap-2 h-9">
                {generating
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating… {genProgress.current}/{genProgress.total}</>
                  : <><Sparkles className="h-4 w-4" /> Generate Reports <span className="ml-0.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.readyForReport}</span></>}
              </Button>

              {stats.generated > 0 && (
                <Button onClick={handlePublishReportCards} disabled={generating || publishing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2 h-9">
                  {publishing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</>
                    : <><Send className="h-4 w-4" /> Publish <span className="ml-0.5 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.generated}</span></>}
                </Button>
              )}

              {stats.published > 0 && (
                <Button onClick={handleUnpublishReportCards} disabled={generating || publishing} variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30 gap-2 h-9">
                  <Shield className="h-4 w-4" /> Unpublish <span className="ml-0.5 text-xs">({stats.published})</span>
                </Button>
              )}

              <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-slate-500 hover:text-slate-700 ml-auto"
                onClick={() => { const p = new URLSearchParams({ class: selectedClass, term: selectedTerm, year: selectedYear, status: 'generated' }); router.push(`/admin/report-cards?${p}`) }}>
                <Eye className="h-4 w-4" /> View Report Cards
              </Button>
            </div>

            {/* Status pills */}
            {(stats.generated > 0 || stats.published > 0) && (
              <div className="flex flex-wrap gap-2">
                {stats.generated > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-full">
                    <FileText className="h-3 w-3" /> {stats.generated} generated — not yet visible to students
                  </span>
                )}
                {stats.published > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> {stats.published} published — visible to students
                  </span>
                )}
              </div>
            )}

            {/* Department breakdown */}
            {Object.keys(stats.deptBreakdown).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(stats.deptBreakdown).map(([dept, count]) => (
                  <span key={dept} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-medium">
                    {dept}: {count}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Generation progress bar ──────────────────────────────────────── */}
        <AnimatePresence>
          {generating && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="no-print bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Generating Report Cards…</span>
                </div>
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2.5 py-1 rounded-full">
                  {genProgress.current} / {genProgress.total}
                </span>
              </div>
              <div className="w-full bg-violet-200 dark:bg-violet-900/40 rounded-full h-2">
                <motion.div className="bg-violet-600 dark:bg-violet-400 h-2 rounded-full"
                  animate={{ width: `${genProgress.total > 0 ? (genProgress.current / genProgress.total) * 100 : 0}%` }}
                  transition={{ duration: 0.3 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Broad sheet table ────────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden print:shadow-none">
          {/* Print header */}
          <div className="hidden print:block p-6 text-center border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-800">VINCOLLINS COLLEGE</h1>
            <p className="text-base font-semibold text-slate-700 mt-1">Broad Sheet — {selectedClass}</p>
            <p className="text-sm text-slate-500">{getTermLabel(selectedTerm)} · {selectedYear}</p>
          </div>

          {/* Table header bar */}
          <div className="no-print flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">Students</span>
              <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                {displayedStudents.length}
              </span>
            </div>
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Refreshing…
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] min-w-[180px]">
                    Student
                  </th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] min-w-[100px]">
                    Adm. No
                  </th>
                  {expectedSubjects.map(subject => (
                    <th key={subject} className="px-2 py-3 text-center font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] whitespace-nowrap min-w-[64px]">
                      {getDisplaySubjectName(subject)}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] min-w-[60px]">Total</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] min-w-[60px]">Avg</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] min-w-[56px]">Grade</th>
                  <th className="no-print px-3 py-3 text-center font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] min-w-[90px]">Report</th>
                  <th className="no-print px-3 py-3 text-center font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] min-w-[72px]">View</th>
                </tr>
              </thead>

              <tbody>
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={expectedSubjects.length + 6} className="text-center py-16">
                      <div className="inline-flex p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No students found</p>
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student, idx) => {
                    const deptLabel = student.class?.includes('Science') ? 'Science' : student.class?.includes('Arts') ? 'Arts' : student.class?.includes('Commercial') ? 'Commercial' : student.department || 'General'

                    return (
                      <tr key={student.id}
                        className={cn(
                          'border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40',
                          idx % 2 !== 0 && 'bg-slate-50/30 dark:bg-slate-800/10',
                          !student.meetsMinimum && 'bg-amber-50/40 dark:bg-amber-950/10',
                        )}>
                        {/* Student cell */}
                        <td className="sticky left-0 z-10 bg-inherit px-4 py-3">
                          <div>
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-snug">{student.name}</p>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{deptLabel}</span>
                              {student.meetsMinimum && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Ready
                                </span>
                              )}
                              {!student.meetsMinimum && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                  <AlertTriangle className="h-2.5 w-2.5" /> {student.completedSubjects}/{minRequired}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{student.vin_id}</p>
                          </div>
                        </td>

                        {/* Admission number */}
                        <td className="px-3 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{student.admission_number}</td>

                        {/* Subject scores */}
                        {expectedSubjects.map(subject => {
                          const score = student.subjectMap[subject]
                          const isExpected = student.expectedSubjects.includes(subject)
                          return (
                            <td key={subject} className="px-2 py-3 text-center">
                              {score && isExpected ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{score.total}</span>
                                  <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full', gradeChipClass(score.grade))}>
                                    {score.grade}
                                  </span>
                                </div>
                              ) : isExpected ? (
                                <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                              ) : (
                                <span className="text-slate-200 dark:text-slate-700 text-[10px]">·</span>
                              )}
                            </td>
                          )
                        })}

                        {/* Totals */}
                        <td className="px-3 py-3 text-center font-bold text-sm text-slate-800 dark:text-slate-100">{student.totalScore || '—'}</td>
                        <td className="px-3 py-3 text-center font-semibold text-sm text-slate-700 dark:text-slate-200">{student.averageScore > 0 ? `${student.averageScore}%` : '—'}</td>
                        <td className="px-3 py-3 text-center">
                          {student.grade !== '—' ? (
                            <span className={cn('text-xs font-bold px-2 py-1 rounded-full', overallChipClass(student.grade))}>
                              {student.grade}
                            </span>
                          ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>

                        {/* Report status */}
                        <td className="no-print px-3 py-3 text-center">
                          <ReportStatusChip status={student.reportCardStatus} />
                        </td>

                        {/* View button */}
                        <td className="no-print px-3 py-3 text-center">
                          <Button variant="ghost" size="sm" onClick={() => handleViewReportCard(student)}
                            className="h-7 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 gap-1">
                            <Eye className="h-3 w-3" /> View
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            @page { size: landscape; margin: 0.5cm; }
            table { font-size: 8pt !important; }
            th, td { padding: 3px 5px !important; }
          }
        `}</style>
      </div>
    </div>
  )
}