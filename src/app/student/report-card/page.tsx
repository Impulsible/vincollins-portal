// app/student/report-card/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, FileText, Printer, ArrowLeft } from 'lucide-react'
import { ReportCardTemplate } from '@/components/shared/ReportCardTemplate'

export default function StudentReportCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [reportCard, setReportCard] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadReportCard() }, [])

  const loadReportCard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/portal'; return }

      const { data: pd } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!pd) { window.location.href = '/portal'; return }
      setProfile(pd)

      const { data: cards } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', pd.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)

      if (cards && cards.length > 0) {
        setReportCard(cards[0])
      } else {
        setError('No published report card found.')
      }
    } catch (error) {
      setError('Failed to load report card')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header onLogout={async () => { await supabase.auth.signOut(); window.location.href = '/portal' }} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
            <p className="mt-3 text-sm text-slate-500">Loading report card...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !reportCard) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header user={{ id: profile?.id || '', name: profile?.full_name || '', email: profile?.email || '', role: 'student', isAuthenticated: true }} onLogout={async () => { await supabase.auth.signOut(); window.location.href = '/portal' }} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <Card className="max-w-md w-full border-0 shadow-sm">
            <CardContent className="text-center py-10">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-1">Report Card Not Available</h3>
              <p className="text-sm text-slate-500 mb-6">{error || 'Your report card will appear here once published.'}</p>
              <Button onClick={() => router.push('/student')} size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Convert report card data to the template format
  const templateData = {
    student_name: reportCard.student_name,
    admission_number: reportCard.admission_number || '—',
    class: reportCard.class,
    dob: reportCard.dob || '—',
    gender: reportCard.gender || '—',
    term: reportCard.term,
    academic_year: reportCard.academic_year,
    next_term_begins: reportCard.next_term_begins || '—',
    total_days: reportCard.total_days || 100,
    days_present: reportCard.days_present || 100,
    subject_scores: reportCard.subjects_data || reportCard.subject_scores || [],
    average_score: reportCard.average_score,
    total_score: reportCard.total_score,
    grade: reportCard.grade,
    remarks: reportCard.remarks || '—',
    behavior_ratings: reportCard.behavior_ratings || [],
    skill_ratings: reportCard.skill_ratings || [],
    teacher_comments: reportCard.teacher_comments || '',
    principal_comments: reportCard.principal_comments || '',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={{ id: profile?.id || '', name: profile?.full_name || '', email: profile?.email || '', role: 'student', isAuthenticated: true }} onLogout={async () => { await supabase.auth.signOut(); window.location.href = '/portal' }} />
      <main className="pt-[72px] lg:pt-24 pb-20 px-4">
        <div className="no-print flex justify-between items-center max-w-[210mm] mx-auto mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/student')}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <Button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-900"><Printer className="h-4 w-4 mr-2" />Print</Button>
        </div>
        <ReportCardTemplate data={templateData} />
      </main>
    </div>
  )
}