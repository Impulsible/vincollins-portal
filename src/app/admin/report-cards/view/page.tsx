// app/admin/report-cards/view/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  GraduationCap, Calendar, User, Hash, Mail, Phone, MapPin,
  Award, Star, TrendingUp, BookOpen, Heart, Clock,
  MessageSquare, PenTool, CheckCircle2, Download,
  Printer, Shield, Sparkles, ChevronLeft, Target,
  Loader2, FileText, Users, CheckCheck, AlertTriangle,
  School, BadgeCheck, Clock4, ArrowUpRight, ArrowLeft,
  Home, Send, XCircle, Camera, ImageIcon, RefreshCw,
  Eye, EyeOff, Maximize2, Minimize2, MoreVertical,
  Share2, Copy, FileDown, ZoomIn, ZoomOut
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ─── Types ────────────────────────────────────────────
interface SubjectData {
  name: string
  ca1?: number
  ca2?: number
  examObj?: number
  examTheory?: number
  ca: number
  exam: number
  total: number
  grade: string
  remark: string
}

interface BehaviorRating {
  name: string
  rating: number
}

interface SkillRating {
  name: string
  rating: number
}

interface AssessmentData {
  daysPresent?: number
  daysAbsent?: number
  totalDays?: number
}

interface ReportCardData {
  id: string
  student_id: string
  student_name: string
  student_vin: string
  student_admission_number?: string
  class: string
  term: string
  academic_year: string
  subjects_data: SubjectData[]
  average_score: number
  total_score: number
  grade: string
  teacher_comments: string
  principal_comments: string
  behavior_ratings?: BehaviorRating[]
  skill_ratings?: SkillRating[]
  assessment_data?: AssessmentData
  remarks?: string
  status: string
  generated_at?: string
  next_term_begins?: string
  approved_at?: string
  published_at?: string
  student_photo_url?: string
  class_teacher?: string
  principal_name?: string
}

interface SchoolSettings {
  name: string
  address: string
  phone: string
  email: string
  website: string
  logo_url?: string
  motto?: string
}

