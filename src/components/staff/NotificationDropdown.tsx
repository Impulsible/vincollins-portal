// src/components/staff/NotificationDropdown.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Bell, CheckCheck, Trash2, Loader2, CheckCircle, Award, BookOpen, Dot
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string; title: string; message: string
  type?: 'exam_graded' | 'new_exam' | 'needs_grading' | 'general'
  read: boolean; created_at: string; link?: string
}

export function NotificationDropdown({ userId }: { userId: string }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.read).length)
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }, [userId])

  useEffect(() => { loadNotifications() }, [loadNotifications])
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const getIcon = (type?: string) => {
    switch (type) {
      case 'exam_graded': return <Award className="h-4 w-4 text-green-500" />
      case 'new_exam': return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'needs_grading': return <CheckCircle className="h-4 w-4 text-amber-500" />
      default: return <Bell className="h-4 w-4 text-slate-500" />
    }
  }

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  const handleClick = async (n: Notification) => {
    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    loadNotifications()
    if (n.link) router.push(n.link)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await supabase.from('notifications').delete().eq('id', id)
    loadNotifications()
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    loadNotifications()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs">
                <CheckCheck className="mr-1 h-3.5 w-3.5" /> Read all
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => router.push('/staff/notifications')} className="h-7 text-xs">
              View all
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-[350px]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left p-3 hover:bg-slate-50 transition-colors border-b last:border-b-0 flex gap-3",
                  !n.read && "bg-blue-50/50"
                )}
              >
                <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.read && <Dot className="h-4 w-4 text-blue-500 shrink-0" />}
                    <p className={cn("text-sm truncate", !n.read && "font-semibold")}>{n.title}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{getTimeAgo(n.created_at)}</p>
                </div>
                <div onClick={(e) => handleDelete(e, n.id)} className="shrink-0 self-start mt-1 opacity-60 hover:opacity-100 hover:text-red-500 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}