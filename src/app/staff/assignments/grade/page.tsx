// app/staff/assignments/grade/page.tsx - COMPLETE GRADING PAGE
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Loader2, ArrowLeft, Home, ChevronRight, Search,
  Download, CheckCircle, XCircle, Eye, FileText, User, Calendar,
  Filter, Award, Clock, BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Submission {
  id: string
  assignment_id: string
  student_id: string
  student_name: string
  student_class: string
  file_url: string
  file_name: string
  submitted_at: string
  status: string
  score?: number
  feedback?: string
  assignment_title?: string
  assignment_subject?: string
  total_marks?: number
  graded_at?: string
  graded_by?: string
}

export default function GradeAssignmentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { 
    loadSubmissions() 
  }, [])

  useEffect(() => {
    let filtered = [...submissions]
    
    if (activeTab === 'pending') {
      filtered = filtered.filter(s => s.status === 'submitted')
    } else if (activeTab === 'graded') {
      filtered = filtered.filter(s => s.status === 'graded')
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.student_name?.toLowerCase().includes(query) ||
        s.assignment_title?.toLowerCase().includes(query) ||
        s.student_class?.toLowerCase().includes(query)
      )
    }
    
    setFilteredSubmissions(filtered)
  }, [submissions, searchQuery, activeTab])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { 
        router.push('/portal')
        return 
      }

      // Get teacher's assignments first
      const { data: teacherAssignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('created_by', session.user.id)

      const assignmentIds = teacherAssignments?.map(a => a.id) || []

      if (assignmentIds.length === 0) {
        setSubmissions([])
        setLoading(false)
        return
      }

      // Get submissions for teacher's assignments
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .in('assignment_id', assignmentIds)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      // Get assignment details
      const uniqueAssignmentIds = [...new Set((data || []).map(s => s.assignment_id))]
      const assignmentMap: Record<string, any> = {}
      
      if (uniqueAssignmentIds.length > 0) {
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id, title, subject, total_points')
          .in('id', uniqueAssignmentIds)
        
        assignments?.forEach(a => { 
          assignmentMap[a.id] = {
            title: a.title,
            subject: a.subject,
            total_marks: a.total_points
          }
        })
      }

      const enriched: Submission[] = (data || []).map(s => ({
        ...s,
        assignment_title: assignmentMap[s.assignment_id]?.title || 'Unknown',
        assignment_subject: assignmentMap[s.assignment_id]?.subject || 'Unknown',
        total_marks: assignmentMap[s.assignment_id]?.total_marks || 100
      }))

      setSubmissions(enriched)
      setFilteredSubmissions(enriched)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = async () => {
    if (!selectedSubmission || !score) {
      toast.error('Please enter a score')
      return
    }

    const numScore = parseFloat(score)
    if (isNaN(numScore) || numScore < 0 || numScore > (selectedSubmission.total_marks || 100)) {
      toast.error(`Score must be between 0 and ${selectedSubmission.total_marks || 100}`)
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          score: numScore,
          feedback: feedback,
          status: 'graded',
          graded_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id)

      if (error) throw error

      // Send notification to student
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.student_id,
        title: `📝 Assignment Graded: ${selectedSubmission.assignment_title}`,
        message: `You received ${numScore}/${selectedSubmission.total_marks || 100} on your assignment.${feedback ? ` Feedback: ${feedback}` : ''}`,
        type: 'grade',
        link: '/student/assignments',
        created_at: new Date().toISOString(),
        read: false
      })

      toast.success('Assignment graded successfully!')
      setSelectedSubmission(null)
      setScore('')
      setFeedback('')
      loadSubmissions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to grade')
    } finally {
      setSubmitting(false)
    }
  }

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    graded: submissions.filter(s => s.status === 'graded').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Link href="/staff" className="hover:text-primary flex items-center gap-1">
            <Home className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/staff/assignments" className="hover:text-primary">Assignments</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Grade Submissions</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/staff/assignments')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignments
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Grade Submissions</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Review and grade student submissions from your assignments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">Graded</p>
                <p className="text-2xl font-bold text-green-700">{stats.graded}</p>
              </div>
              <Award className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="graded">Graded ({stats.graded})</TabsTrigger>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by student name, assignment, or class..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-9 bg-white h-10" 
          />
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredSubmissions.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No submissions found</p>
              <p className="text-sm text-slate-400 mt-1">
                {activeTab === 'pending' ? 'No pending submissions to grade' : 
                 activeTab === 'graded' ? 'No graded submissions yet' : 
                 'No submissions from your assignments'}
              </p>
              {activeTab !== 'all' && stats.total > 0 && (
                <Button variant="link" onClick={() => setActiveTab('all')} className="mt-2">
                  View all submissions
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((sub, index) => (
            <Card key={sub.id} className={cn(
              "border shadow-sm bg-white hover:shadow-md transition-shadow",
              sub.status === 'submitted' && "border-l-4 border-l-yellow-500"
            )}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm sm:text-base">{sub.student_name}</h3>
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        <User className="h-3 w-3 mr-1" />
                        {sub.student_class}
                      </Badge>
                      <Badge className={cn(
                        "text-[10px] sm:text-xs",
                        sub.status === 'graded' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {sub.status === 'graded' ? '✓ Graded' : '⏳ Pending'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {sub.assignment_title}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{sub.assignment_subject}</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {sub.total_marks} marks
                      </span>
                    </p>
                    
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      Submitted: {format(new Date(sub.submitted_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                    
                    {sub.status === 'graded' && sub.score !== undefined && (
                      <p className="text-sm font-bold text-green-600 mt-2">
                        Score: {sub.score}/{sub.total_marks}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(sub.file_url, '_blank')}
                      className="h-9 text-xs"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> 
                      View File
                    </Button>
                    <Button 
                      size="sm" 
                      className={cn(
                        "h-9 text-xs",
                        sub.status === 'graded' ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                      )}
                      onClick={() => {
                        setSelectedSubmission(sub)
                        setScore(sub.score?.toString() || '')
                        setFeedback(sub.feedback || '')
                      }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      {sub.status === 'graded' ? 'Re-grade' : 'Grade'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Grade Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Grade Submission</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(null)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-1 mb-4">
              <p className="text-sm font-medium">{selectedSubmission.student_name}</p>
              <p className="text-xs text-slate-500">{selectedSubmission.assignment_title} • {selectedSubmission.assignment_subject}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Score (max {selectedSubmission.total_marks})</Label>
                <Input 
                  type="number" 
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  placeholder={`0-${selectedSubmission.total_marks}`}
                  min={0} 
                  max={selectedSubmission.total_marks} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Feedback (optional)</Label>
                <Textarea 
                  value={feedback} 
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Enter feedback for the student..." 
                  rows={3} 
                  className="mt-1 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                Cancel
              </Button>
              <Button onClick={handleGrade} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Submit Grade
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}