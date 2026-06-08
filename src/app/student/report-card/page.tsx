'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Printer, Download, FileText, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// ============================================
// WAEC/NECO STANDARD SUBJECT ORDERING
// ============================================
const SUBJECT_ORDER: Record<string, number> = {
  'English Language': 1, 'English Studies': 1, 'Mathematics': 2,
  'Physics': 3, 'Chemistry': 4, 'Further Mathematics': 5, 'Basic Science': 6,
  'Biology': 7, 'Agricultural Science': 8, 'Basic Technology': 9,
  'Economics': 10, 'Geography': 11, 'Social Studies': 12, 'Civic Education': 13,
  'Government': 14, 'History': 15, 'Commerce': 16, 'Financial Accounting': 17,
  'Business Studies': 18, 'Literature in English': 19, 'CRS': 20, 'CCA': 21,
  'Creative Arts': 21, 'Music': 22, 'Yoruba': 23, 'French': 23,
  'Data Processing': 24, 'Information Technology': 25, 'Home Economics': 26,
  'PHE': 27, 'Physical Education': 27, 'Security Education': 28
}

const sortSubjectsByOrder = (subjects: any[]) => {
  return [...subjects].sort((a, b) => {
    const orderA = SUBJECT_ORDER[a.name] || 999
    const orderB = SUBJECT_ORDER[b.name] || 999
    return orderA - orderB
  })
}

