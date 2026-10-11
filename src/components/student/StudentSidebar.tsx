/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, BookOpen, FileText, Award, Settings,
  LogOut, ChevronLeft, ChevronRight, GraduationCap,
  Sparkles, MonitorPlay, User,
  Bell, HelpCircle, Wifi, WifiOff, FileCheck, Users,
  Megaphone, Globe2
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
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, description: 'Dashboard & Stats', route: '/student' },
  { id: 'announcements', name: 'Announcements', icon: Megaphone, description: 'School Updates', route: '/student/announcements' },
  { id: 'exams', name: 'My Exams', icon: MonitorPlay, description: 'Take CBT & Theory', route: '/student/exams' },
  { id: 'results', name: 'Results', icon: Award, description: 'View Performance', route: '/student/results' },
  { id: 'assignments', name: 'Assignments', icon: FileText, description: 'Course Work', route: '/student/assignments' },
  { id: 'courses', name: 'Study Notes', icon: BookOpen, description: 'Learning Materials', route: '/student/courses' },
  { id: 'classmates', name: 'Classmates', icon: Users, description: 'Student Roster', route: '/student/classmates' },
  { id: 'report-card', name: 'Report Card', icon: FileCheck, description: 'Termly Reports', route: '/student/report-card' },
]

const secondaryNavigation: NavigationItem[] = [
  { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Updates & Alerts', route: '/student/notifications' },
  { id: 'profile', name: 'Profile', icon: User, description: 'Account Details', route: '/student/profile' },
  { id: 'settings', name: 'Settings', icon: Settings, description: 'Preferences', route: '/student/settings' },
  { id: 'help', name: 'Help & Support', icon: HelpCircle, description: 'Get assistance', route: '/student/help' },
]

// ============================================
// HELPER FUNCTIONS
// ============================================
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

const getDisplayName = (profile?: StudentProfile | null): string => {
  if (profile?.display_name && profile.display_name.trim() !== '') {
    return profile.display_name.trim()
  }
  if (profile?.full_name && profile.full_name.trim() !== '') {
    return profile.full_name.trim()
  }
  if (profile?.first_name && profile?.last_name) {
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    const firstName = capitalize(profile.first_name.trim())
    const middleName = profile.middle_name?.trim()
    const lastName = capitalize(profile.last_name.trim())
    if (middleName) return `${firstName} ${capitalize(middleName)} ${lastName}`
    return `${firstName} ${lastName}`
  }
  return 'Student Name'
}

const getInitials = (profile?: StudentProfile | null): string => {
  const displayName = getDisplayName(profile)
  const names = displayName.split(' ').filter(n => n.length > 0)
  if (names.length >= 2) return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  return displayName.slice(0, 2).toUpperCase()
}

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
  const [localProfile, setLocalProfile] = useState<StudentProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  
  const isMountedRef = useRef(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const subscriptionAttemptedRef = useRef(false)

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      const cleanupChannel = async () => {
        if (channelRef.current) {
          try {
            await supabase.removeChannel(channelRef.current)
          } catch (error) {
            console.error('Error removing channel:', error)
          }
          channelRef.current = null
        }
      }
      cleanupChannel()
    }
  }, [])

  // ✅ SINGLE EFFECT: Fetch profile THEN set up subscription
  useEffect(() => {
    subscriptionAttemptedRef.current = false
    
    const setupProfileAndSubscription = async () => {
      try {
        setProfileLoading(true)
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('No user found:', userError)
          if (isMountedRef.current) setProfileLoading(false)
          return
        }

        console.log('🔍 Fetching student profile for sidebar...')
        
        const { data: profileData, error: profileError } = await supabase
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

        if (profileError) {
          console.error('❌ Error fetching profile:', profileError)
          if (isMountedRef.current) setProfileLoading(false)
          return
        }

        if (profileData && isMountedRef.current) {
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
          setProfileLoading(false)
        }

        if (channelRef.current) {
          try {
            await supabase.removeChannel(channelRef.current)
          } catch (err) {
            console.warn('Error removing previous channel:', err)
          }
          channelRef.current = null
        }

        const channelId = `profile-updates-${user.id}-${Date.now()}`
        const newChannel = supabase.channel(channelId)
        
        newChannel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMountedRef.current) return
            
            console.log('🔄 Profile updated in real-time:', payload.new)
            const newData = payload.new as any
            
            setLocalProfile(prev => {
              if (!prev) return null
              return {
                ...prev,
                id: newData.id || prev.id,
                full_name: newData.full_name || prev.full_name,
                display_name: newData.display_name || prev.display_name,
                first_name: newData.first_name || prev.first_name,
                middle_name: newData.middle_name || prev.middle_name,
                last_name: newData.last_name || prev.last_name,
                email: newData.email || prev.email,
                class: newData.class || prev.class,
                vin_id: newData.vin_id || prev.vin_id,
                photo_url: newData.photo_url || newData.avatar_url || prev.photo_url,
                department: newData.department || prev.department,
                admission_year: newData.admission_year || prev.admission_year,
                admission_number: newData.admission_number || prev.admission_number,
              }
            })
          }
        )
        
        newChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to profile updates for channel:', channelId)
            subscriptionAttemptedRef.current = true
          }
        })
        
        channelRef.current = newChannel

      } catch (error) {
        console.error('❌ Error in setupProfileAndSubscription:', error)
        if (isMountedRef.current) setProfileLoading(false)
      }
    }

    setupProfileAndSubscription()

    return () => {
      const cleanup = async () => {
        if (channelRef.current) {
          try {
            await supabase.removeChannel(channelRef.current)
          } catch (error) {
            console.error('Error cleaning up channel:', error)
          }
          channelRef.current = null
        }
      }
      cleanup()
    }
  }, [])

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
        }, { onConflict: 'student_id' })
      if (status === 'online') setLastSeen(new Date())
    } catch {
      // Silently fail
    }
  }

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === '/student') setActiveTab('overview')
    else if (pathname?.startsWith('/student/announcements')) setActiveTab('announcements')
    else if (pathname?.startsWith('/student/exams')) setActiveTab('exams')
    else if (pathname?.startsWith('/student/results')) setActiveTab('results')
    else if (pathname?.startsWith('/student/assignments')) setActiveTab('assignments')
    else if (pathname?.startsWith('/student/courses')) setActiveTab('courses')
    else if (pathname?.startsWith('/student/classmates')) setActiveTab('classmates')
    else if (pathname?.startsWith('/student/report-card')) setActiveTab('report-card')
    else if (pathname?.startsWith('/student/notifications')) setActiveTab('notifications')
    else if (pathname?.startsWith('/student/profile')) setActiveTab('profile')
    else if (pathname?.startsWith('/student/settings')) setActiveTab('settings')
    else if (pathname?.startsWith('/student/help')) setActiveTab('help')
  }, [pathname, setActiveTab])

  const firstName = getFirstName(localProfile)
  const displayName = getDisplayName(localProfile)
  const initials = getInitials(localProfile)
  const avatarUrl = localProfile?.photo_url || undefined
  const vinId = formatVinId(localProfile?.vin_id)
  const admissionYear = localProfile?.admission_year || new Date().getFullYear()

  const handleLogoutClick = () => setShowSignOutConfirm(true)

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
        onClick={() => handleNavClick(item.id, item.route)}
        className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-xl transition-all w-full group relative overflow-hidden my-0.5",
          isActive 
            ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/10 font-semibold" 
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60",
          collapsed ? "justify-center" : ""
        )}
      >
        {/* Dynamic active line bar */}
        {isActive && !collapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
        )}
        
        {!isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500" />
        )}
        
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-300",
          isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
        )} />
        
        {!collapsed && (
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium tracking-wide block">{item.name}</span>
              {item.badge && (
                <Badge className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[9px] px-1.5 py-0.5 border-amber-200 border">
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className={cn(
              "text-[10px] block truncate mt-0.5 tracking-tight", 
              isActive ? "text-emerald-50/80" : "text-slate-400 dark:text-slate-500"
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
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
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

  const statusDisplay = isOnline 
    ? { icon: Wifi, color: 'bg-emerald-500', text: 'Online', textColor: 'text-emerald-600' }
    : { icon: WifiOff, color: 'bg-slate-400', text: 'Offline', textColor: 'text-slate-500' }
  const StatusIcon = statusDisplay.icon

  if (profileLoading) {
    return (
      <aside className={cn(
        "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-sm",
        collapsed ? "w-20" : "w-72"
      )}>
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" />
              <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" />
            </div>
          </div>
          <div className="space-y-4 pt-10">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-9 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </aside>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="pt-5" />
        
        {/* Brand Banner */}
        <div className={cn("relative px-5 pb-5 border-b border-slate-100 dark:border-slate-800/80", collapsed ? "flex justify-center" : "")}>
          <div className="relative flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-25" />
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <GraduationCap className="h-5.5 w-5.5 text-white" />
              </div>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h2 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white uppercase">Vincollins College</h2>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />Student Portal
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Card for Profile details */}
        <div className={cn(
          "relative px-5 py-5 border-b border-slate-100 dark:border-slate-800/80",
          "bg-gradient-to-b from-emerald-50/30 via-transparent to-transparent dark:from-emerald-950/10 dark:via-transparent dark:to-transparent",
          collapsed ? "flex justify-center" : ""
        )}>
          {collapsed ? (
            <div className="relative group cursor-pointer">
              <Avatar className="h-12 w-12 ring-2 ring-emerald-500/20 dark:ring-emerald-500/10 shadow-md">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-base">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn("relative h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-950", statusDisplay.color, isOnline && "animate-pulse")} />
                  </TooltipTrigger>
                  <TooltipContent side="right"><p>{isOnline ? 'Online' : 'Offline'}</p></TooltipContent>
                </Tooltip>
              </div>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <Avatar className="h-14 w-14 ring-2 ring-emerald-500/20 dark:ring-emerald-500/10 shadow-lg">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn("relative h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-950", statusDisplay.color, isOnline && "animate-pulse")} />
                      </TooltipTrigger>
                      <TooltipContent><p>{isOnline ? 'Online' : 'Offline'}</p></TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Welcome back,</p>
                    <Badge className={cn("text-[8px] border py-0 px-1 leading-none", isOnline ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-500/10 text-slate-600 border-slate-500/20")}>
                      {statusDisplay.text}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight truncate mt-0.5">{firstName}!</h3>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{localProfile?.email || 'student@vincollins.edu.ng'}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] shadow-sm font-semibold">{vinId}</Badge>
                  {localProfile?.admission_number && (
                    <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/10 dark:text-emerald-400">{localProfile.admission_number}</Badge>
                  )}
                  {localProfile?.department && (
                    <Badge variant="outline" className="text-[9px] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">{localProfile.department}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-xl p-2 text-center">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Class</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{localProfile?.class || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-xl p-2 text-center">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Year</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{admissionYear}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Nav Links */}
        <div className="px-3 py-3 space-y-0.5">
          {!collapsed && (
            <p className="px-3 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Main Dashboard
            </p>
          )}
          {primaryNavigation.map(renderNavItem)}
        </div>

        {!collapsed && <Separator className="mx-3 my-2 bg-slate-100 dark:bg-slate-800/80" />}

        {/* Secondary Nav Links */}
        <div className="px-3 py-1 space-y-0.5">
          {!collapsed && (
            <p className="px-3 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Account Management
            </p>
          )}
          {secondaryNavigation.map(renderNavItem)}
        </div>
      </div>

      {/* Footer / Log out Section */}
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
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate mt-1">End secure session</span>
              </div>
            </div>
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <aside className={cn(
        "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-r border-slate-200 dark:border-slate-800/80 shadow-sm",
        collapsed ? "w-20" : "w-72"
      )}>
        <TooltipProvider>
          <ScrollArea className="h-full scrollbar-none">{sidebarContent}</ScrollArea>
          
          {/* Dynamic Floating Sidebar Toggle Button */}
          <button 
            onClick={onToggle} 
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all flex items-center justify-center hover:scale-105 group z-50 ring-2 ring-emerald-500/10"
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

      {/* Confirmation Modal dialog for Sign out */}
      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-md border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex items-center gap-2.5 font-bold">
              <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              You will be signed out from your student portal session. You will need to re-authenticate to view grades or participate in examinations.
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
              <LogOut className="mr-2 h-4 w-4" />Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default StudentSidebar