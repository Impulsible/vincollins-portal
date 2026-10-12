// src/components/staff/analytics/AnalyticsDashboard.tsx - FIXED UNIQUE STUDENT COUNTING + DARK MODE
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

interface TermOption {
  value: string
  label: string
  session_year: string
  is_current: boolean
}

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
  
  const [termOptions, setTermOptions] = useState<TermOption[]>([])
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  const [isLoadingTerms, setIsLoadingTerms] = useState(true)

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const { data, error } = await supabase
          .from('terms')
          .select('term_code, term_name, session_year')
          .order('session_year', { ascending: false })
          .order('term_code', { ascending: true })

        if (error) {
          console.error('Error fetching terms:', error)
          return
        }

        if (data) {
          const { data: settings } = await supabase
            .from('school_settings')
            .select('current_term, current_session')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const options = data.map((t: any) => ({
            value: t.term_code,
            label: t.term_name,
            session_year: t.session_year,
            is_current: t.term_code === settings?.current_term && 
                        t.session_year === settings?.current_session
          }))
          
          setTermOptions(options)
          
          if (settings?.current_term && settings?.current_session) {
            setSelectedTerm(settings.current_term)
            setSelectedYear(settings.current_session)
          } else if (options.length > 0) {
            setSelectedTerm(options[0].value)
            setSelectedYear(options[0].session_year)
          }
        }
      } catch (error) {
        console.error('Error fetching terms:', error)
      } finally {
        setIsLoadingTerms(false)
      }
    }

    fetchTerms()
  }, [])

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

      const { data: teacherExams } = await supabase
        .from('exams')
        .select('id, title, subject, class, status')
        .eq('created_by', userId)

      const examMap: Record<string, any> = {}
      ;(teacherExams || []).forEach(exam => {
        examMap[exam.id] = exam
      })

      const examIds = (teacherExams || []).map(e => e.id)
      const publishedExams = (teacherExams || []).filter(e => e.status === 'published').length

      const { data: students } = await supabase
        .from('profiles')
        .select('id, full_name, class')
        .eq('role', 'student')
        .order('full_name')

      const classList = [...new Set((students || []).map(s => s.class).filter(Boolean))].sort()
      const studentMap: Record<string, any> = {}
      students?.forEach(s => { studentMap[s.id] = s })

      const allScores: any[] = []

      if (examIds.length > 0 && selectedTerm && selectedYear) {
        const [attemptsResult, caResult] = await Promise.all([
          supabase.from('exam_attempts')
            .select('*')
            .in('exam_id', examIds)
            .eq('term', selectedTerm)
            .eq('session_year', selectedYear)
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

        const caMap: Record<string, any> = {}
        caScores.forEach((c: any) => {
          const key = `${c.student_id}|${c.exam_id}`
          caMap[key] = c
        })

        const processedKeys = new Set<string>()

        attempts.forEach((a: any) => {
          const exam = examMap[a.exam_id]
          const key = `${a.student_id}|${a.exam_id}`
          const ca = caMap[key]
          
          processedKeys.add(key)
          
          const hasCA = ca && (ca.ca1_score > 0 || ca.ca2_score > 0)
          const percentage = hasCA ? (ca.percentage || 0) : (a.percentage || 0)
          const totalScore = hasCA ? (ca.total_score || 0) : (a.total_score || 0)
          const grade = hasCA ? (ca.grade || getGradeFromScore(percentage)) : (a.grade || getGradeFromScore(percentage))
          
          const subject = exam?.subject || a.subject || 'Unknown Subject'
          const studentClass = studentMap[a.student_id]?.class || a.class || exam?.class || 'Unknown Class'
          
          allScores.push({
            student_id: a.student_id,
            student_name: a.student_name || studentMap[a.student_id]?.full_name || 'Unknown Student',
            student_class: studentClass,
            subject: subject,
            total_score: totalScore,
            percentage: percentage,
            grade: grade,
            exam_id: a.exam_id,
            has_ca: hasCA
          })
        })

        caScores.forEach((c: any) => {
          const exam = examMap[c.exam_id]
          const key = `${c.student_id}|${c.exam_id}`
          if (processedKeys.has(key)) return
          
          const subject = exam?.subject || c.subject || 'Unknown Subject'
          const studentClass = studentMap[c.student_id]?.class || c.class || exam?.class || 'Unknown Class'
          
          allScores.push({
            student_id: c.student_id,
            student_name: c.student_name || studentMap[c.student_id]?.full_name || 'Unknown Student',
            student_class: studentClass,
            subject: subject,
            total_score: c.total_score || 0,
            percentage: c.percentage || 0,
            grade: c.grade || getGradeFromScore(c.total_score || 0),
            exam_id: c.exam_id,
            has_ca: true
          })
        })
      }

      const filtered = selectedClass !== 'all'
        ? allScores.filter(s => s.student_class === selectedClass)
        : allScores

      const validScores = filtered.filter(s => s.subject !== 'Unknown Subject' && s.subject !== '—')

      const uniqueStudentIds = new Set<string>()
      const classStudentMap: Record<string, Set<string>> = {}
      
      validScores.forEach(s => {
        if (s.student_id) {
          uniqueStudentIds.add(s.student_id)
          const cls = s.student_class || 'Unknown Class'
          if (!classStudentMap[cls]) {
            classStudentMap[cls] = new Set()
          }
          classStudentMap[cls].add(s.student_id)
        }
      })
      
      const uniqueStudentCount = uniqueStudentIds.size

      const avgScore = validScores.length > 0
        ? Math.round(validScores.reduce((sum, s) => sum + (s.percentage || s.total_score || 0), 0) / validScores.length)
        : 0

      const passingScores = validScores.filter(s => isPassing(s.grade))
      const passRate = validScores.length > 0
        ? Math.round((passingScores.length / validScores.length) * 100)
        : 0

      const overview = {
        totalStudents: uniqueStudentCount,
        totalExams: publishedExams,
        avgScore,
        passRate,
        pendingGrading: allScores.filter(s => s.status === 'pending_theory').length,
        activeClasses: Object.keys(classStudentMap).length
      }

      const subjMap: Record<string, any> = {}
      validScores.forEach(s => {
        const subj = s.subject
        if (!subjMap[subj]) {
          subjMap[subj] = { total: 0, count: 0, high: 0, low: 100, pass: 0, students: new Set() }
        }
        const score = s.percentage || s.total_score || 0
        subjMap[subj].total += score
        subjMap[subj].count++
        if (s.student_id) subjMap[subj].students.add(s.student_id)
        if (score > subjMap[subj].high) subjMap[subj].high = score
        if (score < subjMap[subj].low) subjMap[subj].low = score
        if (isPassing(s.grade)) subjMap[subj].pass++
      })

      const subjectStats = Object.entries(subjMap).map(([name, d]: any) => ({
        name,
        students: d.students.size,
        avgScore: d.count > 0 ? Math.round(d.total / d.count) : 0,
        passRate: d.count > 0 ? Math.round((d.pass / d.count) * 100) : 0,
        highest: d.high,
        lowest: d.low
      })).sort((a: any, b: any) => b.avgScore - a.avgScore)

      const classStats = Object.entries(classStudentMap).map(([name, studentSet]: [string, Set<string>]) => {
        const classScores = validScores.filter(s => s.student_class === name)
        const total = classScores.reduce((sum, s) => sum + (s.percentage || s.total_score || 0), 0)
        const passCount = classScores.filter(s => isPassing(s.grade)).length
        const highest = classScores.length > 0 ? Math.max(...classScores.map(s => s.percentage || s.total_score || 0)) : 0
        const lowest = classScores.length > 0 ? Math.min(...classScores.map(s => s.percentage || s.total_score || 0)) : 0
        
        return {
          name,
          students: studentSet.size,
          avgScore: classScores.length > 0 ? Math.round(total / classScores.length) : 0,
          passRate: classScores.length > 0 ? Math.round((passCount / classScores.length) * 100) : 0,
          highest,
          lowest
        }
      }).sort((a: any, b: any) => b.avgScore - a.avgScore)

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
        studentScores[key].total += (s.percentage || s.total_score || 0)
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

      const allGrades = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']
      const gradeCounts: Record<string, number> = {}
      allGrades.forEach(g => { gradeCounts[g] = 0 })
      
      validScores.forEach(s => {
        const grade = s.grade || getGradeFromScore(s.percentage || s.total_score || 0)
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

  useEffect(() => {
    if (selectedTerm && selectedYear) {
      loadData()
    }
  }, [selectedTerm, selectedYear, selectedClass])

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

  if (loading || isLoadingTerms) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] transition-colors duration-300">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 dark:border-t-emerald-400 animate-spin" />
            <TrendingUp className="absolute inset-0 m-auto h-6 w-6 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">Loading Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Fetching your students' performance data...</p>
        </div>
      </div>
    )
  }

  const currentTermLabel = termOptions.find(t => t.value === selectedTerm)?.label || selectedTerm
  const currentTermInfo = {
    termName: currentTermLabel,
    sessionYear: selectedYear,
    termCode: selectedTerm,
    isCurrent: termOptions.find(t => t.value === selectedTerm)?.is_current || false
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full transition-colors duration-300">
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <Link href="/staff" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-slate-800 dark:text-slate-200 font-medium">My Analytics</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
            My Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Performance insights for your exams and students</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <SelectItem value="all">All Classes</SelectItem>
              {data.classes.map((c: string) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              {termOptions.map((term) => (
                <SelectItem key={`${term.value}-${term.session_year}`} value={term.value}>
                  {term.label} {term.is_current ? '✓' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              {[...new Set(termOptions.map(t => t.session_year))].map((session) => (
                <SelectItem key={session} value={session}>
                  {session}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData} 
            className="h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnalyticsOverview 
        overview={data.overview} 
        termInfo={currentTermInfo}
      />

      <Tabs defaultValue="classes">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 h-auto w-full sm:w-auto overflow-x-auto flex-nowrap shadow-sm">
          <TabsTrigger 
            value="classes" 
            className="text-xs sm:text-sm px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            By Class
          </TabsTrigger>
          <TabsTrigger 
            value="subjects" 
            className="text-xs sm:text-sm px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            By Subject
          </TabsTrigger>
          <TabsTrigger 
            value="students" 
            className="text-xs sm:text-sm px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            Top Students
          </TabsTrigger>
          <TabsTrigger 
            value="grades" 
            className="text-xs sm:text-sm px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap"
          >
            Grades
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="classes" className="mt-4">
          <ClassPerformance 
            data={data.classStats} 
            termInfo={currentTermInfo}
          />
        </TabsContent>
        
        <TabsContent value="subjects" className="mt-4">
          <SubjectPerformance 
            data={data.subjectStats} 
            termInfo={currentTermInfo}
          />
        </TabsContent>
        
        <TabsContent value="students" className="mt-4">
          <div className="flex justify-end mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Download className="mr-1.5 h-4 w-4" />Export CSV
            </Button>
          </div>
          <TopStudents data={data.topStudents} termInfo={currentTermInfo} />
        </TabsContent>
        
        <TabsContent value="grades" className="mt-4">
          <GradeDistribution data={data.gradeDist} termInfo={currentTermInfo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}