// app/admin/broad-sheet/page.tsx - COMPLETE BROAD SHEET WITH REPORT CARD GENERATION
'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Loader2, RefreshCw, Printer, Search, X, FileSpreadsheet,
  Users, FileDown, Sparkles, FileText, ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────
interface SubjectScore {
  subject: string
  ca1: number
  ca2: number
  exam_obj: number
  exam_theory: number
  total: number
  grade: string
}

interface StudentRecord {
  id: string
  name: string
  vin_id: string
  subjectMap: Record<string, SubjectScore>
  totalScore: number
  averageScore: number
  grade: string
  completedSubjects: number
  totalSubjects: number
  hasAllSubjects: boolean
}

// ─── Constants ────────────────────────────────────────
const TERMS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const YEARS = ['2024/2025', '2025/2026', '2026/2027']

const JSS_SUBJECTS = [
  'English Studies', 'Mathematics', 'Basic Science', 'Basic Technology',
  'Social Studies', 'Civic Education', 'Business Studies', 'Information Technology',
  'Agricultural Science', 'Home Economics', 'PHE', 'CRS',
  'French', 'Yoruba', 'Fine Arts', 'Music', 'Security Education'
]

const SS_SUBJECTS_SCIENCE = [
  'English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics',
  'Further Mathematics', 'Agricultural Science', 'Data Processing', 'Civic Education', 'Economics'
]

const SS_SUBJECTS_ARTS = [
  'English Language', 'Mathematics', 'Literature in English', 'Government',
  'CRS', 'Economics', 'Data Processing', 'Agricultural Science', 'Civic Education', 'Biology'
]

const SS_SUBJECTS_COMMERCIAL = [
  'English Language', 'Mathematics', 'Economics', 'Commerce',
  'Financial Accounting', 'Government', 'Civic Education', 'Data Processing',
  'Geography', 'Literature in English'
]

const getWAECGrade = (score: number): string => {
  if (score >= 75) return 'A1'
  if (score >= 70) return 'B2'
  if (score >= 65) return 'B3'
  if (score >= 60) return 'C4'
  if (score >= 55) return 'C5'
  if (score >= 50) return 'C6'
  if (score >= 45) return 'D7'
  if (score >= 40) return 'E8'
  return 'F9'
}

