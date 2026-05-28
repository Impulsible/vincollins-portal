// app/admin/report-cards/view/page.tsx - UPDATED TO READ FROM REPORT_CARDS TABLE

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Printer,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react'

// ============================================
// WAEC GRADING SYSTEM
// ============================================
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

const getOverallGrade = (score: number): string => {
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'P'
  return 'F'
}

const getGradeRemark = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A1': 'Excellent',
    'B2': 'Very Good',
    'B3': 'Good',
    'C4': 'Credit',
    'C5': 'Credit',
    'C6': 'Credit',
    'D7': 'Pass',
    'E8': 'Pass',
    'F9': 'Fail',
  }
  return remarks[grade] || ''
}

const getGradeStyle = (grade: string): string => {
  switch (grade) {
    case 'A1': return 'bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px]'
    case 'B2':
    case 'B3': return 'bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px]'
    case 'C4':
    case 'C5':
    case 'C6': return 'bg-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px]'
    case 'D7':
    case 'E8': return 'bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px]'
    case 'F9': return 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px]'
    default: return 'bg-gray-500 text-white font-bold px-2 py-0.5 rounded text-[10px]'
  }
}

const getOverallGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-emerald-700 font-bold'
    case 'B': return 'text-blue-700 font-bold'
    case 'C': return 'text-cyan-700 font-bold'
    case 'P': return 'text-amber-700 font-bold'
    case 'F': return 'text-red-700 font-bold'
    default: return 'text-gray-700'
  }
}

// ============================================
// AI COMMENT GENERATION (for regeneration only)
// ============================================
const generateAIComments = async (firstName: string, averageScore: number, subjects: any[], className: string, gender: string) => {
  try {
    const response = await fetch('/api/generate-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: firstName,
        averageScore: averageScore,
        subjects: subjects.map(s => ({ name: s.name, score: s.total })),
        className: className,
        gender: gender
      })
    })

    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('API error:', error)
  }
  return null
}

// Fallback comments
const getFallbackTeacherComment = (firstName: string, avg: number, bestSubject: string, bestScore: number, worstSubject: string, worstScore: number, gender: string): string => {
  const pronoun = gender === 'female' ? 'She' : 'He'
  const possessive = gender === 'female' ? 'her' : 'his'
  
  if (avg >= 90) return `Absolutely outstanding, ${firstName}! Scoring ${bestScore}% in ${bestSubject} is remarkable. ${pronoun} has set a very high standard. Keep this exceptional work!`
  if (avg >= 85) return `Excellent performance, ${firstName}! ${possessive} ${bestScore}% in ${bestSubject} is impressive. Keep striving for excellence!`
  if (avg >= 80) return `Excellent work, ${firstName}! ${possessive} performance in ${bestSubject} shows strong understanding and dedication.`
  if (avg >= 75) return `Very good work, ${firstName}! ${pronoun} excelled in ${bestSubject} (${bestScore}%). Focus more on ${worstSubject} (${worstScore}%) to reach even greater heights.`
  if (avg >= 70) return `Good effort, ${firstName}! ${possessive} performance in ${bestSubject} (${bestScore}%) was solid. Keep pushing forward!`
  if (avg >= 65) return `Fair performance, ${firstName}. ${pronoun} did well in ${bestSubject} (${bestScore}%). With more effort in ${worstSubject} (${worstScore}%), improvement is certain.`
  if (avg >= 60) return `Credit level achieved, ${firstName}. ${bestSubject} (${bestScore}%) was ${possessive} strongest subject.`
  if (avg >= 55) return `${firstName}, ${pronoun} narrowly passed. ${bestSubject} (${bestScore}%) was okay, but more effort is needed overall.`
  if (avg >= 50) return `${firstName}, this was a close one. ${possessive} performance in ${bestSubject} (${bestScore}%) helped ${possessive} pass.`
  if (avg >= 40) return `${firstName}, unfortunately ${pronoun} struggled this term. Please see your class teacher for support.`
  return `${firstName}, this is a serious concern. Parent-teacher meeting is required urgently.`
}

