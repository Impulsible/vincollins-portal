/* eslint-disable react/no-unescaped-entities */
 
// components/student/StudentSidebar.tsx - FULLY UPDATED WITH NAVIGATION
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, FileText, Award, Settings,
  LogOut, ChevronLeft, ChevronRight, GraduationCap,
  Calendar, Sparkles, TrendingUp, MonitorPlay, User,
  Bell, HelpCircle
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

interface StudentProfile {
  full_name?: string
  email?: string
  photo_url?: string | null
  class?: string
  vin_id?: string
  department?: string
  admission_year?: number
}

interface StudentSidebarProps {
  profile: StudentProfile | null
  onLogout: () => void
  collapsed: boolean
  onToggle: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

interface NavigationItem {
  id: string
  name: string
  icon: React.ElementType
  description: string
  route: string
  badge?: string
}

const primaryNavigation: NavigationItem[] = [
  { 
    id: 'overview', 
    name: 'Overview', 
    icon: LayoutDashboard,
    description: 'Dashboard & Stats',
    route: '/student'
  },
  { 
    id: 'exams', 
    name: 'My Exams', 
    icon: MonitorPlay,
    description: 'Take CBT & Theory',
    route: '/student/exams',
    badge: 'Available'
  },
  { 
    id: 'results', 
    name: 'Results', 
    icon: Award,
    description: 'View Performance',
    route: '/student/results'
  },
  { 
    id: 'assignments', 
    name: 'Assignments', 
    icon: FileText,
    description: 'Course Work',
    route: '/student/assignments'
  },
  { 
    id: 'attendance', 
    name: 'Attendance', 
    icon: Calendar,
    description: 'Track Presence',
    route: '/student/attendance'
  },
  { 
    id: 'courses', 
    name: 'My Courses', 
    icon: BookOpen,
    description: 'Learning Materials',
    route: '/student/courses'
  },
]

const secondaryNavigation: NavigationItem[] = [
  { 
    id: 'performance', 
    name: 'Performance', 
    icon: TrendingUp,
    description: 'Academic Progress',
    route: '/student/performance'
  },
  { 
    id: 'notifications', 
    name: 'Notifications', 
    icon: Bell,
    description: 'Updates & Alerts',
    route: '/student/notifications'
  },
  { 
    id: 'profile', 
    name: 'Profile', 
    icon: User,
    description: 'Account Details',
    route: '/student/profile'
  },
  { 
    id: 'settings', 
    name: 'Settings', 
    icon: Settings,
    description: 'Preferences',
    route: '/student/settings'
  },
  { 
    id: 'help', 
    name: 'Help & Support', 
    icon: HelpCircle,
    description: 'Get assistance',
    route: '/student/help'
  },
]

const formatDisplayName = (name?: string): string => {
  if (!name) return 'Student Name'
  
  let formatted = name.replace(/[._]/g, ' ')
  formatted = formatted.replace(/\s+/g, ' ').trim()
  formatted = formatted.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  return formatted
}

const getInitials = (name?: string): string => {
  if (!name) return 'ST'
  
  const formattedName = formatDisplayName(name)
  const names = formattedName.split(' ')
  
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }
  return names[0].slice(0, 2).toUpperCase()
}

const getFirstName = (name?: string): string => {
  if (!name) return 'Student'
  
  const formattedName = formatDisplayName(name)
  return formattedName.split(' ')[0]
}

