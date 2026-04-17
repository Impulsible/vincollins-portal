// components/NotificationBell.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, CheckCircle, Award, BookOpen, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  metadata: any
  created_at: string
}

interface NotificationBellProps {
  userId: string
  userRole: 'student' | 'teacher' | 'admin'
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'exam_graded':
      return <Award className="h-4 w-4 text-green-500" />
    case 'new_exam':
      return <BookOpen className="h-4 w-4 text-blue-500" />
    case 'needs_grading':
      return <AlertCircle className="h-4 w-4 text-orange-500" />
    case 'new_student':
      return <CheckCircle className="h-4 w-4 text-purple-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

export function NotificationBell({ userId, userRole }: NotificationBellProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!userId) return
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (!error && data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }, [userId])

  useEffect(() => {
    loadNotifications()
    
    // Real-time subscription for new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔔 New notification:', payload.new)
          loadNotifications()
        }
      )
      .subscribe()
    
    return () => {
      channel.unsubscribe()
    }
  }, [userId, loadNotifications])

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id)
    setOpen(false)
    
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const handleDelete = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 transition-all duration-300"
        >
          <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 bg-red-500 rounded-full text-white text-[8px] sm:text-[10px] lg:text-xs flex items-center justify-center font-bold"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        sideOffset={8}
        className="w-[320px] xs:w-[360px] sm:w-[400px] p-0 rounded-xl shadow-2xl border border-gray-100"
      >
        <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs h-7"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="max-h-[400px] sm:max-h-[450px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer group",
                    !notification.read && "bg-blue-50/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          !notification.read ? "text-gray-900" : "text-gray-600"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="ml-7 mt-1">
                      <span className="inline-block h-2 w-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                  
                  {/* Delete button (visible on hover) */}
                  <button
                    className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(notification.id)
                    }}
                  >
                    <span className="text-gray-400 hover:text-red-500 text-xs">✕</span>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-2 border-t border-gray-100">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => {
              setOpen(false)
              router.push(userRole === 'student' ? '/student/notifications' : '/staff/notifications')
            }}
          >
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}