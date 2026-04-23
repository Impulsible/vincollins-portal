// ============================================
// STUDENT REPORT CARD PAGE - FIXED
// ============================================

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, Award, Download, Printer, FileText,
  GraduationCap, Calendar, TrendingUp, Target,
  CheckCircle, Clock, AlertCircle, BookOpen,
  RefreshCw, Sparkles, User, XCircle, Home
} from 'lucide-react'

// ============================================
// INTERFACES
// ============================================

interface StudentProfile {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
  admission_year?: number
}

interface SubjectScore {
  subject: string
  ca1?: number
  ca2?: number
  exam?: number
  total: number
  grade: string
  remark: string
  position?: number
  classHighest?: number
  classLowest?: number
  classAverage?: number
}

interface ReportCard {
  id: string
  student_id: string
  class: string
  term: string
  session_year: string
  subject_scores: SubjectScore[]
  teacher_comments: string
  status: string
  published_at: string | null
  principal_comments?: string
  admin_comments?: string
  attendance_summary?: {
    total_days: number
    present: number
    absent: number
  }
  affective_traits?: {
    punctuality: string
    neatness: string
    politeness: string
    cooperation: string
    leadership: string
  }
  psychomotor_skills?: {
    handwriting: string
    sports: string
    crafts: string
    fluency: string
  }
}

interface TermOption {
  term: string
  session_year: string
  label: string
  available: boolean
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatProfileForHeader = (profile: StudentProfile | null) => {
  if (!profile) return undefined
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: 'student' as const,
    avatar: profile.photo_url || undefined,
    isAuthenticated: true
  }
}

const getFirstName = (fullName: string): string => {
  if (!fullName) return 'Student'
  return fullName.split(' ')[0]
}

