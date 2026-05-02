// src/components/staff/analytics/AnalyticsDashboard.tsx - FULL FIX WITH LOADING
// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, RefreshCw, Download, Home, ChevronRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { AnalyticsOverview } from './AnalyticsOverview'
import { ClassPerformance } from './ClassPerformance'
import { SubjectPerformance } from './SubjectPerformance'
import { GradeDistribution } from './GradeDistribution'
import { TopStudents } from './TopStudents'

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({ overview: {}, classStats: [], subjectStats: [], gradeDist: [], topStudents: [], classes: [] })
  const [selectedTerm, setSelectedTerm] = useState('third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [selectedClass, setSelectedClass] = useState('all')

  const loadData = async () => {
    setLoading(true)
    try {
      // Get students
      const { data: students, error: studentError } = await supabase
        .from('profiles')
        .select('id, full_name, class')
        .eq('role', 'student')
        .order('full_name')

      if (studentError) { console.error('Student error:', studentError); toast.error('Failed to load students'); setLoading(false); return }

      const studentCount = students?.length || 0
      const classList = [...new Set((students || []).map(s => s.class).filter(Boolean))].sort()
      const studentMap: Record<string, any> = {}
      students?.forEach(s => { studentMap[s.id] = s })

      // Get CA scores
      const { data: scores, error: scoresError } = await supabase
        .from('ca_scores')
        .select('*')
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)

      if (scoresError) { console.error('Scores error:', scoresError); }

      const scoresList = scores || []

      // Enrich with student info from ca_scores columns or profiles
      const enriched = scoresList.map(s => ({
        ...s,
        student_name: studentMap[s.student_id]?.full_name || s.student_name || 'Unknown',
        student_class: studentMap[s.student_id]?.class || s.class || '—'
      }))

      // Filter by class
      const filtered = selectedClass !== 'all' ? enriched.filter(s => s.student_class === selectedClass) : enriched

      // Get counts
      const { count: examCount } = await supabase.from('exams').select('*', { count: 'exact', head: true }).eq('status', 'published')
      const { count: pendingCount } = await supabase.from('exam_attempts').select('*', { count: 'exact', head: true }).eq('status', 'pending_theory')

      // Overview
      const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((s, sc) => s + (sc.total_score || 0), 0) / filtered.length) : 0
      const passCount = filtered.filter(s => s.grade && s.grade !== 'F9').length
      const passRate = filtered.length > 0 ? Math.round((passCount / filtered.length) * 100) : 0
      const overview = { totalStudents: studentCount, totalExams: examCount || 0, avgScore, passRate, pendingGrading: pendingCount || 0, activeClasses: classList.length }

      // Class Stats
      const classMap: Record<string, any> = {}
      filtered.forEach(s => {
        const cls = s.student_class || 'Unknown'
        if (!classMap[cls]) classMap[cls] = { total: 0, count: 0, high: 0, low: 100, pass: 0 }
        classMap[cls].total += (s.total_score || 0); classMap[cls].count++
        if ((s.total_score || 0) > classMap[cls].high) classMap[cls].high = s.total_score || 0
        if ((s.total_score || 0) < classMap[cls].low) classMap[cls].low = s.total_score || 0
        if (s.grade && s.grade !== 'F9') classMap[cls].pass++
      })
      const classStudentCount: Record<string, number> = {}
      students?.forEach(s => { const c = s.class || 'Unknown'; classStudentCount[c] = (classStudentCount[c] || 0) + 1 })
      const classStats = Object.entries(classMap).map(([name, d]: any) => ({
        name, students: d.count, totalInClass: classStudentCount[name] || 0,
        avgScore: d.count > 0 ? Math.round(d.total / d.count) : 0,
        passRate: d.count > 0 ? Math.round((d.pass / d.count) * 100) : 0, highest: d.high, lowest: d.low
      })).sort((a: any, b: any) => b.avgScore - a.avgScore)

      // Top Students
      const studentScores: Record<string, any> = {}
      filtered.forEach(s => {
        const pid = s.student_id
        if (!studentScores[pid]) studentScores[pid] = { name: s.student_name, class: s.student_class, total: 0, count: 0 }
        studentScores[pid].total += (s.total_score || 0); studentScores[pid].count++
      })
      const topStudents = Object.entries(studentScores).map(([id, d]: any) => ({
        id, name: d.name, class: d.class, avgScore: d.count > 0 ? Math.round(d.total / d.count) : 0, subjects: d.count
      })).sort((a, b) => b.avgScore - a.avgScore).slice(0, 20)

      // Subject Stats
      const subjMap: Record<string, any> = {}
      filtered.forEach(s => {
        const subj = s.subject || 'Unknown'
        if (!subjMap[subj]) subjMap[subj] = { total: 0, count: 0, high: 0, low: 100, pass: 0 }
        subjMap[subj].total += (s.total_score || 0); subjMap[subj].count++
        if ((s.total_score || 0) > subjMap[subj].high) subjMap[subj].high = s.total_score || 0
        if ((s.total_score || 0) < subjMap[subj].low) subjMap[subj].low = s.total_score || 0
        if (s.grade && s.grade !== 'F9') subjMap[subj].pass++
      })
      const subjectStats = Object.entries(subjMap).map(([name, d]: any) => ({
        name, students: d.count, avgScore: d.count > 0 ? Math.round(d.total / d.count) : 0,
        passRate: d.count > 0 ? Math.round((d.pass / d.count) * 100) : 0, highest: d.high, lowest: d.low
      })).sort((a: any, b: any) => b.avgScore - a.avgScore)

      // Grade Distribution
      const gradeCounts: Record<string, number> = {}
      filtered.forEach(s => { const g = s.grade || 'F9'; gradeCounts[g] = (gradeCounts[g] || 0) + 1 })
      const total = filtered.length || 1
      const gradeDist = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'].map(g => ({
        grade: g, count: gradeCounts[g] || 0, pct: Math.round(((gradeCounts[g] || 0) / total) * 100)
      }))

      setData({ overview, classStats, subjectStats, gradeDist, topStudents, classes: classList })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [selectedTerm, selectedYear, selectedClass])

  const handleExport = () => {
    const csv = 'Name,Class,Avg Score,Subjects\n' + data.topStudents.map((s: any) => [s.name, s.class, s.avgScore, s.subjects].join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `top_students_${selectedTerm}.csv`; a.click()
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
          <p className="text-sm text-slate-500">Please wait while we fetch performance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
        <Link href="/staff" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-slate-800 font-medium">Analytics</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
            Analytics Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Performance insights across all classes and subjects</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-white"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {data.classes.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
          <Button variant="outline" size="sm" onClick={loadData} className="h-9"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Overview Cards */}
      <AnalyticsOverview overview={data.overview} />

      {/* Tabs */}
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
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" />Export CSV</Button>
          </div>
          <TopStudents data={data.topStudents} />
        </TabsContent>
        <TabsContent value="grades" className="mt-4"><GradeDistribution data={data.gradeDist} /></TabsContent>
      </Tabs>
    </div>
  )
}