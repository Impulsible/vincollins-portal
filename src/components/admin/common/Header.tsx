/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/common/Header.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Bell,
  Menu,
  Search,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  X,
  CheckCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  adminProfile: any
  notifications: any[]
  onMarkNotificationRead: (id: string) => void
  onProfileUpdate: (profile: any) => void
  onSignOut?: () => void // ADD THIS
}

export function Header({
  sidebarOpen,
  setSidebarOpen,
  adminProfile,
  notifications,
  onMarkNotificationRead,
  onSignOut, // ADD THIS
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useState(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  })

  const unreadCount = notifications.filter((n: any) => !n.read).length
  const adminName = adminProfile?.full_name || 'Administrator'
  const adminInitials = adminName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleMarkAllRead = () => {
    notifications.forEach((n: any) => {
      if (!n.read) {
        onMarkNotificationRead(n.id)
      }
    })
  }

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut()
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 md:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title */}
        <h1 className={cn(
          "text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
          isMobile && !sidebarOpen ? "block" : "hidden md:block"
        )}>
          Admin Dashboard
        </h1>

        {/* Search Bar - Desktop only */}
        <div className={cn(
          "hidden md:block transition-all duration-300",
          showSearch ? "w-80" : "w-10"
        )}>
          {showSearch ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students, staff, exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8"
                autoFocus
                onBlur={() => {
                  if (!searchQuery) {
                    setShowSearch(false)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSearch(false)
                    setSearchQuery('')
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full bg-red-500 p-0 text-xs text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <SheetTitle>Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="text-xs"
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    Mark all read
                  </Button>
                )}
              </div>
              <SheetDescription>
                Stay updated with important alerts and activities
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-100px)] pr-4">
              <div className="mt-4 space-y-2">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-center text-muted-foreground">
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  notifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md",
                        notification.read 
                          ? "bg-background" 
                          : "bg-primary/5 border-primary/20"
                      )}
                      onClick={() => onMarkNotificationRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "rounded-full p-2",
                          notification.read ? "bg-muted" : "bg-primary/10"
                        )}>
                          <Bell className={cn(
                            "h-4 w-4",
                            notification.read ? "text-muted-foreground" : "text-primary"
                          )} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2" aria-label="User menu">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={adminProfile?.photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  {adminInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate">
                {adminName.split(' ')[0]}
              </span>
              <ChevronDown className="hidden lg:block h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{adminName}</span>
                <span className="text-xs text-muted-foreground">{adminProfile?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && isMobile && (
        <div className="absolute inset-x-0 top-16 z-40 border-b bg-white p-4 shadow-lg dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
              autoFocus
              onBlur={() => {
                if (!searchQuery) {
                  setShowSearch(false)
                }
              }}
            />
            <button
              onClick={() => {
                setShowSearch(false)
                setSearchQuery('')
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header