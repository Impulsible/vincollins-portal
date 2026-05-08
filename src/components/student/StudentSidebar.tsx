/* eslint-disable react/no-unescaped-entities */
// components/student/StudentSidebar.tsx - FULLY UPDATED WITH PROPER PROFILE HANDLING
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, BookOpen, FileText, Award, Settings,
  LogOut, ChevronLeft, ChevronRight, GraduationCap,
  Sparkles, MonitorPlay, User,
  Bell, HelpCircle, Wifi, WifiOff, FileCheck, Users
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
import { toast } from 'sonner'

interface StudentProfile {
  id?: string
  full_name?: string
  display_name?: string | null
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  email?: string
  photo_url?: string | null
  class?: string
  vin_id?: string | null
  department?: string | null
  admission_year?: number | null
  admission_number?: string | null
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
    route: '/student/exams'
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
    id: 'courses', 
    name: 'Study Notes', 
    icon: BookOpen,
    description: 'Learning Materials',
    route: '/student/courses'
  },
  { 
    id: 'classmates', 
    name: 'Classmates', 
    icon: Users,
    description: 'Student Roster',
    route: '/student/classmates'
  },
  { 
    id: 'report-card', 
    name: 'Report Card', 
    icon: FileCheck,
    description: 'Termly Reports',
    route: '/student/report-card'
  },
]

