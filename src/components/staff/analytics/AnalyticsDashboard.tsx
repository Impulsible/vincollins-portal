// src/components/staff/analytics/AnalyticsDashboard.tsx - FIXED SUBJECT MAPPING
// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { RefreshCw, Download, Home, ChevronRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { AnalyticsOverview } from './AnalyticsOverview'
import { ClassPerformance } from './ClassPerformance'
import { SubjectPerformance } from './SubjectPerformance'
import { GradeDistribution } from './GradeDistribution'
import { TopStudents } from './TopStudents'

function isPassing(grade: string | null | undefined): boolean {
  if (!grade) return false
  const passingGrades = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8']
  return passingGrades.includes(grade)
}

function getGradeFromScore(score: number): string {
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

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({ 
    overview: {}, classStats: [], subjectStats: [], gradeDist: [], topStudents: [], classes: [] 
  })
  const [selectedTerm, setSelectedTerm] = useState('third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [selectedClass, setSelectedClass] = useState('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) { 
        toast.error('Not authenticated')
        setLoading(false)
        return 
      }

      // ✅ Step 1: Get THIS teacher's exams
      const { data: teacherExams } = await supabase
        .from('exams')
        .select('id, title, subject, class, status')
        .eq('created_by', userId)

      // ✅ BUILD EXAM MAP for subject lookup
      const examMap: Record<string, any> = {}
      ;(teacherExams || []).forEach(exam => {
        examMap[exam.id] = exam
      })

      const examIds = (teacherExams || []).map(e => e.id)
      const publishedExams = (teacherExams || []).filter(e => e.status === 'published').length

      console.log('📊 [ANALYTICS] Teacher exams:', teacherExams?.map(e => ({ id: e.id, subject: e.subject, class: e.class })))

      // ✅ Step 2: Get students
      const { data: students } = await supabase
        .from('profiles')
        .select('id, full_name, class')
        .eq('role', 'student')
        .order('full_name')

      const studentCount = students?.length || 0
      const classList = [...new Set((students || []).map(s => s.class).filter(Boolean))].sort()
      const studentMap: Record<string, any> = {}
      students?.forEach(s => { studentMap[s.id] = s })

      // ✅ Step 3: Get scores from BOTH tables
      const allScores: any[] = []

      if (examIds.length > 0) {
        const [attemptsResult, caResult] = await Promise.all([
          supabase.from('exam_attempts')
            .select('*')
            .in('exam_id', examIds)
            .neq('status', 'pending_theory')
            .order('submitted_at', { ascending: false }),
          supabase.from('ca_scores')
            .select('*')
            .in('exam_id', examIds)
            .eq('term', selectedTerm)
            .eq('academic_year', selectedYear)
        ])

        const attempts = attemptsResult?.data || []
        const caScores = caResult?.data || []

        console.log('📊 [ANALYTICS] Raw data:', {
          attemptsCount: attempts.length,
          caScoresCount: caScores.length,
          sampleAttempt: attempts[0] // Log first attempt to see structure
        })

        // Enrich exam_attempts - FIXED: Get subject from examMap
        attempts.forEach((a: any) => {
          const exam = examMap[a.exam_id]
          const score = a.percentage || a.total_score || a.score || 0
          const grade = a.grade || a.letter_grade || getGradeFromScore(score)
          
          // ✅ Get subject from exam table first, then fallback to attempt fields
          const subject = exam?.subject || a.subject || a.exam_subject || 'Unknown Subject'
          const studentClass = studentMap[a.student_id]?.class || a.class || exam?.class || 'Unknown Class'
          
          allScores.push({
            student_id: a.student_id,
            student_name: a.student_name || studentMap[a.student_id]?.full_name || 'Unknown Student',
            student_class: studentClass,
            subject: subject,
            total_score: score,
            percentage: a.percentage,
            grade: grade,
            exam_id: a.exam_id,
            type: 'exam'
          })
        })

        // Enrich ca_scores - FIXED: Get subject from examMap
        caScores.forEach((c: any) => {
          const exam = examMap[c.exam_id]
          const score = c.total_score || c.score || 0
          const grade = c.grade || getGradeFromScore(score)
          
          // ✅ Get subject from exam table first
          const subject = exam?.subject || c.subject || 'Unknown Subject'
          const studentClass = studentMap[c.student_id]?.class || c.class || exam?.class || 'Unknown Class'
          
          allScores.push({
            student_id: c.student_id,
            student_name: c.student_name || studentMap[c.student_id]?.full_name || 'Unknown Student',
            student_class: studentClass,
            subject: subject,
            total_score: score,
            percentage: score,
            grade: grade,
            exam_id: c.exam_id,
            type: 'ca'
          })
        })
      }

      // ✅ Log unique subjects for debugging
      const uniqueSubjects = [...new Set(allScores.map(s => s.subject))]
      console.log('📊 [ANALYTICS] Unique subjects found:', uniqueSubjects)

      // ✅ Step 4: Filter by class
      const filtered = selectedClass !== 'all'
        ? allScores.filter(s => s.student_class === selectedClass)
        : allScores

      // ✅ Filter out "Unknown Subject" entries
      const validScores = filtered.filter(s => s.subject !== 'Unknown Subject' && s.subject !== '—')

      console.log('📊 [ANALYTICS] Score counts:', {
        allScores: allScores.length,
        filtered: filtered.length,
        validScores: validScores.length
      })

      // ✅ Step 5: Calculate overview using valid scores
      const avgScore = validScores.length > 0
        ? Math.round(validScores.reduce((sum, s) => sum + (s.total_score || 0), 0) / validScores.length)
        : 0

      const passingScores = validScores.filter(s => isPassing(s.grade))
      const passRate = validScores.length > 0
        ? Math.round((passingScores.length / validScores.length) * 100)
        : 0

      const overview = {
        totalStudents: studentCount,
        totalExams: publishedExams,
        avgScore,
        passRate,
        pendingGrading: allScores.filter(s => s.status === 'pending_theory').length,
        activeClasses: classList.length
      }

      // ✅ Step 6: Subject Stats - Use valid scores only
      const subjMap: Record<string, any> = {}
      validScores.forEach(s => {
        const subj = s.subject
        if (!subjMap[subj]) {
          subjMap[subj] = { total: 0, count: 0, high: 0, low: 100, pass: 0 }
        }
        const score = s.total_score || 0
        subjMap[subj].total += score
        subjMap[subj].count++
        if (score > subjMap[subj].high) subjMap[subj].high = score
        if (score < subjMap[subj].low) subjMap[subj].low = score
        if (isPassing(s.grade)) subjMap[subj].pass++
      })

      const subjectStats = Object.entries(subjMap).map(([name, d]: any) => ({
        name,
        students: d.count,
        avgScore: d.count > 0 ? Math.round(d.total / d.count) : 0,
        passRate: d.count > 0 ? Math.round((d.pass / d.count) * 100) : 0,
        highest: d.high,
        lowest: d.low
      })).sort((a: any, b: any) => b.avgScore - a.avgScore)

      console.log('📊 [ANALYTICS] Final subject stats:', subjectStats.map(s => `${s.name}: ${s.students} students, ${s.avgScore}%`))

      // ✅ Step 7: Class Stats
      const classMap: Record<string, any> = {}
      validScores.forEach(s => {
        const cls = s.student_class || 'Unknown Class'
        if (!classMap[cls]) {
          classMap[cls] = { total: 0, count: 0, high: 0, low: 100, pass: 0 }
        }
        const score = s.total_score || 0
        classMap[cls].total += score
        classMap[cls].count++
        if (score > classMap[cls].high) classMap[cls].high = score
        if (score < classMap[cls].low) classMap[cls].low = score
        if (isPassing(s.grade)) classMap[cls].pass++
      })

      const classStats = Object.entries(classMap).map(([name, d]: any) => ({
        name,
        students: d.count,
        avgScore: d.count > 0 ? Math.round(d.total / d.count) : 0,
        passRate: d.count > 0 ? Math.round((d.pass / d.count) * 100) : 0,
        highest: d.high,
        lowest: d.low
      })).sort((a: any, b: any) => b.avgScore - a.avgScore)

      // ✅ Step 8: Top Students
      const studentScores: Record<string, any> = {}
      validScores.forEach(s => {
        const key = s.student_id || s.student_name || 'unknown'
        if (!studentScores[key]) {
          studentScores[key] = {
            id: s.student_id,
            name: s.student_name || 'Unknown',
            class: s.student_class || 'Unknown',
            total: 0,
            count: 0
          }
        }
        studentScores[key].total += (s.total_score || 0)
        studentScores[key].count++
      })

      const topStudents = Object.entries(studentScores)
        .map(([key, d]: any) => ({
          id: d.id || key,
          name: d.name,
          class: d.class,
          avgScore: d.count > 0 ? Math.round(d.total / d.count) : 0,
          subjects: d.count
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 20)

      // ✅ Step 9: Grade Distribution
      const allGrades = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']
      const gradeCounts: Record<string, number> = {}
      allGrades.forEach(g => { gradeCounts[g] = 0 })
      
      validScores.forEach(s => {
        const grade = s.grade || getGradeFromScore(s.total_score || 0)
        if (gradeCounts[grade] !== undefined) {
          gradeCounts[grade]++
        }
      })

      const total = validScores.length || 1
      const gradeDist = allGrades.map(g => ({
        grade: g,
        count: gradeCounts[g] || 0,
        pct: Math.round(((gradeCounts[g] || 0) / total) * 100)
      }))

      setData({
        overview,
        classStats,
        subjectStats,
        gradeDist,
        topStudents,
        classes: classList
      })

    } catch (error) {
      console.error('❌ Analytics error:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [selectedTerm, selectedYear, selectedClass])

  const handleExport = () => {
    const csv = 'Name,Class,Avg Score,Subjects\n' +
      data.topStudents.map((s: any) =>
        [s.name, s.class, s.avgScore + '%', s.subjects].join(',')
      ).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `my_students_${selectedTerm}.csv`
    a.click()
    toast.success('Exported!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
            <TrendingUp className="absolute inset-0 m-auto h-6 w-6 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">Loading Analytics</h2>
          <p className="text-sm text-slate-500">Fetching your students' performance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
        <Link href="/staff" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-slate-800 font-medium">My Analytics</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            My Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Performance insights for your exams and students</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-white">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {data.classes.map((c: string) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="h-9 text-xs w-[120px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="first">First Term</SelectItem>
              <SelectItem value="second">Second Term</SelectItem>
              <SelectItem value="third">Third Term</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-9 text-xs w-[120px] bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2025/2026">2025/2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadData} className="h-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnalyticsOverview overview={data.overview} />

      <Tabs defaultValue="classes">
        <TabsList className="bg-white border rounded-lg p-1 h-auto w-full sm:w-auto overflow-x-auto flex-nowrap shadow-sm">
          <TabsTrigger value="classes" className="text-xs sm:text-sm px-3 py-1.5 rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap">By Class</TabsTrigger>
          <TabsTrigger value="subjects" className="text-xs sm:text-sm px-3 py-1.5 rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap">By Subject</TabsTrigger>
          <TabsTrigger value="students" className="text-xs sm:text-sm px-3 py-1.5 rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap">Top Students</TabsTrigger>
          <TabsTrigger value="grades" className="text-xs sm:text-sm px-3 py-1.5 rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap">Grades</TabsTrigger>
        </TabsList>
        <TabsContent value="classes" className="mt-4"><ClassPerformance data={data.classStats} /></TabsContent>
        <TabsContent value="subjects" className="mt-4"><SubjectPerformance data={data.subjectStats} /></TabsContent>
        <TabsContent value="students" className="mt-4">
          <div className="flex justify-end mb-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1.5 h-4 w-4" />Export CSV
            </Button>
          </div>
          <TopStudents data={data.topStudents} />
        </TabsContent>
        <TabsContent value="grades" className="mt-4"><GradeDistribution data={data.gradeDist} /></TabsContent>
      </Tabs>
    </div>
  )
}