export function StudentSidebar({ 
  profile, 
  onLogout, 
  collapsed, 
  onToggle, 
  activeTab, 
  setActiveTab,
}: StudentSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === '/student') {
      setActiveTab('overview')
    } else if (pathname?.startsWith('/student/exams')) {
      setActiveTab('exams')
    } else if (pathname?.startsWith('/student/results')) {
      setActiveTab('results')
    } else if (pathname?.startsWith('/student/assignments')) {
      setActiveTab('assignments')
    } else if (pathname?.startsWith('/student/attendance')) {
      setActiveTab('attendance')
    } else if (pathname?.startsWith('/student/courses')) {
      setActiveTab('courses')
    } else if (pathname?.startsWith('/student/performance')) {
      setActiveTab('performance')
    } else if (pathname?.startsWith('/student/notifications')) {
      setActiveTab('notifications')
    } else if (pathname?.startsWith('/student/profile')) {
      setActiveTab('profile')
    } else if (pathname?.startsWith('/student/settings')) {
      setActiveTab('settings')
    } else if (pathname?.startsWith('/student/help')) {
      setActiveTab('help')
    }
  }, [pathname, setActiveTab])

  const displayName = formatDisplayName(profile?.full_name)
  const firstName = getFirstName(profile?.full_name)
  const initials = getInitials(profile?.full_name)
  const avatarUrl = profile?.photo_url || undefined

  const handleLogoutClick = () => {
    setShowSignOutConfirm(true)
  }

  const confirmSignOut = () => {
    setShowSignOutConfirm(false)
    onLogout()
  }

  // UPDATED: Navigate to the correct route
  const handleNavClick = (tabId: string, route: string) => {
    console.log('🔄 Student Sidebar clicked:', tabId, '→', route)
    setActiveTab(tabId)
    router.push(route)
  }

  const renderNavItem = (item: NavigationItem) => {
    const isActive = activeTab === item.id
    const Icon = item.icon
    
    const buttonContent = (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id, item.route)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full group relative overflow-hidden",
          isActive 
            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25" 
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
          collapsed ? "justify-center" : ""
        )}
      >
        {!isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500" />
        )}
        
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-all duration-300",
          isActive ? "text-white" : "group-hover:scale-110 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
        )} />
        
        {!collapsed && (
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium block">{item.name}</span>
              {item.badge && (
                <Badge className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 border-amber-200">
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className={cn(
              "text-xs block truncate",
              isActive ? "text-emerald-100" : "text-slate-400 dark:text-slate-500"
            )}>
              {item.description}
            </span>
          </div>
        )}
      </button>
    )

    if (collapsed) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-slate-400">{item.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      )
    }

    return <div key={item.id}>{buttonContent}</div>
  }

  // Sidebar Content
  const sidebarContent = (
    <>
      <div className="pt-6" />
      
      {/* Logo Section */}
      <div className={cn(
        "relative px-5 pb-4 border-b border-slate-200 dark:border-slate-800",
        collapsed ? "flex justify-center" : ""
      )}>
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-30" />
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Vincollins College
              </h2>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Student Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className={cn(
        "relative px-5 py-5 border-b border-slate-200 dark:border-slate-800",
        "bg-gradient-to-b from-emerald-50/50 via-white to-transparent dark:from-emerald-950/20 dark:via-slate-900 dark:to-transparent",
        collapsed ? "flex justify-center" : ""
      )}>
        {collapsed ? (
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-30" />
            <Avatar className="h-12 w-12 ring-3 ring-white dark:ring-slate-900 shadow-xl">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1">
              <div className="relative h-3 w-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-30" />
                <Avatar className="h-16 w-16 ring-3 ring-white dark:ring-slate-900 shadow-xl">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1">
                  <div className="relative h-3.5 w-3.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Welcome back,
                </p>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight truncate">
                  {firstName}!
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {profile?.email || 'student@vincollins.edu.ng'}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] shadow-sm">
                  {profile?.vin_id || 'VIN-XXXXXX'}
                </Badge>
                {profile?.department && (
                  <Badge variant="outline" className="text-[10px]">
                    {profile.department}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Class</p>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {profile?.class || 'N/A'}
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Year</p>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    {profile?.admission_year || new Date().getFullYear()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Navigation */}
      <div className="px-3 py-3 space-y-1">
        {!collapsed && (
          <p className="px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Main
          </p>
        )}
        {primaryNavigation.map(renderNavItem)}
      </div>

      {!collapsed && <Separator className="mx-3 my-2 bg-slate-200 dark:bg-slate-800" />}

      {/* Secondary Navigation */}
      <div className="px-3 py-3 space-y-1">
        {!collapsed && (
          <p className="px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            Account
          </p>
        )}
        {secondaryNavigation.map(renderNavItem)}
      </div>

      {/* Sign Out Button */}
      <div className="p-3 mt-2 border-t border-slate-200 dark:border-slate-800">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={handleLogoutClick}
                className="w-full justify-center h-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 group rounded-lg transition-all"
              >
                <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p className="font-medium">Sign Out</p>
              <p className="text-xs text-slate-400">End your session</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            onClick={handleLogoutClick}
            className="w-full justify-start h-11 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 group rounded-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-950/50 transition-colors">
                <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium block">Sign Out</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  End your session
                </span>
              </div>
            </div>
          </Button>
        )}
      </div>

      <div className="h-4" />
    </>
  )

  return (
    <>
      <aside 
        className={cn(
          "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <TooltipProvider>
          <ScrollArea className="h-full">
            {sidebarContent}
          </ScrollArea>

          <button 
            onClick={onToggle} 
            className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all flex items-center justify-center hover:scale-110 group z-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-0 group-hover:opacity-10 transition-opacity" />
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            )}
          </button>
        </TooltipProvider>
      </aside>

      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              Sign Out?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to sign out of your account? You'll need to log in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSignOut}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md shadow-red-500/25"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default StudentSidebar