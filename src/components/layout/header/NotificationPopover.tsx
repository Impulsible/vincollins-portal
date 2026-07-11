// components/layout/header/NotificationPopover.tsx - COMPACT & PROFESSIONAL
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
    case 'exam_graded': return <Award className="h-3.5 w-3.5 text-green-500" />
    case 'new_exam': return <BookOpen className="h-3.5 w-3.5 text-blue-500" />
    case 'needs_grading': return <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
    case 'new_student': return <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
    default: return <Bell className="h-3.5 w-3.5 text-gray-500" />
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
        <button className="relative h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 flex items-center justify-center transition-colors">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        sideOffset={8}
        className="w-[340px] sm:w-[380px] p-0 rounded-xl shadow-xl border border-gray-200/80 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-[11px] text-gray-500 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllAsRead} className="text-[11px] h-7 px-2 hover:bg-gray-100">
              Mark all read
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[320px]">
          {notifications.length === 0 ? (
            <div className="py-10 text-center px-4">
              <div className="h-10 w-10 rounded-full bg-gray-100 mx-auto mb-2 flex items-center justify-center">
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No notifications</p>
              <p className="text-[11px] text-gray-400 mt-0.5">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "px-4 py-2.5 hover:bg-gray-50 cursor-pointer group relative transition-colors",
                    !n.read && "bg-blue-50/30 hover:bg-blue-50/50"
                  )}
                  onClick={() => { onMarkAsRead(n.id); onOpenChange(false); if (n.link) router.push(n.link) }}
                >
                  <div className="flex gap-2.5">
                    {/* Icon */}
                    <div className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      !n.read ? "bg-blue-100" : "bg-gray-100"
                    )}>
                      {getIcon(n.type)}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-[13px] font-medium leading-snug line-clamp-1",
                          !n.read ? "text-gray-900" : "text-gray-600"
                        )}>
                          {n.title}
                        </p>
                        {/* Unread dot */}
                        {!n.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onDelete(n.id) }}
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-gray-50/80">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[12px] h-8 font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-none"
            onClick={() => { onOpenChange(false); router.push(userRole === 'student' ? '/student/notifications' : '/staff/notifications') }}
          >
            View All Notifications
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
})