const getFallbackPrincipalComment = (avg: number, firstName: string, gender: string): string => {
  const pronoun = gender === 'female' ? 'She' : 'He'
  
  if (avg >= 90) return `Outstanding academic performance. ${pronoun} is promoted with distinction.`
  if (avg >= 85) return `Excellent performance. ${pronoun} is promoted with high honors.`
  if (avg >= 80) return `Excellent performance. ${pronoun} is promoted with honors.`
  if (avg >= 75) return `Very good performance. ${pronoun} is promoted to the next class.`
  if (avg >= 70) return `Good performance. Consistent effort will take ${pronoun} further. Promoted.`
  if (avg >= 65) return `Satisfactory performance. There is room for improvement. Promoted.`
  if (avg >= 60) return `Fair performance. More dedication needed. Promoted.`
  if (avg >= 55) return `Credit performance. ${pronoun} passed but can do better. Promoted.`
  if (avg >= 50) return `${pronoun} passed. Work harder next term. Promoted conditionally.`
  if (avg >= 45) return `A pass. Significant improvement required. Promoted conditionally.`
  if (avg >= 40) return `Poor performance. ${pronoun} must improve significantly next term.`
  return `Failed. ${pronoun} needs to repeat the class or work much harder next term.`
}

// ============================================
// TYPES
// ============================================
interface SubjectData {
  name: string
  ca: number
  exam: number
  total: number
  grade: string
  remark: string
}

interface ReportCardData {
  id: string
  student_id: string
  student_name: string
  student_first_name: string
  student_vin: string
  student_admission_number?: string
  student_photo_url?: string
  class: string
  term: string
  academic_year: string
  subjects_data: SubjectData[]
  average_score: number
  total_score: number
  grade: string
  teacher_comments: string
  principal_comments: string
  behavior_ratings?: { name: string; rating: number }[]
  skill_ratings?: { name: string; rating: number }[]
  status: string
  generated_at?: string
  next_term_begins?: string
}

interface SchoolSettings {
  name: string
  address: string
  phone: string
  email: string
  logo_url?: string
  motto?: string
}

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border border-gray-300 mb-2">
    <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">{title}</div>
    <div className="p-2 text-[10px]">{children}</div>
  </div>
)

