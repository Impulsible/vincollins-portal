// components/admin/NotificationDropdown.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, X, CheckCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { markAsRead, markAllAsRead } from '@/lib/notifications'

export function NotificationDropdown() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    setNotifications(data || [])
    setUnreadCount(data?.filter(n => !n.read).length || 0)
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleClick = async (notif: any) => {
    await markAsRead(notif.id)
    setOpen(false)
    if (notif.link) router.push(notif.link)
    loadNotifications()
  }

  const handleMarkAll = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await markAllAsRead(session.user.id)
      loadNotifications()
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 hover:bg-slate-100 rounded-lg">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500">
            {unreadCount}
          </Badge>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <Button variant="ghost" size="sm" onClick={handleMarkAll} className="text-xs h-7">
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
            </Button>
          </div>
          <ScrollArea className="max-h-[400px]">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No notifications</p>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-slate-50 border-b last:border-0 transition-colors",
                    !n.read && "bg-blue-50/50"
                  )}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}