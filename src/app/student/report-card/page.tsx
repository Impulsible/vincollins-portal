// app/student/report-card/page.tsx - WITH PROPER PDF DOWNLOAD (EXACT VISUAL)

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
import { Loader2, Printer, Download, FileText, ArrowLeft, User, RefreshCw } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { cn } from '@/lib/utils'

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
    'F9': 'Fail'
  }
  return remarks[grade] || ''
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

interface ReportCard {
  id: string
  student_id: string
  student_name: string
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
  date_of_birth: string
  blood_group: string
  parent_name: string
  parent_phone: string
  parent_email: string
  home_address: string
}

// ============================================
// CONSTANTS
// ============================================
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

const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  name: 'VINCOLLINS COLLEGE',
  address: '7/9 Lawani Street, off Ishaga Rd, Surulere, Lagos',
  phone: '+234 912 1155 554',
  email: 'vincollinscollege@gmail.com',
  motto: 'Geared Towards Excellence',
}

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border border-gray-300 mb-2">
    <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">{title}</div>
    <div className="p-2 text-[10px]">{children}</div>
  </div>
)

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

  // Load next term date
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
    loadSchoolSettings()
    loadNextTermDate()
    loadStudentProfile()
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
        address: data.address || DEFAULT_SCHOOL_SETTINGS.address,
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
        .select('*')
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
        date_of_birth: data.date_of_birth || '',
        blood_group: data.blood_group || '',
        parent_name: data.parent_name || '',
        parent_phone: data.parent_phone || '',
        parent_email: data.parent_email || '',
        home_address: data.home_address || '',
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

      // Fetch PUBLISHED report cards
      const { data, error } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', user.id)
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .eq('status', 'published')
        .order('generated_at', { ascending: false })

      if (error) throw error

      // Get fresh student profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, display_name, admission_number, photo_url, class')
        .eq('id', user.id)
        .single()

      const ratings = generateRatings(data?.[0]?.average_score || 0)

      const cards = (data || []).map((card: any) => ({
        ...card,
        student_name: profile?.display_name || profile?.full_name || card.student_name || 'Student',
        student_admission_number: profile?.admission_number || card.student_admission_number,
        student_photo_url: profile?.photo_url || card.student_photo_url,
        class: profile?.class || card.class,
        behavior_ratings: ratings.behaviorRatings,
        skill_ratings: ratings.skillRatings,
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

  // ✅ PROPER PDF DOWNLOAD - Captures exact visual of the report card
  const handleDownloadPDF = async () => {
    if (!reportCardRef.current || !selectedReportCard) return
    
    setDownloading(true)
    toast.info('Generating PDF... Please wait.')
    
    try {
      // Get the report card element
      const element = reportCardRef.current
      const originalWidth = element.style.width
      const originalOverflow = element.style.overflow
      
      // Set temporary styles for better capture
      element.style.width = '210mm'
      element.style.overflow = 'visible'
      
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 3, // High quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true, // Allow cross-origin images
        allowTaint: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      })
      
      // Restore original styles
      element.style.width = originalWidth
      element.style.overflow = originalOverflow
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      let heightLeft = imgHeight
      let position = 0
      let page = 1
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
        page++
      }
      
      // Save the PDF
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
    loadStudentProfile()
    toast.success('Refreshed!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const displaySubjects = selectedReportCard?.subjects_data || []
  const termDisplay = getTermLabel(selectedReportCard?.term || selectedTerm)
  const formattedNextTermDate = selectedReportCard?.next_term_begins 
    ? new Date(selectedReportCard.next_term_begins).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'To be announced'

  // Get the overall grade for display
  const overallGrade = selectedReportCard?.grade || 
    (selectedReportCard?.average_score ? 
      (selectedReportCard.average_score >= 80 ? 'A' : 
       selectedReportCard.average_score >= 70 ? 'B' : 
       selectedReportCard.average_score >= 60 ? 'C' : 
       selectedReportCard.average_score >= 50 ? 'P' : 'F') : '—')

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      
      {/* Header with Back Button */}
      <div className="no-print max-w-[210mm] mx-auto mb-3 flex items-center justify-between px-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {downloading ? 'Generating...' : 'PDF'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 px-4">
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Select Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS.map(term => (
                      <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Select Session</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No Report Card Message */}
      {reportCards.length === 0 && (
        <div className="max-w-[210mm] mx-auto px-4">
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No Report Card Available</h3>
              <p className="text-sm text-slate-500">
                Your report card for {getTermLabel(selectedTerm)} {selectedYear} is not yet available.
                <br />Please check back later.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Card Display */}
      {selectedReportCard && (
        <div className="max-w-[210mm] mx-auto px-4">
          {/* Report Card Selector - if multiple cards available */}
          {reportCards.length > 1 && (
            <div className="no-print flex items-center gap-2 mb-3">
              <Label className="text-xs">Select Report:</Label>
              <Select 
                value={selectedReportCard.id} 
                onValueChange={(id) => {
                  const found = reportCards.find(r => r.id === id)
                  setSelectedReportCard(found || null)
                }}
              >
                <SelectTrigger className="h-8 text-xs w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportCards.map(card => (
                    <SelectItem key={card.id} value={card.id}>
                      {getTermLabel(card.term)} - {card.academic_year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* PROFESSIONAL REPORT CARD - with ref for PDF capture */}
          <div 
            ref={reportCardRef}
            className="bg-white w-full max-w-[210mm] mx-auto text-[11px] text-black border border-gray-300 p-3 print:p-0 print:border-none shadow-lg"
          >
            
            {/* HEADER */}
            <div className="border-b border-gray-300 pb-2 print:pb-1">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                {/* LOGO */}
                <div className="w-16 print:w-12 mx-auto sm:mx-0">
                  {schoolSettings.logo_url && (
                    <img src={schoolSettings.logo_url} alt="logo" className="w-14 h-14 object-contain print:w-10 print:h-10 mx-auto sm:mx-0" />
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
                <div className="w-20 h-24 border border-gray-300 print:w-16 print:h-20 mx-auto sm:mx-0">
                  {selectedReportCard?.student_photo_url ? (
                    <img src={selectedReportCard.student_photo_url} alt="student" className="w-full h-full object-cover" />
                  ) : studentProfile?.photo_url ? (
                    <img src={studentProfile.photo_url} alt="student" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* STUDENT INFO - VIN ID REMOVED */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] mt-2 mb-3 print:mt-1 print:mb-2 print:text-[9px]">
              <div className="flex flex-wrap"><span className="font-bold w-32">Name:</span><span>{selectedReportCard.student_name}</span></div>
              <div className="flex flex-wrap"><span className="font-bold w-32">Admission No:</span><span>{selectedReportCard.student_admission_number || studentProfile?.admission_number || '—'}</span></div>
              <div className="flex flex-wrap"><span className="font-bold w-32">Class:</span><span>{selectedReportCard.class || studentProfile?.class || '—'}</span></div>
              <div className="flex flex-wrap"><span className="font-bold w-32">Term:</span><span>{termDisplay}</span></div>
              <div className="flex flex-wrap"><span className="font-bold w-32">Session:</span><span>{selectedReportCard.academic_year}</span></div>
              <div className="flex flex-wrap"><span className="font-bold w-32">Next Term:</span><span>{formattedNextTermDate}</span></div>
              {studentProfile?.date_of_birth && (
                <div className="flex flex-wrap"><span className="font-bold w-32">Date of Birth:</span><span>{new Date(studentProfile.date_of_birth).toLocaleDateString('en-NG')}</span></div>
              )}
              {studentProfile?.blood_group && (
                <div className="flex flex-wrap"><span className="font-bold w-32">Blood Group:</span><span>{studentProfile.blood_group}</span></div>
              )}
            </div>

            {/* MAIN CONTENT - 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-3">
              {/* LEFT COLUMN - ACADEMIC RESULTS */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2 border-l-4 border-emerald-500 pl-2">ACADEMIC PERFORMANCE</h3>
                
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
                      {displaySubjects.map((subject, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                          <td className="border px-2 py-1 font-medium">{subject.name}</td>
                          <td className="border text-center font-mono">{subject.ca || '-'}</td>
                          <td className="border text-center font-mono">{subject.exam || '-'}</td>
                          <td className="border text-center font-bold font-mono">{subject.total || '-'}</td>
                          <td className="border text-center">
                            <span className={getGradeStyle(subject.grade)}>
                              {subject.grade || '-'}
                            </span>
                          </td>
                          <td className="border px-2 py-1">{subject.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold">
                      <tr>
                        <td colSpan={3} className="border px-2 py-1 text-right">SUMMARY:</td>
                        <td className="border text-center">{selectedReportCard.total_score || 0}</td>
                        <td className="border text-center">
                          <span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span>
                        </td>
                        <td className="border text-center">{selectedReportCard.average_score || 0}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* TEACHER'S REMARK */}
                <div className="mt-3 border border-gray-300">
                  <div className="bg-blue-600 text-white px-2 py-1 text-[10px] font-bold">
                    CLASS TEACHER&apos;S REMARK
                  </div>
                  <div className="p-2 text-[10px] italic leading-relaxed">
                    {selectedReportCard.teacher_comments || 'No comment available.'}
                  </div>
                </div>

                {/* PRINCIPAL'S REMARK */}
                <div className="mt-2 border border-gray-300">
                  <div className="bg-blue-600 text-white px-2 py-1 text-[10px] font-bold">
                    PRINCIPAL&apos;S REMARK
                  </div>
                  <div className="p-2 text-[10px] italic leading-relaxed">
                    {selectedReportCard.principal_comments || 'No comment available.'}
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
                {/* Performance Summary */}
                <Panel title="Performance Summary">
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Total Score</span><span className="font-bold">{selectedReportCard.total_score || 0}</span></div>
                    <div className="flex justify-between"><span>Average</span><span className="font-bold">{selectedReportCard.average_score || 0}%</span></div>
                    <div className="flex justify-between">
                      <span>Grade</span>
                      <span className={getOverallGradeColor(overallGrade)}>{overallGrade}</span>
                    </div>
                  </div>
                </Panel>

                {/* Affective Domain */}
                <Panel title="Affective Domain">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-[10px]">
                      <tbody>
                        {(selectedReportCard.behavior_ratings || [
                          { name: 'Honesty', rating: 4 },
                          { name: 'Neatness', rating: 4 },
                          { name: 'Obedience', rating: 4 },
                          { name: 'Orderliness', rating: 3 },
                          { name: 'Diligence', rating: 4 },
                          { name: 'Punctuality', rating: 4 },
                          { name: 'Leadership', rating: 3 },
                          { name: 'Politeness', rating: 4 },
                        ]).map((item) => (
                          <tr key={item.name}>
                            <td className="border px-1 py-1">{item.name}</td>
                            <td className="border text-center w-12 font-bold">{item.rating}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                {/* Psychomotor Skills */}
                <Panel title="Psychomotor Skills">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-[10px]">
                      <tbody>
                        {(selectedReportCard.skill_ratings || [
                          { name: 'Handwriting', rating: 4 },
                          { name: 'Verbal Fluency', rating: 4 },
                          { name: 'Sports', rating: 3 },
                          { name: 'Handling Tools', rating: 3 },
                          { name: 'Club Activities', rating: 4 },
                        ]).map((item) => (
                          <tr key={item.name}>
                            <td className="border px-1 py-1">{item.name}</td>
                            <td className="border text-center w-12 font-bold">{item.rating}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                {/* Parent/Guardian Info */}
                {studentProfile && (studentProfile.parent_name || studentProfile.parent_phone) && (
                  <Panel title="Parent/Guardian Information">
                    <div className="space-y-1 text-[9px]">
                      {studentProfile.parent_name && <div><span className="font-bold">Name:</span> {studentProfile.parent_name}</div>}
                      {studentProfile.parent_phone && <div><span className="font-bold">Phone:</span> {studentProfile.parent_phone}</div>}
                      {studentProfile.parent_email && <div><span className="font-bold">Email:</span> {studentProfile.parent_email}</div>}
                      {studentProfile.home_address && <div><span className="font-bold">Address:</span> {studentProfile.home_address}</div>}
                    </div>
                  </Panel>
                )}

                {/* Rating Key */}
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
        </div>
      )}

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
          .bg-blue-600 {
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