const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  name: 'VINCOLLINS COLLEGE',
  address: '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  email: 'vincollinscollege@gmail.com',
  motto: 'Geared Towards Excellence',
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ViewReportCardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const studentId = searchParams.get('student')
  const term = searchParams.get('term') || 'third'
  const year = searchParams.get('year') || '2025/2026'

  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS)
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null)
  const [nextTermDate, setNextTermDate] = useState<string>('')
  const [studentGender, setStudentGender] = useState<string>('male')

  const loadNextTermDate = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'next_term_date')
        .maybeSingle()

      if (data?.value) {
        setNextTermDate(data.value)
      }
    } catch (error) {
      console.error('Error loading next term date:', error)
    }
  }, [])

  useEffect(() => {
    const handleDateUpdate = (event: CustomEvent) => {
      setNextTermDate(event.detail.date)
      toast.info('Next term date has been updated', { duration: 3000 })
      loadReportCard()
    }

    window.addEventListener('next-term-date-updated', handleDateUpdate as EventListener)
    return () => window.removeEventListener('next-term-date-updated', handleDateUpdate as EventListener)
  }, [])

  const generateRatings = (averageScore: number) => {
    const getRating = (base: number): number => {
      if (averageScore >= 90) return Math.min(5, base + 1)
      if (averageScore >= 80) return base
      if (averageScore >= 70) return Math.max(3, base)
      if (averageScore >= 60) return Math.max(2, base - 1)
      return Math.max(1, base - 2)
    }

    return {
      behaviorRatings: [
        { name: 'Honesty', rating: getRating(4) },
        { name: 'Neatness', rating: getRating(4) },
        { name: 'Obedience', rating: getRating(4) },
        { name: 'Orderliness', rating: getRating(3) },
        { name: 'Diligence', rating: getRating(4) },
        { name: 'Punctuality', rating: getRating(4) },
        { name: 'Leadership', rating: getRating(3) },
        { name: 'Politeness', rating: getRating(4) },
      ],
      skillRatings: [
        { name: 'Handwriting', rating: getRating(4) },
        { name: 'Verbal Fluency', rating: getRating(4) },
        { name: 'Sports', rating: getRating(3) },
        { name: 'Handling Tools', rating: getRating(3) },
        { name: 'Club Activities', rating: getRating(4) },
      ]
    }
  }

  // ✅ FIXED: Load report card from report_cards table, NOT from ca_scores
  const loadReportCard = useCallback(async () => {
    setLoading(true)

    try {
      // Get student profile first
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError

      const gender = studentData?.gender || 'male'
      setStudentGender(gender)

      const fullName = studentData?.display_name || studentData?.full_name || 'Student'
      const firstName = fullName.split(' ')[0] || fullName

      // ✅ Load from report_cards table
      const { data: reportCardData, error: reportCardError } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('academic_year', year)
        .maybeSingle()

      if (reportCardError || !reportCardData) {
        toast.error('No report card found for this student')
        router.back()
        return
      }

      // Format subjects data for display (ensure ca and exam are proper numbers)
      const formattedSubjects = (reportCardData.subjects_data || []).map((subject: any) => ({
        name: subject.name,
        ca: subject.ca || subject.ca1 + subject.ca2 || 0,
        exam: subject.exam || subject.examObj + subject.examTheory || 0,
        total: subject.total || 0,
        grade: subject.grade || getWAECGrade(subject.total || 0),
        remark: subject.remark || getGradeRemark(subject.grade || getWAECGrade(subject.total || 0))
      }))

      const termLabels: Record<string, string> = {
        first: 'First Term',
        second: 'Second Term',
        third: 'Third Term',
      }

      setReportCard({
        id: reportCardData.id,
        student_id: studentId!,
        student_name: fullName,
        student_first_name: firstName,
        student_vin: studentData?.vin_id || '—',
        student_admission_number: studentData?.admission_number || '—',
        student_photo_url: studentData?.photo_url || null,
        class: reportCardData.class || studentData?.class || '—',
        term: termLabels[term] || term,
        academic_year: year,
        subjects_data: formattedSubjects,
        average_score: reportCardData.average_score || 0,
        total_score: reportCardData.total_score || 0,
        grade: reportCardData.grade || getOverallGrade(reportCardData.average_score || 0),
        teacher_comments: reportCardData.teacher_comments || 'No comment available.',
        principal_comments: reportCardData.principal_comments || 'No comment available.',
        behavior_ratings: generateRatings(reportCardData.average_score || 0).behaviorRatings,
        skill_ratings: generateRatings(reportCardData.average_score || 0).skillRatings,
        status: reportCardData.status,
        next_term_begins: nextTermDate,
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to load report card')
    } finally {
      setLoading(false)
    }
  }, [studentId, term, year, nextTermDate, router])

  // Regenerate just the comments and update the database
  const handleRegenerateComments = async () => {
    if (!reportCard) return
    
    setRegenerating(true)
    try {
      const aiComments = await generateAIComments(
        reportCard.student_first_name,
        reportCard.average_score,
        reportCard.subjects_data,
        reportCard.class,
        studentGender
      )
      
      if (aiComments) {
        // Update the report card in the database
        const { error } = await supabase
          .from('report_cards')
          .update({
            teacher_comments: aiComments.teacher_comment,
            principal_comments: aiComments.principal_comment
          })
          .eq('id', reportCard.id)

        if (error) throw error

        // Update local state
        setReportCard({
          ...reportCard,
          teacher_comments: aiComments.teacher_comment,
          principal_comments: aiComments.principal_comment
        })
        toast.success('Comments regenerated and saved successfully!')
      } else {
        toast.error('Failed to regenerate comments')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to regenerate comments')
    } finally {
      setRegenerating(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/portal')
        return
      }

      const { data: schoolData } = await supabase
        .from('school_settings')
        .select('*')
        .maybeSingle()

      if (schoolData) {
        setSchoolSettings({
          name: schoolData.school_name || DEFAULT_SCHOOL_SETTINGS.name,
          address: schoolData.address || DEFAULT_SCHOOL_SETTINGS.address,
          phone: schoolData.school_phone || DEFAULT_SCHOOL_SETTINGS.phone,
          email: schoolData.school_email || DEFAULT_SCHOOL_SETTINGS.email,
          logo_url: schoolData.logo_path,
          motto: schoolData.school_motto || DEFAULT_SCHOOL_SETTINGS.motto,
        })
      }

      await loadNextTermDate()
      
      if (studentId) {
        await loadReportCard()
      }
    }

    init()
  }, [studentId, term, year])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const displaySubjects = reportCard?.subjects_data || []
  const termDisplay = reportCard?.term || term
  const formattedNextTermDate = reportCard?.next_term_begins 
    ? new Date(reportCard.next_term_begins).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'To be announced'

  return (
    <div className="bg-gray-100 min-h-screen py-4">

      {/* TOPBAR */}
      <div className="no-print max-w-[210mm] mx-auto mb-3 flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReportCard}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRegenerateComments}
            disabled={regenerating}
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Regenerate Comments
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* REPORT CARD */}
      <div className="bg-white w-[210mm] min-h-[297mm] mx-auto text-[11px] text-black border border-gray-300 p-3 print:p-0 print:border-none">

        {/* HEADER */}
        <div className="border-b border-gray-300 pb-2 print:pb-1">
          <div className="flex items-start justify-between">

            {/* LOGO */}
            <div className="w-16 print:w-12">
              {schoolSettings.logo_url && (
                <img src={schoolSettings.logo_url} alt="logo" className="w-14 h-14 object-contain print:w-10 print:h-10" />
              )}
            </div>

            {/* SCHOOL INFO */}
            <div className="flex-1 text-center">
              <h1 className="text-[18px] font-bold uppercase text-blue-900 print:text-[14px]">
                {schoolSettings.name}
              </h1>
              <p className="text-[10px] print:text-[8px]">{schoolSettings.address}</p>
              <p className="text-[10px] print:text-[8px]">Tel: {schoolSettings.phone}</p>
              <p className="text-[10px] print:text-[8px]">Email: {schoolSettings.email}</p>
              <p className="text-[9px] italic text-amber-600 mt-1 print:text-[7px]">"{schoolSettings.motto}"</p>
              <h2 className="font-bold mt-2 text-[14px] print:text-[11px]">
                {termDisplay} Student&apos;s Performance Report
              </h2>
            </div>

            {/* PHOTO */}
            <div className="w-20 h-24 border border-gray-300 print:w-16 print:h-20">
              {reportCard?.student_photo_url ? (
                <img src={reportCard.student_photo_url} alt="student" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100" />
              )}
            </div>
          </div>
        </div>

        {/* STUDENT INFO */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] mt-2 mb-3 print:mt-1 print:mb-2 print:text-[9px]">
          <div className="flex"><span className="font-bold w-32">Name:</span><span>{reportCard?.student_name}</span></div>
          <div className="flex"><span className="font-bold w-32">Admission No:</span><span>{reportCard?.student_admission_number}</span></div>
          <div className="flex"><span className="font-bold w-32">Class:</span><span>{reportCard?.class}</span></div>
          <div className="flex"><span className="font-bold w-32">Term:</span><span>{termDisplay}</span></div>
          <div className="flex"><span className="font-bold w-32">Session:</span><span>{reportCard?.academic_year}</span></div>
          <div className="flex"><span className="font-bold w-32">Next Term:</span><span>{formattedNextTermDate}</span></div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-3">

          {/* LEFT COLUMN - ACADEMIC RESULTS */}
          <div>

            {/* SUBJECT TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-[10px] print:text-[8px] min-w-[500px]">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="border px-2 py-1 text-left">Subjects</th>
                    <th className="border px-2 py-1 text-center w-16">CA</th>
                    <th className="border px-2 py-1 text-center w-16">Exam</th>
                    <th className="border px-2 py-1 text-center w-16">Total</th>
                    <th className="border px-2 py-1 text-center w-14">Grade</th>
                    <th className="border px-2 py-1 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {displaySubjects.map((subject) => (
                    <tr key={subject.name} className="hover:bg-gray-50">
                      <td className="border px-2 py-1">{subject.name}</td>
                      <td className="border text-center font-mono">{subject.ca}</td>
                      <td className="border text-center font-mono">{subject.exam}</td>
                      <td className="border text-center font-bold font-mono">{subject.total}</td>
                      <td className="border text-center">
                        <span className={getGradeStyle(subject.grade)}>{subject.grade}</span>
                      </td>
                      <td className="border px-2 py-1">{subject.remark}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan={3} className="border px-2 py-1 text-right">TOTAL / AVERAGE:</td>
                    <td className="border text-center">{reportCard?.total_score}</td>
                    <td className="border text-center">
                      <span className={getOverallGradeColor(reportCard?.grade || '—')}>{reportCard?.grade || '—'}</span>
                    </td>
                    <td className="border text-center">{reportCard?.average_score}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* CLASS TEACHER'S REMARK */}
            <div className="mt-3 border border-gray-300">
              <div className="bg-purple-600 text-white px-2 py-1 text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                CLASS TEACHER'S REMARK (AI-Generated)
              </div>
              <div className="p-2 text-[10px] italic leading-relaxed bg-purple-50">
                {reportCard?.teacher_comments || 'No comment available.'}
              </div>
            </div>

            {/* PRINCIPAL'S REMARK */}
            <div className="mt-2 border border-gray-300">
              <div className="bg-blue-600 text-white px-2 py-1 text-[10px] font-bold">
                PRINCIPAL'S REMARK
              </div>
              <div className="p-2 text-[10px] italic leading-relaxed">
                {reportCard?.principal_comments || 'No comment available.'}
              </div>
            </div>

            {/* GRADE SCALE */}
            <div className="mt-3">
              <div className="bg-blue-600 text-white text-[10px] px-2 py-1 font-bold">Grade Scale (WAEC)</div>
              <div className="border border-gray-300 p-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[9px]">
                  <div><span className={getGradeStyle('A1')}>A1</span> 75-100</div>
                  <div><span className={getGradeStyle('B2')}>B2</span> 70-74</div>
                  <div><span className={getGradeStyle('B3')}>B3</span> 65-69</div>
                  <div><span className={getGradeStyle('C4')}>C4</span> 60-64</div>
                  <div><span className={getGradeStyle('C5')}>C5</span> 55-59</div>
                  <div><span className={getGradeStyle('C6')}>C6</span> 50-54</div>
                  <div><span className={getGradeStyle('D7')}>D7</span> 45-49</div>
                  <div><span className={getGradeStyle('E8')}>E8</span> 40-44</div>
                  <div><span className={getGradeStyle('F9')}>F9</span> 0-39</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - PSYCHOMOTOR & SKILLS */}
          <div>

            {/* PERFORMANCE SUMMARY */}
            <Panel title="Performance Summary">
              <div className="space-y-1">
                <div className="flex justify-between"><span>Total Score</span><span className="font-bold">{reportCard?.total_score}</span></div>
                <div className="flex justify-between"><span>Average</span><span className="font-bold">{reportCard?.average_score}%</span></div>
                <div className="flex justify-between">
                  <span>Grade</span>
                  <span className={getOverallGradeColor(reportCard?.grade || '—')}>{reportCard?.grade || '—'}</span>
                </div>
              </div>
            </Panel>

            {/* AFFECTIVE DOMAIN */}
            <Panel title="Affective Domain">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-[10px]">
                  <tbody>
                    {reportCard?.behavior_ratings?.map((item) => (
                      <tr key={item.name}>
                        <td className="border px-1 py-1">{item.name}</td>
                        <td className="border text-center w-12 font-bold">{item.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* PSYCHOMOTOR SKILLS */}
            <Panel title="Psychomotor Skills">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-[10px]">
                  <tbody>
                    {reportCard?.skill_ratings?.map((item) => (
                      <tr key={item.name}>
                        <td className="border px-1 py-1">{item.name}</td>
                        <td className="border text-center w-12 font-bold">{item.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* RATING KEY */}
            <Panel title="Key To Ratings">
              <div className="space-y-1 text-[9px]">
                <div>5 - Excellent</div>
                <div>4 - Very Good</div>
                <div>3 - Good</div>
                <div>2 - Fair</div>
                <div>1 - Poor</div>
              </div>
            </Panel>

          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-300 mt-4 pt-2 text-center text-[9px] text-gray-500 print:mt-2 print:pt-1 print:text-[7px]">
          Powered by Vincollins Portal | {schoolSettings.motto}
        </div>

      </div>

      {/* PRINT CSS */}
      <style jsx global>{`
        @media print {
          body { 
            background: white; 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .no-print { 
            display: none !important; 
          }
          @page { 
            size: A4 portrait; 
            margin: 0.5cm;
          }
          .bg-blue-600, .bg-purple-600 {
            background-color: #1e40af !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .border {
            border-color: #000 !important;
          }
        }
      `}</style>
    </div>
  )
}