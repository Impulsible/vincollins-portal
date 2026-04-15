/* eslint-disable @typescript-eslint/no-unused-vars */
// app/student/exams/page.tsx - FIXED VERSION
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  MonitorPlay, 
  FileText, 
  Award, 
  Clock, 
  AlertCircle,
  BookOpen,
  GraduationCap,
  Calendar,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Exam {
  id: string
  title: string
  subject: string
  class: string
  duration: number
  total_questions: number
  total_marks: number
  total_points?: number
  status: string
  description?: string
  instructions?: string
  passing_percentage?: number
  created_at: string
  starts_at?: string
  ends_at?: string
  has_theory?: boolean
  proctoring_enabled?: boolean
}

interface StudentProfile {
  id: string
  full_name: string
  email: string
  class: string
  department: string
  vin_id?: string
  photo_url?: string
  admission_year?: number
}

// Subject mappings by department
const DEPARTMENT_SUBJECTS: Record<string, string[]> = {
  science: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Further Mathematics', 'English Language', 'Computer Science'],
  arts: ['Literature in English', 'Government', 'Christian Religious Studies', 'Islamic Religious Studies', 'Economics', 'Geography', 'History', 'French', 'Yoruba', 'Igbo', 'Hausa'],
  commercial: ['Commerce', 'Financial Accounting', 'Economics', 'Business Studies', 'Marketing', 'Office Practice'],
  technology: ['Computer Science', 'Data Processing', 'Technical Drawing', 'Basic Technology', 'Information Technology'],
  general: ['English Language', 'Mathematics', 'Civic Education', 'Social Studies', 'Basic Science']
}

