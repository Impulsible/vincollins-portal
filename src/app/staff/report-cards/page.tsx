// app/staff/report-cards/page.tsx - UPDATED WITH IMPROVED FONT VISIBILITY AND PRINT
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
  X, User, TrendingUp, CheckCircle2, Sparkles, ArrowLeft,
  Calendar, Award, TrendingDown, School, Mail, Phone
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
  'Business Studies': 18, 'Literature in English': 19, 'CRS': 20, 'CCA': 21, 'Music': 22, 'Yoruba': 23, 'French': 23,
  'Data Processing': 24, 'Information Technology': 25, 'Home Economics': 26,
  'PHE': 27, 'Security Education': 28
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
    case 'A1': return 'bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
    case 'B2':
    case 'B3': return 'bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
    case 'C4':
    case 'C5':
    case 'C6': return 'bg-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
    case 'D7':
    case 'E8': return 'bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
    case 'F9': return 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
    default: return 'bg-gray-500 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[8px]'
  }
}

const getOverallGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'B': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'C': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
    case 'P': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'F': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

const getOverallGradeTextColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-emerald-700 font-bold'
    case 'B': return 'text-blue-700 font-bold'
    case 'C': return 'text-cyan-700 font-bold'
    case 'P': return 'text-amber-700 font-bold'
    case 'F': return 'text-red-700 font-bold'
    default: return 'text-gray-700'
  }
}

