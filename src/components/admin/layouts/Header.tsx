/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/layouts/Header.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  ChevronDown,
  HelpCircle,
  Shield,
  UserCog,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
  darkMode: boolean
  toggleDarkMode: () => void
  adminProfile: any
  onProfileUpdate: (profile: any) => void
  notifications: any[]
  onMarkNotificationRead: (id: string) => void
  onSignOut?: () => void
}

export function Header({
  onMenuClick,
  darkMode,
  toggleDarkMode,
  adminProfile,
  onProfileUpdate,
  notifications,
  onMarkNotificationRead,
  onSignOut,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      )
    }
    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length
  const firstName = adminProfile?.full_name?.split(' ')[0] || 'Admin'
  const avatarLetter = adminProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Date & Time - Visible on mobile */}
          <div className="lg:hidden">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {currentDate}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentTime}
            </p>
          </div>

          {/* Search - Hidden on mobile */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 lg:w-96 rounded-xl border border-slate-200 bg-slate-50 pl-10 text-sm shadow-none transition-all focus-visible:border-primary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Mobile Search Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl md:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="h-32">
              <SheetHeader>
                <SheetTitle>Search</SheetTitle>
              </SheetHeader>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search dashboard..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border-slate-200 pl-10"
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-xl">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-0.5 -top-0.5 h-5 w-5 rounded-full bg-red-500 p-0 text-[10px] text-white">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-80 md:w-96 rounded-xl border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} unread
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <ScrollArea className="max-h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      onClick={() => onMarkNotificationRead(notif.id)}
                      className={cn(
                        'cursor-pointer p-3 transition-colors',
                        !notif.read && 'bg-primary/5'
                      )}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg',
                            notif.read ? 'bg-slate-100' : 'bg-primary/10'
                          )}
                        >
                          <Bell
                            className={cn(
                              'h-4 w-4',
                              notif.read ? 'text-slate-400' : 'text-primary'
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{notif.title}</p>
                          <p className="text-xs text-slate-500">{notif.message}</p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(notif.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer justify-center text-primary font-medium">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex rounded-xl"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <div className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Profile & Sign Out */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 md:gap-3 group">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    Hi, {firstName}
                  </p>
                  <p className="text-xs text-slate-500">{currentTime}</p>
                </div>

                <Avatar className="h-9 w-9 md:h-10 md:w-10 ring-2 ring-primary/15 group-hover:scale-[1.03] transition">
                  <AvatarImage src={adminProfile?.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-semibold">
                    {avatarLetter}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden md:block h-4 w-4 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 rounded-xl border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <DropdownMenuLabel>
                <div className="flex items-center gap-3 py-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={adminProfile?.photo_url} />
                    <AvatarFallback>{avatarLetter}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{adminProfile?.full_name || 'Admin'}</p>
                    <p className="text-xs text-slate-500">{adminProfile?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer md:hidden">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Sign Out - Visible on mobile in dropdown */}
              <DropdownMenuItem
                className="cursor-pointer text-red-600 hover:text-red-700 focus:text-red-700"
                onClick={onSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Sign Out Button (Quick access) */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 md:hidden dark:hover:bg-red-950/30"
            onClick={onSignOut}
            aria-label="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}