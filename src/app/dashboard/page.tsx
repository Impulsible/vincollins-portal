/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationPanel } from '@/components/cbt/notification-panel'
import { AssignmentCard } from '@/components/cbt/assignment-card'
import { ExamCard } from '@/components/cbt/exam-card'
import { 
  BookOpen, 
  Award, 
  CheckCircle,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalExams: number
  completedExams: number
  averageScore: number
  pendingAssignments: number
  upcomingExams: number
}

interface Exam {
  id: string
  title: string
  subject: string
  category: 'senior-science' | 'junior' | 'senior-arts'
  class: string
  duration: number
  total_questions: number
  status: 'published' | 'draft' | 'archived'
  instructions: string
  passing_score: number
  created_by: string
  is_practice?: boolean
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  status: 'pending' | 'submitted' | 'graded'
  subject: string
}

// Mock data for demo
const mockStats: DashboardStats = {
  totalExams: 12,
  completedExams: 8,
  averageScore: 78,
  pendingAssignments: 3,
  upcomingExams: 2
}

const mockExams: Exam[] = [
  {
    id: '1',
    title: 'Mathematics Mid-Term Exam',
    subject: 'Mathematics',
    category: 'senior-science',
    class: 'SS2',
    duration: 60,
    total_questions: 50,
    status: 'published',
    instructions: 'Answer all questions',
    passing_score: 50,
    created_by: 'teacher1'
  },
  {
    id: '2',
    title: 'Physics Practice Test',
    subject: 'Physics',
    category: 'senior-science',
    class: 'SS2',
    duration: 45,
    total_questions: 40,
    status: 'published',
    instructions: 'Practice questions',
    passing_score: 0,
    created_by: 'teacher2',
    is_practice: true
  }
]

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Exam Result Available',
    message: 'Your Mathematics exam results are now available',
    type: 'success',
    read: false,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'New Assignment',
    message: 'Physics assignment has been posted',
    type: 'info',
    read: false,
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
]

const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Physics Lab Report',
    description: 'Complete the lab report on mechanics',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    status: 'pending',
    subject: 'Physics'
  },
  {
    id: '2',
    title: 'Mathematics Problem Set',
    description: 'Solve problems from chapter 5',
    due_date: new Date(Date.now() - 86400000).toISOString(),
    status: 'pending',
    subject: 'Mathematics'
  }
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [stats, setStats] = useState<DashboardStats>(mockStats)
  const [recentExams, setRecentExams] = useState<Exam[]>(mockExams)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments)
  const [loading, setLoading] = useState(false)

  // Mock user for demo
  const user = session?.user || {
    id: 'user1',
    name: 'John Doe',
    email: 'john@vincollins.edu.ng',
    role: 'student'
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Don't redirect for demo, just use mock data
      console.log('Using mock data for demo')
    }
  }, [status, router])

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your academic journey today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Exams</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalExams}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed Exams</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedExams}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.averageScore}%</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Assignments</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingAssignments}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Exams */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Exams</CardTitle>
              </CardHeader>
              <CardContent>
                {recentExams.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No exams available</p>
                ) : (
                  <div className="space-y-4">
                    {recentExams.map((exam) => (
                      <ExamCard
                        key={exam.id}
                        exam={exam}
                        onStart={(id) => router.push(`/cbt/exams/${id}`)}
                        userRole={user?.role}
                      />
                    ))}
                  </div>
                )}
                {recentExams.length > 0 && (
                  <div className="mt-4 text-center">
                    <Link href="/cbt" className="text-primary text-sm hover:underline">
                      View all exams →
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No assignments</p>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onView={(id) => router.push(`/assignments/${id}`)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications Panel */}
          <div className="space-y-6">
            <NotificationPanel
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/cbt">
                  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Take an Exam</p>
                        <p className="text-xs text-gray-500">Start a new exam session</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/results">
                  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">View Results</p>
                        <p className="text-xs text-gray-500">Check your exam performance</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link href="/profile">
                  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Update Profile</p>
                        <p className="text-xs text-gray-500">Manage your account settings</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}