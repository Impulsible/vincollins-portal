// app/student/report-card/page.tsx - STUDENT REPORT CARD VIEW
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, Award, Download, Printer, Eye, FileText,
  GraduationCap, Calendar, TrendingUp, Target, Trophy,
  CheckCircle, Clock, AlertCircle, ChevronRight, BookOpen,
  RefreshCw, Sparkles, Shield, User, Mail, Phone, MapPin
} from 'lucide-react'

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

interface ReportCard {
  id: string
  student_id: string
  class: string
  term: string
  session_year: string
  subject_scores: SubjectScore[]
  teacher_comments: string
  status: string
  published_at: string
  principal_comments?: string
  attendance?: {
    totalDays: number
    presentDays: number
    absentDays: number
    percentage: number
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

interface TermOption {
  term: string
  session_year: string
  label: string
  available: boolean
}

export default function StudentReportCardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const [reportCard, setReportCard] = useState<ReportCard | null>(null)
  const [availableTerms, setAvailableTerms] = useState<TermOption[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [showPrintView, setShowPrintView] = useState(false)
  const [gradingScale, setGradingScale] = useState<any[]>([])
  const [schoolSettings, setSchoolSettings] = useState<any>(null)

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
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700"><FileText className="h-3 w-3 mr-1" />Draft</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>
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

  // Auth check
  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          console.log('No active session, redirecting to portal')
          if (isMounted) window.location.replace('/portal')
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

        if (isMounted) {
          setProfile({
            id: session.user.id,
            full_name: profileData.full_name || session.user.user_metadata?.full_name || 'Student',
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            email: profileData.email || session.user.email || '',
            class: profileData.class || 'Not Assigned',
            department: profileData.department || 'General',
            vin_id: profileData.vin_id,
            photo_url: profileData.photo_url,
            admission_year: profileData.admission_year
          })
          setAuthChecking(false)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        if (isMounted) setAuthChecking(false)
      }
    }

    checkAuth()
    return () => { isMounted = false }
  }, [router])

  // Load available terms
  const loadAvailableTerms = useCallback(async () => {
    if (!profile?.id) return
    
    try {
      const { data, error } = await supabase
        .from('report_cards')
        .select('term, session_year, status')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading terms:', error)
        return
      }

      const terms: TermOption[] = (data || []).map((rc: any) => ({
        term: rc.term,
        session_year: rc.session_year,
        label: `${getTermLabel(rc.term)} ${rc.session_year}`,
        available: rc.status === 'published'
      }))

      setAvailableTerms(terms)
      
      // Auto-select first published term
      const publishedTerm = terms.find(t => t.available)
      if (publishedTerm) {
        setSelectedTerm(`${publishedTerm.term}|${publishedTerm.session_year}`)
      } else if (terms.length > 0) {
        setSelectedTerm(`${terms[0].term}|${terms[0].session_year}`)
      }
    } catch (error) {
      console.error('Error loading terms:', error)
    }
  }, [profile?.id])

  // Load report card
  const loadReportCard = useCallback(async () => {
    if (!profile?.id || !selectedTerm) return
    
    setLoading(true)
    try {
      const [term, sessionYear] = selectedTerm.split('|')
      
      const { data: rcData, error: rcError } = await supabase
        .from('report_cards')
        .select('*')
        .eq('student_id', profile.id)
        .eq('term', term)
        .eq('session_year', sessionYear)
        .maybeSingle()

      if (rcError) {
        console.error('Error loading report card:', rcError)
        toast.error('Failed to load report card')
        return
      }

      if (rcData) {
        // Load grading scale
        const { data: settingsData } = await supabase
          .from('report_card_settings')
          .select('*')
          .eq('term', term)
          .eq('session_year', sessionYear)
          .maybeSingle()

        if (settingsData) {
          setGradingScale(settingsData.grading_scale || [])
          setSchoolSettings(settingsData)
        }

        // Calculate attendance
        const attendance = rcData.attendance_summary || { total_days: 0, present: 0, absent: 0 }
        const attendancePercentage = attendance.total_days > 0 
          ? Math.round((attendance.present / attendance.total_days) * 100) 
          : 0

        setReportCard({
          id: rcData.id,
          student_id: rcData.student_id,
          class: rcData.class,
          term: rcData.term,
          session_year: rcData.session_year,
          subject_scores: rcData.subject_scores || [],
          teacher_comments: rcData.teacher_comments || '',
          status: rcData.status,
          published_at: rcData.published_at,
          principal_comments: rcData.admin_comments,
          attendance: {
            totalDays: attendance.total_days || 0,
            presentDays: attendance.present || 0,
            absentDays: attendance.absent || 0,
            percentage: attendancePercentage
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
      } else {
        setReportCard(null)
      }
    } catch (error) {
      console.error('Error loading report card:', error)
      toast.error('Failed to load report card')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, selectedTerm])

  useEffect(() => {
    if (!authChecking && profile) {
      loadAvailableTerms()
    }
  }, [authChecking, profile, loadAvailableTerms])

  useEffect(() => {
    if (selectedTerm) {
      loadReportCard()
    }
  }, [selectedTerm, loadReportCard])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    window.location.replace('/portal')
  }

  const handlePrint = () => {
    setShowPrintView(true)
    setTimeout(() => {
      window.print()
      setShowPrintView(false)
    }, 100)
  }

  const handleDownloadPDF = async () => {
    toast.info('PDF download feature coming soon')
  }

  // Calculate overall statistics
  const calculateOverallStats = () => {
    if (!reportCard?.subject_scores.length) return null
    
    const scores = reportCard.subject_scores
    const totalScore = scores.reduce((sum, s) => sum + s.total, 0)
    const average = Math.round(totalScore / scores.length)
    
    let grade = 'F'
    if (average >= 80) grade = 'A'
    else if (average >= 70) grade = 'B'
    else if (average >= 60) grade = 'C'
    else if (average >= 50) grade = 'P'
    
    return { average, grade, totalSubjects: scores.length }
  }

  const overallStats = calculateOverallStats()

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

  const firstName = profile ? getFirstName(profile.full_name) : 'Student'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
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
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-primary/20 shadow-lg">
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
                
                <div className="flex gap-2">
                  {reportCard?.status === 'published' && (
                    <>
                      <Button variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button onClick={handleDownloadPDF} className="bg-emerald-600">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={loadReportCard}>
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
              className="mb-6"
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
                        {availableTerms.map((term) => (
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
                        ))}
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

            {/* Report Card Content */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="ml-3 text-slate-600">Loading report card...</span>
              </div>
            ) : reportCard ? (
              <div className={cn("space-y-6", showPrintView && "print-view")}>
                {/* Print View - School Header */}
                {showPrintView && (
                  <div className="print-only text-center mb-6">
                    <h1 className="text-2xl font-bold">VINCOLLINS COLLEGE</h1>
                    <p className="text-sm">123 Education Road, Ikeja, Lagos, Nigeria</p>
                    <p className="text-sm">Tel: +234 800 123 4567 | Email: info@vincollins.edu.ng</p>
                    <h2 className="text-xl font-bold mt-4">REPORT CARD</h2>
                    <p>{getTermLabel(reportCard.term)} - {reportCard.session_year}</p>
                  </div>
                )}

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
                          <span className="text-sm">Subjects: <strong>{reportCard.subject_scores.length}</strong></span>
                        </div>
                        {overallStats && (
                          <>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-slate-400" />
                              <span className="text-sm">Average: <strong className={getGradeColor(overallStats.grade)}>{overallStats.average}% ({overallStats.grade})</strong></span>
                            </div>
                          </>
                        )}
                        {reportCard.attendance && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-slate-400" />
                            <span className="text-sm">Attendance: <strong>{reportCard.attendance.percentage}%</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Scores Table */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                      Subject Performance
                    </CardTitle>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Subject</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold">CA1 (20%)</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold">CA2 (20%)</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold">Exam (60%)</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold">Total (100%)</th>
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
                              <Badge className={cn("text-xs", getGradeColor(subject.grade).replace('text', 'bg').replace('600', '100'))}>
                                <span className={getGradeColor(subject.grade)}>{subject.grade}</span>
                              </Badge>
                            </td>
                            <td className="text-center py-3 px-4 text-sm text-slate-600">{subject.remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Affective Traits & Psychomotor Skills */}
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
                            <Badge variant="outline">{value}</Badge>
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
                            <Badge variant="outline">{value}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Attendance Summary */}
                {reportCard.attendance && (
                  <Card className="border-0 shadow-sm bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Attendance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-2xl font-bold">{reportCard.attendance.totalDays}</p>
                          <p className="text-xs text-slate-500">Total Days</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{reportCard.attendance.presentDays}</p>
                          <p className="text-xs text-slate-500">Present</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                          <p className="text-2xl font-bold text-red-600">{reportCard.attendance.absentDays}</p>
                          <p className="text-xs text-slate-500">Absent</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{reportCard.attendance.percentage}%</p>
                          <p className="text-xs text-slate-500">Attendance Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Teacher & Principal Comments */}
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
                        "{reportCard.principal_comments || 'Keep up the good work!'}"
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
                  <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50">
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