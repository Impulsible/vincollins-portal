/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, BookOpen, FileText, Settings,
  LogOut, ChevronLeft, ChevronRight, GraduationCap,
  Sparkles, User, CalendarDays,
  Bell, HelpCircle, Notebook, Megaphone,
  MonitorPlay, CalendarCheck, Globe2
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
  school_id?: string | null
  class?: string | null
}

interface StaffSidebarProps {
  profile: StaffProfile | null
  onLogout: () => void
  collapsed: boolean
  onToggle: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
  termCode?: string
  sessionYear?: string
}

interface NavigationItem {
  id: string
  name: string
  icon: React.ElementType
  description: string
  route: string
}

interface SidebarStats {
  studentCount: number
  examCount: number
  pendingGradingCount: number
  attendanceCount: number
}

// Primary Navigation - ATTENDANCE + ASSIGNMENTS + CA SCORES
const primaryNavigation: NavigationItem[] = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, description: 'Dashboard & Analytics', route: '/staff' },
  { id: 'attendance', name: 'Attendance', icon: CalendarCheck, description: 'Mark Daily Attendance', route: '/staff/attendance' },
  { id: 'announcements', name: 'Announcements', icon: Megaphone, description: 'School Updates', route: '/staff/announcements' },
  { id: 'exams', name: 'Exams', icon: BookOpen, description: 'Manage CBT & Theory', route: '/staff/exams' },
  { id: 'assignments', name: 'Assignments', icon: FileText, description: 'Homework & Projects', route: '/staff/assignments' },
  { id: 'ca-scores', name: 'CA Scores', icon: GraduationCap, description: 'Continuous Assessment', route: '/staff/ca-scores' },
  { id: 'notes', name: 'Study Notes', icon: Notebook, description: 'Learning Materials', route: '/staff/notes' },
  { id: 'students', name: 'Students', icon: User, description: 'Class Roster', route: '/staff/students' },
]

