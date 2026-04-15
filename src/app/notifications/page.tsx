/* eslint-disable @typescript-eslint/no-unused-vars */
// app/notifications/page.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Bell,
  CheckCheck,
  Loader2,
  ArrowLeft,
  BookOpen,
  MonitorPlay,
  GraduationCap,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  user_id: string
  exam_id: string | null
  class: string | null
  subject: string | null
  created_at: string
}

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  photo_url?: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([])
  const [readNotifications, setReadNotifications] = useState<Notification[]>([])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState('unread')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const loadNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/portal')
        return
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setUser(profileData as UserProfile)
      }

      // Get notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const allNotifications = data || []
      setNotifications(allNotifications)
      setUnreadNotifications(allNotifications.filter(n => !n.read))
      setReadNotifications(allNotifications.filter(n => n.read))
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal')
  }

  const markAsRead = async (id: string) => {
    if (processingIds.has(id)) return
    
    setProcessingIds(prev => new Set(prev).add(id))
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) throw error

      // Update local state
      const updatedNotification = notifications.find(n => n.id === id)
      if (updatedNotification) {
        updatedNotification.read = true
      }
      
      setUnreadNotifications(prev => prev.filter(n => n.id !== id))
      setReadNotifications(prev => [updatedNotification!, ...prev.filter(n => n.id !== id)])
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (error) {
      console.error('Error marking as read:', error)
      toast.error('Failed to mark as read')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const markAllAsRead = async () => {
    if (unreadNotifications.length === 0) return
    
    try {
      const unreadIds = unreadNotifications.map(n => n.id)
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds)

      if (error) throw error

      // Update local state
      setReadNotifications(prev => [...unreadNotifications.map(n => ({ ...n, read: true })), ...prev])
      setUnreadNotifications([])
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (id: string) => {
    if (processingIds.has(id)) return
    
    setProcessingIds(prev => new Set(prev).add(id))
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== id))
      setUnreadNotifications(prev => prev.filter(n => n.id !== id))
      setReadNotifications(prev => prev.filter(n => n.id !== id))
      
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Navigate based on notification type and user role
    if (notification.type === 'exam_submission' && user?.role === 'admin') {
      router.push('/admin/exams')
    } else if (notification.type === 'exam_approved' && user?.role === 'teacher') {
      router.push('/staff/exams')
    } else if (notification.type === 'exam_rejected' && user?.role === 'teacher') {
      router.push('/staff/exams')
    } else if (notification.type === 'exam_available' && user?.role === 'student') {
      router.push('/student/exams')
    } else if (notification.exam_id) {
      if (user?.role === 'admin') {
        router.push(`/admin/exams/${notification.exam_id}`)
      } else if (user?.role === 'teacher') {
        router.push(`/staff/exams/${notification.exam_id}`)
      } else if (user?.role === 'student') {
        router.push(`/student/exams/${notification.exam_id}`)
      }
    }
  }

  const getTypeIcon = (type: string): React.ReactElement => {
    switch (type) {
      case 'exam_submission':
        return <FileText className="h-5 w-5" />
      case 'exam_approved':
        return <CheckCircle className="h-5 w-5" />
      case 'exam_rejected':
        return <XCircle className="h-5 w-5" />
      case 'exam_available':
        return <BookOpen className="h-5 w-5" />
      case 'exam_reminder':
        return <Clock className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getTypeBadge = (type: string): React.ReactElement => {
    switch (type) {
      case 'exam_submission':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">New Submission</Badge>
      case 'exam_approved':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>
      case 'exam_rejected':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Needs Revision</Badge>
      case 'exam_available':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Available Now</Badge>
      case 'exam_reminder':
        return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Reminder</Badge>
      default:
        return <Badge variant="outline">General</Badge>
    }
  }

  const formatTime = (date: string): string => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`
    
    return d.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getBackLink = (): string => {
    if (user?.role === 'admin') return '/admin'
    if (user?.role === 'teacher') return '/staff'
    if (user?.role === 'student') return '/student'
    return '/'
  }

  const currentNotifications = activeTab === 'unread' ? unreadNotifications : readNotifications

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header onLogout={handleLogout} />
        <main className="pt-20 pb-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="space-y-4">
              <Skeleton className="h-12 w-48" />
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header onLogout={handleLogout} />
      
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={getBackLink()}>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Notifications
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Stay updated with your exams and activities
                  </p>
                </div>
              </div>
              {unreadNotifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unread" className="relative">
                  Unread
                  {unreadNotifications.length > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white text-xs">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read">
                  Read
                </TabsTrigger>
              </TabsList>

              <TabsContent value="unread" className="mt-6">
                <NotificationList
                  notifications={unreadNotifications}
                  processingIds={processingIds}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                  getTypeIcon={getTypeIcon}
                  getTypeBadge={getTypeBadge}
                  formatTime={formatTime}
                />
              </TabsContent>

              <TabsContent value="read" className="mt-6">
                <NotificationList
                  notifications={readNotifications}
                  processingIds={processingIds}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                  getTypeIcon={getTypeIcon}
                  getTypeBadge={getTypeBadge}
                  formatTime={formatTime}
                  isReadTab
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

// Notification List Component Props Interface
interface NotificationListProps {
  notifications: Notification[]
  processingIds: Set<string>
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onClick: (notification: Notification) => void
  getTypeIcon: (type: string) => React.ReactElement
  getTypeBadge: (type: string) => React.ReactElement
  formatTime: (date: string) => string
  isReadTab?: boolean
}

// Notification List Component
function NotificationList({
  notifications,
  processingIds,
  onMarkAsRead,
  onDelete,
  onClick,
  getTypeIcon,
  getTypeBadge,
  formatTime,
  isReadTab = false
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No {isReadTab ? 'read' : 'unread'} notifications
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            {isReadTab ? 'Notifications you\'ve read will appear here' : 'You\'re all caught up!'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification, index) => (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              !notification.read && "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "p-3 rounded-full shrink-0",
                  !notification.read 
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}>
                  {getTypeIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0" onClick={() => onClick(notification)}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {notification.title}
                    </h4>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(notification.type)}
                    {notification.class && (
                      <Badge variant="outline" className="text-xs">
                        {notification.class}
                      </Badge>
                    )}
                    {notification.subject && (
                      <Badge variant="outline" className="text-xs">
                        {notification.subject}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        onMarkAsRead(notification.id)
                      }}
                      disabled={processingIds.has(notification.id)}
                    >
                      {processingIds.has(notification.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCheck className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(notification.id)
                    }}
                    disabled={processingIds.has(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onClick(notification)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}