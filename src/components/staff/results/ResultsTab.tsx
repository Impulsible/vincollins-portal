// ============================================
// RESULTS TAB - Complete with Responsive Layout
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Award, Search, TrendingUp, Download, Loader2, BarChart3, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const calculateGrade = (percentage: number): string => {
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'P'
  return 'F'
}

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-700'
    case 'B': return 'bg-blue-100 text-blue-700'
    case 'C': return 'bg-yellow-100 text-yellow-700'
    case 'P': return 'bg-orange-100 text-orange-700'
    case 'F': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

interface ResultsTabProps {
  staffProfile: any
  termInfo: any
}

export function ResultsTab({ staffProfile, termInfo }: ResultsTabProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedExam, setSelectedExam] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [exams, setExams] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [stats, setStats] = useState({ totalStudents: 0, averageScore: 0, highestScore: 0, lowestScore: 100, passRate: 0 })
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { setMounted(true); loadExams() }, [])
  useEffect(() => { if (selectedExam) loadResults() }, [selectedExam])

  const loadExams = async () => {
    try {
      const { data } = await supabase.from('exams').select('id, title, subject, class').eq('created_by', staffProfile.id).order('created_at', { ascending: false })
      setExams(data || [])
    } catch (error) { console.error('Error loading exams:', error) }
  }

  const loadResults = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('exam_results').select(`*, student:students!exam_results_student_id_fkey(profiles!students_id_fkey(full_name), vin_id, class)`).eq('exam_id', selectedExam).order('percentage', { ascending: false })
      if (error) throw error
      
      const formatted = data?.map((r: any) => ({ ...r, student: { full_name: r.student?.profiles?.full_name || 'Unknown', vin_id: r.student?.vin_id, class: r.student?.class } })) || []
      setResults(formatted)
      
      if (formatted.length > 0) {
        const scores = formatted.map(r => r.percentage || 0)
        const passed = formatted.filter(r => calculateGrade(r.percentage || 0) !== 'F').length
        setStats({ totalStudents: formatted.length, averageScore: scores.reduce((a, b) => a + b, 0) / scores.length, highestScore: Math.max(...scores), lowestScore: Math.min(...scores), passRate: (passed / formatted.length) * 100 })
      }
    } catch (error) { console.error('Error loading results:', error) } finally { setLoading(false); setRefreshing(false) }
  }

  const handleRefresh = () => { setRefreshing(true); loadResults(); toast.success('Results refreshed') }
  const handleExport = () => {
    const csv = [['Name', 'VIN', 'Class', 'Score', 'Percentage', 'Grade', 'Status'].join(','), ...results.map(r => [r.student?.full_name, r.student?.vin_id, r.student?.class, `${r.score}/${r.total_marks}`, `${r.percentage?.toFixed(1)}%`, calculateGrade(r.percentage || 0), calculateGrade(r.percentage || 0) !== 'F' ? 'Passed' : 'Failed'].join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `results_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    toast.success('Export complete!')
  }

  if (!mounted) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Exam Results</h1><p className="text-xs sm:text-sm text-gray-500 mt-1">View and analyze student exam performance</p></div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export</Button><Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}><RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />Refresh</Button></div>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3"><span className="text-xs sm:text-sm font-medium">Grade Scale:</span><Badge className="bg-green-100 text-green-700 text-xs">A: 80-100%</Badge><Badge className="bg-blue-100 text-blue-700 text-xs">B: 70-79%</Badge><Badge className="bg-yellow-100 text-yellow-700 text-xs">C: 60-69%</Badge><Badge className="bg-orange-100 text-orange-700 text-xs">P: 50-59%</Badge><Badge className="bg-red-100 text-red-700 text-xs">F: 0-49%</Badge></div>
        </CardContent>
      </Card>

      {selectedExam && stats.totalStudents > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <Card className="border-0 shadow-sm"><CardContent className="p-3"><p className="text-xs text-gray-500">Students</p><p className="text-xl font-bold">{stats.totalStudents}</p></CardContent></Card>
          <Card className="border-0 shadow-sm bg-blue-50"><CardContent className="p-3"><p className="text-xs text-blue-600">Average</p><p className="text-xl font-bold text-blue-700">{stats.averageScore.toFixed(1)}%</p></CardContent></Card>
          <Card className="border-0 shadow-sm bg-green-50"><CardContent className="p-3"><p className="text-xs text-green-600">Highest</p><p className="text-xl font-bold text-green-700">{stats.highestScore}%</p></CardContent></Card>
          <Card className="border-0 shadow-sm bg-red-50"><CardContent className="p-3"><p className="text-xs text-red-600">Lowest</p><p className="text-xl font-bold text-red-700">{stats.lowestScore}%</p></CardContent></Card>
          <Card className="border-0 shadow-sm bg-purple-50"><CardContent className="p-3"><p className="text-xs text-purple-600">Pass Rate</p><p className="text-xl font-bold text-purple-700">{stats.passRate.toFixed(1)}%</p></CardContent></Card>
        </div>
      )}

      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-64"><Label className="text-xs mb-1 block">Select Exam</Label><Select value={selectedExam} onValueChange={setSelectedExam}><SelectTrigger><SelectValue placeholder="Select an exam" /></SelectTrigger><SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.title} ({e.class} - {e.subject})</SelectItem>)}</SelectContent></Select></div>
            <div className="flex-1 relative"><Label className="text-xs mb-1 block">Search</Label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search by name or VIN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10" disabled={!selectedExam} /></div></div>
          </div>
        </CardContent>
      </Card>

      {selectedExam ? (
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            {loading ? <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" /></div> : results.length === 0 ? <div className="text-center py-12"><Award className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p>No results found</p></div> : (
              <Table>
                <TableHeader><TableRow className="bg-gray-50"><TableHead>#</TableHead><TableHead>Student</TableHead><TableHead>VIN</TableHead><TableHead className="text-center">Score</TableHead><TableHead className="text-center">Percentage</TableHead><TableHead>Grade</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {results.filter(r => r.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.student?.vin_id?.toLowerCase().includes(searchQuery.toLowerCase())).map((r, i) => {
                    const grade = calculateGrade(r.percentage || 0)
                    return <TableRow key={r.id}><TableCell className="font-medium">{i + 1}{i === 0 && <TrendingUp className="h-3 w-3 text-green-500 inline ml-1" />}</TableCell><TableCell>{r.student?.full_name}</TableCell><TableCell className="text-sm text-gray-500">{r.student?.vin_id}</TableCell><TableCell className="text-center">{r.score}/{r.total_marks}</TableCell><TableCell className="text-center font-semibold">{r.percentage?.toFixed(1)}%</TableCell><TableCell><Badge className={getGradeColor(grade)}>{grade}</Badge></TableCell><TableCell className="text-center">{grade !== 'F' ? <Badge className="bg-green-100 text-green-700">Passed</Badge> : <Badge className="bg-red-100 text-red-700">Failed</Badge>}</TableCell></TableRow>
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : <Card className="border-0 shadow-sm bg-white"><CardContent className="text-center py-12"><BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-600 font-medium">Select an exam to view results</p></CardContent></Card>}
    </motion.div>
  )
}