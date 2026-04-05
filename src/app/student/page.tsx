/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, BookOpen, Calendar, Clock, Trophy, User, LogOut, GraduationCap, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function StudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [stats, setStats] = useState({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    upcomingExams: 0
  })

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/portal')
        return
      }

      // Use the working function to get profile
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_profile_by_id', { p_user_id: session.user.id });

      if (profileError) {
        console.error('Profile error:', profileError)
        toast.error('Failed to load profile')
        router.push('/portal')
        return
      }

      if (!profileData) {
        console.error('No profile found')
        toast.error('Profile not found')
        router.push('/portal')
        return
      }

      if (profileData.role !== 'student') {
        router.push('/portal')
        return
      }

      setStudent(profileData)
      await loadStudentStats(session.user.id)
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function loadStudentStats(userId: string) {
    try {
      // Get submissions for this student
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', userId)

      const completedExams = submissions?.length || 0
      
      let averageScore = 0
      if (submissions && submissions.length > 0) {
        const totalScore = submissions.reduce((sum, s) => sum + (s.percentage || 0), 0)
        averageScore = Math.round(totalScore / submissions.length)
      }

      // Get available exams
      const { data: exams } = await supabase
        .from('exams')
        .select('*')
        .eq('status', 'published')
        .gte('end_date', new Date().toISOString())

      setStats({
        totalExams: exams?.length || 0,
        completedExams,
        averageScore,
        upcomingExams: exams?.filter(e => new Date(e.start_date) > new Date()).length || 0
      })

    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Student Portal
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {student?.full_name || 'Student'}!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{student?.class || 'Class not set'}</p>
                <p className="text-xs text-muted-foreground">{student?.department || 'No department'}</p>
              </div>
              <Button variant="ghost" onClick={handleLogout} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground">Hello, {student?.full_name?.split(' ')[0]}! 👋</h2>
          <p className="text-muted-foreground mt-1">Ready for your learning journey today?</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExams}</div>
              <p className="text-xs text-muted-foreground">Available exams</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Trophy className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedExams}</div>
              <p className="text-xs text-muted-foreground">Exams taken</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
              <p className="text-xs text-muted-foreground">Overall performance</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingExams}</div>
              <p className="text-xs text-muted-foreground">Scheduled exams</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium text-lg">{student?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{student?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium text-lg">{student?.class || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{student?.department || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Available Exams</h3>
                  <p className="text-sm text-muted-foreground">Take your pending exams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50">
                  <Trophy className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">My Results</h3>
                  <p className="text-sm text-muted-foreground">View your performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}