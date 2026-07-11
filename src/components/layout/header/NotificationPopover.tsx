// components/layout/header/NotificationPopover.tsx - MOBILE BOTTOM SHEET (WORKING)
'use client'

import { memo, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Award, BookOpen, AlertCircle, CheckCircle2, ChevronRight, Trash2, X } from 'lucide-react'
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

export const NotificationPopover = memo(function NotificationPopover({
  open, onOpenChange, notifications, unreadCount, userRole,
  onMarkAsRead, onMarkAllAsRead, onDelete
}: NotificationPopoverProps) {
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isMobile, open])

  // ═══════════════════════════════════════════════════
  // Shared list content
  // ═══════════════════════════════════════════════════
  const NotificationList = () => (
    <>
      {notifications.length === 0 ? (
        <div className="py-12 text-center px-4">
          <div className="h-12 w-12 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
            <Bell className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No notifications</p>
          <p className="text-xs text-gray-400 mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "px-4 py-3 hover:bg-gray-50 cursor-pointer group relative transition-colors",
                !n.read && "bg-blue-50/30 hover:bg-blue-50/50"
              )}
              onClick={() => {
                onMarkAsRead(n.id)
                onOpenChange(false)
                if (n.link) router.push(n.link)
              }}
            >
              <div className="flex gap-2.5">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  !n.read ? "bg-blue-100" : "bg-gray-100"
                )}>
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      "text-[13px] font-medium leading-snug line-clamp-2 break-words",
                      !n.read ? "text-gray-900" : "text-gray-600"
                    )}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed break-words">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <button
                className={cn(
                  "absolute right-2 top-2 p-1.5 rounded-full hover:bg-gray-200 transition-all",
                  "sm:opacity-0 sm:group-hover:opacity-100"
                )}
                onClick={(e) => { e.stopPropagation(); onDelete(n.id) }}
                aria-label="Delete notification"
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )

  // ═══════════════════════════════════════════════════
  // MOBILE: Bottom sheet
  // ═══════════════════════════════════════════════════
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => onOpenChange(!open)}
          className="relative h-8 w-8 rounded-full text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => onOpenChange(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                animation: 'notifFadeIn 0.2s ease-out',
              }}
            />

            {/* Bottom sheet */}
            <div
              style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 101,
                backgroundColor: 'white',
                borderTopLeftRadius: '1rem',
                borderTopRightRadius: '1rem',
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                animation: 'notifSlideUp 0.3s ease-out',
              }}
            >
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px', paddingBottom: '4px', flexShrink: 0 }}>
                <div style={{ height: '4px', width: '40px', borderRadius: '9999px', backgroundColor: '#d1d5db' }} />
              </div>

              {/* Header */}
              <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{unreadCount} unread</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onMarkAllAsRead}
                      className="text-xs h-8 px-2 hover:bg-gray-100"
                    >
                      Mark all read
                    </Button>
                  )}
                  <button
                    onClick={() => onOpenChange(false)}
                    className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Scrollable list */}
              <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
                <NotificationList />
              </div>

              {/* Footer */}
              <div className="border-t bg-gray-50/80 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm h-11 font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-none"
                  onClick={() => {
                    onOpenChange(false)
                    router.push(userRole === 'student' ? '/student/notifications' : '/staff/notifications')
                  }}
                >
                  View All Notifications
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Inline animations */}
            <style jsx>{`
              @keyframes notifFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes notifSlideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>
          </>
        )}
      </>
    )
  }

  // ═══════════════════════════════════════════════════
  // DESKTOP: Popover
  // ═══════════════════════════════════════════════════
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative h-9 w-9 lg:h-10 lg:w-10 rounded-full text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
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
        className="w-[380px] p-0 rounded-xl shadow-xl border border-gray-200/80 overflow-hidden"
      >
        <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-[11px] text-gray-500 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-[11px] h-7 px-2 hover:bg-gray-100"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          <NotificationList />
        </ScrollArea>

        <div className="border-t bg-gray-50/80">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[12px] h-8 font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-none"
            onClick={() => {
              onOpenChange(false)
              router.push(userRole === 'student' ? '/student/notifications' : '/staff/notifications')
            }}
          >
            View All Notifications
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
})