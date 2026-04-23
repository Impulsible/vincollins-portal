/* eslint-disable react-hooks/exhaustive-deps */
// components/staff/StaffSidebar.tsx - UPDATED ROUTES
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, BookOpen, FileText, Users, Settings,
  LogOut, ChevronLeft, ChevronRight, GraduationCap,
  Notebook, Sparkles, UserCircle, CalendarDays,
  Bell, Award, HelpCircle, Loader2, ClipboardList
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
import { Skeleton } from '@/components/ui/skeleton'

interface StaffProfile {
  id?: string
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  department?: string
  photo_url?: string | null
  avatar_url?: string | null
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
  department?: string
}

const primaryNavigation: NavigationItem[] = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, description: 'Dashboard & Analytics', route: '/staff' },
  { id: 'exams', name: 'Exams', icon: BookOpen, description: 'Manage CBT & Theory', route: '/staff/exams' },
  { id: 'assignments', name: 'Assignments', icon: FileText, description: 'Student Tasks', route: '/staff/assignments' },
  { id: 'notes', name: 'Study Notes', icon: Notebook, description: 'Learning Materials', route: '/staff/notes' },
  { id: 'attendance', name: 'Attendance', icon: ClipboardList, description: 'Track Records', route: '/staff/attendance' },
  { id: 'students', name: 'Students', icon: Users, description: 'Class Roster', route: '/staff/students' },
]

