'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Loader2, 
  Printer, 
  Download, 
  FileText, 
  ArrowLeft, 
  User, 
  RefreshCw, 
  Sparkles, 
  ChevronLeft, 
  FileDown 
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { cn } from '@/lib/utils'

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
// TYPES
// ============================================
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
  class_teacher?: string
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

const TERMS = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const YEARS = ['2024/2025', '2025/2026', '2026/2027']

const getTermLabel = (term: string): string => {
  const found = TERMS.find(t => t.value === term)
  return found?.label || 'Third Term'
}

// ============================================
// MAIN COMPONENT
// ============================================
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

  const loadNextTermDate = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'next_term_date')
        .maybeSingle()
      if (data?.value) setNextTermDate(data.value)
    } catch (error) {
      console.error('Error loading next term date:', error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await loadSchoolSettings()
      await loadNextTermDate()
      await loadStudentProfile()
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedTerm && selectedYear) {
      loadReportCards()
    }
  }, [selectedTerm, selectedYear])

  const loadSchoolSettings = async () => {
    const { data } = await supabase
      .from('school_settings')
      .select('*')
      .maybeSingle()
    
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
    toast.info('Generating PDF... Please wait.')
    
    try {
      const element = reportCardRef.current
      const originalWidth = element.style.width
      const originalOverflow = element.style.overflow
      
      element.style.width = '210mm'
      element.style.overflow = 'visible'
      
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      })
      
      element.style.width = originalWidth
      element.style.overflow = originalOverflow
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const termDisplay = getTermLabel(selectedTerm)
  const formattedNextTermDate = nextTermDate 
    ? new Date(nextTermDate).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'To be announced'

  // If no report card found
  if (reportCards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="no-print max-w-[210mm] mx-auto mb-4 px-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
        <div className="max-w-[210mm] mx-auto px-4">
          <Card className="shadow-xl border-0">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Report Card Available</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Your report card for {getTermLabel(selectedTerm)} {selectedYear} is not yet available.
                <br />Please check back later or contact your class teacher.
              </p>
              <Button variant="outline" onClick={handleRefresh} className="mt-6">
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const displaySubjects = selectedReportCard?.subjects_data || []
  const overallGrade = selectedReportCard?.grade || 
    (selectedReportCard?.average_score ? 
      (selectedReportCard.average_score >= 80 ? 'A' : 
       selectedReportCard.average_score >= 70 ? 'B' : 
       selectedReportCard.average_score >= 60 ? 'C' : 
       selectedReportCard.average_score >= 50 ? 'P' : 'F') : '—')
  
  const formattedAvg = selectedReportCard?.average_score?.toFixed(2) || '0'

  // Find best and worst subjects
  const bestSubject = displaySubjects.length > 0 
    ? displaySubjects.reduce((a, b) => a.total > b.total ? a : b) 
    : null
  const worstSubject = displaySubjects.length > 0 
    ? displaySubjects.reduce((a, b) => a.total < b.total ? a : b) 
    : null
  const showAreaForImprovement = worstSubject && worstSubject.total < 50

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
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen py-6 print:py-0">
      {/* TOP BAR - Simplified with just back and refresh */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 px-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => router.back()} size="sm" className="text-slate-600">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="h-9 text-sm w-[130px] border-slate-200 bg-white">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                {TERMS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-9 text-sm w-[140px] border-slate-200 bg-white">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="border-slate-200">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* REPORT CARD - With top padding/margin to push content down */}
      <div className="pt-4 print:pt-0">
        <div 
          ref={reportCardRef}
          className="bg-white w-full max-w-[210mm] mx-auto text-[11px] text-black border border-gray-300 p-4 print:p-3 print:border-none shadow-2xl print:shadow-none rounded-lg print:rounded-none"
          style={{ margin: '0 auto' }}
        >
          {/* HEADER - Responsive grid layout */}
          <div className="border-b border-gray-300 pb-3 print:pb-2 mb-4">
            <div className="grid grid-cols-[auto,1fr,auto] gap-3 items-start">
              {/* LOGO - Responsive sizing */}
              <div className="w-16 sm:w-20 print:w-12 flex-shrink-0">
                {schoolSettings.logo_url ? (
                  <img src={schoolSettings.logo_url} alt="logo" className="w-full h-auto object-contain max-h-16 sm:max-h-20 print:max-h-12" />
                ) : (
                  <div className="w-full h-16 sm:h-20 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                    Logo
                  </div>
                )}
              </div>

              {/* SCHOOL INFO - Responsive text sizing */}
              <div className="flex-1 text-center px-2">
                <h1 className="text-lg sm:text-xl font-bold uppercase text-blue-900 print:text-[14px] leading-tight tracking-wide">
                  {schoolSettings.name}
                </h1>
                <p className="text-[10px] sm:text-[11px] print:text-[8px] text-gray-600">{schoolSettings.address}</p>
                <p className="text-[9px] sm:text-[10px] print:text-[8px] text-gray-600">Tel: {schoolSettings.phone} | Email: {schoolSettings.email}</p>
                <p className="text-[8px] sm:text-[9px] italic text-amber-600 mt-1 print:text-[7px]">"{schoolSettings.motto}"</p>
                <h2 className="font-bold mt-2 text-sm sm:text-base print:text-[11px] text-gray-800">
                  {getTermLabel(selectedReportCard?.term || selectedTerm)} Student&apos;s Performance Report
                </h2>
              </div>

              {/* PHOTO - Responsive sizing */}
              <div className="w-16 h-20 sm:w-20 sm:h-24 print:w-16 print:h-20 border border-gray-300 rounded-md flex-shrink-0 bg-gray-50 overflow-hidden">
                {selectedReportCard?.student_photo_url ? (
                  <img src={selectedReportCard.student_photo_url} alt="student" className="w-full h-full object-cover" />
                ) : studentProfile?.photo_url ? (
                  <img src={studentProfile.photo_url} alt="student" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] text-center p-1">
                    Student Photo
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STUDENT INFO - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[11px] mb-5 print:mb-3 print:text-[9px] bg-gray-50 p-3 rounded-lg">
            <div className="flex flex-wrap"><span className="font-bold w-32">Student Name:</span><span className="flex-1">{selectedReportCard?.student_name}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-32">Admission No:</span><span className="flex-1">{selectedReportCard?.student_admission_number || studentProfile?.admission_number || '—'}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-32">Class:</span><span className="flex-1">{selectedReportCard?.class || studentProfile?.class || '—'}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-32">Term:</span><span className="flex-1">{getTermLabel(selectedReportCard?.term || selectedTerm)}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-32">Session:</span><span className="flex-1">{selectedReportCard?.academic_year || selectedYear}</span></div>
            <div className="flex flex-wrap"><span className="font-bold w-32">Next Term Begins:</span><span className="flex-1 text-xs sm:text-sm font-medium text-blue-700">{formattedNextTermDate}</span></div>
          </div>

          {/* MAIN CONTENT - Responsive column layout */}
          <div className="flex flex-col lg:flex-row gap-5">
            {/* LEFT COLUMN - ACADEMIC RESULTS */}
            <div className="flex-1 min-w-0">
              {/* SUBJECT TABLE - Responsive overflow */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full border-collapse text-[10px] sm:text-[11px] print:text-[8px] min-w-[500px]">
                  <thead className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
                    <tr>
                      <th className="border border-blue-500 px-3 py-2 text-left">Subjects</th>
                      <th className="border border-blue-500 px-2 py-2 text-center w-16">CA</th>
                      <th className="border border-blue-500 px-2 py-2 text-center w-16">Exam</th>
                      <th className="border border-blue-500 px-2 py-2 text-center w-16">Total</th>
                      <th className="border border-blue-500 px-2 py-2 text-center w-14">Grade</th>
                      <th className="border border-blue-500 px-3 py-2 text-left">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displaySubjects.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-500">No scores available</td></tr>
                    ) : (
                      displaySubjects.map((subject, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-200 px-3 py-1.5 font-medium">{subject.name}</td>
                          <td className="border border-gray-200 text-center font-mono">{subject.ca}</td>
                          <td className="border border-gray-200 text-center font-mono">{subject.exam}</td>
                          <td className="border border-gray-200 text-center font-bold font-mono">{subject.total}</td>
                          <td className="border border-gray-200 text-center">
                            <span className={getGradeStyle(subject.grade)}>{subject.grade}</span>
                          </td>
                          <td className="border border-gray-200 px-3 py-1.5">{subject.remark}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold">
                    <tr>
                      <td colSpan={3} className="border border-gray-200 px-3 py-2 text-right">TOTAL / AVERAGE:</td>
                      <td className="border border-gray-200 text-center">{selectedReportCard?.total_score || 0}</td>
                      <td className="border border-gray-200 text-center">
                        <span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span>
                      </td>
                      <td className="border border-gray-200 text-center">{formattedAvg}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* CLASS TEACHER'S REMARK */}
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1.5 text-[11px] font-bold flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  CLASS TEACHER'S REMARK
                </div>
                <div className="p-3 text-[11px] italic leading-relaxed bg-purple-50">
                  {selectedReportCard?.teacher_comments || 'No comment available.'}
                </div>
              </div>

              {/* PRINCIPAL'S REMARK */}
              <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-3 py-1.5 text-[11px] font-bold">
                  PRINCIPAL'S REMARK
                </div>
                <div className="p-3 text-[11px] italic leading-relaxed">
                  {selectedReportCard?.principal_comments || 'No comment available.'}
                </div>
              </div>

              {/* GRADE SCALE - Responsive grid */}
              <div className="mt-4">
                <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white text-[10px] px-3 py-1.5 font-bold rounded-t-lg">Grade Scale</div>
                <div className="border border-gray-200 p-3 rounded-b-lg bg-gray-50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-[9px]">
                    <div className="flex items-center gap-1"><span className={getGradeStyle('A1')}>A1</span> <span className="text-gray-600">75-100</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('B2')}>B2</span> <span className="text-gray-600">70-74</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('B3')}>B3</span> <span className="text-gray-600">65-69</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('C4')}>C4</span> <span className="text-gray-600">60-64</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('C5')}>C5</span> <span className="text-gray-600">55-59</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('C6')}>C6</span> <span className="text-gray-600">50-54</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('D7')}>D7</span> <span className="text-gray-600">45-49</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('E8')}>E8</span> <span className="text-gray-600">40-44</span></div>
                    <div className="flex items-center gap-1"><span className={getGradeStyle('F9')}>F9</span> <span className="text-gray-600">0-39</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - PSYCHOMOTOR & SKILLS */}
            <div className="w-full lg:w-64 xl:w-72 flex-shrink-0">
              {/* PERFORMANCE SUMMARY */}
              <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 uppercase">Performance Summary</div>
                <div className="p-3 space-y-2 text-[10px]">
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-600">Total Score</span><span className="font-bold">{selectedReportCard?.total_score || 0}</span></div>
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-600">Average</span><span className="font-bold">{formattedAvg}%</span></div>
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-600">Grade</span><span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span></div>
                  {bestSubject && (
                    <div className="flex justify-between text-emerald-600 pt-1">
                      <span>🏆 Best Subject</span>
                      <span className="font-bold">{bestSubject.name} ({bestSubject.total})</span>
                    </div>
                  )}
                  {showAreaForImprovement && (
                    <div className="flex justify-between text-red-600">
                      <span>📚 Area for Improvement</span>
                      <span className="font-bold">{worstSubject.name} ({worstSubject.total})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AFFECTIVE DOMAIN */}
              <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 uppercase">Affective Domain</div>
                <div className="p-2">
                  <table className="w-full border-collapse text-[10px]">
                    <tbody>
                      {behaviorRatings.map((item) => (
                        <tr key={item.name} className="border-b border-gray-100">
                          <td className="px-1 py-1.5">{item.name}</td>
                          <td className="text-center w-12">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 font-bold rounded-full text-xs">{item.rating}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PSYCHOMOTOR SKILLS */}
              <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white text-[10px] font-bold px-3 py-1.5 uppercase">Psychomotor Skills</div>
                <div className="p-2">
                  <table className="w-full border-collapse text-[10px]">
                    <tbody>
                      {skillRatings.map((item) => (
                        <tr key={item.name} className="border-b border-gray-100">
                          <td className="px-1 py-1.5">{item.name}</td>
                          <td className="text-center w-12">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 font-bold rounded-full text-xs">{item.rating}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RATING KEY */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white text-[10px] font-bold px-3 py-1.5 uppercase">Key To Ratings</div>
                <div className="p-2 space-y-0.5 text-[9px]">
                  <div className="flex items-center gap-2"><span className="w-5 h-5 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center text-xs">5</span> - Excellent</div>
                  <div className="flex items-center gap-2"><span className="w-5 h-5 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center text-xs">4</span> - Very Good</div>
                  <div className="flex items-center gap-2"><span className="w-5 h-5 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center text-xs">3</span> - Good</div>
                  <div className="flex items-center gap-2"><span className="w-5 h-5 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center text-xs">2</span> - Fair</div>
                  <div className="flex items-center gap-2"><span className="w-5 h-5 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center text-xs">1</span> - Poor</div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-gray-300 mt-5 pt-3 text-center text-[9px] text-gray-500 print:mt-2 print:pt-2">
            Powered by Vincollins Portal | {schoolSettings.motto}
          </div>
        </div>
      </div>

      {/* BEAUTIFUL FLOATING ACTION BUTTONS FOOTER - Print/Download */}
      <div className="no-print fixed bottom-6 left-0 right-0 flex justify-center z-50 print:hidden">
        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 border border-gray-200">
          <Button 
            onClick={handlePrint} 
            variant="ghost" 
            size="default"
            className="rounded-full gap-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <div className="w-px h-6 bg-gray-200"></div>
          <Button 
            onClick={handleDownloadPDF} 
            disabled={downloading}
            className="rounded-full gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </Button>
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
          .bg-gradient-to-r, .bg-blue-600, .bg-purple-600, .bg-indigo-600, .bg-teal-600, .bg-emerald-600 {
            background-color: #1e40af !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .border {
            border-color: #000 !important;
          }
          .shadow-2xl, .shadow-lg {
            box-shadow: none !important;
          }
          .rounded-lg, .rounded-full, .rounded-md {
            border-radius: 0 !important;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        }
        
        @media (max-width: 640px) {
          .grid-cols-[auto,1fr,auto] {
            gap: 0.5rem;
          }
          .text-lg {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  )
}