const getGradeColor = (grade: string): string => {
  if (grade.startsWith('A')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 border-blue-200'
  if (grade.startsWith('C')) return 'bg-cyan-100 text-cyan-700 border-cyan-200'
  if (grade.startsWith('D') || grade.startsWith('E')) return 'bg-amber-100 text-amber-700 border-amber-200'
  if (grade === 'F9') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-slate-100 text-slate-600'
}

const getExpectedSubjects = (className: string): string[] => {
  if (!className) return SS_SUBJECTS_SCIENCE
  const upper = className.toUpperCase()
  if (upper.startsWith('JSS')) return JSS_SUBJECTS
  if (upper.includes('SCIENCE') || upper.includes('SC')) return SS_SUBJECTS_SCIENCE
  if (upper.includes('ART')) return SS_SUBJECTS_ARTS
  if (upper.includes('COMMERCIAL') || upper.includes('COMM')) return SS_SUBJECTS_COMMERCIAL
  return SS_SUBJECTS_SCIENCE
}

const getTermLabel = (term: string): string => {
  const found = TERMS.find(t => t.value === term)
  return found?.label || 'Third Term'
}

// ─── AI REPORT CARD HELPERS ──────────────────────────
const getSubjectRemark = (grade: string): string => {
  const r: Record<string, string> = {
    'A1': 'Excellent', 'B2': 'Very Good', 'B3': 'Good',
    'C4': 'Credit', 'C5': 'Credit', 'C6': 'Credit',
    'D7': 'Pass', 'E8': 'Pass', 'F9': 'Fail'
  }
  return r[grade] || ''
}

// Also update the teacher comment to match:
const generateTeacherComment = (name: string, avg: number): string => {
  if (avg >= 80) return `Excellent performance! ${name} has demonstrated outstanding academic ability. Keep up the excellent work!`
  if (avg >= 70) return `Very good performance. ${name} has shown great dedication and consistency. Continue to work hard.`
  if (avg >= 60) return `Good performance this term. ${name} has potential to do even better with more focus and effort.`
  if (avg >= 50) return `A satisfactory performance. ${name} can improve with more dedication to studies.`
  return `${name} needs to work harder and pay more attention in class. Improvement is possible with dedication.`
}

// And principal comment:
const generatePrincipalComment = (avg: number): string => {
  if (avg >= 80) return 'An excellent performance. Maintain this high standard.'
  if (avg >= 70) return 'A very good performance. Keep striving for excellence.'
  if (avg >= 60) return 'A good performance. There is room for improvement.'
  if (avg >= 50) return 'A satisfactory performance. You can do better with more effort.'
  return 'Work harder next term. You can do better.'
}

const generateBehaviorRatings = (avgScore: number): { name: string; rating: number }[] => {
  const getRating = (base: number): number => Math.max(1, Math.min(5, Math.round(base + (avgScore - 50) / 25)))
  return [
    { name: 'Honesty', rating: getRating(4) }, { name: 'Neatness', rating: getRating(4) },
    { name: 'Obedience', rating: getRating(3) }, { name: 'Orderliness', rating: getRating(4) },
    { name: 'Diligence', rating: getRating(4) }, { name: 'Empathy', rating: getRating(3) },
    { name: 'Punctuality', rating: getRating(4) }, { name: 'Leadership', rating: getRating(3) },
    { name: 'Politeness', rating: getRating(4) },
  ]
}

const generateSkillRatings = (avgScore: number): { name: string; rating: number }[] => {
  const getRating = (base: number): number => Math.max(1, Math.min(5, Math.round(base + (avgScore - 50) / 25)))
  return [
    { name: 'Handwriting', rating: getRating(4) }, { name: 'Verbal Fluency', rating: getRating(4) },
    { name: 'Sports', rating: getRating(3) }, { name: 'Handling Tools', rating: getRating(3) },
    { name: 'Club Activities', rating: getRating(4) },
  ]
}

const getOverallRemark = (avgScore: number): string => {
  if (avgScore >= 80) return 'Excellent'
  if (avgScore >= 70) return 'Very Good'
  if (avgScore >= 60) return 'Good'
  if (avgScore >= 50) return 'Pass'
  return 'Fail'
}

// ─── Main Component ───────────────────────────────────
export default function BroadSheetPage() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [expectedSubjects, setExpectedSubjects] = useState<string[]>(SS_SUBJECTS_SCIENCE)
  const [classes, setClasses] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState('third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [searchQuery, setSearchQuery] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 })

  useEffect(() => { setIsMounted(true) }, [])

  // ─── Init ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single()
        if (profileData) setProfile(profileData)

        const { data: studentsData } = await supabase
          .from('profiles').select('class').eq('role', 'student').not('class', 'is', null).limit(1000)

        if (studentsData) {
          const uniqueClasses = [...new Set(studentsData.map(s => s.class).filter(Boolean))] as string[]
          const sorted = uniqueClasses.sort()
          setClasses(sorted)
          if (sorted.length > 0) {
            setSelectedClass(sorted[0])
            setExpectedSubjects(getExpectedSubjects(sorted[0]))
          }
        }
      } catch (error) { console.error('Init error:', error) }
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedClass) setExpectedSubjects(getExpectedSubjects(selectedClass))
    if (isMounted && selectedClass && selectedTerm && selectedYear) loadBroadSheet()
  }, [selectedClass, selectedTerm, selectedYear, isMounted])

  // ─── Load Broad Sheet ──────────────────────────────
  const loadBroadSheet = async () => {
    setLoading(true)
    try {
      const { data: classStudents, error: studentError } = await supabase
        .from('profiles').select('id, full_name, class, vin_id')
        .eq('role', 'student').filter('class', 'eq', selectedClass).order('full_name').limit(500)

      if (studentError) throw studentError
      if (!classStudents || classStudents.length === 0) { setStudents([]); setLoading(false); return }

      const studentIds = classStudents.map(s => s.id)

      const { data: allScores, error: scoresError } = await supabase
        .from('ca_scores').select('*')
        .filter('class', 'eq', selectedClass).eq('term', selectedTerm)
        .eq('academic_year', selectedYear).in('student_id', studentIds).limit(5000)

      if (scoresError) throw scoresError

      const subjectsForClass = getExpectedSubjects(selectedClass)
      const totalExpected = subjectsForClass.length

      const studentRecords: StudentRecord[] = classStudents.map(student => {
        const studentScores = (allScores || []).filter(s => s.student_id === student.id)
        const subjectMap: Record<string, SubjectScore> = {}
        studentScores.forEach(s => {
          subjectMap[s.subject] = {
            subject: s.subject, ca1: s.ca1_score || 0, ca2: s.ca2_score || 0,
            exam_obj: s.exam_objective_score || 0, exam_theory: s.exam_theory_score || 0,
            total: s.total_score || 0, grade: s.grade || '—'
          }
        })
        const scoredSubjects = Object.keys(subjectMap).length
        const totalScore = Object.values(subjectMap).reduce((sum, s) => sum + s.total, 0)
        const averageScore = scoredSubjects > 0 ? Math.round(totalScore / scoredSubjects) : 0
        const grade = scoredSubjects > 0 ? getWAECGrade(averageScore) : '—'
        return {
          id: student.id, name: student.full_name, vin_id: student.vin_id || '—',
          subjectMap, totalScore, averageScore, grade,
          completedSubjects: scoredSubjects, totalSubjects: totalExpected,
          hasAllSubjects: scoredSubjects >= totalExpected
        }
      })

      studentRecords.sort((a, b) => a.name.localeCompare(b.name))
      setStudents(studentRecords)
    } catch (error) { console.error('Error:', error); toast.error('Failed to load broad sheet') }
    finally { setLoading(false) }
  }

  // ─── Generate All Report Cards ─────────────────────
  const handleGenerateReportCards = async () => {
    const completeStudents = students.filter(s => s.hasAllSubjects)
    if (completeStudents.length === 0) { toast.warning('No students have all subjects completed'); return }

    setGenerating(true)
    setGenProgress({ current: 0, total: completeStudents.length })
    let count = 0

    try {
      for (const student of completeStudents) {
        const formattedSubjects = expectedSubjects.map(subject => {
          const score = student.subjectMap[subject]
          if (!score) return null
          const ca = Math.round(score.ca1 + score.ca2)
          const exam = Math.round(score.exam_obj + score.exam_theory)
          return {
            name: subject, ca1: score.ca1, ca2: score.ca2,
            examObj: score.exam_obj, examTheory: score.exam_theory,
            ca, exam, total: score.total, grade: score.grade,
            remark: getSubjectRemark(score.grade)
          }
        }).filter(Boolean)

        const avgScore = student.averageScore
        const grade = getWAECGrade(avgScore)

        await supabase.from('report_cards').upsert({
          student_id: student.id,
          student_name: student.name,
          student_vin: student.vin_id,                       // ✅ ADMISSION NUMBER
          class: selectedClass,
          term: selectedTerm,
          academic_year: selectedYear,
          subjects_data: formattedSubjects,
          average_score: avgScore,
          total_score: student.totalScore,
          grade: grade,
          teacher_comments: generateTeacherComment(student.name, avgScore),
          principal_comments: generatePrincipalComment(avgScore),
          behavior_ratings: generateBehaviorRatings(avgScore),
          skill_ratings: generateSkillRatings(avgScore),
          remarks: getOverallRemark(avgScore),
          assessment_data: {
            daysPresent: 100, daysAbsent: 0,
            handwriting: 4, sports: 3, creativity: 4, technical: 3,
            punctuality: 4, neatness: 4, politeness: 4, cooperation: 3, leadership: 3
          },
          total_subjects: student.completedSubjects,
          generated_by: profile?.id,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,term,academic_year' })

        count++
        setGenProgress({ current: count, total: completeStudents.length })
      }

      toast.success(`✅ Generated ${count} report cards for ${selectedClass}!`)
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate report cards')
    } finally {
      setGenerating(false)
      setGenProgress({ current: 0, total: 0 })
    }
  }

  // ─── Filtered Students ──────────────────────────────
  const displayedStudents = useMemo(() => {
    let filtered = students
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.vin_id.toLowerCase().includes(q))
    }
    return filtered
  }, [students, searchQuery])

  // ─── Stats ──────────────────────────────────────────
  const stats = useMemo(() => {
    const complete = students.filter(s => s.hasAllSubjects)
    const classAvg = complete.length > 0
      ? Math.round(complete.reduce((sum, s) => sum + s.averageScore, 0) / complete.length) : 0
    const topScore = complete.length > 0 ? Math.max(...complete.map(s => s.totalScore)) : 0
    return { total: students.length, complete: complete.length, incomplete: students.length - complete.length, classAvg, topScore }
  }, [students])

  // ─── Export CSV ─────────────────────────────────────
  const handleExportCSV = () => {
    if (displayedStudents.length === 0) { toast.error('No data'); return }
    const headers = ['Student Name', 'Admission No', ...expectedSubjects, 'Total', 'Average', 'Grade']
    const rows = displayedStudents.map(s => {
      const subjects = expectedSubjects.map(sub => { const sc = s.subjectMap[sub]; return sc ? `${sc.total} (${sc.grade})` : '—' })
      return [s.name, s.vin_id, ...subjects, s.totalScore, `${s.averageScore}%`, s.grade]
    })
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `BroadSheet_${selectedClass}_${selectedTerm}_${selectedYear.replace('/', '_')}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }

  const handlePrint = () => { if (isMounted) window.print() }

  const displayClass = isMounted ? selectedClass : ''
  const displayTermLabel = isMounted ? getTermLabel(selectedTerm) : 'Third Term'
  const displayYear = isMounted ? selectedYear : '2025/2026'
  const displaySubjectCount = isMounted ? expectedSubjects.length : 10

  // ─── Loading ────────────────────────────────────────
  if (!isMounted || (loading && students.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mx-auto mb-6">
            <FileSpreadsheet className="h-14 w-14 text-emerald-500" />
          </motion.div>
          <p className="text-slate-500 font-medium">Loading broad sheet...</p>
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 print:space-y-1">
      {/* Header */}
      <div className="no-print">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Broad Sheet</h2>
            <p className="text-sm text-slate-500">{displayClass} • {displayTermLabel} • {displayYear} • {displaySubjectCount} subjects</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={loadBroadSheet} disabled={loading} className="h-8 text-xs">
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 text-xs">
              <FileDown className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
            <Button size="sm" onClick={handlePrint} className="h-8 text-xs bg-slate-600 hover:bg-slate-700">
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
            </Button>
            {/* ✅ GENERATE REPORT CARDS BUTTON */}
            <Button
              size="sm"
              onClick={handleGenerateReportCards}
              disabled={generating || stats.complete === 0}
              className="h-8 text-xs bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {genProgress.current}/{genProgress.total}</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate All Report Cards</>
              )}
            </Button>
            {/* ✅ LINK TO REPORT CARD APPROVAL */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/admin/report-cards')}
              className="h-8 text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Report Cards
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Filters + Stats */}
      <div className="no-print space-y-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              <div>
                <Label className="text-[10px] text-slate-400 mb-1 block">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 mb-1 block">Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{TERMS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 mb-1 block">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-slate-400 mb-1 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input placeholder="Name or VIN..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-7 h-8 text-xs" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-slate-400" /></button>}
                </div>
              </div>
              <div className="flex items-end">
                <div className="bg-emerald-50 rounded-lg p-2 text-center w-full border border-emerald-100">
                  <p className="text-[9px] text-emerald-500 uppercase">Ready</p>
                  <p className="text-sm font-bold text-emerald-700">{stats.complete}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-700' },
            { label: 'Complete', value: stats.complete, color: 'text-emerald-600' },
            { label: 'Incomplete', value: stats.incomplete, color: 'text-amber-600' },
            { label: 'Avg', value: `${stats.classAvg}%`, color: 'text-blue-600' },
            { label: 'Top', value: stats.topScore, color: 'text-purple-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-lg p-2 text-center shadow-sm border">
              <p className="text-[9px] text-slate-400 uppercase">{stat.label}</p>
              <p className={cn("text-sm font-bold", stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Generation Progress Bar */}
      {generating && (
        <div className="no-print bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-purple-700 font-medium">Generating Report Cards...</span>
            <span className="text-xs text-purple-600">{genProgress.current}/{genProgress.total}</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(genProgress.current / genProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* THE BROAD SHEET TABLE */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-lg overflow-hidden print:shadow-none print:border">
          <div className="hidden print:block p-4 text-center border-b">
            <h1 className="text-xl font-bold">VINCOLLINS EDUCATIONAL INSTITUTE</h1>
            <p className="text-base font-semibold">Broad Sheet - {selectedClass}</p>
            <p className="text-xs">{getTermLabel(selectedTerm)} • {selectedYear}</p>
          </div>

          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse text-[11px] sm:text-xs min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 print:bg-gray-100">
                  <th className="sticky left-0 z-20 bg-slate-100 print:bg-gray-100 border-b-2 border-slate-200 px-2 sm:px-3 py-2 text-left font-bold text-slate-600 text-[10px] sm:text-xs min-w-[130px] sm:min-w-[160px]">
                    Student
                  </th>
                  {expectedSubjects.map(subject => (
                    <th key={subject} className="border-b-2 border-slate-200 px-1.5 sm:px-2 py-2 text-center font-bold text-slate-600 text-[9px] sm:text-[10px] whitespace-nowrap min-w-[70px] sm:min-w-[80px]">
                      {subject.split(' ').map((w, i) => (<span key={i} className="block leading-tight">{w}</span>))}
                    </th>
                  ))}
                  <th className="border-b-2 border-slate-200 px-2 py-2 text-center font-bold text-slate-600 text-[10px] sm:text-xs min-w-[55px]">Total</th>
                  <th className="border-b-2 border-slate-200 px-2 py-2 text-center font-bold text-slate-600 text-[10px] sm:text-xs min-w-[45px]">Avg</th>
                  <th className="border-b-2 border-slate-200 px-2 py-2 text-center font-bold text-slate-600 text-[10px] sm:text-xs min-w-[45px]">Grade</th>
                </tr>
              </thead>
              <tbody>
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={expectedSubjects.length + 4} className="text-center py-12">
                      <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No students found</p>
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map(student => (
                    <tr key={student.id} className={cn("border-b border-slate-100 hover:bg-slate-50/50 transition-colors", !student.hasAllSubjects && "bg-amber-50/20")}>
                      <td className="sticky left-0 z-10 bg-white print:bg-white border-r border-slate-100 px-2 sm:px-3 py-1.5">
                        <div>
                          <p className="font-semibold text-[11px] sm:text-xs">{student.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{student.vin_id}</p>
                          {!student.hasAllSubjects && (
                            <span className="text-[9px] text-amber-600">{student.completedSubjects}/{student.totalSubjects}</span>
                          )}
                        </div>
                      </td>
                      {expectedSubjects.map(subject => {
                        const score = student.subjectMap[subject]
                        return (
                          <td key={subject} className="px-1.5 sm:px-2 py-1.5 text-center border-r border-slate-50">
                            {score ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-semibold text-[11px] sm:text-xs">{score.total}</span>
                                <Badge className={cn("text-[8px] leading-none px-1 py-0 border", getGradeColor(score.grade))}>{score.grade}</Badge>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-2 py-1.5 text-center font-bold text-[11px] sm:text-xs text-slate-700 border-r border-slate-50">{student.totalScore}</td>
                      <td className="px-2 py-1.5 text-center font-semibold text-[11px] sm:text-xs text-slate-600 border-r border-slate-50">{student.averageScore}%</td>
                      <td className="px-2 py-1.5 text-center">
                        <Badge className={cn("text-[9px] sm:text-[10px] font-bold border", getGradeColor(student.grade))}>{student.grade}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="hidden print:block p-3 border-t text-center text-[10px] text-slate-500">
            Generated {new Date().toLocaleDateString()} • Total: {stats.total} students • Avg: {stats.classAvg}%
          </div>
        </Card>
      </motion.div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { size: landscape; margin: 0.5cm; }
        }
      `}</style>
    </div>
  )
}