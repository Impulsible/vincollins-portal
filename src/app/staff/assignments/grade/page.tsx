// app/staff/assignments/grade/page.tsx
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
import { toast } from 'sonner'
import {
  Loader2, ArrowLeft, Home, ChevronRight, Search,
  Download, CheckCircle, XCircle, Eye, FileText, User, Calendar
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

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
}

export default function GradeAssignmentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadSubmissions() }, [])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/portal'); return }

      // Get submissions with pending/graded status
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .in('status', ['submitted', 'graded'])
        .order('submitted_at', { ascending: false })

      if (error) throw error

      // Get assignment details
      const assignmentIds = [...new Set((data || []).map(s => s.assignment_id))]
      const assignmentMap: Record<string, any> = {}
      
      if (assignmentIds.length > 0) {
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id, title, subject, total_marks')
          .in('id', assignmentIds)
        
        assignments?.forEach(a => { assignmentMap[a.id] = a })
      }

      const enriched: Submission[] = (data || []).map(s => ({
        ...s,
        assignment_title: assignmentMap[s.assignment_id]?.title || 'Unknown',
        assignment_subject: assignmentMap[s.assignment_id]?.subject || 'Unknown',
        total_marks: assignmentMap[s.assignment_id]?.total_marks || 100
      }))

      setSubmissions(enriched)
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

    const numScore = parseInt(score)
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

      // Notify student
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.student_id,
        title: '📝 Assignment Graded',
        message: `"${selectedSubmission.assignment_title}" has been graded. Score: ${numScore}/${selectedSubmission.total_marks || 100}`,
        type: 'assignment',
        link: '/student/assignments',
        created_at: new Date().toISOString()
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

  const filtered = submissions.filter(s => {
    const q = searchQuery.toLowerCase()
    return s.student_name?.toLowerCase().includes(q) ||
           s.assignment_title?.toLowerCase().includes(q) ||
           s.student_class?.toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Link href="/staff" className="hover:text-primary flex items-center gap-1"><Home className="h-3.5 w-3.5" /> Dashboard</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/staff/assignments" className="hover:text-primary">Assignments</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Grade</span>
        </div>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Grade Submissions</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Review and grade student submissions</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search by student name, assignment, or class..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-white h-10" />
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No submissions to grade</p>
          </CardContent></Card>
        ) : (
          filtered.map(sub => (
            <Card key={sub.id} className="border shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{sub.student_name}</h3>
                      <Badge variant="outline" className="text-[10px]">{sub.student_class}</Badge>
                      <Badge className={sub.status === 'graded' ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-yellow-100 text-yellow-700 text-[10px]'}>
                        {sub.status === 'graded' ? 'Graded' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {sub.assignment_title} • {sub.assignment_subject} • {sub.total_marks} marks
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      Submitted: {format(new Date(sub.submitted_at), 'MMM dd, yyyy hh:mm a')}
                    </p>
                    {sub.score !== undefined && (
                      <p className="text-sm font-bold text-green-600 mt-1">Score: {sub.score}/{sub.total_marks}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => window.open(sub.file_url, '_blank')}>
                      <Download className="h-3.5 w-3.5 mr-1" /> View File
                    </Button>
                    <Button size="sm" className="bg-emerald-600"
                      onClick={() => {
                        setSelectedSubmission(sub)
                        setScore(sub.score?.toString() || '')
                        setFeedback(sub.feedback || '')
                      }}>
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
            <h3 className="text-lg font-bold mb-4">Grade Submission</h3>
            <p className="text-sm text-slate-600 mb-4">
              {selectedSubmission.student_name} • {selectedSubmission.assignment_title}
            </p>
            
            <div className="space-y-4">
              <div>
                <Label>Score (max {selectedSubmission.total_marks})</Label>
                <Input type="number" value={score}
                  onChange={e => setScore(e.target.value)}
                  placeholder={`0-${selectedSubmission.total_marks}`}
                  min={0} max={selectedSubmission.total_marks} />
              </div>
              <div>
                <Label>Feedback (optional)</Label>
                <Textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                  placeholder="Enter feedback for the student..." rows={3} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Cancel</Button>
              <Button onClick={handleGrade} disabled={submitting} className="bg-emerald-600">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Submit Grade
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}