const getOverallGradeRemark = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A': 'Excellent',
    'B': 'Very Good',
    'C': 'Good',
    'P': 'Pass',
    'F': 'Fail'
  }
  return remarks[grade] || ''
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

  const handlePrint = () => {
    window.print()
  }

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
              <Label className="text-xs text-slate-500 font-medium">Class</Label>
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
              <Label className="text-xs text-slate-500 font-medium">Term</Label>
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
              <Label className="text-xs text-slate-500 font-medium">Session</Label>
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
              <Label className="text-xs text-slate-500 font-medium">Search Student</Label>
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
                  <DialogTitle className="flex items-center gap-2 text-base font-bold">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Report Card - {selectedCard.student_name}
                  </DialogTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-xs">
                      <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={downloading} className="h-8 text-xs">
                      {downloading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {downloading ? 'Generating...' : 'PDF'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowViewDialog(false)} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <DialogDescription className="text-sm">
                  {selectedCard.class} • {getTermLabel(selectedCard.term)} {selectedCard.academic_year}
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 bg-gray-100">
                {/* REPORT CARD */}
                <div 
                  ref={printRef}
                  className="print-report bg-white mx-auto text-black border-2 border-blue-900 print:border-2 print:border-blue-900 w-[210mm] min-h-[297mm] p-4 print:p-2 shadow-lg"
                  style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                >
                  {/* Header Section */}
                  <div className="border-b-2 border-blue-900 pb-3 print:pb-1.5 mb-3 print:mb-2">
                    <div className="flex items-start justify-between gap-3 print:gap-2">
                      <div className="w-16 print:w-12 shrink-0">
                        {schoolSettings.logo_url ? (
                          <img src={schoolSettings.logo_url} alt="logo" className="w-14 h-14 object-contain print:w-10 print:h-10" />
                        ) : (
                          <div className="w-14 h-14 border-2 border-blue-900 rounded flex items-center justify-center text-[10px] bg-blue-50 print:w-10 print:h-10">
                            <School className="h-8 w-8 text-blue-900 print:h-6 print:w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center">
                        <h1 className="text-[18px] font-bold uppercase text-blue-900 print:text-[14px] tracking-wide">
                          {schoolSettings.name}
                        </h1>
                        <p className="text-[11px] print:text-[9px] text-gray-700">{schoolSettings.address}</p>
                        <p className="text-[11px] print:text-[9px] text-gray-700">
                          <Mail className="inline h-3 w-3 mr-1 print:h-2 print:w-2" /> {schoolSettings.email} | 
                          <Phone className="inline h-3 w-3 mx-1 print:h-2 print:w-2" /> {schoolSettings.phone}
                        </p>
                        <p className="text-[10px] italic text-amber-700 mt-0.5 print:text-[8px] font-medium">"{schoolSettings.motto}"</p>
                        <h2 className="font-bold mt-1.5 text-[14px] print:text-[12px] text-blue-900">
                          {getTermLabel(selectedCard.term)} Student's Performance Report
                        </h2>
                        <p className="text-[10px] mt-0.5 font-semibold print:text-[8px] text-gray-800">Academic Session: {selectedCard.academic_year}</p>
                      </div>
                      <div className="w-16 h-20 sm:w-20 sm:h-24 border-2 border-blue-900 rounded overflow-hidden print:w-14 print:h-16 shrink-0">
                        {selectedCard.student_photo_url ? (
                          <img src={selectedCard.student_photo_url} alt="student" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[8px] sm:text-xs">
                            <User className="h-8 w-8 print:h-6 print:w-6" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Student Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] mb-4 print:mb-2 print:text-[10px]">
                    <div className="flex flex-wrap">
                      <span className="font-bold w-28 sm:w-32 text-gray-700 print:w-24">Name:</span>
                      <span className="break-words text-black font-medium">{selectedCard.student_name}</span>
                    </div>
                    <div className="flex flex-wrap">
                      <span className="font-bold w-28 sm:w-32 text-gray-700 print:w-24">Admission No:</span>
                      <span className="text-black font-medium">{selectedCard.student_admission_number || '—'}</span>
                    </div>
                    <div className="flex flex-wrap">
                      <span className="font-bold w-28 sm:w-32 text-gray-700 print:w-24">Class:</span>
                      <span className="text-black font-medium">{selectedCard.class}</span>
                    </div>
                    <div className="flex flex-wrap">
                      <span className="font-bold w-28 sm:w-32 text-gray-700 print:w-24">Term:</span>
                      <span className="text-black font-medium">{getTermLabel(selectedCard.term)}</span>
                    </div>
                    <div className="flex flex-wrap">
                      <span className="font-bold w-28 sm:w-32 text-gray-700 print:w-24">Session:</span>
                      <span className="text-black font-medium">{selectedCard.academic_year}</span>
                    </div>
                    <div className="flex flex-wrap items-center">
                      <span className="font-bold w-28 sm:w-32 text-gray-700 print:w-24">Next Term Begins:</span>
                      <span className="flex items-center gap-1 text-black font-medium">
                        <Calendar className="h-3 w-3 text-blue-600 print:h-2 print:w-2" />
                        {selectedCard.next_term_begins ? new Date(selectedCard.next_term_begins).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'To be announced'}
                      </span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4 print:gap-2">
                    {/* Left Column */}
                    <div className="min-w-0 overflow-hidden">
                      <div className="border-2 border-blue-900 rounded-sm overflow-hidden">
                        <table className="w-full border-collapse text-[11px] print:text-[9px] table-fixed">
                          <thead className="bg-blue-700 text-white">
                            <tr>
                              <th className="border border-blue-500 px-2 py-1.5 text-left w-[35%] font-bold print:px-1.5 print:py-1">Subjects</th>
                              <th className="border border-blue-500 px-2 py-1.5 text-center w-[10%] font-bold print:px-1.5 print:py-1">CA</th>
                              <th className="border border-blue-500 px-2 py-1.5 text-center w-[10%] font-bold print:px-1.5 print:py-1">Exam</th>
                              <th className="border border-blue-500 px-2 py-1.5 text-center w-[10%] font-bold print:px-1.5 print:py-1">Total</th>
                              <th className="border border-blue-500 px-2 py-1.5 text-center w-[12%] font-bold print:px-1.5 print:py-1">Grade</th>
                              <th className="border border-blue-500 px-2 py-1.5 text-left w-[23%] font-bold print:px-1.5 print:py-1">Remark</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortSubjectsByOrder(selectedCard.subjects_data || []).map((subject, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border border-gray-400 px-2 py-1 font-medium print:px-1.5 print:py-0.5 truncate" title={subject.name}>
                                  {subject.name}
                                </td>
                                <td className="border border-gray-400 text-center font-mono print:px-1.5 print:py-0.5">{subject.ca || '-'}</td>
                                <td className="border border-gray-400 text-center font-mono print:px-1.5 print:py-0.5">{subject.exam || '-'}</td>
                                <td className="border border-gray-400 text-center font-bold font-mono print:px-1.5 print:py-0.5">{subject.total || '-'}</td>
                                <td className="border border-gray-400 text-center print:px-1.5 print:py-0.5">
                                  <span className={getGradeStyle(subject.grade)}>{subject.grade || '-'}</span>
                                </td>
                                <td className="border border-gray-400 px-2 py-1 text-[10px] break-words print:px-1.5 print:py-0.5 print:text-[8px]" title={subject.remark}>
                                  {subject.remark || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-blue-50 font-bold">
                            <tr>
                              <td colSpan={3} className="border border-gray-400 px-2 py-1.5 text-right print:px-1.5 print:py-1">TOTAL / AVERAGE:</td>
                              <td className="border border-gray-400 text-center print:px-1.5 print:py-1">{selectedCard.total_score || 0}</td>
                              <td className="border border-gray-400 text-center print:px-1.5 print:py-1">
                                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold print:text-[8px]", getOverallGradeColor(selectedCard.overall_grade))}>
                                  {selectedCard.overall_grade}
                                </span>
                              </td>
                              <td className="border border-gray-400 text-center print:px-1.5 print:py-1">{selectedCard.average_score?.toFixed(2) || '0'}%</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Remarks */}
                      <div className="mt-3 space-y-2 print:mt-2">
                        <div className="border-l-4 border-purple-600 bg-purple-50 p-2.5 text-[11px] print:text-[9px] print:p-2 rounded-r">
                          <div className="font-bold text-purple-800 mb-0.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 print:h-2 print:w-2" /> CLASS TEACHER'S REMARK
                          </div>
                          <p className="italic text-gray-800 leading-relaxed">{selectedCard.teacher_comments || 'No comment available.'}</p>
                        </div>
                        <div className="border-l-4 border-blue-600 bg-blue-50 p-2.5 text-[11px] print:text-[9px] print:p-2 rounded-r">
                          <div className="font-bold text-blue-800 mb-0.5">
                            <Award className="inline h-3 w-3 mr-1 print:h-2 print:w-2" /> PRINCIPAL'S REMARK
                          </div>
                          <p className="italic text-gray-800 leading-relaxed">{selectedCard.principal_comments || 'No comment available.'}</p>
                        </div>
                      </div>

                      {/* Grade Scale */}
                      <div className="mt-3 print:mt-2">
                        <div className="bg-blue-700 text-white text-[10px] px-2.5 py-1 font-bold rounded-t print:px-2 print:py-0.5 print:text-[8px]">Grade Scale</div>
                        <div className="border-2 border-t-0 border-blue-900 p-2 rounded-b print:p-1.5">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[9px] print:text-[7px] print:gap-0.5">
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
                          <div className="mt-1.5 pt-1.5 border-t border-blue-300 grid grid-cols-5 gap-1 text-[9px] print:mt-1 print:pt-1 print:text-[7px] print:gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold print:text-[7px]", getOverallGradeColor('A'))}>A</span>
                              <span className="text-gray-600">80-100</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold print:text-[7px]", getOverallGradeColor('B'))}>B</span>
                              <span className="text-gray-600">70-79</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold print:text-[7px]", getOverallGradeColor('C'))}>C</span>
                              <span className="text-gray-600">60-69</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold print:text-[7px]", getOverallGradeColor('P'))}>P</span>
                              <span className="text-gray-600">50-59</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold print:text-[7px]", getOverallGradeColor('F'))}>F</span>
                              <span className="text-gray-600">0-49</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3 print:space-y-2">
                      {/* Performance Summary */}
                      <div className="border-2 border-blue-900 w-full box-border">
                        <div className="bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1 uppercase print:px-2 print:py-0.5 print:text-[8px]">Performance Summary</div>
                        <div className="p-2.5 text-[11px] space-y-1 print:p-2 print:text-[9px] print:space-y-0.5">
                          <div className="flex justify-between flex-wrap">
                            <span className="text-gray-700 font-medium">Total Score:</span>
                            <span className="font-bold text-black">{selectedCard.total_score || 0}</span>
                          </div>
                          <div className="flex justify-between flex-wrap">
                            <span className="text-gray-700 font-medium">Average:</span>
                            <span className="font-bold text-black">{selectedCard.average_score?.toFixed(2) || '0'}%</span>
                          </div>
                          <div className="flex justify-between flex-wrap">
                            <span className="text-gray-700 font-medium">Grade:</span>
                            <span className={getOverallGradeTextColor(selectedCard.overall_grade)}>
                              {selectedCard.overall_grade} - {getOverallGradeRemark(selectedCard.overall_grade)}
                            </span>
                          </div>
                          <div className="flex justify-between flex-wrap">
                            <span className="text-gray-700 font-medium">Subjects:</span>
                            <span className="font-bold text-black">{selectedCard.subjects_data?.length || 0}</span>
                          </div>
                          {selectedCard.subjects_data && selectedCard.subjects_data.length > 0 && (
                            <>
                              <div className="flex justify-between text-emerald-700 pt-1 border-t border-gray-300 flex-wrap print:pt-0.5">
                                <span className="flex items-center gap-1 font-medium">
                                  <TrendingUp className="h-3 w-3 print:h-2 print:w-2" /> Best:
                                </span>
                                <span className="font-bold text-right break-words max-w-[140px]">
                                  {selectedCard.subjects_data.reduce((a, b) => a.total > b.total ? a : b).name} ({selectedCard.subjects_data.reduce((a, b) => a.total > b.total ? a : b).total})
                                </span>
                              </div>
                              <div className="flex justify-between text-red-600 flex-wrap">
                                <span className="flex items-center gap-1 font-medium">
                                  <TrendingDown className="h-3 w-3 print:h-2 print:w-2" /> Improve:
                                </span>
                                <span className="font-bold text-right break-words max-w-[140px]">
                                  {selectedCard.subjects_data.reduce((a, b) => a.total < b.total ? a : b).name}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Affective Domain */}
                      <div className="border-2 border-blue-900 w-full box-border">
                        <div className="bg-blue-700 text-white text-[9px] font-bold px-2.5 py-1 uppercase print:px-2 print:py-0.5 print:text-[8px]">Affective Domain</div>
                        <div className="p-2 text-[10px] space-y-0.5 print:p-1.5 print:text-[8px] print:space-y-0">
                          {(selectedCard.behavior_ratings || [
                            { name: 'Honesty', rating: 4 }, { name: 'Neatness', rating: 4 },
                            { name: 'Obedience', rating: 4 }, { name: 'Orderliness', rating: 3 },
                            { name: 'Diligence', rating: 4 }, { name: 'Punctuality', rating: 4 },
                            { name: 'Leadership', rating: 3 }, { name: 'Politeness', rating: 4 },
                          ]).map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                              <span className="text-gray-800 font-medium">{item.name}</span>
                              <span className="font-bold text-blue-700">{item.rating}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Psychomotor Skills */}
                      <div className="border-2 border-blue-900 w-full box-border">
                        <div className="bg-blue-700 text-white text-[9px] font-bold px-2.5 py-1 uppercase print:px-2 print:py-0.5 print:text-[8px]">Psychomotor Skills</div>
                        <div className="p-2 text-[10px] space-y-0.5 print:p-1.5 print:text-[8px] print:space-y-0">
                          {(selectedCard.skill_ratings || [
                            { name: 'Handwriting', rating: 4 }, { name: 'Verbal Fluency', rating: 4 },
                            { name: 'Sports', rating: 3 }, { name: 'Handling Tools', rating: 3 },
                            { name: 'Club Activities', rating: 4 },
                          ]).map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                              <span className="text-gray-800 font-medium">{item.name}</span>
                              <span className="font-bold text-green-700">{item.rating}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rating Key */}
                      <div className="border-2 border-blue-900 w-full box-border">
                        <div className="bg-blue-700 text-white text-[9px] font-bold px-2.5 py-1 uppercase print:px-2 print:py-0.5 print:text-[8px]">Rating Key</div>
                        <div className="p-2 text-[9px] space-y-0.5 print:p-1.5 print:text-[7px] print:space-y-0">
                          <div className="font-medium text-gray-800">5 - Excellent</div>
                          <div className="font-medium text-gray-800">4 - Very Good</div>
                          <div className="font-medium text-gray-800">3 - Good</div>
                          <div className="font-medium text-gray-800">2 - Fair</div>
                          <div className="font-medium text-gray-800">1 - Poor</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t-2 border-blue-900 mt-3 pt-1.5 text-center text-[9px] text-gray-600 print:mt-2 print:pt-1 print:text-[7px]">
                    Powered by Vincollins Portal | {schoolSettings.motto}
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
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            font-size: 10px !important;
            line-height: 1.4 !important;
            color: #000 !important;
          }
          .no-print { 
            display: none !important; 
          }
          @page { 
            size: A4 portrait; 
            margin: 0.4cm;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0.2cm !important;
            margin: 0 !important;
          }
          .print-report {
            border: none !important;
            padding: 0.2cm !important;
            min-height: auto !important;
            width: 100% !important;
            font-size: 10px !important;
          }
          .bg-blue-700, .bg-blue-600, .bg-purple-600 {
            background-color: #1e40af !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-emerald-600 { background-color: #059669 !important; }
          .bg-blue-600 { background-color: #2563eb !important; }
          .bg-cyan-600 { background-color: #0891b2 !important; }
          .bg-amber-600 { background-color: #d97706 !important; }
          .bg-red-600 { background-color: #dc2626 !important; }
          .border {
            border-color: #000 !important;
            border-width: 1px !important;
          }
          .border-2 {
            border-color: #000 !important;
            border-width: 2px !important;
          }
          table {
            table-layout: fixed !important;
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9px !important;
          }
          th, td {
            word-break: break-word !important;
            padding: 3px 4px !important;
            border-color: #000 !important;
            border-width: 1px !important;
          }
          th {
            font-weight: 700 !important;
            background-color: #1e40af !important;
            color: white !important;
            font-size: 9px !important;
          }
          .text-gray-800 { color: #1f2937 !important; }
          .text-black { color: #000 !important; }
          .font-bold { font-weight: 700 !important; }
          .font-semibold { font-weight: 600 !important; }
          .font-medium { font-weight: 500 !important; }
          .text-emerald-700 { color: #047857 !important; }
          .text-red-600 { color: #dc2626 !important; }
          .text-blue-700 { color: #1d4ed8 !important; }
          .text-cyan-700 { color: #0e7490 !important; }
          .text-amber-700 { color: #b45309 !important; }
          .text-purple-800 { color: #6b21a8 !important; }
          .text-blue-800 { color: #1e40af !important; }
          .text-gray-500 { color: #6b7280 !important; }
          .bg-purple-50 { background-color: #faf5ff !important; }
          .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-gray-50 { background-color: #f9fafb !important; }
          .bg-white { background-color: #ffffff !important; }
          .grid-cols-\\[70\\%_30\\%\\] {
            grid-template-columns: 67% 33% !important;
          }
          .gap-3 { gap: 8px !important; }
          .gap-4 { gap: 10px !important; }
          .space-y-2 > * + * { margin-top: 6px !important; }
          .space-y-3 > * + * { margin-top: 8px !important; }
          .space-y-1\\.5 > * + * { margin-top: 4px !important; }
          .mt-2 { margin-top: 6px !important; }
          .mt-3 { margin-top: 8px !important; }
          .mt-4 { margin-top: 10px !important; }
          .mb-2 { margin-bottom: 6px !important; }
          .mb-3 { margin-bottom: 8px !important; }
          .mb-4 { margin-bottom: 10px !important; }
          .p-2 { padding: 6px !important; }
          .p-3 { padding: 8px !important; }
          .p-4 { padding: 10px !important; }
          .px-2 { padding-left: 6px !important; padding-right: 6px !important; }
          .px-3 { padding-left: 8px !important; padding-right: 8px !important; }
          .py-1 { padding-top: 3px !important; padding-bottom: 3px !important; }
          .py-1\\.5 { padding-top: 4px !important; padding-bottom: 4px !important; }
          .py-2 { padding-top: 5px !important; padding-bottom: 5px !important; }
          h1 { font-size: 14px !important; font-weight: 700 !important; }
          h2 { font-size: 12px !important; font-weight: 700 !important; }
          .text-\\[18px\\] { font-size: 14px !important; }
          .text-\\[16px\\] { font-size: 12px !important; }
          .text-\\[14px\\] { font-size: 12px !important; }
          .text-\\[12px\\] { font-size: 11px !important; }
          .text-\\[11px\\] { font-size: 10px !important; }
          .text-\\[10px\\] { font-size: 9px !important; }
          .text-\\[9px\\] { font-size: 8px !important; }
          .text-\\[8px\\] { font-size: 8px !important; }
          .italic { font-style: italic !important; }
          .tracking-wide { letter-spacing: 0.025em !important; }
          .uppercase { text-transform: uppercase !important; }
          .break-words { word-break: break-word !important; }
          .w-full { width: 100% !important; }
          .text-center { text-align: center !important; }
          .text-left { text-align: left !important; }
          .text-right { text-align: right !important; }
          .font-mono { font-family: monospace !important; }
          .inline-block { display: inline-block !important; }
          .shrink-0 { flex-shrink: 0 !important; }
          .w-16 { width: 40px !important; }
          .w-14 { width: 36px !important; }
          .w-20 { width: 50px !important; }
          .h-14 { height: 36px !important; }
          .h-20 { height: 50px !important; }
          .h-24 { height: 60px !important; }
          .object-contain { object-fit: contain !important; }
          .object-cover { object-fit: cover !important; }
          .border-t { border-top-width: 1px !important; }
          .border-t-2 { border-top-width: 2px !important; }
          .border-b-2 { border-bottom-width: 2px !important; }
          .rounded-sm { border-radius: 2px !important; }
          .rounded-t { border-radius: 2px 2px 0 0 !important; }
          .rounded-b { border-radius: 0 0 2px 2px !important; }
          .overflow-hidden { overflow: hidden !important; }
        }
      `}</style>
    </div>
  )
}