// components/layout/header/NotificationPopover.tsx
'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Award, BookOpen, AlertCircle, CheckCircle2, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Notification } from './types'

const getIcon = (type: string) => {
  switch (type) {
    case 'exam_graded': return <Award className="h-4 w-4 text-green-500" />
    case 'new_exam': return <BookOpen className="h-4 w-4 text-blue-500" />
    case 'needs_grading': return <AlertCircle className="h-4 w-4 text-orange-500" />
    case 'new_student': return <CheckCircle2 className="h-4 w-4 text-purple-500" />
    default: return <Bell className="h-4 w-4 text-gray-500" />
  }
}

interface NotificationPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notifications: Notification[]
  unreadCount: number
  userRole?: string
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
}

export const NotificationPopover = memo(function NotificationPopover({
  open, onOpenChange, notifications, unreadCount, userRole,
  onMarkAsRead, onMarkAllAsRead, onDelete
}: NotificationPopoverProps) {
  const router = useRouter()

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 flex items-center justify-center">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 rounded-2xl shadow-2xl border-0">
        <div className="px-5 py-4 border-b bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}</p>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllAsRead} className="text-xs h-7">Mark all read</Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={cn("px-5 py-3 hover:bg-gray-50 cursor-pointer group relative", !n.read && "bg-blue-50/40")}
                onClick={() => { onMarkAsRead(n.id); onOpenChange(false); if (n.link) router.push(n.link) }}>
                <div className="flex gap-3">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", !n.read ? "bg-blue-100" : "bg-gray-100")}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", !n.read ? "text-gray-900" : "text-gray-600")}>{n.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
                <button className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200"
                  onClick={(e) => { e.stopPropagation(); onDelete(n.id) }}>
                  <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))
          )}
        </ScrollArea>
        <div className="p-3 border-t bg-gray-50/50 rounded-b-2xl">
          <Button variant="ghost" size="sm" className="w-full text-sm"
            onClick={() => { onOpenChange(false); router.push(userRole === 'student' ? '/student/notifications' : '/staff/notifications') }}>
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
})