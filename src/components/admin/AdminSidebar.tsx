// components/admin/AdminSidebar.tsx - FIXED WITH DISPLAY NAME
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, MonitorPlay, FileCheck, Activity,
  LogOut, ChevronLeft, ChevronRight, Shield, Sparkles,
  Settings, HelpCircle, GraduationCap, Briefcase,
  MessageSquare, BookOpen
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AdminSidebarProps {
  profile: any
  onLogout: () => void
  collapsed: boolean
  onToggle: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
  pendingExams?: number
  pendingReports?: number
  pendingInquiries?: number
}

interface NavigationItem {
  id: string
  name: string
  icon: React.ElementType
  description: string
  badge?: number
  routePatterns?: string[]
}

export function AdminSidebar({ 
  profile, onLogout, collapsed, onToggle, activeTab, setActiveTab,
  pendingExams = 0, pendingReports = 0, pendingInquiries = 0
}: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Set initial tab from URL on first load only
  useEffect(() => {
    const getTabFromPathname = (path: string): string => {
      if (!path) return 'overview'
      if (path === '/admin') return 'overview'
      if (path === '/admin/settings') return 'settings'
      if (path === '/admin/help') return 'help'
      if (path.startsWith('/admin/broad-sheet')) return 'broad-sheet'
      if (path.startsWith('/admin/students')) return 'students'
      if (path.startsWith('/admin/staff')) return 'staff'
      if (path.startsWith('/admin/exams')) return 'exams'
      if (path.startsWith('/admin/report-cards')) return 'report-cards'
      if (path.startsWith('/admin/inquiries')) return 'inquiries'
      if (path.startsWith('/admin/monitor')) return 'cbt-monitor'
      return 'overview'
    }
    
    const tab = getTabFromPathname(pathname || '/admin')
    setActiveTab(tab)
  }, []) // Only runs once on mount

  const primaryNavigation: NavigationItem[] = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, description: 'Dashboard & Analytics', routePatterns: ['/admin'] },
    { id: 'broad-sheet', name: 'Broad Sheet', icon: BookOpen, description: 'Generate Report Cards', routePatterns: ['/admin/broad-sheet'] },
    { id: 'students', name: 'Students', icon: GraduationCap, description: 'Manage Students', routePatterns: ['/admin/students'] },
    { id: 'staff', name: 'Staff', icon: Briefcase, description: 'Manage Teachers', routePatterns: ['/admin/staff'] },
    { id: 'exams', name: 'Exam Approvals', icon: MonitorPlay, description: 'Review & Publish', badge: pendingExams || undefined, routePatterns: ['/admin/exams'] },
    { id: 'report-cards', name: 'Report Cards', icon: FileCheck, description: 'Review & Approve', badge: pendingReports || undefined, routePatterns: ['/admin/report-cards'] },
    { id: 'inquiries', name: 'Inquiries', icon: MessageSquare, description: 'Admissions & Contact', badge: pendingInquiries || undefined, routePatterns: ['/admin/inquiries'] },
    { id: 'cbt-monitor', name: 'Live Monitor', icon: Activity, description: 'Real-time Activity', routePatterns: ['/admin/monitor'] },
  ]

  const secondaryNavigation: NavigationItem[] = [
    { id: 'settings', name: 'Settings', icon: Settings, description: 'Preferences', routePatterns: ['/admin/settings'] },
    { id: 'help', name: 'Help & Support', icon: HelpCircle, description: 'Get assistance', routePatterns: ['/admin/help'] },
  ]

  // ============================================
  // NAME RESOLUTION - Same as header
  // Profile: LastName FirstName MiddleName
  // Greeting: FirstName only
  // ============================================
  const getDisplayName = (): string => {
    if (profile?.first_name) {
      const parts: string[] = []
      if (profile?.last_name) parts.push(profile.last_name)
      parts.push(profile.first_name)
      if (profile?.middle_name) parts.push(profile.middle_name)
      return parts.join(' ').trim()
    }
    if (profile?.display_name?.trim()) return profile.display_name.trim()
    if (profile?.full_name?.trim()) return profile.full_name.trim()
    return 'Administrator'
  }

  const getFirstName = (): string => {
    if (profile?.first_name?.trim()) return profile.first_name.trim()
    const displayName = getDisplayName()
    return displayName.split(' ')[0] || 'Admin'
  }

  const displayName = getDisplayName()
  const firstName = getFirstName()
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleLogoutClick = () => setShowSignOutConfirm(true)
  const confirmSignOut = () => { 
    setShowSignOutConfirm(false)
    window.location.href = '/portal'
    onLogout()
  }

  // Simple navigation - set tab and push route
  const handleNavClick = (tabId: string, routePatterns?: string[]) => {
    setActiveTab(tabId)
    if (routePatterns && routePatterns.length > 0) {
      const targetRoute = routePatterns[0]
      if (pathname !== targetRoute) {
        router.push(targetRoute)
      }
    }
  }

  const renderNavItem = (item: NavigationItem) => {
    const isActive = activeTab === item.id
    const Icon = item.icon
    
    const buttonContent = (
      <button
        onClick={() => handleNavClick(item.id, item.routePatterns)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full group relative overflow-hidden",
          isActive 
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25" 
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
          collapsed ? "justify-center" : ""
        )}
      >
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-all duration-300",
          isActive ? "text-white" : "group-hover:scale-110 group-hover:text-purple-600"
        )} />
        
        {!collapsed && (
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium block">{item.name}</span>
              {item.badge && item.badge > 0 && (
                <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 animate-pulse">{item.badge}</Badge>
              )}
            </div>
            <span className={cn(
              "text-xs block truncate",
              isActive ? "text-purple-100" : "text-slate-400 dark:text-slate-500"
            )}>
              {item.description}
            </span>
          </div>
        )}
        
        {collapsed && isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
        )}
        
        {collapsed && item.badge && item.badge > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{item.badge}</div>
        )}
      </button>
    )

    if (collapsed) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-slate-400">{item.description}</p>
              {item.badge && item.badge > 0 && (
                <Badge className="mt-1 bg-red-500 text-white text-[9px]">{item.badge} pending</Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      )
    }

    return <div key={item.id}>{buttonContent}</div>
  }

  return (
    <>
      <aside className={cn(
        "hidden lg:flex flex-col fixed left-0 top-[4.5rem] z-30 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
        "h-[calc(100vh-4.5rem)]",
        collapsed ? "w-20" : "w-72"
      )}>
        <TooltipProvider delayDuration={0}>
          <ScrollArea className="h-full">
            {!mounted ? (
              <div className="flex-1" />
            ) : (
              <div className="flex flex-col h-full">
                <div className={cn(
                  "shrink-0 border-b border-slate-200 dark:border-slate-800",
                  "bg-gradient-to-b from-purple-50/50 via-white to-transparent dark:from-purple-950/20 dark:via-slate-900",
                  collapsed ? "px-2 py-4 flex justify-center" : "px-5 py-5"
                )}>
                  {collapsed ? (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Avatar className="h-12 w-12 ring-2 ring-white shadow-xl cursor-pointer">
                          <AvatarImage src={profile?.photo_url || profile?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">{initials}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{displayName}</p>
                        <p className="text-xs text-slate-400">Administrator</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="space-y-4 w-full">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 ring-3 ring-white shadow-xl">
                          <AvatarImage src={profile?.photo_url || profile?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xl">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Welcome back,</p>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{firstName}!</h3>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.email}</p>
                        <Badge className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">Administrator</Badge>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-3 py-3 space-y-1">
                  {!collapsed && (
                    <p className="px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Main</p>
                  )}
                  {primaryNavigation.map(renderNavItem)}
                </div>

                {!collapsed && <Separator className="mx-3 my-2" />}

                <div className="px-3 py-3 space-y-1">
                  {!collapsed && (
                    <p className="px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Account</p>
                  )}
                  {secondaryNavigation.map(renderNavItem)}
                </div>

                <div className="shrink-0 p-3 mt-2 border-t border-slate-200 dark:border-slate-800">
                  {collapsed ? (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" onClick={handleLogoutClick} className="w-full justify-center px-2 text-red-600 hover:bg-red-50">
                          <LogOut className="h-4 w-4 shrink-0" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">Sign Out</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button variant="ghost" onClick={handleLogoutClick} className="w-full justify-start text-red-600 hover:bg-red-50">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                          <LogOut className="h-4 w-4 shrink-0" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium block">Sign Out</span>
                          <span className="text-[10px] text-slate-400 block">End your session</span>
                        </div>
                      </div>
                    </Button>
                  )}
                </div>

                <div className="h-4" />
              </div>
            )}
          </ScrollArea>
        </TooltipProvider>

        <button onClick={onToggle} className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border rounded-full p-1.5 shadow-md hover:shadow-lg transition-all z-50">
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to sign out of your account?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSignOut} className="bg-red-600 hover:bg-red-700">Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}