const secondaryNavigation: NavigationItem[] = [
  { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Updates & Alerts', route: '/staff/notifications' },
  { id: 'profile', name: 'Profile', icon: User, description: 'Account Details', route: '/staff/profile' },
  { id: 'settings', name: 'Settings', icon: Settings, description: 'Preferences', route: '/staff/settings' },
  { id: 'help', name: 'Help & Support', icon: HelpCircle, description: 'Get assistance', route: '/staff/help' },
]

// Helper functions
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

const getDisplayName = (profile?: StaffProfile | null): string => {
  if (profile?.display_name) return profile.display_name
  if (profile?.first_name && profile?.last_name) {
    const firstName = profile.first_name.trim()
    const lastName = profile.last_name.trim()
    return `${firstName} ${lastName}`.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  }
  if (profile?.full_name) return profile.full_name
  return 'Staff Member'
}

const getInitials = (profile?: StaffProfile | null): string => {
  const displayName = profile?.display_name || profile?.full_name || 'Teacher'
  const names = displayName.split(' ')
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase()
}

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
  termCode,
  sessionYear,
}: StaffSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  
  const firstName = getFirstName(profile)
  const displayName = getDisplayName(profile)
  const initials = getInitials(profile)
  const avatarUrl = profile?.photo_url || undefined
  const userEmail = profile?.email || ''
  const userRole = profile?.role
  const department = profile?.department

  const [stats, setStats] = useState<SidebarStats>({ 
    studentCount: 0, 
    examCount: 0,
    pendingGradingCount: 0,
    attendanceCount: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch stats with TERM FILTERING
  useEffect(() => {
    let mounted = true
    let retryTimeout: NodeJS.Timeout
    let retryCount = 0
    const maxRetries = 3

    const fetchStats = async () => {
      try {
        console.log('📊 Fetching sidebar stats...', { 
          userId: profile?.id,
          termCode,
          sessionYear 
        })
        
        let studentQuery = supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')

        if (profile?.school_id) {
          studentQuery = studentQuery.eq('school_id', profile.school_id)
        }
        if (profile?.class) {
          studentQuery = studentQuery.eq('class', profile.class)
        }

        const { count: studentsCount, error: studentError } = await studentQuery
        if (studentError) console.error('Student count error:', studentError)

        let examQuery = supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })

        if (profile?.id) {
          examQuery = examQuery.eq('created_by', profile.id)
        }

        if (termCode && sessionYear) {
          examQuery = examQuery
            .eq('term', termCode)
            .eq('session_year', sessionYear)
        }

        const { count: examsCount, error: examError } = await examQuery
        if (examError) console.error('Exam count error:', examError)

        let pendingCount = 0
        if (profile?.id) {
          let examIdQuery = supabase
            .from('exams')
            .select('id')
            .eq('created_by', profile.id)

          if (termCode && sessionYear) {
            examIdQuery = examIdQuery
              .eq('term', termCode)
              .eq('session_year', sessionYear)
          }

          const { data: teacherExams, error: examError2 } = await examIdQuery

          if (!examError2 && teacherExams && teacherExams.length > 0) {
            const examIds = teacherExams.map(e => e.id)

            let submissionQuery = supabase
              .from('exam_attempts')
              .select('*', { count: 'exact', head: true })
              .in('exam_id', examIds)
              .eq('status', 'pending_theory')

            if (termCode && sessionYear) {
              submissionQuery = submissionQuery
                .eq('term', termCode)
                .eq('session_year', sessionYear)
            }

            const { count, error: subError } = await submissionQuery
            
            if (!subError) {
              pendingCount = count || 0
            }
          }
        }

        let attendanceCount = 0
        if (profile?.id) {
          const todayStr = new Date().toISOString().split('T')[0]
          
          const { data: teacherClasses } = await supabase
            .from('teacher_classes')
            .select('class_name')
            .eq('teacher_id', profile.id)

          if (teacherClasses && teacherClasses.length > 0) {
            const classNames = teacherClasses.map(tc => tc.class_name)
            
            const { count: attCount, error: attError } = await supabase
              .from('attendance_records')
              .select('*', { count: 'exact', head: true })
              .in('class_name', classNames)
              .eq('date', todayStr)
              .eq('term_code', termCode || '')
              .eq('session_year', sessionYear || '')

            if (!attError) {
              attendanceCount = attCount || 0
            }
          }
        }

        if (mounted) {
          setStats({
            studentCount: studentsCount || 0,
            examCount: examsCount || 0,
            pendingGradingCount: pendingCount,
            attendanceCount: attendanceCount
          })
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        if (retryCount < maxRetries && mounted) {
          retryCount++
          retryTimeout = setTimeout(fetchStats, 2000 * retryCount)
        } else if (mounted) {
          setIsLoading(false)
        }
      }
    }

    if (profile?.id) {
      fetchStats()
    } else {
      const fetchFallbackStats = async () => {
        try {
          const { count: studentsCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student')

          let examQuery = supabase
            .from('exams')
            .select('*', { count: 'exact', head: true })

          if (termCode && sessionYear) {
            examQuery = examQuery
              .eq('term', termCode)
              .eq('session_year', sessionYear)
          }

          const { count: examsCount } = await examQuery

          if (mounted) {
            setStats({
              studentCount: studentsCount || 0,
              examCount: examsCount || 0,
              pendingGradingCount: 0,
              attendanceCount: 0
            })
            setIsLoading(false)
          }
        } catch (error) {
          console.error('Fallback stats error:', error)
          if (mounted) setIsLoading(false)
        }
      }
      fetchFallbackStats()
    }

    return () => {
      mounted = false
      clearTimeout(retryTimeout)
    }
  }, [profile?.id, profile?.school_id, profile?.class, termCode, sessionYear])

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === '/staff') {
      setActiveTab('overview')
    } else if (pathname?.startsWith('/staff/attendance')) {
      setActiveTab('attendance')
    } else if (pathname?.startsWith('/staff/announcements')) {
      setActiveTab('announcements')
    } else if (pathname?.startsWith('/staff/exams')) {
      setActiveTab('exams')
    } else if (pathname?.startsWith('/staff/assignments')) {
      setActiveTab('assignments')
    } else if (pathname?.startsWith('/staff/ca-scores')) {   
      setActiveTab('ca-scores')
    } else if (pathname?.startsWith('/staff/notes')) {
      setActiveTab('notes')
    } else if (pathname?.startsWith('/staff/students')) {
      setActiveTab('students')
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
          "flex items-center gap-3 px-3 py-3 rounded-xl transition-all w-full group relative overflow-hidden my-0.5",
          isActive 
            ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/10 font-semibold" 
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60",
          collapsed ? "justify-center" : ""
        )}
      >
        {isActive && !collapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
        )}

        {!isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-500" />
        )}
        
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-300",
          isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-blue-400"
        )} />
        
        {!collapsed && (
          <div className="flex-1 text-left">
            <span className="text-sm font-medium tracking-wide block">{item.name}</span>
            <span className={cn(
              "text-[10px] block truncate mt-0.5 tracking-tight",
              isActive ? "text-blue-50/80" : "text-slate-400 dark:text-slate-500"
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
          <TooltipContent side="right" className="ml-2 bg-slate-900 text-white border border-slate-800">
            <div>
              <p className="font-semibold text-xs">{item.name}</p>
              <p className="text-[10px] text-slate-400">{item.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      )
    }

    return <div key={item.id}>{buttonContent}</div>
  }

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="pt-5" />
        
        {/* Logo Section */}
        <div className={cn(
          "relative px-5 pb-5 border-b border-slate-100 dark:border-slate-800/80",
          collapsed ? "flex justify-center" : ""
        )}>
          <div className="relative flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur opacity-25" />
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <GraduationCap className="h-5.5 w-5.5 text-white" />
              </div>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h2 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white uppercase">
                  Vincollins College
                </h2>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                  Staff Portal
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Section */}
        <div className={cn(
          "relative px-5 py-5 border-b border-slate-100 dark:border-slate-800/80",
          "bg-gradient-to-b from-blue-50/30 via-transparent to-transparent dark:from-blue-950/10 dark:via-transparent dark:to-transparent",
          collapsed ? "flex justify-center" : ""
        )}>
          {collapsed ? (
            <div className="relative group cursor-pointer">
              <Avatar className="h-12 w-12 ring-2 ring-blue-500/20 dark:ring-blue-500/10 shadow-md">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-base">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <div className="relative h-3 w-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <Avatar className="h-14 w-14 ring-2 ring-blue-500/20 dark:ring-blue-500/10 shadow-lg">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <div className="relative h-3.5 w-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Welcome back,
                  </p>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight truncate mt-0.5">
                    {firstName}!
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {userEmail}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] shadow-sm font-semibold">
                    {getRoleDisplay(userRole)}
                  </Badge>
                  {department && (
                    <Badge variant="outline" className="text-[9px] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      {department}
                    </Badge>
                  )}
                </div>

                {/* Micro Widgets Stats Row */}
                <div className="grid grid-cols-4 gap-1.5 pt-1.5">
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-xl p-2 text-center">
                    <p className="text-[8px] text-slate-400 uppercase font-semibold">Students</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {isLoading ? '...' : stats.studentCount}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-xl p-2 text-center">
                    <p className="text-[8px] text-slate-400 uppercase font-semibold">Exams</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {isLoading ? '...' : stats.examCount}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-xl p-2 text-center">
                    <p className="text-[8px] text-slate-400 uppercase font-semibold">To Grade</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {isLoading ? '...' : stats.pendingGradingCount}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-xl p-2 text-center">
                    <p className="text-[8px] text-slate-400 uppercase font-semibold">Today</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {isLoading ? '...' : stats.attendanceCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-3 space-y-0.5">
          {!collapsed && (
            <p className="px-3 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Main Dashboard
            </p>
          )}
          {primaryNavigation.map(renderNavItem)}
        </div>

        {!collapsed && <Separator className="mx-3 my-2 bg-slate-100 dark:bg-slate-800/80" />}

        {/* Secondary Navigation */}
        <div className="px-3 py-1 space-y-0.5">
          {!collapsed && (
            <p className="px-3 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Account Management
            </p>
          )}
          {secondaryNavigation.map(renderNavItem)}
        </div>
      </div>

      {/* Footer / Sign Out Button */}
      <div className="p-3 mb-4 mt-auto border-t border-slate-100 dark:border-slate-800/80">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={handleLogoutClick}
                className="w-full justify-center h-10 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 group rounded-xl transition-all"
              >
                <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2 bg-slate-900 text-white border border-slate-800">
              <p className="font-semibold text-xs">Sign Out</p>
              <p className="text-[10px] text-slate-400">End secure session</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            onClick={handleLogoutClick}
            className="w-full justify-start h-12 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 group rounded-xl transition-all p-2"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="h-9 w-9 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-950/40 transition-colors shrink-0">
                <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-sm font-semibold block leading-none">Sign Out</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate mt-1">
                  End secure session
                </span>
              </div>
            </div>
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <aside 
        className={cn(
          "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-r border-slate-200 dark:border-slate-800/80 shadow-sm",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <TooltipProvider>
          <ScrollArea className="h-full scrollbar-none">
            {sidebarContent}
          </ScrollArea>

          {/* Floating Sidebar Toggle Button */}
          <button 
            onClick={onToggle} 
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all flex items-center justify-center hover:scale-105 group z-50 ring-2 ring-blue-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-10 transition-opacity" />
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-600 transition-colors" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-600 transition-colors" />
            )}
          </button>
        </TooltipProvider>
      </aside>

      {/* Confirmation Modal dialog for Sign out */}
      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex items-center gap-2.5 font-bold">
              <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Sign Out?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              Are you sure you want to sign out of your account? You'll need to log in again to access your classes and manage examinations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSignOut}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-md shadow-red-500/10 font-medium"
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