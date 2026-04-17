// app/staff/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CheckCircle, Award, BookOpen, Bell, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ============================================
// TYPE DEFINITIONS
// ============================================

interface Profile {
  id: string
  full_name?: string
  email?: string
  role?: string
  class?: string
  department?: string
  photo_url?: string
}

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type?: 'exam_graded' | 'new_exam' | 'needs_grading' | 'general'
  read: boolean
  created_at: string
  link?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profileData as Profile)

      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      
      setNotifications((notificationsData as Notification[]) || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      toast.success('Notification marked as read')
    } catch (error) {
      console.error('Error marking as read:', error)
      toast.error('Failed to update notification')
    }
  }

  const markAllAsRead = async () => {
    if (!profile) return
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile.id)
        .eq('read', false)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to update notifications')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', id)
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const clearAll = async () => {
    if (!profile) return
    try {
      await supabase.from('notifications').delete().eq('user_id', profile.id)
      setNotifications([])
      toast.success('All notifications cleared')
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast.error('Failed to clear notifications')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Logged out successfully')
    window.location.href = '/portal'
  }

  const filteredNotifications = notifications.filter((n: Notification) => {
    if (activeTab === 'unread') return !n.read
    if (activeTab === 'read') return n.read
    return true
  })

  const unreadCount = notifications.filter((n: Notification) => !n.read).length

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'exam_graded':
        return { icon: Award, color: 'text-green-600', bgColor: 'bg-green-100' }
      case 'new_exam':
        return { icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-100' }
      case 'needs_grading':
        return { icon: CheckCircle, color: 'text-orange-600', bgColor: 'bg-orange-100' }
      default:
        return { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100' }
    }
  }

  if (loading) {
    return (
      <>
        <Header onLogout={handleLogout} />
        <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header onLogout={handleLogout} />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-20 pb-8">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Stay updated with your activities and exam notifications
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearAll}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="bg-white p-1 rounded-xl shadow-sm border">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                All
                <Badge variant="secondary" className="ml-2 bg-white/20">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                Unread
                <Badge variant="secondary" className="ml-2 bg-white/20">
                  {unreadCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="read" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                Read
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {activeTab === 'all' ? 'No notifications' : 
                     activeTab === 'unread' ? 'No unread notifications' : 
                     'No read notifications'}
                  </h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? 'You\'re all caught up! New notifications will appear here.' 
                      : activeTab === 'unread' 
                        ? 'All your notifications have been read.' 
                        : 'You haven\'t read any notifications yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification: Notification) => {
                const { icon: IconComponent, color, bgColor } = getNotificationIcon(notification.type)
                
                return (
                  <Card 
                    key={notification.id} 
                    className={cn(
                      "transition-all hover:shadow-md border-0 shadow-sm",
                      !notification.read && "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-white"
                    )}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className={cn(
                          "h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center shrink-0",
                          bgColor
                        )}>
                          <IconComponent className={cn("h-5 w-5", color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className={cn(
                                "font-semibold text-gray-900",
                                !notification.read && "font-bold"
                              )}>
                                {notification.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-8 text-xs sm:text-sm"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Mark as read
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 text-xs sm:text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </main>
    </>
  )
}