const getInitials = (name: string): string => {
  if (!name) return 'S'
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

const getTermLabel = (term: string): string => {
  const terms: Record<string, string> = {
    'first': 'First Term',
    'second': 'Second Term',
    'third': 'Third Term'
  }
  return terms[term] || term
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>
    case 'approved':
      return <Badge className="bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
    case 'pending_approval':
      return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    case 'draft':
      return <Badge className="bg-gray-100 text-gray-700"><FileText className="h-3 w-3 mr-1" />Draft</Badge>
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-emerald-600'
    case 'B': return 'text-blue-600'
    case 'C': return 'text-amber-600'
    case 'P': return 'text-orange-600'
    case 'F': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StudentReportCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const [reportCard, setReportCard] = useState<ReportCard | null>(null)
  const [availableTerms, setAvailableTerms] = useState<TermOption[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [gradingScale, setGradingScale] = useState<any[]>([])
  const [schoolSettings, setSchoolSettings] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs to prevent infinite loops
  const termsLoadedRef = useRef(false)
  const isMountedRef = useRef(true)
  const initialLoadDoneRef = useRef(false)

  // ============================================
  // AUTH CHECK
  // ============================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          console.log('No active session, redirecting to portal')
          if (isMountedRef.current) window.location.replace('/portal')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (!profileData || profileData.role !== 'student') {
          toast.error('Access denied')
          router.push('/portal')
          return
        }

        // Get student-specific data
        const { data: studentData } = await supabase
          .from('students')
          .select('class, vin_id, department')
          .eq('id', session.user.id)
          .maybeSingle()

        if (isMountedRef.current) {
          setProfile({
            id: session.user.id,
            full_name: profileData.full_name || session.user.user_metadata?.full_name || 'Student',
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            email: profileData.email || session.user.email || '',
            class: studentData?.class || profileData.class || 'Not Assigned',
            department: studentData?.department || profileData.department || 'General',
            vin_id: studentData?.vin_id || profileData.vin_id,
            photo_url: profileData.photo_url,
            admission_year: profileData.admission_year
          })
          setAuthChecking(false)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        if (isMountedRef.current) setAuthChecking(false)
      }
    }

    checkAuth()
    return () => { isMountedRef.current = false }
  }, [router])

  // ============================================
  // LOAD AVAILABLE TERMS
  // ============================================
  const loadAvailableTerms = useCallback(async () => {
    if (!profile?.id) {
      if (isMountedRef.current) setLoading(false)
      return
    }
    
    if (termsLoadedRef.current) {
      if (isMountedRef.current) setLoading(false)
      return
    }
    
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('report_cards')
        .select('term, session_year, status, created_at')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        // Handle missing session_year column
        if (error.code === '42703') {
          console.warn('session_year column missing, deriving from created_at')
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('report_cards')
            .select('term, status, created_at')
            .eq('student_id', profile.id)
            .order('created_at', { ascending: false })

          if (fallbackError) {
            console.error('Error loading terms:', fallbackError)
            if (isMountedRef.current) {
              setError('Failed to load available terms')
              setLoading(false)
            }
            return
          }

          const terms: TermOption[] = (fallbackData || []).map((rc: any) => {
            const createdAt = new Date(rc.created_at)
            const year = createdAt.getFullYear()
            const month = createdAt.getMonth()
            const sessionYear = month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`
            
            return {
              term: rc.term,
              session_year: sessionYear,
              label: `${getTermLabel(rc.term)} ${sessionYear}`,
              available: rc.status === 'published'
            }
          })

          // Remove duplicates
          const uniqueTerms = terms.filter((term, index, self) => 
            index === self.findIndex(t => t.term === term.term && t.session_year === term.session_year)
          )

          if (isMountedRef.current) {
            setAvailableTerms(uniqueTerms)
            termsLoadedRef.current = true
            
            const publishedTerm = uniqueTerms.find(t => t.available)
            if (publishedTerm) {
              setSelectedTerm(`${publishedTerm.term}|${publishedTerm.session_year}`)
            } else if (uniqueTerms.length > 0) {
              setSelectedTerm(`${uniqueTerms[0].term}|${uniqueTerms[0].session_year}`)
            }
            setLoading(false)
          }
          return
        }
        
        console.error('Error loading terms:', error)
        if (isMountedRef.current) {
          setError('Failed to load available terms')
          setLoading(false)
        }
        return
      }

      // Normal processing
      const terms: TermOption[] = (data || []).map((rc: any) => {
        let sessionYear = rc.session_year
        if (!sessionYear && rc.created_at) {
          const createdAt = new Date(rc.created_at)
          const year = createdAt.getFullYear()
          const month = createdAt.getMonth()
          sessionYear = month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`
        }
        
        return {
          term: rc.term,
          session_year: sessionYear || '2024/2025',
          label: `${getTermLabel(rc.term)} ${sessionYear || '2024/2025'}`,
          available: rc.status === 'published'
        }
      })

      // Remove duplicates
      const uniqueTerms = terms.filter((term, index, self) => 
        index === self.findIndex(t => t.term === term.term && t.session_year === term.session_year)
      )

      if (isMountedRef.current) {
        setAvailableTerms(uniqueTerms)
        termsLoadedRef.current = true
        
        const publishedTerm = uniqueTerms.find(t => t.available)
        if (publishedTerm) {
          setSelectedTerm(`${publishedTerm.term}|${publishedTerm.session_year}`)
        } else if (uniqueTerms.length > 0) {
          setSelectedTerm(`${uniqueTerms[0].term}|${uniqueTerms[0].session_year}`)
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading terms:', error)
      if (isMountedRef.current) {
        setError('Failed to load available terms')
        setLoading(false)
      }
    }
  }, [profile?.id])

  // ============================================
  // LOAD REPORT CARD
  // ============================================
  const loadReportCard = useCallback(async () => {
    if (!profile?.id || !selectedTerm) {
      return
    }
    
    if (isMountedRef.current) {
      setLoading(true)
      setError(null)
    }
    
    try {
      const [term, sessionYear] = selectedTerm.split('|')
      
      const { data: rcData, error: rcError } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', profile.id)
        .eq('term', term)
        .maybeSingle()

      if (rcError) {
        console.error('Error loading report card:', rcError)
        if (isMountedRef.current) {
          setError('Failed to load report card')
          toast.error('Failed to load report card')
          setLoading(false)
        }
        return
      }

      if (rcData && isMountedRef.current) {
        // Load grading scale from settings
        const { data: settingsData } = await supabase
          .from('report_card_settings')
          .select('*')
          .eq('term', term)
          .maybeSingle()

        if (settingsData) {
          setGradingScale(settingsData.grading_scale || [])
          setSchoolSettings(settingsData)
        }

        const attendance = rcData.attendance_summary || { total_days: 0, present: 0, absent: 0 }
        
        // Ensure subject_scores is an array
        const subjectScores = Array.isArray(rcData.subject_scores) 
          ? rcData.subject_scores 
          : (rcData.subjects_data || [])

        setReportCard({
          id: rcData.id,
          student_id: rcData.student_id,
          class: rcData.class,
          term: rcData.term,
          session_year: rcData.session_year || sessionYear || '2024/2025',
          subject_scores: subjectScores,
          teacher_comments: rcData.teacher_comments || '',
          status: rcData.status,
          published_at: rcData.published_at || rcData.generated_at,
          principal_comments: rcData.principal_comments,
          admin_comments: rcData.admin_comments,
          attendance_summary: {
            total_days: attendance.total_days || 0,
            present: attendance.present || 0,
            absent: attendance.absent || 0
          },
          affective_traits: rcData.affective_traits || {
            punctuality: 'Good',
            neatness: 'Good',
            politeness: 'Good',
            cooperation: 'Good',
            leadership: 'Good'
          },
          psychomotor_skills: rcData.psychomotor_skills || {
            handwriting: 'Good',
            sports: 'Good',
            crafts: 'Good',
            fluency: 'Good'
          }
        })
        setLoading(false)
      } else if (isMountedRef.current) {
        setReportCard(null)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading report card:', error)
      if (isMountedRef.current) {
        setError('Failed to load report card')
        toast.error('Failed to load report card')
        setLoading(false)
      }
    }
  }, [profile?.id, selectedTerm])

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (!authChecking && profile && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true
      loadAvailableTerms()
    }
  }, [authChecking, profile, loadAvailableTerms])

  useEffect(() => {
    if (selectedTerm && profile) {
      loadReportCard()
    }
  }, [selectedTerm, profile, loadReportCard])

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    window.location.replace('/portal')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    toast.loading('Generating PDF...')
    
    try {
      // Create a printable version
      const printWindow = window.open('', '_blank')
      
      if (printWindow && reportCard) {
        const html = generatePrintableHTML(reportCard, profile)
        printWindow.document.write(html)
        printWindow.document.close()
        
        toast.success('PDF ready! Use Print → Save as PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const generatePrintableHTML = (reportCard: ReportCard, profile: StudentProfile | null) => {
    const overallStats = calculateOverallStats()
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Card - ${getTermLabel(reportCard.term)} ${reportCard.session_year}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #059669; padding-bottom: 20px; }
            .school-name { font-size: 28px; font-weight: bold; color: #059669; }
            .report-title { font-size: 18px; color: #666; margin: 10px 0; }
            .student-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f0f0f0; font-weight: bold; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
            .summary-card { padding: 20px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; border-radius: 8px; text-align: center; }
            .comments { margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
            .footer { margin-top: 40px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            .grade-A { color: #059669; font-weight: bold; }
            .grade-B { color: #2563eb; font-weight: bold; }
            .grade-C { color: #d97706; font-weight: bold; }
            .print-btn { margin-bottom: 20px; padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; }
            @media print {
              .print-btn { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
          
          <div class="header">
            <div class="school-name">Vincollins College</div>
            <div class="report-title">Academic Report Card</div>
            <div>${getTermLabel(reportCard.term)} - ${reportCard.session_year}</div>
          </div>
          
          <div class="student-info">
            <div><strong>Student Name:</strong> ${profile?.full_name || 'N/A'}</div>
            <div><strong>Class:</strong> ${reportCard.class}</div>
            <div><strong>VIN:</strong> ${profile?.vin_id || 'N/A'}</div>
            <div><strong>Department:</strong> ${profile?.department || 'General'}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>CA1</th>
                <th>CA2</th>
                <th>Exam</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              ${reportCard.subject_scores.map(s => `
                <tr>
                  <td>${s.subject}</td>
                  <td>${s.ca1 || '-'}</td>
                  <td>${s.ca2 || '-'}</td>
                  <td>${s.exam || '-'}</td>
                  <td><strong>${s.total}</strong></td>
                  <td class="grade-${s.grade}">${s.grade}</td>
                  <td>${s.remark || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-card">
              <div>Average Score</div>
              <div style="font-size: 32px; font-weight: bold;">${overallStats?.average || 0}%</div>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
              <div>Overall Grade</div>
              <div style="font-size: 32px; font-weight: bold;">${overallStats?.grade || 'N/A'}</div>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%);">
              <div>Total Subjects</div>
              <div style="font-size: 32px; font-weight: bold;">${overallStats?.totalSubjects || 0}</div>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);">
              <div>Attendance</div>
              <div style="font-size: 32px; font-weight: bold;">${reportCard.attendance_summary ? Math.round((reportCard.attendance_summary.present / reportCard.attendance_summary.total_days) * 100) || 0 : 0}%</div>
            </div>
          </div>
          
          <div class="comments">
            <h3>Class Teacher's Comment</h3>
            <p>"${reportCard.teacher_comments || 'No comment provided.'}"</p>
            
            ${reportCard.principal_comments ? `
              <h3 style="margin-top: 20px;">Principal's Comment</h3>
              <p>"${reportCard.principal_comments}"</p>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>Vincollins College - Official Report Card</p>
          </div>
        </body>
      </html>
    `
  }

  const handleRefresh = () => {
    termsLoadedRef.current = false
    initialLoadDoneRef.current = false
    setError(null)
    setLoading(true)
    setReportCard(null)
    setAvailableTerms([])
    setSelectedTerm('')
    
    if (profile) {
      loadAvailableTerms()
    }
    toast.success('Refreshing report card...')
  }

  const calculateOverallStats = () => {
    if (!reportCard?.subject_scores?.length) return null
    
    const scores = reportCard.subject_scores
    const totalScore = scores.reduce((sum, s) => sum + (s.total || 0), 0)
    const average = Math.round(totalScore / scores.length)
    
    let grade = 'F'
    if (average >= 80) grade = 'A'
    else if (average >= 70) grade = 'B'
    else if (average >= 60) grade = 'C'
    else if (average >= 50) grade = 'P'
    
    return { average, grade, totalSubjects: scores.length }
  }

  const overallStats = calculateOverallStats()
  const attendancePercentage = reportCard?.attendance_summary?.total_days 
    ? Math.round((reportCard.attendance_summary.present / reportCard.attendance_summary.total_days) * 100)
    : 0

  // ============================================
  // RENDER LOADING STATE
  // ============================================
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        </div>
      </div>
    )
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 print:bg-white">
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <div className="flex">
        <StudentSidebar 
          profile={profile}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeTab="report-card"
          setActiveTab={() => {}}
        />

        <main className={cn(
          "flex-1 pt-16 lg:pt-20 pb-8 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>
          <div className="container mx-auto px-4 lg:px-6 py-6 max-w-7xl">
            
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-emerald-500/20 shadow-lg">
                    <AvatarImage src={profile?.photo_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-xl font-bold">
                      {profile?.full_name ? getInitials(profile.full_name) : 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Report Card
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      View and download your academic reports
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 print:hidden">
                  {reportCard?.status === 'published' && (
                    <>
                      <Button variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button onClick={handleDownloadPDF} className="bg-emerald-600 hover:bg-emerald-700">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Term Selector */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6 print:hidden"
            >
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium">Select Term:</span>
                    </div>
                    <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select a term" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTerms.length === 0 ? (
                          <div className="p-2 text-center text-sm text-gray-500">
                            No terms available
                          </div>
                        ) : (
                          availableTerms.map((term) => (
                            <SelectItem 
                              key={`${term.term}|${term.session_year}`} 
                              value={`${term.term}|${term.session_year}`}
                            >
                              <div className="flex items-center gap-2">
                                {term.label}
                                {!term.available && (
                                  <Badge variant="outline" className="text-yellow-600 text-[10px]">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    {reportCard && (
                      <div className="ml-auto">
                        {getStatusBadge(reportCard.status)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="ml-3 text-slate-600">Loading report card...</span>
              </div>
            ) : error ? (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="text-center py-16">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Error Loading Report Card
                  </h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : reportCard ? (
              <div className="space-y-6">
                {/* Student Info Card */}
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={profile?.photo_url || undefined} />
                          <AvatarFallback className="bg-emerald-600 text-white text-2xl">
                            {getInitials(profile?.full_name || 'S')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-lg">{profile?.full_name}</h3>
                          <p className="text-sm text-slate-500">VIN: {profile?.vin_id || 'N/A'}</p>
                          <Badge className="mt-1">{profile?.class}</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">Class: <strong>{reportCard.class}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">Term: <strong>{getTermLabel(reportCard.term)} {reportCard.session_year}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">Department: <strong>{profile?.department || 'General'}</strong></span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">Subjects: <strong>{reportCard.subject_scores?.length || 0}</strong></span>
                        </div>
                        {overallStats && (
                          <>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-slate-400" />
                              <span className="text-sm">Average: <strong className={getGradeColor(overallStats.grade)}>{overallStats.average}% ({overallStats.grade})</strong></span>
                            </div>
                            <Progress value={overallStats.average} className="h-2" />
                          </>
                        )}
                        {attendancePercentage > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">Attendance: <strong>{attendancePercentage}%</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Scores Table */}
                {reportCard.subject_scores && reportCard.subject_scores.length > 0 ? (
                  <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-emerald-600" />
                        Subject Performance
                      </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-semibold">Subject</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold">CA1</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold">CA2</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold">Exam</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold">Total</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold">Grade</th>
                            <th className="text-center py-3 px-4 text-sm font-semibold">Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportCard.subject_scores.map((subject, idx) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium">{subject.subject}</td>
                              <td className="text-center py-3 px-4">{subject.ca1 || '-'}</td>
                              <td className="text-center py-3 px-4">{subject.ca2 || '-'}</td>
                              <td className="text-center py-3 px-4">{subject.exam || '-'}</td>
                              <td className="text-center py-3 px-4 font-semibold">{subject.total}</td>
                              <td className="text-center py-3 px-4">
                                <Badge className={cn(
                                  "text-xs",
                                  subject.grade === 'A' && "bg-green-100",
                                  subject.grade === 'B' && "bg-blue-100",
                                  subject.grade === 'C' && "bg-amber-100",
                                  subject.grade === 'P' && "bg-orange-100",
                                  subject.grade === 'F' && "bg-red-100"
                                )}>
                                  <span className={getGradeColor(subject.grade)}>{subject.grade}</span>
                                </Badge>
                              </td>
                              <td className="text-center py-3 px-4 text-sm text-slate-600">{subject.remark || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No subject scores available</p>
                    </CardContent>
                  </Card>
                )}

                {/* Traits Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Affective Traits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportCard.affective_traits && Object.entries(reportCard.affective_traits).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                            <Badge variant="outline">{value as string}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Psychomotor Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportCard.psychomotor_skills && Object.entries(reportCard.psychomotor_skills).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                            <Badge variant="outline">{value as string}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Comments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Class Teacher's Comment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 italic">
                        "{reportCard.teacher_comments || 'No comment provided.'}"
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Principal's Comment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 italic">
                        "{reportCard.principal_comments || reportCard.admin_comments || 'Keep up the good work!'}"
                      </p>
                      {schoolSettings?.principal_name && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="font-semibold">{schoolSettings.principal_name}</p>
                          <p className="text-xs text-slate-500">Principal</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Next Term Info */}
                {schoolSettings?.next_term_begins && (
                  <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 print:hidden">
                    <CardContent className="p-4 text-center">
                      <p className="text-emerald-700">
                        <Sparkles className="inline h-4 w-4 mr-1" />
                        Next Term Begins: <strong>{new Date(schoolSettings.next_term_begins).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="text-center py-16">
                  <Award className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No report card available
                  </h3>
                  <p className="text-muted-foreground">
                    {availableTerms.length === 0 
                      ? 'Your report card for this term has not been published yet.'
                      : 'Select a different term to view your report card.'}
                  </p>
                  {availableTerms.length === 0 && (
                    <Button onClick={() => router.push('/student')} variant="outline" className="mt-4">
                      <Home className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  )
}