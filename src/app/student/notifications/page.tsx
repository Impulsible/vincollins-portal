// app/staff/notifications/page.tsx - FULLY RESPONSIVE WITH PROPER SPACING (FIXED TYPES)
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CheckCircle, Award, BookOpen, Bell, Trash2, ChevronRight, Home } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

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

// ✅ FIXED: Header User type with firstName
interface HeaderUser {
  id: string
  name: string
  firstName: string  // ✅ ADD THIS
  email: string
  role: 'admin' | 'student' | 'teacher'
  avatar?: string
  isAuthenticated: boolean
}

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    setMounted(true)
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
        return { icon: Award, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Exam Graded' }
      case 'new_exam':
        return { icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'New Exam' }
      case 'needs_grading':
        return { icon: CheckCircle, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Needs Grading' }
      default:
        return { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'General' }
    }
  }

  // ✅ FIXED: Properly typed header user
  const formatProfileForHeader = (profile: Profile | null): HeaderUser | undefined => {
    if (!profile) return undefined
    
    const headerRole = profile.role === 'staff' ? 'teacher' as const : 'student' as const
    
    return {
      id: profile.id,
      name: profile.full_name || 'Staff',
      firstName: profile.full_name?.split(' ')[0] || 'User',  // ✅ ADD THIS
      email: profile.email || '',
      role: headerRole,
      avatar: profile.photo_url || undefined,
      isAuthenticated: true
    }
  }

  if (!mounted || loading) {
    return (
      <>
        <Header onLogout={handleLogout} />
        <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-12 w-12 sm:h-14 sm:w-14 text-primary mx-auto" />
            </motion.div>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg">Loading notifications...</p>
            <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">Fetching your updates</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header user={formatProfileForHeader(profile)} onLogout={handleLogout} />
      
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
          
          {/* Breadcrumb Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 sm:mb-5 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
          >
            <Link href="/staff" className="hover:text-primary flex items-center gap-1">
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Dashboard</span>
            </Link>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="text-foreground font-medium">Notifications</span>
          </motion.div>

          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 sm:mb-7"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    Notifications
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Stay updated with your activities and exam notifications
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    <span className="hidden xs:inline">Mark all read</span>
                    <span className="xs:hidden">Read all</span>
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAll}
                    className="h-8 sm:h-9 text-xs sm:text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    <span className="hidden xs:inline">Clear all</span>
                    <span className="xs:hidden">Clear</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Unread Summary */}
            {unreadCount > 0 && (
              <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                  You have <span className="font-bold">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </motion.div>

          {/* Tabs */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-5 sm:mb-6"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-card p-1 rounded-xl shadow-sm border w-full sm:w-auto">
                <TabsTrigger 
                  value="all" 
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 flex-1 sm:flex-initial px-3 sm:px-4"
                >
                  All
                  <Badge variant="secondary" className="ml-1.5 sm:ml-2 bg-background/20 text-inherit text-[10px] sm:text-xs">
                    {notifications.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="unread" 
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 flex-1 sm:flex-initial px-3 sm:px-4"
                >
                  Unread
                  <Badge variant="secondary" className="ml-1.5 sm:ml-2 bg-background/20 text-inherit text-[10px] sm:text-xs">
                    {unreadCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="read" 
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 flex-1 sm:flex-initial px-3 sm:px-4"
                >
                  Read
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Notifications List */}
          <AnimatePresence mode="wait">
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-8 sm:p-12 lg:p-16 text-center">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                      {activeTab === 'all' ? 'No notifications' : 
                       activeTab === 'unread' ? 'No unread notifications' : 
                       'No read notifications'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                      {activeTab === 'all' 
                        ? 'You\'re all caught up! New notifications will appear here.' 
                        : activeTab === 'unread' 
                          ? 'All your notifications have been read.' 
                          : 'You haven\'t read any notifications yet.'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2 sm:space-y-3"
              >
                {filteredNotifications.map((notification: Notification, index: number) => {
                  const { icon: IconComponent, color, bgColor, label } = getNotificationIcon(notification.type)
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card 
                        className={cn(
                          "group relative overflow-hidden transition-all duration-300 hover:shadow-md border-0 shadow-sm",
                          !notification.read && "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-card dark:from-blue-950/20"
                        )}
                      >
                        {/* Unread Indicator Dot */}
                        {!notification.read && (
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                            <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-blue-500"></span>
                            </span>
                          </div>
                        )}
                        
                        <CardContent className="p-3 sm:p-4 lg:p-5">
                          <div className="flex items-start gap-3 sm:gap-4">
                            {/* Icon */}
                            <div className={cn(
                              "h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                              bgColor
                            )}>
                              <IconComponent className={cn("h-5 w-5", color)} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className={cn(
                                      "font-semibold text-sm sm:text-base",
                                      !notification.read && "font-bold",
                                      "text-foreground"
                                    )}>
                                      {notification.title}
                                    </h3>
                                    <Badge variant="outline" className="text-[10px] sm:text-xs font-normal">
                                      {label}
                                    </Badge>
                                  </div>
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-1.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>
                                <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-1 sm:pt-2 border-t border-border/50">
                                {!notification.read && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-7 sm:h-8 text-[10px] sm:text-xs"
                                  >
                                    <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                    Mark as read
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-7 sm:h-8 text-[10px] sm:text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Footer Info */}
          {filteredNotifications.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-5 sm:mt-6 text-center"
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Showing {filteredNotifications.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </>
  )
}