// app/staff/report-cards/page.tsx - WITH PRINT AND PDF DOWNLOAD

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Loader2, Search, Eye, FileText, Printer, Download, 
  Users, GraduationCap, ChevronLeft, ChevronRight, 
  X, User, TrendingUp, CheckCircle2, Sparkles, ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
  if (!subjects || subjects.length === 0) return []
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

const getOverallGrade = (percentage: number): string => {
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'P'
  return 'F'
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
  overall_grade: string
  teacher_comments: string
  principal_comments: string
  status: string
  generated_at: string
  next_term_begins?: string
  behavior_ratings?: { name: string; rating: number }[]
  skill_ratings?: { name: string; rating: number }[]
}

interface ClassStats {
  className: string
  total: number
  published: number
  averageScore: number
}

interface SchoolSettings {
  name: string
  address: string
  phone: string
  email: string
  logo_url?: string
  motto?: string
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
const PAGE_SIZE = 20

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

// ============================================
// MAIN COMPONENT
// ============================================
export default function StaffReportCardsPage() {
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [classStats, setClassStats] = useState<ClassStats[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedTerm, setSelectedTerm] = useState('third')
  const [selectedYear, setSelectedYear] = useState('2025/2026')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCard, setSelectedCard] = useState<ReportCard | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS)

  // Load school settings
  useEffect(() => {
    const loadSchoolData = async () => {
      const { data: school } = await supabase
        .from('school_settings')
        .select('*')
        .maybeSingle()
      if (school) {
        setSchoolSettings({
          name: school.school_name || DEFAULT_SCHOOL_SETTINGS.name,
          address: school.address || DEFAULT_SCHOOL_SETTINGS.address,
          phone: school.school_phone || DEFAULT_SCHOOL_SETTINGS.phone,
          email: school.school_email || DEFAULT_SCHOOL_SETTINGS.email,
          logo_url: school.logo_path,
          motto: school.school_motto || DEFAULT_SCHOOL_SETTINGS.motto,
        })
      }
    }
    loadSchoolData()
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

  const loadReportCards = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('report_cards')
        .select('*')
        .eq('term', selectedTerm)
        .eq('academic_year', selectedYear)
        .eq('status', 'published')
        .order('class', { ascending: true })

      if (selectedClass !== 'all') {
        query = query.eq('class', selectedClass)
      }

      const { data, error } = await query
      if (error) throw error

      if (!data || data.length === 0) {
        setReportCards([])
        setClassStats([])
        setLoading(false)
        return
      }

      const studentIds = [...new Set(data.map((rc: any) => rc.student_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, admission_number, photo_url')
        .in('id', studentIds)

      const profileMap = new Map()
      profiles?.forEach(profile => {
        profileMap.set(profile.id, {
          name: profile.display_name || profile.full_name || 'Student',
          admission_number: profile.admission_number,
          photo_url: profile.photo_url
        })
      })

      const cards: ReportCard[] = data.map((rc: any) => {
        const profile = profileMap.get(rc.student_id)
        const avgScore = rc.average_score || 0
        const overallGrade = getOverallGrade(avgScore)
        
        return {
          id: rc.id,
          student_id: rc.student_id,
          student_name: profile?.name || rc.student_name || 'Student',
          student_admission_number: profile?.admission_number || rc.student_admission_number,
          student_photo_url: profile?.photo_url,
          class: rc.class,
          term: rc.term,
          academic_year: rc.academic_year,
          subjects_data: rc.subjects_data || [],
          average_score: avgScore,
          total_score: rc.total_score || 0,
          grade: rc.grade || getWAECGrade(avgScore),
          overall_grade: overallGrade,
          teacher_comments: rc.teacher_comments || '',
          principal_comments: rc.principal_comments || '',
          status: rc.status,
          generated_at: rc.generated_at,
          next_term_begins: rc.next_term_begins,
          behavior_ratings: generateRatings(avgScore).behaviorRatings,
          skill_ratings: generateRatings(avgScore).skillRatings,
        }
      })

      setReportCards(cards)

      const statsMap = new Map<string, ClassStats>()
      cards.forEach(card => {
        const existing = statsMap.get(card.class)
        if (existing) {
          existing.total++
          if (card.status === 'published') existing.published++
          existing.averageScore = (existing.averageScore + card.average_score) / 2
        } else {
          statsMap.set(card.class, {
            className: card.class,
            total: 1,
            published: card.status === 'published' ? 1 : 0,
            averageScore: card.average_score
          })
        }
      })
      setClassStats(Array.from(statsMap.values()).sort((a, b) => a.className.localeCompare(b.className)))
    } catch (error) {
      console.error('Error loading report cards:', error)
      toast.error('Failed to load report cards')
    } finally {
      setLoading(false)
    }
  }, [selectedTerm, selectedYear, selectedClass])

  useEffect(() => {
    loadReportCards()
  }, [loadReportCards])

  const filteredCards = useMemo(() => {
    let filtered = reportCards
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(card =>
        card.student_name.toLowerCase().includes(q) ||
        (card.student_admission_number?.toLowerCase().includes(q))
      )
    }
    return filtered
  }, [reportCards, searchQuery])

  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredCards.slice(start, start + PAGE_SIZE)
  }, [filteredCards, currentPage])

  const totalPages = Math.ceil(filteredCards.length / PAGE_SIZE)

  // Handle Print
  const handlePrint = () => {
    window.print()
  }

  // Handle Download PDF
  const handleDownloadPDF = async () => {
    if (!printRef.current || !selectedCard) {
      toast.error('Report card not found')
      return
    }
    
    setDownloading(true)
    toast.info('Generating PDF... Please wait.')
    
    try {
      const element = printRef.current
      
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
      pdf.save(`Report_Card_${selectedCard.student_name}_${getTermLabel(selectedCard.term)}_${selectedCard.academic_year.replace('/', '_')}.pdf`)
      
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleExportCSV = () => {
    if (filteredCards.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['Student Name', 'Admission No', 'Class', 'Average Score', 'Grade', 'Status']
    const rows = filteredCards.map(card => [
      card.student_name,
      card.student_admission_number || '',
      card.class,
      `${card.average_score}%`,
      card.overall_grade,
      card.status
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ReportCards_${getTermLabel(selectedTerm)}_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported successfully!')
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedClass, selectedTerm, selectedYear])

  if (loading && reportCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-slate-500 text-sm">Loading report cards...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Student Report Cards
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View published report cards for your students • {getTermLabel(selectedTerm)} {selectedYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadReportCards} className="h-9 text-xs">
            <Loader2 className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Class Statistics Cards */}
      {classStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Students</p>
                  <p className="text-2xl font-bold text-slate-700">{reportCards.length}</p>
                </div>
                <Users className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Classes</p>
                  <p className="text-2xl font-bold text-slate-700">{classStats.length}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Average Score</p>
                  <p className="text-2xl font-bold text-slate-700">
                    {Math.round(reportCards.reduce((sum, c) => sum + c.average_score, 0) / (reportCards.length || 1))}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Published</p>
                  <p className="text-2xl font-bold text-slate-700">{reportCards.filter(c => c.status === 'published').length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes ({reportCards.length})</SelectItem>
                  {classStats.map(cls => (
                    <SelectItem key={cls.className} value={cls.className}>
                      {cls.className} ({cls.total} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger className="h-9 text-sm mt-1">
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
              <Label className="text-xs text-slate-500">Session</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-9 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Label className="text-xs text-slate-500">Search Student</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search by name or admission number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {paginatedCards.length} of {filteredCards.length} students
        </p>
        {searchQuery && (
          <Badge variant="outline" className="text-xs">
            Filtered by: {searchQuery}
          </Badge>
        )}
      </div>

      {/* Report Cards Table */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">Student</TableHead>
                <TableHead className="text-xs font-semibold">Admission No</TableHead>
                <TableHead className="text-xs font-semibold">Class</TableHead>
                <TableHead className="text-center text-xs font-semibold">Average</TableHead>
                <TableHead className="text-center text-xs font-semibold">Grade</TableHead>
                <TableHead className="text-center text-xs font-semibold">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No report cards found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCards.map((card) => (
                  <TableRow key={card.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <p className="font-medium text-sm">{card.student_name}</p>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{card.student_admission_number || '—'}</TableCell>
                    <TableCell className="text-xs">{card.class}</TableCell>
                    <TableCell className="text-center font-semibold text-sm">{card.average_score}%</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-bold", 
                        card.overall_grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                        card.overall_grade === 'B' ? 'bg-blue-100 text-blue-700' :
                        card.overall_grade === 'C' ? 'bg-cyan-100 text-cyan-700' :
                        card.overall_grade === 'P' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {card.overall_grade}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px]">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                        Published
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setSelectedCard(card)
                          setShowViewDialog(true)
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-slate-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Report Card Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-[210mm] w-full max-h-[90vh] overflow-y-auto p-0">
          {selectedCard && (
            <>
              <DialogHeader className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Report Card - {selectedCard.student_name}
                  </DialogTitle>
                  <div className="flex gap-2">
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
                    <Button variant="ghost" size="sm" onClick={() => setShowViewDialog(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <DialogDescription>
                  {selectedCard.class} • {getTermLabel(selectedCard.term)} {selectedCard.academic_year}
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 bg-gray-100">
                {/* REPORT CARD - Professional styling matching view page */}
                <div 
                  ref={printRef}
                  className="bg-white mx-auto text-black w-[210mm] min-h-[297mm] p-6 shadow-lg"
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
                          {getTermLabel(selectedCard.term)} Student's Performance Report
                        </h2>
                        <p className="text-[10px] mt-1 font-semibold">Academic Session: {selectedCard.academic_year}</p>
                      </div>
                      <div className="w-20 h-24 border border-gray-300 rounded overflow-hidden flex-shrink-0">
                        {selectedCard.student_photo_url ? (
                          <img src={selectedCard.student_photo_url} alt="student" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">Photo</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student Information */}
                  <div className="bg-blue-50 p-3 rounded-md mb-5 text-[11px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="font-bold">Student Name:</span> {selectedCard.student_name}</div>
                      <div><span className="font-bold">Admission No:</span> {selectedCard.student_admission_number || '—'}</div>
                      <div><span className="font-bold">Class:</span> {selectedCard.class}</div>
                      <div><span className="font-bold">Term:</span> {getTermLabel(selectedCard.term)}</div>
                      <div><span className="font-bold">Session:</span> {selectedCard.academic_year}</div>
                      <div><span className="font-bold">Next Term:</span> {selectedCard.next_term_begins ? new Date(selectedCard.next_term_begins).toLocaleDateString('en-NG') : 'To be announced'}</div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex gap-5">
                    {/* Left Column */}
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
                          {sortSubjectsByOrder(selectedCard.subjects_data || []).map((subject, idx) => (
                            <tr key={idx}>
                              <td className="border border-gray-300 px-2 py-1.5">{subject.name}</td>
                              <td className="border border-gray-300 text-center">{subject.ca || '-'}</td>
                              <td className="border border-gray-300 text-center">{subject.exam || '-'}</td>
                              <td className="border border-gray-300 text-center font-bold">{subject.total || '-'}</td>
                              <td className="border border-gray-300 text-center">
                                <span className={getGradeStyle(subject.grade)}>{subject.grade || '-'}</span>
                              </td>
                              <td className="border border-gray-300 px-2 py-1.5">{subject.remark || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold">
                          <tr>
                            <td colSpan={3} className="border border-gray-300 px-2 py-1.5 text-right">TOTAL / AVERAGE:</td>
                            <td className="border border-gray-300 text-center">{selectedCard.total_score || 0}</td>
                            <td className="border border-gray-300 text-center">
                              <span className={getOverallGradeColor(selectedCard.overall_grade)}>{selectedCard.overall_grade}</span>
                            </td>
                            <td className="border border-gray-300 text-center">{selectedCard.average_score?.toFixed(2) || '0'}%</td>
                          </tr>
                        </tfoot>
                      </table>

                      {/* Remarks */}
                      <div className="mt-4 space-y-2">
                        <div className="border-l-4 border-purple-500 bg-purple-50 p-2 text-[10px]">
                          <div className="font-bold text-purple-700 mb-1 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> CLASS TEACHER'S REMARK
                          </div>
                          <p className="italic">{selectedCard.teacher_comments || 'No comment available.'}</p>
                        </div>
                        <div className="border-l-4 border-blue-500 bg-blue-50 p-2 text-[10px]">
                          <div className="font-bold text-blue-700 mb-1">PRINCIPAL'S REMARK</div>
                          <p className="italic">{selectedCard.principal_comments || 'No comment available.'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-56 flex-shrink-0 space-y-3">
                      <div className="border border-gray-300">
                        <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">Performance Summary</div>
                        <div className="p-2 text-[10px] space-y-1">
                          <div className="flex justify-between"><span>Total Score:</span><span className="font-bold">{selectedCard.total_score || 0}</span></div>
                          <div className="flex justify-between"><span>Average:</span><span className="font-bold">{selectedCard.average_score?.toFixed(2) || '0'}%</span></div>
                          <div className="flex justify-between"><span>Grade:</span><span className={getOverallGradeColor(selectedCard.overall_grade)}>{selectedCard.overall_grade}</span></div>
                          <div className="flex justify-between"><span>Subjects:</span><span className="font-bold">{selectedCard.subjects_data?.length || 0}</span></div>
                        </div>
                      </div>

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

                      {/* Affective Domain */}
                      <div className="border border-gray-300">
                        <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 uppercase">Affective Domain</div>
                        <div className="p-2 text-[9px] space-y-0.5">
                          {(selectedCard.behavior_ratings || [
                            { name: 'Honesty', rating: 4 }, { name: 'Neatness', rating: 4 },
                            { name: 'Obedience', rating: 4 }, { name: 'Orderliness', rating: 3 },
                            { name: 'Diligence', rating: 4 }, { name: 'Punctuality', rating: 4 },
                            { name: 'Leadership', rating: 3 }, { name: 'Politeness', rating: 4 },
                          ]).map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                              <span>{item.name}</span>
                              <span className="font-bold text-blue-600">{item.rating}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Psychomotor Skills */}
                      <div className="border border-gray-300">
                        <div className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 uppercase">Psychomotor Skills</div>
                        <div className="p-2 text-[9px] space-y-0.5">
                          {(selectedCard.skill_ratings || [
                            { name: 'Handwriting', rating: 4 }, { name: 'Verbal Fluency', rating: 4 },
                            { name: 'Sports', rating: 3 }, { name: 'Handling Tools', rating: 3 },
                            { name: 'Club Activities', rating: 4 },
                          ]).map((item) => (
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
            </>
          )}
        </DialogContent>
      </Dialog>

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