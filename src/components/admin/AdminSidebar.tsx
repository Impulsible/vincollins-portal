/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { instantLogout } from '@/lib/auth-utils'
import {
  LayoutDashboard, Users, MonitorPlay, FileCheck, Activity,
  LogOut, ChevronLeft, ChevronRight, Settings, HelpCircle,
  GraduationCap, Briefcase, MessageSquare, BookOpen, Megaphone,
  Bell, School, Globe2
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  unreadNotifications?: number
  pendingPromotions?: number
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
  pendingExams = 0, pendingReports = 0, pendingInquiries = 0,
  unreadNotifications = 0, pendingPromotions = 0
}: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const isUpdatingRef = useRef(false)
  const previousTabRef = useRef(activeTab)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getTabFromPathname = useCallback((path: string): string => {
    if (!path) return 'overview'
    if (path === '/admin') return 'overview'
    if (path === '/admin/settings') return 'settings'
    if (path === '/admin/help') return 'help'
    if (path.startsWith('/admin/notifications')) return 'notifications'
    if (path.startsWith('/admin/announcements')) return 'announcements'
    if (path.startsWith('/admin/broad-sheet')) return 'broad-sheet'
    if (path.startsWith('/admin/students')) return 'students'
    if (path.startsWith('/admin/staff')) return 'staff'
    if (path.startsWith('/admin/exams')) return 'exams'
    if (path.startsWith('/admin/report-cards')) return 'report-cards'
    if (path.startsWith('/admin/inquiries')) return 'inquiries'
    if (path.startsWith('/admin/monitor')) return 'cbt-monitor'
    if (path.startsWith('/admin/promotions')) return 'promotions'
    if (path.startsWith('/admin/teacher-classes')) return 'teacher-classes'
    return 'overview'
  }, [])

  useEffect(() => {
    if (isUpdatingRef.current) return
    
    const tab = getTabFromPathname(pathname || '/admin')
    
    if (tab !== previousTabRef.current && tab !== activeTab) {
      isUpdatingRef.current = true
      previousTabRef.current = tab
      setActiveTab(tab)
      
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 50)
    }
  }, [pathname, getTabFromPathname, activeTab, setActiveTab])

  const primaryNavigation = useMemo<NavigationItem[]>(() => [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, description: 'Dashboard & Analytics', routePatterns: ['/admin'] },
    { id: 'notifications', name: 'Notifications', icon: Bell, description: 'View Updates', badge: unreadNotifications || undefined, routePatterns: ['/admin/notifications'] },
    { id: 'announcements', name: 'Announcements', icon: Megaphone, description: 'Send Updates', routePatterns: ['/admin/announcements'] },
    { id: 'broad-sheet', name: 'Broad Sheet', icon: BookOpen, description: 'Generate Report Cards', routePatterns: ['/admin/broad-sheet'] },
    { id: 'students', name: 'Students', icon: GraduationCap, description: 'Manage Students', routePatterns: ['/admin/students'] },
    { id: 'staff', name: 'Staff', icon: Briefcase, description: 'Manage Teachers', routePatterns: ['/admin/staff'] },
    { id: 'teacher-classes', name: 'Teacher Classes', icon: School, description: 'Assign Classes to Teachers', routePatterns: ['/admin/teacher-classes'] },
    { id: 'exams', name: 'Exam Approvals', icon: MonitorPlay, description: 'Review & Publish', badge: pendingExams || undefined, routePatterns: ['/admin/exams'] },
    { id: 'report-cards', name: 'Report Cards', icon: FileCheck, description: 'Review & Approve', badge: pendingReports || undefined, routePatterns: ['/admin/report-cards'] },
    { id: 'inquiries', name: 'Inquiries', icon: MessageSquare, description: 'Admissions & Contact', badge: pendingInquiries || undefined, routePatterns: ['/admin/inquiries'] },
    { id: 'cbt-monitor', name: 'Live Monitor', icon: Activity, description: 'Real-time Activity', routePatterns: ['/admin/monitor'] },
  ], [unreadNotifications, pendingExams, pendingReports, pendingInquiries])

  const secondaryNavigation = useMemo<NavigationItem[]>(() => [
    { id: 'settings', name: 'Settings', icon: Settings, description: 'Preferences', routePatterns: ['/admin/settings'] },
    { id: 'help', name: 'Help & Support', icon: HelpCircle, description: 'Get assistance', routePatterns: ['/admin/help'] },
  ], [])

  const displayName = useMemo(() => 
    profile?.display_name || profile?.full_name || 'Administrator',
    [profile]
  )
  
  const firstName = useMemo(() => 
    displayName.split(' ').length >= 2 ? displayName.split(' ')[1] : displayName.split(' ')[0],
    [displayName]
  )
  
  const initials = useMemo(() => 
    displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    [displayName]
  )

  const handleLogoutClick = useCallback(() => setShowSignOutConfirm(true), [])
  
  const confirmSignOut = useCallback(() => {
    setShowSignOutConfirm(false)
    instantLogout()
  }, [])

  const handleNavClick = useCallback((tabId: string, routePatterns?: string[]) => {
    if (isUpdatingRef.current) return
    isUpdatingRef.current = true
    
    setActiveTab(tabId)
    if (routePatterns && routePatterns.length > 0) {
      const targetRoute = routePatterns[0]
      if (pathname !== targetRoute) {
        router.push(targetRoute)
      }
    }
    
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 50)
  }, [setActiveTab, pathname, router])

  const renderNavItem = useCallback((item: NavigationItem) => {
    const isActive = activeTab === item.id
    const Icon = item.icon
    
    const buttonContent = (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id, item.routePatterns)}
        className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-xl transition-all w-full group relative overflow-hidden my-0.5",
          isActive 
            ? "bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/10 font-semibold" 
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60",
          collapsed ? "justify-center" : ""
        )}
      >
        {isActive && !collapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
        )}

        {!isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/5 group-hover:to-indigo-500/5 transition-all duration-500" />
        )}
        
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-300",
          isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:text-purple-600 dark:group-hover:text-purple-400"
        )} />
        
        {!collapsed && (
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium tracking-wide block">{item.name}</span>
              {item.badge && item.badge > 0 && (
                <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 animate-pulse border-none">
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className={cn(
              "text-[10px] block truncate mt-0.5 tracking-tight",
              isActive ? "text-purple-50/80" : "text-slate-400 dark:text-slate-500"
            )}>
              {item.description}
            </span>
          </div>
        )}
        
        {collapsed && item.badge && item.badge > 0 && (
          <div className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center animate-pulse font-bold">
            {item.badge}
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

    return buttonContent;
  }, [activeTab, collapsed, handleNavClick])

  // Group navigation items with a separator
  const navigationGroups = useMemo(() => {
    const mainGroup = primaryNavigation.slice(0, 4) 
    const managementGroup = primaryNavigation.slice(4, 7) 
    const academicGroup = primaryNavigation.slice(7) 
    
    return { mainGroup, managementGroup, academicGroup }
  }, [primaryNavigation])

  if (!mounted) return null

  return (
    <>
      <aside className={cn(
        "hidden lg:flex flex-col fixed left-0 top-[4.5rem] z-30 transition-all duration-300 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-r border-slate-200 dark:border-slate-800/80 shadow-sm",
        "h-[calc(100vh-4.5rem)]",
        collapsed ? "w-20" : "w-72"
      )}>
        <TooltipProvider>
          <ScrollArea className="h-full scrollbar-none">
            <div className="flex flex-col h-full justify-between pb-4">
              <div>
                {/* Profile Section */}
                <div className={cn(
                  "shrink-0 border-b border-slate-100 dark:border-slate-800/80",
                  "bg-gradient-to-b from-purple-50/30 via-transparent to-transparent dark:from-purple-950/10 dark:via-transparent dark:to-transparent",
                  collapsed ? "px-2 py-4 flex justify-center" : "px-5 py-5"
                )}>
                  {collapsed ? (
                    <Avatar className="h-12 w-12 ring-2 ring-purple-500/20 dark:ring-purple-500/10 shadow-md cursor-pointer" title={displayName}>
                      <AvatarImage src={profile?.photo_url} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-base">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="space-y-4 w-full">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 ring-2 ring-purple-500/20 dark:ring-purple-500/10 shadow-lg">
                          <AvatarImage src={profile?.photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-lg">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            Welcome back,
                          </p>
                          <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight truncate mt-0.5">
                            {firstName}!
                          </h3>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{profile?.email}</p>
                        <Badge className="mt-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] shadow-sm font-semibold">
                          Administrator
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Navigation - Group 1: Overview & Communications */}
                <div className="px-3 py-3 space-y-0.5">
                  {!collapsed && (
                    <p className="px-3 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Dashboard
                    </p>
                  )}
                  {navigationGroups.mainGroup.map(renderNavItem)}
                </div>

                {!collapsed && <Separator className="mx-3 my-2 bg-slate-100 dark:bg-slate-800/80" />}

                {/* Primary Navigation - Group 2: Management */}
                <div className="px-3 py-1 space-y-0.5">
                  {!collapsed && (
                    <p className="px-3 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Management
                    </p>
                  )}
                  {navigationGroups.managementGroup.map(renderNavItem)}
                </div>

                {!collapsed && <Separator className="mx-3 my-2 bg-slate-100 dark:bg-slate-800/80" />}

                {/* Primary Navigation - Group 3: Academic */}
                <div className="px-3 py-1 space-y-0.5">
                  {!collapsed && (
                    <p className="px-3 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Academic
                    </p>
                  )}
                  {navigationGroups.academicGroup.map(renderNavItem)}
                </div>

                {!collapsed && <Separator className="mx-3 my-2 bg-slate-100 dark:bg-slate-800/80" />}

                {/* Secondary Navigation */}
                <div className="px-3 py-1 space-y-0.5">
                  {!collapsed && (
                    <p className="px-3 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Account
                    </p>
                  )}
                  {secondaryNavigation.map(renderNavItem)}
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="shrink-0 p-3 mt-4 border-t border-slate-100 dark:border-slate-800/80">
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
          </ScrollArea>

          {/* Collapse Toggle */}
          <button
            onClick={onToggle}
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-2 shadow-md hover:shadow-lg transition-all flex items-center justify-center hover:scale-105 group z-50 ring-2 ring-purple-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-10 transition-opacity" />
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-purple-600 transition-colors" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 text-slate-500 group-hover:text-purple-600 transition-colors" />
            )}
          </button>
        </TooltipProvider>
      </aside>

      {/* Sign Out Confirmation Dialog */}
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
              Are you sure you want to sign out of your account? You will need to re-authenticate to review system diagnostics or approve report cards.
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