const secondaryNavigation: NavigationItem[] = [
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

// ============================================
// HELPER FUNCTIONS
// ============================================

// ✅ Get first name for welcome message
const getFirstName = (profile?: StudentProfile | null): string => {
  if (profile?.first_name) {
    const firstName = profile.first_name.trim()
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
  }
  
  if (profile?.full_name) {
    const formattedName = profile.full_name.replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim()
    const firstName = formattedName.split(' ')[0]
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
  }
  
  return 'Student'
}

// ✅ FIXED: Get display name - properly uses display_name from database
const getDisplayName = (profile?: StudentProfile | null): string => {
  // Priority 1: Use display_name from database (set by admin when editing)
  if (profile?.display_name && profile.display_name.trim() !== '') {
    return profile.display_name.trim()
  }
  
  // Priority 2: Use full_name from database
  if (profile?.full_name && profile.full_name.trim() !== '') {
    return profile.full_name.trim()
  }
  
  // Priority 3: Construct from first/middle/last name
  if (profile?.first_name && profile?.last_name) {
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    const firstName = capitalize(profile.first_name.trim())
    const middleName = profile.middle_name?.trim()
    const lastName = capitalize(profile.last_name.trim())
    
    if (middleName) {
      return `${firstName} ${capitalize(middleName)} ${lastName}`
    }
    return `${firstName} ${lastName}`
  }
  
  return 'Student Name'
}

// ✅ Get initials for avatar
const getInitials = (profile?: StudentProfile | null): string => {
  const displayName = getDisplayName(profile)
  const names = displayName.split(' ').filter(n => n.length > 0)
  
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase()
}

// ✅ Format VIN ID for display
const formatVinId = (vinId?: string | null): string => {
  if (!vinId) return 'VIN-XXXXXX'
  return vinId
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
  const [isOnline, setIsOnline] = useState(true)
  const [lastSeen, setLastSeen] = useState<Date | null>(null)
  
  // ✅ Local state for profile with ALL fields
  const [localProfile, setLocalProfile] = useState<StudentProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // ✅ Fetch COMPLETE profile data when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setProfileLoading(false)
          return
        }

        console.log('🔍 Fetching student profile for sidebar...')
        
        // ✅ Fetch ALL profile fields including name parts
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            middle_name,
            last_name,
            full_name,
            display_name,
            email,
            class,
            vin_id,
            photo_url,
            avatar_url,
            department,
            admission_year,
            admission_number
          `)
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('❌ Error fetching profile:', error)
          setProfileLoading(false)
          return
        }

        if (profileData) {
          console.log('✅ Profile loaded:', {
            full_name: profileData.full_name,
            display_name: profileData.display_name,
            first_name: profileData.first_name,
            middle_name: profileData.middle_name,
            last_name: profileData.last_name,
          })

          setLocalProfile({
            id: profileData.id,
            first_name: profileData.first_name,
            middle_name: profileData.middle_name,
            last_name: profileData.last_name,
            full_name: profileData.full_name || `${profileData.first_name || ''} ${profileData.middle_name ? profileData.middle_name + ' ' : ''}${profileData.last_name || ''}`.trim(),
            display_name: profileData.display_name,
            email: profileData.email,
            class: profileData.class,
            vin_id: profileData.vin_id,
            photo_url: profileData.photo_url || profileData.avatar_url,
            department: profileData.department,
            admission_year: profileData.admission_year,
            admission_number: profileData.admission_number,
          })
        }
      } catch (error) {
        console.error('❌ Error in fetchProfile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    // ✅ Always fetch fresh profile data
    fetchProfile()

    // ✅ Set up real-time subscription for profile changes
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel('profile-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔄 Profile updated in real-time:', payload.new)
            const newData = payload.new as any
            setLocalProfile(prev => ({
              ...prev,
              ...newData,
              full_name: newData.full_name || prev?.full_name,
              display_name: newData.display_name || prev?.display_name,
              first_name: newData.first_name || prev?.first_name,
              middle_name: newData.middle_name || prev?.middle_name,
              last_name: newData.last_name || prev?.last_name,
            }))
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }

    const cleanup = setupSubscription()
    return () => {
      cleanup.then(fn => fn?.())
    }
  }, [profile?.id])

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      updatePresence('online')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      updatePresence('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    updatePresence('online')
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      updatePresence('offline')
    }
  }, [localProfile?.id])

  const updatePresence = async (status: 'online' | 'offline' | 'away') => {
    if (!localProfile?.id) return
    
    try {
      await supabase
        .from('student_presence')
        .upsert({
          student_id: localProfile.id,
          status: status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id'
        })
      
      if (status === 'online') {
        setLastSeen(new Date())
      }
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }

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
    } else if (pathname?.startsWith('/student/courses')) {
      setActiveTab('courses')
    } else if (pathname?.startsWith('/student/classmates')) {
      setActiveTab('classmates')
    } else if (pathname?.startsWith('/student/report-card')) {
      setActiveTab('report-card')
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

  const firstName = getFirstName(localProfile)
  const displayName = getDisplayName(localProfile)
  const initials = getInitials(localProfile)
  const avatarUrl = localProfile?.photo_url || undefined
  const vinId = formatVinId(localProfile?.vin_id)
  const admissionYear = localProfile?.admission_year || new Date().getFullYear()

  const handleLogoutClick = () => {
    setShowSignOutConfirm(true)
  }

  const confirmSignOut = async () => {
    setShowSignOutConfirm(false)
    await updatePresence('offline')
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

  const getStatusDisplay = () => {
    if (isOnline) {
      return {
        icon: Wifi,
        color: 'bg-green-500',
        text: 'Online',
        textColor: 'text-green-600'
      }
    } else {
      return {
        icon: WifiOff,
        color: 'bg-gray-400',
        text: 'Offline',
        textColor: 'text-gray-500'
      }
    }
  }

  const statusDisplay = getStatusDisplay()
  const StatusIcon = statusDisplay.icon

  // ✅ Loading skeleton for profile
  if (profileLoading) {
    return (
      <aside className={cn(
        "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
        collapsed ? "w-20" : "w-72"
      )}>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </aside>
    )
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
                Student Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ PROFILE SECTION - FIXED DISPLAY */}
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "relative h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900",
                    statusDisplay.color,
                    isOnline && "animate-pulse"
                  )} />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{isOnline ? 'Online' : 'Offline'}</p>
                </TooltipContent>
              </Tooltip>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "relative h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-900",
                        statusDisplay.color,
                        isOnline && "animate-pulse"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isOnline ? 'Online' : 'Offline'}</p>
                      {lastSeen && !isOnline && (
                        <p className="text-xs text-slate-400">
                          Last seen: {lastSeen.toLocaleTimeString()}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Welcome back,
                  </p>
                  <Badge className={cn(
                    "text-[9px]",
                    isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  )}>
                    <StatusIcon className="h-3 w-3 mr-0.5" />
                    {statusDisplay.text}
                  </Badge>
                </div>
                {/* ✅ WELCOME MESSAGE - Uses first name */}
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight truncate">
                  {firstName}!
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {/* ✅ FULL DISPLAY NAME */}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {localProfile?.email || 'student@vincollins.edu.ng'}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {/* ✅ VIN ID */}
                <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] shadow-sm">
                  {vinId}
                </Badge>
                {/* ✅ Admission Number */}
                {localProfile?.admission_number && (
                  <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">
                    {localProfile.admission_number}
                  </Badge>
                )}
                {localProfile?.department && (
                  <Badge variant="outline" className="text-[10px]">
                    {localProfile.department}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Class</p>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {localProfile?.class || 'N/A'}
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">Year</p>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    {admissionYear}
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