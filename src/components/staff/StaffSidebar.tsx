/* eslint-disable react/no-unescaped-entities */
// components/staff/StaffSidebar.tsx - NO LOADING STATE, OPENS IMMEDIATELY
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, BookOpen, FileText, Settings,
  LogOut, ChevronLeft, ChevronRight, GraduationCap,
  Sparkles, User, CalendarDays,
  Bell, HelpCircle, ClipboardList, Notebook
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

interface StaffProfile {
  id?: string
  full_name?: string
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string
  photo_url?: string | null
  avatar_url?: string | null
  department?: string
  role?: string
}

interface StaffSidebarProps {
  profile: StaffProfile | null
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

interface SidebarStats {
  studentCount: number
  examCount: number
}

const primaryNavigation: NavigationItem[] = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, description: 'Dashboard & Analytics', route: '/staff' },
  { id: 'exams', name: 'Exams', icon: BookOpen, description: 'Manage CBT & Theory', route: '/staff/exams' },
  { id: 'assignments', name: 'Assignments', icon: FileText, description: 'Student Tasks', route: '/staff/assignments' },
  { id: 'notes', name: 'Study Notes', icon: Notebook, description: 'Learning Materials', route: '/staff/notes' },
  { id: 'attendance', name: 'Attendance', icon: ClipboardList, description: 'Track Records', route: '/staff/attendance' },
  { id: 'students', name: 'Students', icon: User, description: 'Class Roster', route: '/staff/students' },
  { id: 'schedule', name: 'Schedule', icon: CalendarDays, description: 'Class Schedule', route: '/staff/schedule' },
]

const secondaryNavigation: NavigationItem[] = [
  { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Updates & Alerts', route: '/staff/notifications' },
  { id: 'profile', name: 'Profile', icon: User, description: 'Account Details', route: '/staff/profile' },
  { id: 'settings', name: 'Settings', icon: Settings, description: 'Preferences', route: '/staff/settings' },
  { id: 'help', name: 'Help & Support', icon: HelpCircle, description: 'Get assistance', route: '/staff/help' },
]

// Get first name from profile
const getFirstName = (profile?: StaffProfile | null): string => {
  if (profile?.first_name) {
    const firstName = profile.first_name.trim()
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
  }
  
  if (profile?.full_name) {
    const formattedName = profile.full_name.replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim()
    const firstName = formattedName.split(' ')[0]
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
  }
  
  return 'Teacher'
}

// Get display name
const getDisplayName = (profile?: StaffProfile | null): string => {
  if (profile?.display_name) {
    return profile.display_name
  }
  
  if (profile?.first_name && profile?.last_name) {
    const firstName = profile.first_name.trim()
    const lastName = profile.last_name.trim()
    return `${firstName} ${lastName}`.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  }
  
  if (profile?.full_name) {
    return profile.full_name
  }
  
  return 'Staff Member'
}

// Get initials for avatar
const getInitials = (profile?: StaffProfile | null): string => {
  const displayName = profile?.display_name || profile?.full_name || 'Teacher'
  const names = displayName.split(' ')
  
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase()
}

// Get role display
const getRoleDisplay = (role?: string): string => {
  if (role === 'admin') return 'Administrator'
  if (role === 'teacher' || role === 'staff') return 'Teacher'
  return 'Staff'
}

export function StaffSidebar({ 
  profile, 
  onLogout, 
  collapsed, 
  onToggle, 
  activeTab, 
  setActiveTab,
}: StaffSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  
  // Use the profile directly from props - no loading state
  const firstName = getFirstName(profile)
  const displayName = getDisplayName(profile)
  const initials = getInitials(profile)
  const avatarUrl = profile?.photo_url || undefined
  const userEmail = profile?.email || ''
  const userRole = profile?.role
  const department = profile?.department

  // Stats - initialize with empty values, they'll update when data loads
  const [stats, setStats] = useState<SidebarStats>({ studentCount: 0, examCount: 0 })

  // Fetch stats in background (doesn't block sidebar rendering)
  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return
      
      try {
        // Get student count
        const { count: studentsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')

        // Get exam count for this teacher
        const { count: examsCount } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', profile.id)

        setStats({
          studentCount: studentsCount || 0,
          examCount: examsCount || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [profile?.id])

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === '/staff') {
      setActiveTab('overview')
    } else if (pathname?.startsWith('/staff/exams')) {
      setActiveTab('exams')
    } else if (pathname?.startsWith('/staff/assignments')) {
      setActiveTab('assignments')
    } else if (pathname?.startsWith('/staff/notes')) {
      setActiveTab('notes')
    } else if (pathname?.startsWith('/staff/attendance')) {
      setActiveTab('attendance')
    } else if (pathname?.startsWith('/staff/students')) {
      setActiveTab('students')
    } else if (pathname?.startsWith('/staff/schedule')) {
      setActiveTab('schedule')
    } else if (pathname?.startsWith('/staff/notifications')) {
      setActiveTab('notifications')
    } else if (pathname?.startsWith('/staff/profile')) {
      setActiveTab('profile')
    } else if (pathname?.startsWith('/staff/settings')) {
      setActiveTab('settings')
    } else if (pathname?.startsWith('/staff/help')) {
      setActiveTab('help')
    }
  }, [pathname, setActiveTab])

  const handleLogoutClick = () => {
    setShowSignOutConfirm(true)
  }

  const confirmSignOut = async () => {
    setShowSignOutConfirm(false)
    onLogout()
  }

  const handleNavClick = (tabId: string, route: string) => {
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
                Staff Portal
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
            <Avatar className="h-12 w-12 ring-3 ring-white dark:ring-slate-900 shadow-xl">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1">
              <div className="relative h-3 w-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 ring-3 ring-white dark:ring-slate-900 shadow-xl">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1">
                  <div className="relative h-3.5 w-3.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
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
                  {userEmail}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] shadow-sm">
                  {getRoleDisplay(userRole)}
                </Badge>
                {department && (
                  <Badge variant="outline" className="text-[10px] border-emerald-200 dark:border-emerald-800">
                    {department}
                  </Badge>
                )}
              </div>

              {/* Stats - updates in background */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Students</p>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {stats.studentCount}
                  </p>
                </div>
                <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-2">
                  <p className="text-[9px] text-teal-600 dark:text-teal-400 font-medium">My Exams</p>
                  <p className="text-xs font-bold text-teal-700 dark:text-teal-300">
                    {stats.examCount}
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

export default StaffSidebar