const getGradeStyle = (grade: string): string => {
  switch (grade) {
    case 'A1': return 'bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'B2':
    case 'B3': return 'bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'C4':
    case 'C5':
    case 'C6': return 'bg-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'D7':
    case 'E8': return 'bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    case 'F9': return 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
    default: return 'bg-gray-500 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block'
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

interface SubjectScore {
  name: string
  ca: number
  exam: number
  total: number
  grade: string
  remark: string
}

interface ReportCard {
  id: string
  student_id: string
  student_name: string
  student_admission_number?: string
  student_photo_url?: string
  class: string
  term: string
  academic_year: string
  subjects_data: SubjectScore[]
  average_score: number
  total_score: number
  grade: string
  teacher_comments: string
  principal_comments: string
  status: string
  generated_at: string
  next_term_begins?: string
  behavior_ratings?: { name: string; rating: number }[]
  skill_ratings?: { name: string; rating: number }[]
}

interface SchoolSettings {
  name: string
  address: string
  phone: string
  email: string
  logo_url?: string
  motto?: string
}

interface StudentProfile {
  id: string
  full_name: string
  display_name: string
  admission_number: string
  photo_url: string
  class: string
  gender: string
}

const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  name: 'VINCOLLINS COLLEGE',
  address: '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  email: 'vincollinscollege@gmail.com',
  motto: 'Geared Towards Excellence',
}

const TERMS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const YEARS = ['2025/2026', '2026/2027', '2027/2028', '2028/2029']

const getTermLabel = (term: string): string => {
  const found = TERMS.find(t => t.value === term)
  return found?.label || 'Third Term'
}

export default function StudentReportCardPage() {
  const router = useRouter()
  const reportCardRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [selectedReportCard, setSelectedReportCard] = useState<ReportCard | null>(null)
  const [selectedTerm, setSelectedTerm] = useState('third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS)
  const [nextTermDate, setNextTermDate] = useState<string>('')
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)

  useEffect(() => {
    const init = async () => {
      await loadSchoolSettings()
      await loadNextTermDate()
      await loadStudentProfile()
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedTerm && selectedYear && studentProfile) {
      loadReportCards()
    }
  }, [selectedTerm, selectedYear, studentProfile])

  const loadSchoolSettings = async () => {
    const { data } = await supabase.from('school_settings').select('*').maybeSingle()
    if (data) {
      setSchoolSettings({
        name: data.school_name || DEFAULT_SCHOOL_SETTINGS.name,
        address: data.school_address || DEFAULT_SCHOOL_SETTINGS.address,
        phone: data.school_phone || DEFAULT_SCHOOL_SETTINGS.phone,
        email: data.school_email || DEFAULT_SCHOOL_SETTINGS.email,
        logo_url: data.logo_path,
        motto: data.school_motto || DEFAULT_SCHOOL_SETTINGS.motto,
      })
    }
  }

  const loadNextTermDate = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'next_term_date')
        .maybeSingle()
      if (data?.value) setNextTermDate(data.value)
    } catch (error) {
      console.error('Error loading next term date:', error)
    }
  }

  const loadStudentProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, admission_number, photo_url, class, gender')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setStudentProfile({
        id: data.id,
        full_name: data.full_name || '',
        display_name: data.display_name || '',
        admission_number: data.admission_number || '',
        photo_url: data.photo_url || '',
        class: data.class || '',
        gender: data.gender || 'male',
      })
    } catch (error) {
      console.error('Error loading student profile:', error)
    }
  }

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

  const loadReportCards = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal')
        return
      }

      const { data, error } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', user.id)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .eq('status', 'published')
        .order('generated_at', { ascending: false })

      if (error) throw error

      const ratings = generateRatings(data?.[0]?.average_score || 0)

      const cards = (data || []).map((card: any) => ({
        ...card,
        student_name: studentProfile?.display_name || studentProfile?.full_name || card.student_name || 'Student',
        student_admission_number: studentProfile?.admission_number || card.student_admission_number,
        student_photo_url: studentProfile?.photo_url || card.student_photo_url,
        class: studentProfile?.class || card.class,
        behavior_ratings: card.assessment_data?.behaviorRatings || ratings.behaviorRatings,
        skill_ratings: card.assessment_data?.skillRatings || ratings.skillRatings,
        next_term_begins: nextTermDate,
      }))

      setReportCards(cards)
      if (cards.length > 0) {
        setSelectedReportCard(cards[0])
      } else {
        setSelectedReportCard(null)
      }
    } catch (error) {
      console.error('Error loading report cards:', error)
      toast.error('Failed to load report cards')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!reportCardRef.current || !selectedReportCard) return

    setDownloading(true)
    toast.info('Generating PDF...')

    try {
      const element = reportCardRef.current
      
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST')
      pdf.save(`Report_Card_${selectedReportCard.student_name}_${getTermLabel(selectedReportCard.term)}_${selectedReportCard.academic_year}.pdf`)
      
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleRefresh = () => {
    loadReportCards()
    toast.success('Refreshed!')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500 animate-pulse">Loading your report card...</p>
      </div>
    )
  }

  const formattedNextTermDate = nextTermDate 
    ? new Date(nextTermDate).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'To be announced'

  // No report card found - show message with selectors
  if (reportCards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-4 pb-32">
        {/* Top Bar */}
        <div className="no-print sticky top-0 z-10 bg-gray-100 border-b border-gray-200 shadow-sm">
          <div className="max-w-[210mm] mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-12"></div>

        <div className="max-w-[210mm] mx-auto px-4">
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No Report Card Available</h3>
              <p className="text-sm text-slate-500">
                Your report card for {getTermLabel(selectedTerm)} {selectedYear} is not yet available.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Try selecting a different term or academic year using the selectors below.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Floating Action Buttons - Always visible even when no report card */}
        <div className="no-print fixed bottom-6 left-0 right-0 flex justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 border border-gray-200">
            {/* Term Selector */}
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="h-8 text-xs w-[130px] rounded-full border-gray-300">
                <SelectValue placeholder="Select Term" />
              </SelectTrigger>
              <SelectContent>
                {TERMS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            
            {/* Year Selector */}
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 text-xs w-[140px] rounded-full border-gray-300">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )
  }

  const displaySubjects = sortSubjectsByOrder(selectedReportCard?.subjects_data || [])
  const overallGrade = selectedReportCard?.grade || 
    (selectedReportCard?.average_score ? 
      (selectedReportCard.average_score >= 80 ? 'A' : 
       selectedReportCard.average_score >= 70 ? 'B' : 
       selectedReportCard.average_score >= 60 ? 'C' : 
       selectedReportCard.average_score >= 50 ? 'P' : 'F') : '—')
  
  const formattedAvg = selectedReportCard?.average_score?.toFixed(2) || '0'

  const bestSubject = displaySubjects.length > 0 
    ? displaySubjects.reduce((a, b) => a.total > b.total ? a : b) 
    : null
  const worstSubject = displaySubjects.length > 0 
    ? displaySubjects.reduce((a, b) => a.total < b.total ? a : b) 
    : null

  const behaviorRatings = selectedReportCard?.behavior_ratings || [
    { name: 'Honesty', rating: 4 }, { name: 'Neatness', rating: 4 },
    { name: 'Obedience', rating: 4 }, { name: 'Orderliness', rating: 3 },
    { name: 'Diligence', rating: 4 }, { name: 'Punctuality', rating: 4 },
    { name: 'Leadership', rating: 3 }, { name: 'Politeness', rating: 4 },
  ]

  const skillRatings = selectedReportCard?.skill_ratings || [
    { name: 'Handwriting', rating: 4 }, { name: 'Verbal Fluency', rating: 4 },
    { name: 'Sports', rating: 3 }, { name: 'Handling Tools', rating: 3 },
    { name: 'Club Activities', rating: 4 },
  ]

  return (
    <div className="bg-gray-100 min-h-screen overflow-y-auto pb-32">
      {/* Top Bar - Only Back button */}
      <div className="no-print sticky top-0 z-10 bg-gray-100 border-b border-gray-200 shadow-sm">
        <div className="max-w-[210mm] mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Extra spacing div to push report card down from page header */}
      <div className="pt-12 print:pt-0"></div>

      {/* Report Card Container */}
      <div className="print:pt-0">
        <div 
          ref={reportCardRef}
          className="bg-white mx-auto text-black w-[210mm] min-h-[297mm] p-6 print:p-6 shadow-lg print:shadow-none"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {/* Header Section */}
          <div className="border-b-2 border-gray-300 pb-6 mb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="w-20 flex-shrink-0">
                {schoolSettings.logo_url && (
                  <img src={schoolSettings.logo_url} alt="logo" className="w-16 h-16 object-contain" />
                )}
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-xl font-bold uppercase text-blue-900 mb-1">{schoolSettings.name}</h1>
                <p className="text-[10px] text-gray-600">{schoolSettings.address}</p>
                <p className="text-[10px] text-gray-600">Tel: {schoolSettings.phone} | Email: {schoolSettings.email}</p>
                <p className="text-[9px] italic text-amber-600 mt-1">"{schoolSettings.motto}"</p>
                <h2 className="font-bold text-base mt-3 text-blue-800">
                  {getTermLabel(selectedReportCard?.term || selectedTerm)} Student&apos;s Performance Report
                </h2>
                <p className="text-[10px] mt-1 font-semibold">Academic Session: {selectedReportCard?.academic_year || selectedYear}</p>
              </div>
              <div className="w-20 h-24 border border-gray-300 rounded overflow-hidden flex-shrink-0">
                {selectedReportCard?.student_photo_url || studentProfile?.photo_url ? (
                  <img 
                    src={selectedReportCard?.student_photo_url || studentProfile?.photo_url} 
                    alt="student" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">Photo</div>
                )}
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="bg-blue-50 p-3 rounded-md mb-5 text-[11px]">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-bold">Student Name:</span> {selectedReportCard?.student_name}</div>
              <div><span className="font-bold">Admission No:</span> {selectedReportCard?.student_admission_number || studentProfile?.admission_number || '—'}</div>
              <div><span className="font-bold">Class:</span> {selectedReportCard?.class || studentProfile?.class || '—'}</div>
              <div><span className="font-bold">Term:</span> {getTermLabel(selectedReportCard?.term || selectedTerm)}</div>
              <div><span className="font-bold">Session:</span> {selectedReportCard?.academic_year || selectedYear}</div>
              <div><span className="font-bold">Next Term Begins:</span> {formattedNextTermDate}</div>
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="flex gap-5">
            {/* LEFT COLUMN - Subjects Table and Remarks */}
            <div className="flex-1">
              <table className="w-full border-collapse border border-gray-300 text-[10px]">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-blue-500 px-2 py-1.5 text-left">Subjects</th>
                    <th className="border border-blue-500 px-2 py-1.5 text-center w-12">CA</th>
                    <th className="border border-blue-500 px-2 py-1.5 text-center w-12">Exam</th>
                    <th className="border border-blue-500 px-2 py-1.5 text-center w-12">Total</th>
                    <th className="border border-blue-500 px-2 py-1.5 text-center w-10">Grade</th>
                    <th className="border border-blue-500 px-2 py-1.5 text-left">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {displaySubjects.map((subject, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1.5">{subject.name}</td>
                      <td className="border border-gray-300 text-center">{subject.ca}</td>
                      <td className="border border-gray-300 text-center">{subject.exam}</td>
                      <td className="border border-gray-300 text-center font-bold">{subject.total}</td>
                      <td className="border border-gray-300 text-center">
                        <span className={getGradeStyle(subject.grade)}>{subject.grade}</span>
                      </td>
                      <td className="border border-gray-300 px-2 py-1.5">{subject.remark}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan={3} className="border border-gray-300 px-2 py-1.5 text-right">TOTAL / AVERAGE:</td>
                    <td className="border border-gray-300 text-center">{selectedReportCard?.total_score || 0}</td>
                    <td className="border border-gray-300 text-center">
                      <span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span>
                    </td>
                    <td className="border border-gray-300 text-center">{formattedAvg}%</td>
                  </tr>
                </tfoot>
              </table>

              {/* Teacher and Principal Remarks */}
              <div className="mt-4 space-y-2">
                <div className="border-l-4 border-purple-500 bg-purple-50 p-2 text-[10px]">
                  <div className="font-bold text-purple-700 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> CLASS TEACHER&apos;S REMARK
                  </div>
                  <p className="italic">{selectedReportCard?.teacher_comments || 'No comment available.'}</p>
                </div>
                <div className="border-l-4 border-blue-500 bg-blue-50 p-2 text-[10px]">
                  <div className="font-bold text-blue-700 mb-1">PRINCIPAL&apos;S REMARK</div>
                  <p className="italic">{selectedReportCard?.principal_comments || 'No comment available.'}</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Stats, Ratings, and Grade Scale */}
            <div className="w-56 flex-shrink-0 space-y-3">
              {/* Performance Summary */}
              <div className="border border-gray-300">
                <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">Performance Summary</div>
                <div className="p-2 text-[10px] space-y-1">
                  <div className="flex justify-between"><span>Total Score:</span><span className="font-bold">{selectedReportCard?.total_score || 0}</span></div>
                  <div className="flex justify-between"><span>Average:</span><span className="font-bold">{formattedAvg}%</span></div>
                  <div className="flex justify-between"><span>Grade:</span><span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span></div>
                  <div className="flex justify-between"><span>Subjects:</span><span className="font-bold">{displaySubjects.length}</span></div>
                  {bestSubject && (
                    <div className="flex justify-between text-emerald-600 pt-1 border-t"><span>Best:</span><span className="font-bold">{bestSubject.name} ({bestSubject.total})</span></div>
                  )}
                  {worstSubject && worstSubject.total < 50 && (
                    <div className="flex justify-between text-red-600"><span>Improve:</span><span className="font-bold">{worstSubject.name}</span></div>
                  )}
                </div>
              </div>

              {/* Grade Scale */}
              <div className="border border-gray-300">
                <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 uppercase">Grade Scale</div>
                <div className="p-2 text-[8px] grid grid-cols-2 gap-x-2 gap-y-0.5">
                  <div>A1: 75-100%</div><div>B2: 70-74%</div>
                  <div>B3: 65-69%</div><div>C4: 60-64%</div>
                  <div>C5: 55-59%</div><div>C6: 50-54%</div>
                  <div>D7: 45-49%</div><div>E8: 40-44%</div>
                  <div>F9: 0-39%</div>
                </div>
              </div>

              {/* Affective Domain - Ratings as simple numbers */}
              <div className="border border-gray-300">
                <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 uppercase">Affective Domain</div>
                <div className="p-2 text-[9px] space-y-0.5">
                  {behaviorRatings.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span>{item.name}</span>
                      <span className="font-bold text-blue-600">{item.rating}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Psychomotor Skills - Ratings as simple numbers */}
              <div className="border border-gray-300">
                <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 uppercase">Psychomotor Skills</div>
                <div className="p-2 text-[9px] space-y-0.5">
                  {skillRatings.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span>{item.name}</span>
                      <span className="font-bold text-green-600">{item.rating}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Key */}
              <div className="border border-gray-300">
                <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 uppercase">Rating Key</div>
                <div className="p-2 text-[8px] space-y-0.5">
                  <div>5 - Excellent</div>
                  <div>4 - Very Good</div>
                  <div>3 - Good</div>
                  <div>2 - Fair</div>
                  <div>1 - Poor</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-300 mt-5 pt-2 text-center text-[8px] text-gray-500">
            Powered by Vincollins School Management Portal | {schoolSettings.motto}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons - Term/Year Selectors + Print + Download at bottom */}
      <div className="no-print fixed bottom-6 left-0 right-0 flex justify-center z-50">
        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 border border-gray-200">
          {/* Term Selector */}
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="h-8 text-xs w-[130px] rounded-full border-gray-300">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent>
              {TERMS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          
          {/* Year Selector */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-8 text-xs w-[140px] rounded-full border-gray-300">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-gray-200"></div>
          
          <Button 
            onClick={handlePrint} 
            variant="ghost" 
            size="sm"
            className="rounded-full gap-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          
          <Button 
            onClick={handleDownloadPDF} 
            disabled={downloading}
            size="sm"
            className="rounded-full gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .bg-blue-600, .bg-purple-600, .bg-emerald-600, .bg-cyan-600, .bg-amber-600, .bg-red-600, 
          .bg-blue-50, .bg-purple-50, .bg-gray-100 {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}