export default function StudentExamsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exams, setExams] = useState<Exam[]>([])
  const [filteredExams, setFilteredExams] = useState<Exam[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])

  const loadExams = useCallback(async () => {
    setLoading(true)
    try {
      // FIXED: Use Supabase auth directly instead of custom session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
      }
      
      if (!session) {
        console.log('No session found, redirecting to portal')
        toast.error('Please log in to continue')
        router.push('/portal')
        return
      }

      const user = session.user
      console.log('✅ Session found:', user.email)

      // FIXED: Get profile from PROFILES table using auth ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        toast.error('Failed to load your profile')
        return
      }

      if (!profileData) {
        toast.error('Student profile not found')
        return
      }

      // Verify student role
      if (profileData.role !== 'student') {
        toast.error('Access denied. Student accounts only.')
        router.push('/portal')
        return
      }

      // Get VIN ID from users table
      const { data: userData } = await supabase
        .from('users')
        .select('vin_id')
        .eq('id', profileData.id)
        .maybeSingle()

      const studentProfile: StudentProfile = {
        id: profileData.id,
        full_name: profileData.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
        email: profileData.email,
        class: profileData.class || 'Not Assigned',
        department: profileData.department || 'General',
        vin_id: userData?.vin_id,
        photo_url: profileData.photo_url,
        admission_year: profileData.admission_year
      }

      setProfile(studentProfile)
      console.log('📚 Student Profile:', {
        name: studentProfile.full_name,
        class: studentProfile.class,
        department: studentProfile.department
      })

      // Load published exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (examsError) {
        console.error('Error loading exams:', examsError)
        toast.error('Failed to load exams')
        setExams([])
        setFilteredExams([])
        return
      }

      console.log(`📋 Loaded ${examsData?.length || 0} total published exams`)

      // FILTER 1: Filter by student's class
      const classFilteredExams = (examsData || []).filter(exam => {
        if (!exam.class) return true
        return exam.class === studentProfile.class
      })

      console.log(`📚 After class filter (${studentProfile.class}): ${classFilteredExams.length} exams`)

      // FILTER 2: Filter by department/subject
      let departmentFilteredExams = classFilteredExams

      if (studentProfile.class?.startsWith('SS') && studentProfile.department) {
        const deptLower = studentProfile.department.toLowerCase()
        let allowedSubjects: string[] = []
        
        if (deptLower.includes('science')) {
          allowedSubjects = DEPARTMENT_SUBJECTS.science
        } else if (deptLower.includes('art')) {
          allowedSubjects = DEPARTMENT_SUBJECTS.arts
        } else if (deptLower.includes('commercial')) {
          allowedSubjects = DEPARTMENT_SUBJECTS.commercial
        } else if (deptLower.includes('technology')) {
          allowedSubjects = DEPARTMENT_SUBJECTS.technology
        } else {
          allowedSubjects = DEPARTMENT_SUBJECTS.general
        }

        departmentFilteredExams = classFilteredExams.filter(exam => 
          allowedSubjects.includes(exam.subject)
        )

        console.log(`📚 After department filter: ${departmentFilteredExams.length} exams`)
      }

      setExams(departmentFilteredExams)
      setFilteredExams(departmentFilteredExams)

      // Extract available subjects for filter dropdown
      const subjects = [...new Set(departmentFilteredExams.map(e => e.subject))]
      setAvailableSubjects(subjects.sort())

    } catch (error) {
      console.error('Error loading exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadExams()
  }, [loadExams])

  // Filter exams by subject when subject filter changes
  useEffect(() => {
    if (selectedSubject === 'all') {
      setFilteredExams(exams)
    } else {
      setFilteredExams(exams.filter(e => e.subject === selectedSubject))
    }
  }, [selectedSubject, exams])

  // Filter exams by tab (all, available, upcoming)
  const getDisplayedExams = () => {
    const now = new Date()
    
    switch (activeTab) {
      case 'available':
        return filteredExams.filter(exam => {
          if (!exam.starts_at && !exam.ends_at) return true
          if (!exam.starts_at) return true
          return new Date(exam.starts_at) <= now
        })
      case 'upcoming':
        return filteredExams.filter(exam => {
          if (!exam.starts_at) return false
          return new Date(exam.starts_at) > now
        })
      default:
        return filteredExams
    }
  }

  const displayedExams = getDisplayedExams()

  const handleTakeExam = (examId: string) => {
    router.push(`/student/exam/${examId}`)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    router.push('/portal')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Always available'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExamAvailable = (exam: Exam) => {
    if (!exam.starts_at && !exam.ends_at) return true
    const now = new Date()
    if (exam.starts_at && new Date(exam.starts_at) > now) return false
    if (exam.ends_at && new Date(exam.ends_at) < now) return false
    return true
  }

  if (loading) {
    return (
      <>
        <Header onLogout={handleLogout} />
        <div className="min-h-screen flex items-center justify-center pt-20 bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading your exams...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header onLogout={handleLogout} />
      
      <main className="min-h-screen bg-gray-50 pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Header with Student Info */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My CBT Exams</h1>
                <p className="text-muted-foreground mt-1">
                  Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
                </p>
              </div>
              {profile && (
                <Badge variant="outline" className="text-sm py-2 px-4">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {profile.class} • {profile.department}
                </Badge>
              )}
            </div>
          </div>

          {/* Filter Info Alert */}
          {profile && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Filter className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Showing exams for <strong>{profile.class}</strong>
                {profile.department && profile.department !== 'General' && (
                  <> - <strong>{profile.department}</strong> department</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Subject Filter */}
          {availableSubjects.length > 1 && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filter by Subject:
              </label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedSubject === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => setSelectedSubject('all')}
                >
                  All Subjects ({exams.length})
                </Badge>
                {availableSubjects.map(subject => (
                  <Badge
                    key={subject}
                    variant={selectedSubject === subject ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject} ({exams.filter(e => e.subject === subject).length})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">
                All Exams ({filteredExams.length})
              </TabsTrigger>
              <TabsTrigger value="available">
                Available Now ({filteredExams.filter(e => isExamAvailable(e)).length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({filteredExams.filter(e => e.starts_at && new Date(e.starts_at) > new Date()).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Exams Grid */}
          {displayedExams.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-16">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <MonitorPlay className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No exams available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {activeTab === 'all' 
                    ? `There are no exams published for ${profile?.class} yet. Check back later!`
                    : activeTab === 'available'
                      ? 'No exams are currently available. Check the upcoming tab.'
                      : 'No upcoming exams scheduled. Check the available tab.'}
                </p>
                {selectedSubject !== 'all' && (
                  <Button 
                    variant="link" 
                    onClick={() => setSelectedSubject('all')}
                    className="mt-4"
                  >
                    Clear subject filter
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedExams.map((exam) => {
                const available = isExamAvailable(exam)
                
                return (
                  <Card 
                    key={exam.id} 
                    className={cn(
                      "hover:shadow-lg transition-all duration-300 border-0 shadow-sm",
                      !available && "opacity-75"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">{exam.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <BookOpen className="h-3 w-3" />
                            {exam.subject}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "ml-2",
                            available 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {available ? 'Available' : 'Upcoming'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            Class:
                          </span>
                          <span className="font-medium">{exam.class || 'All Classes'}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Duration:
                          </span>
                          <span className="font-medium">{exam.duration} minutes</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Questions:
                          </span>
                          <span className="font-medium">{exam.total_questions || 0}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            Total Marks:
                          </span>
                          <span className="font-medium">{exam.total_marks || exam.total_points || 0}</span>
                        </div>

                        {exam.starts_at && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Starts:
                            </span>
                            <span className="font-medium text-xs">{formatDate(exam.starts_at)}</span>
                          </div>
                        )}

                        {exam.proctoring_enabled && (
                          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                            <AlertCircle className="h-3 w-3" />
                            <span>Proctoring enabled - camera required</span>
                          </div>
                        )}

                        {exam.has_theory && (
                          <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 p-2 rounded-lg">
                            <FileText className="h-3 w-3" />
                            <span>Includes theory questions</span>
                          </div>
                        )}

                        <Button 
                          onClick={() => handleTakeExam(exam.id)}
                          disabled={!available}
                          className={cn(
                            "w-full mt-4",
                            available 
                              ? "bg-green-600 hover:bg-green-700" 
                              : "bg-gray-400 cursor-not-allowed"
                          )}
                        >
                          <MonitorPlay className="mr-2 h-4 w-4" />
                          {available ? 'Take Exam' : 'Not Available Yet'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  )
}