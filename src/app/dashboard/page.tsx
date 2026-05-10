/* eslint-disable react/no-unescaped-entities */
 
'use client'

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Award, 
  CheckCircle,
  Calendar,
  Loader2,
  Clock,
  FileText,
  Bell,
  User,
  Settings,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalExams: number
  completedExams: number
  averageScore: number
  pendingAssignments: number
  upcomingExams: number
}

interface DashboardUser {
  id: string
  name: string
  firstName: string
  email: string
  role: string
}

// Mock data for demo
const mockStats: DashboardStats = {
  totalExams: 12,
  completedExams: 8,
  averageScore: 78,
  pendingAssignments: 3,
  upcomingExams: 2
}

// Simple notification type
interface SimpleNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

const mockNotifications: SimpleNotification[] = [
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
  },
  {
    id: '3',
    title: 'System Update',
    message: 'Portal maintenance scheduled for Sunday',
    type: 'warning',
    read: true,
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
]

// Simple notification panel component
function SimpleNotificationPanel({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead 
}: { 
  notifications: SimpleNotification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
}) {
  const unreadCount = notifications.filter(n => !n.read).length
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No notifications</p>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <div 
              key={notification.id}
              className={`p-3 rounded-lg transition-colors cursor-pointer ${
                notification.read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
              }`}
              onClick={() => onMarkAsRead(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!notification.read && (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function DashboardContent() {
  const router = useRouter()
  
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [stats] = useState<DashboardStats>(mockStats)
  const [notifications, setNotifications] = useState<SimpleNotification[]>(mockNotifications)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          console.log('No session found, using mock user for demo')
          setUser({
            id: 'user1',
            name: 'John Doe',
            firstName: 'John',
            email: 'john@vincollins.edu.ng',
            role: 'student'
          })
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          // Build name in LastName FirstName MiddleName order
          let fullName = ''
          let firstName = ''
          
          if (profile?.first_name) {
            const parts: string[] = []
            if (profile?.last_name) parts.push(profile.last_name)
            parts.push(profile.first_name)
            if (profile?.middle_name) parts.push(profile.middle_name)
            fullName = parts.join(' ').trim()
            firstName = profile.first_name.trim()
          }
          if (!fullName && profile?.display_name?.trim()) {
            fullName = profile.display_name.trim()
            firstName = fullName.split(' ')[0]
          }
          if (!fullName && profile?.full_name?.trim()) {
            fullName = profile.full_name.trim()
            firstName = fullName.split(' ')[0]
          }
          if (!fullName) {
            firstName = session.user.email?.split('@')[0] || 'User'
            fullName = firstName
          }
          
          setUser({
            id: session.user.id,
            name: fullName,
            firstName: firstName,
            email: session.user.email || '',
            role: profile?.role || 'student'
          })
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setUser({
          id: 'user1',
          name: 'John Doe',
          firstName: 'John',
          email: 'john@vincollins.edu.ng',
          role: 'student'
        })
      } finally {
        setAuthChecked(true)
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLogout={handleLogout} />
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

  // Get first name for greeting
  const greetingName = user?.firstName || user?.name?.split(' ')[0] || 'User'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={{
        id: user?.id || '',
        name: user?.name || 'User',
        firstName: user?.firstName || 'User',  // ✅ ADDED THIS
        email: user?.email || '',
        role: (user?.role === 'teacher' ? 'teacher' : user?.role === 'admin' ? 'admin' : 'student') as 'admin' | 'teacher' | 'student',
        isAuthenticated: true
      }} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {greetingName}!
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
                  <p className="text-sm font-medium text-gray-500">Completed</p>
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
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingAssignments}</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Mathematics Mid-Term</p>
                        <p className="text-sm text-gray-500">Completed • Score: 85%</p>
                      </div>
                    </div>
                    <Badge>Passed</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Physics Assignment</p>
                        <p className="text-sm text-gray-500">Due in 2 days</p>
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">Chemistry Lab Report</p>
                      <p className="text-sm text-gray-500">Due: April 18, 2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">English Essay</p>
                      <p className="text-sm text-gray-500">Due: April 20, 2026</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <SimpleNotificationPanel
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
                <Link href="/student">
                  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Student Dashboard</p>
                        <p className="text-xs text-gray-500">Access your full dashboard</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
                <Link href="/student?tab=profile">
                  <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Account Settings</p>
                        <p className="text-xs text-gray-500">Update your profile</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}