const secondaryNavigation: NavigationItem[] = [
  { id: 'schedule', name: 'Schedule', icon: CalendarDays, description: 'Class & Event Schedule', route: '/staff/schedule' },
  { id: 'profile', name: 'Profile', icon: UserCircle, description: 'Your Account', route: '/staff/profile' },
  { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Updates & Alerts', route: '/staff/notifications' },
  { id: 'settings', name: 'Settings', icon: Settings, description: 'Preferences', route: '/staff/settings' },
  { id: 'help', name: 'Help & Support', icon: HelpCircle, description: 'Get assistance', route: '/staff/help' },
]

const formatDisplayName = (profile: StaffProfile | null): string => {
  if (profile?.full_name) {
    return profile.full_name.replace(/\./g, ' ').replace(/\s+/g, ' ').trim()
      .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name} ${profile.last_name}`.replace(/\./g, ' ').trim()
      .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }
  if (profile?.first_name) return profile.first_name
  return 'Teacher Name'
}

const getInitials = (profile: StaffProfile | null): string => {
  const displayName = formatDisplayName(profile)
  const names = displayName.split(' ')
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase()
}

const getFirstName = (profile: StaffProfile | null): string => {
  const displayName = formatDisplayName(profile)
  return displayName.split(' ')[0]
}

const getRoleDisplay = (role?: string): string => {
  if (role === 'admin') return 'Administrator'
  if (role === 'staff' || role === 'teacher') return 'Teacher'
  return role || 'Staff'
}

export function StaffSidebar({ 
  profile: initialProfile, 
  onLogout, 
  collapsed, 
  onToggle, 
  activeTab, 
  setActiveTab,
}: StaffSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [localProfile, setLocalProfile] = useState<StaffProfile | null>(initialProfile)
  
  const [stats, setStats] = useState<SidebarStats>({ studentCount: 0, examCount: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  
  const statsFetchedRef = useRef(false)
  const profileFetchedRef = useRef(false)

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
    } else if (pathname?.startsWith('/staff/profile')) {
      setActiveTab('profile')
    } else if (pathname?.startsWith('/staff/notifications')) {
      setActiveTab('notifications')
    } else if (pathname?.startsWith('/staff/settings')) {
      setActiveTab('settings')
    } else if (pathname?.startsWith('/staff/help')) {
      setActiveTab('help')
    }
  }, [pathname, setActiveTab])

  // Update local profile when prop changes
  useEffect(() => {
    if (initialProfile) {
      setLocalProfile(initialProfile)
    }
  }, [initialProfile])

  // Fetch profile if not provided
  useEffect(() => {
    const fetchProfile = async () => {
      if (profileFetchedRef.current) return
      if (localProfile?.id && localProfile?.full_name) return
      
      profileFetchedRef.current = true
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, first_name, last_name, email, department, photo_url, avatar_url, role')
          .eq('id', session.user.id)
          .single()

        if (profileData) {
          setLocalProfile(profileData)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfile()
  }, [])

  // Fetch stats
  useEffect(() => {
    if (statsFetchedRef.current) return
    if (!localProfile?.id) return

    statsFetchedRef.current = true

    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        // Get student count
        const { count: studentsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student')

        if (studentsCount !== null) {
          setStats(prev => ({ ...prev, studentCount: studentsCount }))
        }

        // Get exam count
        const { count: examsCount } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', localProfile.id)

        if (examsCount !== null) {
          setStats(prev => ({ ...prev, examCount: examsCount }))
        }

        // Get department if not in profile
        let department = localProfile.department
        if (!department) {
          const { data: teacherData } = await supabase
            .from('teacher_profiles')
            .select('department')
            .eq('id', localProfile.id)
            .single()
          
          department = teacherData?.department
        }
        
        setStats(prev => ({ ...prev, department: department || 'General' }))
      } catch (error) {
        console.error('Error fetching sidebar stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()

    // Real-time subscriptions
    const studentsChannel = supabase
      .channel('students-changes-sidebar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.student' },
        async () => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student')
          if (count !== null) setStats(prev => ({ ...prev, studentCount: count }))
        }
      )
      .subscribe()

    const examsChannel = supabase
      .channel('exams-changes-sidebar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exams', filter: `created_by=eq.${localProfile.id}` },
        async () => {
          const { count } = await supabase
            .from('exams')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', localProfile.id)
          if (count !== null) setStats(prev => ({ ...prev, examCount: count }))
        }
      )
      .subscribe()

    return () => {
      studentsChannel.unsubscribe()
      examsChannel.unsubscribe()
    }
  }, [localProfile?.id])

  const handleLogoutClick = () => {
    setShowSignOutConfirm(true)
  }

  const confirmSignOut = () => {
    setShowSignOutConfirm(false)
    onLogout()
  }

  const handleNavClick = (tabId: string, route: string) => {
    setActiveTab(tabId)
    router.push(route)
  }

  const displayName = formatDisplayName(localProfile)
  const firstName = getFirstName(localProfile)
  const initials = getInitials(localProfile)
  const avatarUrl = localProfile?.photo_url || localProfile?.avatar_url || undefined

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
                      Teacher Portal
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
                    <div className="relative h-3 w-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
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
                        {localProfile?.email || 'teacher@vincollins.edu.ng'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] shadow-sm">
                        {getRoleDisplay(localProfile?.role)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-emerald-200 dark:border-emerald-800">
                        {stats.department || 'General'}
                      </Badge>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Students</p>
                        {loadingStats ? (
                          <Skeleton className="h-4 w-8 mt-1 bg-emerald-200 dark:bg-emerald-800" />
                        ) : (
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {stats.studentCount}
                          </p>
                        )}
                      </div>
                      <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-2">
                        <p className="text-[9px] text-teal-600 dark:text-teal-400 font-medium">My Exams</p>
                        {loadingStats ? (
                          <Skeleton className="h-4 w-8 mt-1 bg-teal-200 dark:bg-teal-800" />
                        ) : (
                          <p className="text-xs font-bold text-teal-700 dark:text-teal-300">
                            {stats.examCount}
                          </p>
                        )}
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
                  More
                </p>
              )}
              {secondaryNavigation.map(renderNavItem)}
            </div>

            {/* Logout Button */}
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
                    Sign Out
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
              Are you sure you want to sign out of your account?
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