// ─── Constants ────────────────────────────────────────
const GRADE_SCALE = [
  { grade: 'A1', min: 75, max: 100, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Excellent' },
  { grade: 'B2', min: 70, max: 74, color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Very Good' },
  { grade: 'B3', min: 65, max: 69, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Good' },
  { grade: 'C4', min: 60, max: 64, color: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'Credit' },
  { grade: 'C5', min: 55, max: 59, color: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Credit' },
  { grade: 'C6', min: 50, max: 54, color: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Credit' },
  { grade: 'D7', min: 45, max: 49, color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pass' },
  { grade: 'E8', min: 40, max: 44, color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Pass' },
  { grade: 'F9', min: 0, max: 39, color: 'bg-red-50 text-red-700 border-red-200', label: 'Fail' },
]

const RATING_KEYS = [
  { value: 5, label: 'Very Good', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 4, label: 'Good', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 3, label: 'Average', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 2, label: 'Below Average', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 1, label: 'Poor', color: 'bg-red-100 text-red-700 border-red-200' },
]

const TERM_LABELS: Record<string, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term',
}

const DEFAULT_SCHOOL: SchoolSettings = {
  name: 'Demo International School Abuja',
  address: '1234 Unity Avenue, Wuse, Abuja, FCT, Nigeria',
  phone: '08033174228',
  email: 'info@demo.inlaps.cloud',
  website: 'demo.intalps.cloud',
  motto: 'Excellence in Education',
}

// ─── Helpers ──────────────────────────────────────────
const getGradeColor = (grade: string): string => {
  const scale = GRADE_SCALE.find(g => g.grade === grade)
  return scale?.color || 'bg-slate-50 text-slate-600 border-slate-200'
}

const getGradeLabel = (grade: string): string => {
  const scale = GRADE_SCALE.find(g => g.grade === grade)
  return scale?.label || ''
}

const getRatingColor = (rating: number): string => {
  const key = RATING_KEYS.find(k => k.value === rating)
  return key?.color || 'bg-slate-100 text-slate-600 border-slate-200'
}

const getRatingLabel = (rating: number): string => {
  const key = RATING_KEYS.find(k => k.value === rating)
  return key?.label || ''
}

const getRatingStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={cn(
        'h-3.5 w-3.5 transition-all duration-300',
        i < rating 
          ? 'text-amber-400 fill-amber-400 drop-shadow-sm' 
          : 'text-slate-200 fill-slate-100'
      )}
    />
  ))
}

const getOverallGrade = (avg: number): string => {
  if (avg >= 75) return 'A1'
  if (avg >= 70) return 'B2'
  if (avg >= 65) return 'B3'
  if (avg >= 60) return 'C4'
  if (avg >= 55) return 'C5'
  if (avg >= 50) return 'C6'
  if (avg >= 45) return 'D7'
  if (avg >= 40) return 'E8'
  return 'F9'
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><Send className="h-3 w-3 mr-1" /> Published</Badge>
    case 'approved':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>
    case 'generated':
      return <Badge className="bg-purple-100 text-purple-700 border-purple-200"><FileText className="h-3 w-3 mr-1" /> Generated</Badge>
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Main Component ───────────────────────────────────
export default function ViewReportCardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('student')
  const term = searchParams.get('term') || 'third'
  const year = searchParams.get('year') || '2025/2026'

  const [loading, setLoading] = useState(true)
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null)
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL)
  const [profile, setProfile] = useState<any>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showWatermark, setShowWatermark] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const containerRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)

  // ─── Init ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/login')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileData) setProfile(profileData)

        // Load school settings
        const { data: schoolData } = await supabase
          .from('school_settings')
          .select('*')
          .single()
        
        if (schoolData) {
          setSchoolSettings({
            name: schoolData.name || DEFAULT_SCHOOL.name,
            address: schoolData.address || DEFAULT_SCHOOL.address,
            phone: schoolData.phone || DEFAULT_SCHOOL.phone,
            email: schoolData.email || DEFAULT_SCHOOL.email,
            website: schoolData.website || DEFAULT_SCHOOL.website,
            logo_url: schoolData.logo_url,
            motto: schoolData.motto || DEFAULT_SCHOOL.motto,
          })
        }

        if (studentId) {
          await loadReportCard()
        }
      } catch (error) {
        console.error('Init error:', error)
        toast.error('Failed to initialize')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [studentId, term, year])

  // ─── Real-time Subscription ─────────────────────────
  useEffect(() => {
    if (!studentId) return

    // Subscribe to real-time updates for this student's report card
    const channel = supabase
      .channel(`report-card-${studentId}-${term}-${year}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_cards',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          console.log('Real-time update:', payload)
          const updatedCard = payload.new as ReportCardData
          if (updatedCard.term === term && updatedCard.academic_year === year) {
            setReportCard(prev => ({
              ...prev,
              ...updatedCard,
            }))
            toast.success('Report card updated in real-time!', {
              icon: <RefreshCw className="h-4 w-4" />,
              duration: 2000,
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setLiveStatus('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setLiveStatus('disconnected')
        } else {
          setLiveStatus('connecting')
        }
      })

    subscriptionRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [studentId, term, year])

  // ─── Load Report Card ──────────────────────────────
  const loadReportCard = useCallback(async () => {
    setLoading(true)
    try {
      // Load report card
      const { data: reportCardData, error: reportCardError } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', studentId)
        .eq('term', term)
        .eq('academic_year', year)
        .single()

      if (reportCardError) {
        if (reportCardError.code === 'PGRST116') {
          // No report card found, create empty template
          const { data: studentData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', studentId)
            .single()

          if (studentData) {
            setReportCard({
              id: '',
              student_id: studentId!,
              student_name: studentData.display_name || studentData.full_name || 'Student',
              student_vin: studentData.vin_id || '—',
              student_admission_number: studentData.admission_number || '—',
              class: studentData.class || '—',
              term: term,
              academic_year: year,
              subjects_data: [],
              average_score: 0,
              total_score: 0,
              grade: '—',
              teacher_comments: '',
              principal_comments: '',
              behavior_ratings: [],
              skill_ratings: [],
              remarks: '',
              status: 'pending',
              student_photo_url: studentData.photo_url || null,
            })
          }
        } else {
          throw reportCardError
        }
      } else if (reportCardData) {
        // Load student photo if available
        const { data: studentData } = await supabase
          .from('profiles')
          .select('photo_url, display_name, full_name, admission_number')
          .eq('id', studentId)
          .single()

        setReportCard({
          ...reportCardData,
          student_photo_url: studentData?.photo_url || null,
          student_name: studentData?.display_name || studentData?.full_name || reportCardData.student_name,
          student_admission_number: studentData?.admission_number || reportCardData.student_admission_number,
        })
      }
    } catch (error) {
      console.error('Error loading report card:', error)
      toast.error('Failed to load report card')
    } finally {
      setLoading(false)
    }
  }, [studentId, term, year])

  // ─── Actions ────────────────────────────────────────
  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    // Trigger PDF download - you can integrate jsPDF or react-pdf here
    toast.info('PDF download feature coming soon!')
  }

  const handleRefresh = async () => {
    await loadReportCard()
    toast.success('Report card refreshed')
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  // ─── Get Class Subjects (Empty Template) ────────────
  const getEmptySubjects = (className: string): SubjectData[] => {
    const subjects = className?.toUpperCase().startsWith('JSS') 
      ? [
          'English Studies', 'Mathematics', 'Basic Science', 'Basic Technology',
          'Social Studies', 'Civic Education', 'Business Studies', 'Information Technology',
          'Agricultural Science', 'Home Economics', 'PHE', 'CRS', 'French', 'Yoruba', 'CCA', 'Music', 'Security Education'
        ]
      : [
          'English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics',
          'Further Mathematics', 'Agricultural Science', 'Data Processing', 'Civic Education', 'Economics',
          'Literature in English', 'Government', 'CRS', 'Commerce', 'Financial Accounting', 'Geography'
        ]

    return subjects.map(name => ({
      name,
      ca: 0,
      exam: 0,
      total: 0,
      grade: '—',
      remark: '',
    }))
  }

  const getEmptyBehaviors = (): BehaviorRating[] => {
    return [
      { name: 'Honesty', rating: 0 },
      { name: 'Neatness', rating: 0 },
      { name: 'Obedience', rating: 0 },
      { name: 'Orderliness', rating: 0 },
      { name: 'Diligence', rating: 0 },
      { name: 'Empathy', rating: 0 },
      { name: 'Punctuality', rating: 0 },
      { name: 'Leadership', rating: 0 },
      { name: 'Politeness', rating: 0 },
    ]
  }

  const getEmptySkills = (): SkillRating[] => {
    return [
      { name: 'Handwriting', rating: 0 },
      { name: 'Verbal Fluency', rating: 0 },
      { name: 'Sports', rating: 0 },
      { name: 'Handling Tools', rating: 0 },
      { name: 'Club Activities', rating: 0 },
    ]
  }

  // ─── Prepare Display Data ───────────────────────────
  const displaySubjects = reportCard?.subjects_data?.length 
    ? reportCard.subjects_data 
    : reportCard?.class ? getEmptySubjects(reportCard.class) : []

  const displayBehaviors = reportCard?.behavior_ratings?.length 
    ? reportCard.behavior_ratings 
    : getEmptyBehaviors()

  const displaySkills = reportCard?.skill_ratings?.length 
    ? reportCard.skill_ratings 
    : getEmptySkills()

  const hasScores = displaySubjects.some(s => s.total > 0)
  const isGenerated = reportCard?.status === 'generated' || reportCard?.status === 'approved' || reportCard?.status === 'published'
  const canApprove = reportCard?.status === 'generated'
  const canPublish = reportCard?.status === 'approved'

  // ─── Loading State ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-6"
        >
          <GraduationCap className="h-16 w-16 text-blue-500" />
        </motion.div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Loading Report Card</h2>
        <p className="text-sm text-slate-500">Please wait while we fetch the student's data...</p>
        <div className="flex gap-1 mt-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-blue-400"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────
  return (
    <TooltipProvider>
      <div 
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 print:bg-white"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
      >
        {/* Top Navigation Bar */}
        <div className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {reportCard?.student_name || 'Student Report'}
                  </span>
                  {reportCard && getStatusBadge(reportCard.status)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Live Status Indicator */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        liveStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                        liveStatus === 'connecting' ? 'bg-amber-500' : 'bg-red-500'
                      )} />
                      <span className="text-[10px] text-slate-500">
                        {liveStatus === 'connected' ? 'Live' : liveStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Real-time updates {liveStatus}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                    disabled={zoomLevel <= 0.5}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs font-medium text-slate-600 min-w-[40px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                    disabled={zoomLevel >= 2}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Watermark Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowWatermark(!showWatermark)}
                    >
                      {showWatermark ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{showWatermark ? 'Hide' : 'Show'} Watermark</p>
                  </TooltipContent>
                </Tooltip>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-8 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 text-xs"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Print
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <MoreVertical className="h-3.5 w-3.5 mr-1" />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDownloadPDF}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleFullscreen}>
                      {isFullscreen ? (
                        <><Minimize2 className="h-4 w-4 mr-2" /> Exit Fullscreen</>
                      ) : (
                        <><Maximize2 className="h-4 w-4 mr-2" /> Fullscreen</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowWatermark(!showWatermark)}>
                      {showWatermark ? (
                        <><EyeOff className="h-4 w-4 mr-2" /> Hide Watermark</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-2" /> Show Watermark</>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Report Card Content */}
        <div className="max-w-5xl mx-auto px-4 py-6 print:py-0 print:px-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={reportCard?.id || 'empty'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Watermark */}
              {showWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                  <div className="relative">
                    {schoolSettings.logo_url ? (
                      <img
                        src={schoolSettings.logo_url}
                        alt="Watermark"
                        className="w-96 h-96 object-contain opacity-[0.03]"
                      />
                    ) : (
                      <GraduationCap className="w-96 h-96 text-slate-200 opacity-[0.04]" />
                    )}
                    <p className="text-6xl font-bold text-slate-200/10 text-center mt-4 select-none">
                      {schoolSettings.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Report Card Content */}
              <div className="relative z-10 space-y-4 sm:space-y-6">
                {/* School Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-5 sm:p-8 text-white print:rounded-none print:bg-white print:text-black print:border-b print:border-black"
                >
                  {/* Background Decorations */}
                  <div className="absolute inset-0 print:hidden">
                    <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
                  </div>

                  {/* Top Line */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-white to-amber-400 opacity-60 print:hidden" />

                  <div className="relative">
                    {/* School Info & Student Photo */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
                      {/* School Logo */}
                      <div className="flex-shrink-0">
                        {schoolSettings.logo_url ? (
                          <img
                            src={schoolSettings.logo_url}
                            alt="School Logo"
                            className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-2"
                          />
                        ) : (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg"
                          >
                            <School className="h-8 w-8 sm:h-10 sm:w-10 text-amber-300" />
                          </motion.div>
                        )}
                      </div>

                      {/* School Name */}
                      <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight print:text-black">
                          {schoolSettings.name}
                        </h1>
                        <p className="text-blue-200/70 text-xs mt-1 print:text-gray-600">
                          {schoolSettings.address}
                        </p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-1 text-xs text-blue-200/60 print:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {schoolSettings.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {schoolSettings.email}
                          </span>
                          {schoolSettings.motto && (
                            <span className="italic font-medium text-amber-300/80 print:text-gray-700">
                              "{schoolSettings.motto}"
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Student Photo */}
                      <div className="flex-shrink-0">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                          className="relative"
                        >
                          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-white/30 shadow-lg">
                            <AvatarImage src={reportCard?.student_photo_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xl sm:text-2xl font-bold">
                              {reportCard?.student_name ? getInitials(reportCard.student_name) : <User className="h-8 w-8" />}
                            </AvatarFallback>
                          </Avatar>
                          {!reportCard?.student_photo_url && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/30 rounded-full p-1">
                                <Camera className="h-4 w-4 text-white/70" />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-5 print:bg-black print:h-0.5" />

                    {/* Report Title */}
                    <div className="text-center">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Badge className="mb-3 bg-amber-500/20 text-amber-200 border border-amber-400/30 px-4 py-1 text-xs font-medium tracking-wider uppercase print:hidden">
                          <Award className="h-3 w-3 mr-1.5" />
                          Student Progress Report
                        </Badge>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight print:text-black">
                          Academic Performance Report
                        </h2>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Student Information */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:shadow-none print:border print:border-black"
                >
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 px-5 py-3 border-b border-slate-100 print:bg-gray-100">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-blue-500" />
                      Student Information
                    </h3>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Student Name', value: reportCard?.student_name || '—', icon: User },
                        { label: 'Admission No', value: reportCard?.student_admission_number || reportCard?.student_vin || '—', icon: Hash },
                        { label: 'Class', value: reportCard?.class || '—', icon: BookOpen },
                        { label: 'Term', value: `${TERM_LABELS[reportCard?.term || term] || term} ${reportCard?.academic_year || year}`, icon: Calendar },
                        { label: 'Days Present', value: `${reportCard?.assessment_data?.daysPresent || 0}/${reportCard?.assessment_data?.totalDays || (reportCard?.assessment_data?.daysPresent || 0) + (reportCard?.assessment_data?.daysAbsent || 0)}`, icon: CheckCircle2 },
                        { label: 'Next Term Begins', value: reportCard?.next_term_begins || 'TBD', icon: Clock },
                        { label: 'Class Teacher', value: reportCard?.class_teacher || '—', icon: User },
                        { label: 'Principal', value: reportCard?.principal_name || schoolSettings.name, icon: School },
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + i * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                              {item.label}
                            </p>
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {item.value}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Score Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  {[
                    {
                      label: 'Average Score',
                      value: hasScores ? `${(reportCard?.average_score || 0).toFixed(1)}%` : '—',
                      icon: TrendingUp,
                      bgColor: 'bg-violet-50',
                      textColor: 'text-violet-700',
                      borderColor: 'border-violet-200',
                    },
                    {
                      label: 'Total Score',
                      value: hasScores ? (reportCard?.total_score?.toString() || '0') : '—',
                      icon: Target,
                      bgColor: 'bg-blue-50',
                      textColor: 'text-blue-700',
                      borderColor: 'border-blue-200',
                    },
                    {
                      label: 'Overall Grade',
                      value: hasScores ? getOverallGrade(reportCard?.average_score || 0) : '—',
                      icon: Award,
                      bgColor: 'bg-emerald-50',
                      textColor: 'text-emerald-700',
                      borderColor: 'border-emerald-200',
                      isGrade: true,
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.55 + i * 0.08 }}
                      className={cn(
                        "relative overflow-hidden rounded-2xl border bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200",
                        item.borderColor
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', item.bgColor)}>
                          <item.icon className={cn('h-5 w-5', item.textColor)} />
                        </div>
                        {item.isGrade && hasScores && (
                          <Badge className={cn('text-xs font-bold px-3 py-1 border', getGradeColor(item.value))}>
                            {item.value}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-medium text-slate-500">{item.label}</p>
                        <p className={cn('text-2xl sm:text-3xl font-bold mt-0.5', item.isGrade ? item.textColor : 'text-slate-800')}>
                          {item.value}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Academic Performance Table */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:shadow-none print:border print:border-black"
                >
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 px-5 py-3 border-b border-slate-100 print:bg-gray-100">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Academic Performance
                      {!hasScores && (
                        <Badge className="text-[10px] bg-amber-100 text-amber-700 ml-2">
                          Awaiting Scores
                        </Badge>
                      )}
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200 bg-slate-50/80 print:bg-gray-200">
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                            Subjects
                          </th>
                          <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-600 w-16">
                            CA <span className="text-[9px] text-slate-400 font-normal">(40)</span>
                          </th>
                          <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-600 w-16">
                            Exam <span className="text-[9px] text-slate-400 font-normal">(60)</span>
                          </th>
                          <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-600 w-20">
                            Total <span className="text-[9px] text-slate-400 font-normal">(100)</span>
                          </th>
                          <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-600 w-16">
                            Grade
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displaySubjects.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-16">
                              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                              <p className="text-sm text-slate-500 font-medium">No subjects available</p>
                              <p className="text-xs text-slate-400 mt-1">Subject scores will appear here once submitted by teachers</p>
                            </td>
                          </tr>
                        ) : (
                          displaySubjects.map((subject, idx) => (
                            <motion.tr
                              key={subject.name}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.65 + idx * 0.02 }}
                              className={cn(
                                'group border-b border-slate-100 transition-all duration-200 hover:bg-blue-50/30',
                                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
                                subject.total > 0 && 'hover:shadow-sm'
                              )}
                            >
                              <td className="px-4 py-2.5">
                                <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                  {subject.name}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {subject.total > 0 ? (
                                  <span className="text-xs font-medium text-slate-600">{subject.ca}</span>
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {subject.total > 0 ? (
                                  <span className="text-xs font-medium text-slate-600">{subject.exam}</span>
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {subject.total > 0 ? (
                                  <span className="text-xs font-bold text-slate-800">{subject.total}</span>
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {subject.total > 0 ? (
                                  <Badge className={cn('text-[10px] font-bold px-2 py-0.5 border', getGradeColor(subject.grade))}>
                                    {subject.grade}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                {subject.total > 0 ? (
                                  <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                                    {subject.remark || getGradeLabel(subject.grade)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-300 italic">Awaiting submission</span>
                                )}
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Grade Scale */}
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 print:bg-gray-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Grade Scale
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {GRADE_SCALE.map((g) => (
                        <Badge
                          key={g.grade}
                          variant="outline"
                          className={cn(
                            'text-[9px] font-medium border',
                            g.color
                          )}
                        >
                          {g.grade}: {g.min}-{g.max} ({g.label})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Behaviour & Skills */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {/* Behaviour / Character Development */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:shadow-none print:border print:border-black">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 px-5 py-3 border-b border-slate-100 print:bg-gray-100">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-rose-500" />
                        Character Development
                      </h3>
                    </div>
                    <div className="p-5">
                      <div className="space-y-2">
                        {displayBehaviors.map((item, idx) => (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.75 + idx * 0.03 }}
                            className="flex items-center justify-between rounded-xl bg-slate-50/80 px-3 py-2 hover:bg-blue-50/50 transition-colors"
                          >
                            <span className="text-xs font-medium text-slate-700">{item.name}</span>
                            <div className="flex items-center gap-2">
                              {item.rating > 0 ? (
                                <>
                                  <Badge className={cn('text-[10px] font-medium border', getRatingColor(item.rating))}>
                                    {item.rating}/5
                                  </Badge>
                                  <div className="flex">{getRatingStars(item.rating)}</div>
                                </>
                              ) : (
                                <span className="text-xs text-slate-300 italic">Pending</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Skills & Abilities */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:shadow-none print:border print:border-black">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 px-5 py-3 border-b border-slate-100 print:bg-gray-100">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        Skills & Abilities
                      </h3>
                    </div>
                    <div className="p-5">
                      <div className="space-y-2">
                        {displaySkills.map((item, idx) => (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.85 + idx * 0.03 }}
                            className="flex items-center justify-between rounded-xl bg-slate-50/80 px-3 py-2 hover:bg-blue-50/50 transition-colors"
                          >
                            <span className="text-xs font-medium text-slate-700">{item.name}</span>
                            <div className="flex items-center gap-2">
                              {item.rating > 0 ? (
                                <>
                                  <Badge className={cn('text-[10px] font-medium border', getRatingColor(item.rating))}>
                                    {item.rating}/5
                                  </Badge>
                                  <div className="flex">{getRatingStars(item.rating)}</div>
                                </>
                              ) : (
                                <span className="text-xs text-slate-300 italic">Pending</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rating Key */}
                  <div className="sm:col-span-2 pt-3">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {RATING_KEYS.map((key) => (
                        <Badge
                          key={key.value}
                          variant="outline"
                          className={cn('text-[9px] font-medium border', key.color)}
                        >
                          {key.value} - {key.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Comments Section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {/* Teacher's Comment */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:shadow-none print:border print:border-black">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 px-5 py-3 border-b border-slate-100 print:bg-gray-100">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-blue-500" />
                        Teacher's Comment
                      </h3>
                    </div>
                    <div className="p-5">
                      <div className="relative rounded-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-4 border border-blue-100">
                        <MessageSquare className="absolute top-3 right-3 h-4 w-4 text-blue-300" />
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {reportCard?.teacher_comments || (
                            <span className="text-slate-400 italic">No comments yet. Teacher will provide feedback here.</span>
                          )}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 text-right">
                        — {reportCard?.class_teacher || 'Class Teacher'}
                      </p>
                    </div>
                  </div>

                  {/* Principal's Comment */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:shadow-none print:border print:border-black">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 px-5 py-3 border-b border-slate-100 print:bg-gray-100">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Award className="h-4 w-4 text-emerald-500" />
                        Principal's Comment
                      </h3>
                    </div>
                    <div className="p-5">
                      <div className="relative rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-4 border border-emerald-100">
                        <Star className="absolute top-3 right-3 h-4 w-4 text-emerald-300" />
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {reportCard?.principal_comments || (
                            <span className="text-slate-400 italic">Pending principal's review and comments.</span>
                          )}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 text-right">
                        — Principal
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-center pt-4 pb-8"
                >
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 print:border print:border-black">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <p className="text-xs font-medium text-amber-700">
                      Next Term Begins: <span className="font-bold">{reportCard?.next_term_begins || 'TBD'}</span>
                    </p>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] text-slate-400">
                      Generated: {reportCard?.generated_at ? new Date(reportCard.generated_at).toLocaleString() : 'Not yet generated'}
                    </p>
                    <p className="text-[9px] text-slate-300 print:hidden">
                      Status: {reportCard?.status || 'N/A'} • Real-time updates: {liveStatus}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            .no-print { display: none !important; }
            body { 
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page { 
              size: A4;
              margin: 1cm;
            }
          }
        `}</style>
      </div>
    </TooltipProvider>
  )
}