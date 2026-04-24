/* eslint-disable @typescript-eslint/no-unused-vars */
// components/admin/AdminSidebar.tsx - FIXED: Navigates using tabs, not routes
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, MonitorPlay, FileCheck, Activity,
  LogOut, ChevronLeft, ChevronRight, Shield, Sparkles,
  User, Settings, HelpCircle, GraduationCap, Briefcase,
  MessageSquare, Bell
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
}

export function AdminSidebar({ 
  profile, 
  onLogout, 
  collapsed, 
  onToggle, 
  activeTab, 
  setActiveTab,
  pendingExams = 0,
  pendingReports = 0,
  pendingInquiries = 0
}: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Primary navigation - clicking these switches tabs, NOT routes
  const primaryNavigation: NavigationItem[] = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: LayoutDashboard,
      description: 'Dashboard & Analytics',
    },
    { 
      id: 'students', 
      name: 'Students', 
      icon: GraduationCap,
      description: 'Manage Students',
    },
    { 
      id: 'staff', 
      name: 'Staff', 
      icon: Briefcase,
      description: 'Manage Teachers',
    },
    { 
      id: 'exams', 
      name: 'Exam Approvals', 
      icon: MonitorPlay,
      description: 'Review & Publish',
      badge: pendingExams > 0 ? pendingExams : undefined
    },
    { 
      id: 'report-cards', 
      name: 'Report Cards', 
      icon: FileCheck,
      description: 'Review & Approve',
      badge: pendingReports > 0 ? pendingReports : undefined
    },
    { 
      id: 'inquiries', 
      name: 'Inquiries', 
      icon: MessageSquare,
      description: 'Admissions & Contact',
      badge: pendingInquiries > 0 ? pendingInquiries : undefined
    },
    { 
      id: 'cbt-monitor', 
      name: 'Live Monitor', 
      icon: Activity,
      description: 'Real-time Activity',
    },
  ]

  const secondaryNavigation: NavigationItem[] = [
    { 
      id: 'settings', 
      name: 'Settings', 
      icon: Settings,
      description: 'Preferences',
    },
    { 
      id: 'help', 
      name: 'Help & Support', 
      icon: HelpCircle,
      description: 'Get assistance',
    },
  ]

  const displayName = profile?.full_name || 'Administrator'
  const firstName = displayName.split(' ')[0]
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const avatarUrl = profile?.photo_url

  const handleLogoutClick = () => setShowSignOutConfirm(true)
  
  const confirmSignOut = () => {
    setShowSignOutConfirm(false)
    onLogout()
  }

  // FIXED: Just switch tabs, don't navigate to new routes
  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId)
  }

  const renderNavItem = (item: NavigationItem) => {
    const isActive = activeTab === item.id
    const Icon = item.icon
    
    const buttonContent = (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id)}
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
                <Badge className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 animate-pulse">
                  {item.badge}
                </Badge>
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
        
        {/* Badge for collapsed mode */}
        {collapsed && item.badge && item.badge > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
            {item.badge}
          </div>
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
                <Badge className="mt-1 bg-red-500 text-white text-[9px]">
                  {item.badge} pending
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      )
    }

    return <div key={item.id}>{buttonContent}</div>
  }

  // SSR placeholder
  if (!mounted) {
    return (
      <aside className={cn(
        "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
        collapsed ? "w-20" : "w-72"
      )}>
        <div className="flex-1" />
      </aside>
    )
  }

  return (
    <>
      <aside className={cn(
        "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
        collapsed ? "w-20" : "w-72"
      )}>
        <TooltipProvider delayDuration={0}>
          <ScrollArea className="h-full">
            <div className="pt-16" />
            
            {/* Logo Section */}
            <div className={cn(
              "relative px-5 pb-4 border-b border-slate-200 dark:border-slate-800",
              collapsed ? "flex justify-center" : ""
            )}>
              <div className="relative flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                {!collapsed && (
                  <div>
                    <h2 className="font-bold text-base text-slate-900 dark:text-white">
                      Vincollins College
                    </h2>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Admin Portal
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Section */}
            <div className={cn(
              "relative px-5 py-5 border-b border-slate-200 dark:border-slate-800",
              "bg-gradient-to-b from-purple-50/50 via-white to-transparent dark:from-purple-950/20 dark:via-slate-900",
              collapsed ? "flex justify-center" : ""
            )}>
              {collapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-xl cursor-pointer">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                        {initials}
                      </AvatarFallback>
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
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                        Welcome back,
                      </p>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">
                        {firstName}!
                      </h3>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.email}</p>
                    <Badge className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                      Administrator
                    </Badge>
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

            {!collapsed && <Separator className="mx-3 my-2" />}

            {/* Secondary Navigation */}
            <div className="px-3 py-3 space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Account
                </p>
              )}
              {secondaryNavigation.map(renderNavItem)}
            </div>

            {/* Sign Out */}
            <div className="p-3 mt-2 border-t border-slate-200 dark:border-slate-800">
              {collapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={handleLogoutClick}
                      className="w-full justify-center px-2 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleLogoutClick}
                  className="w-full justify-start text-red-600 hover:bg-red-50"
                >
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
          </ScrollArea>

          {/* Collapse Toggle */}
          <button 
            onClick={onToggle} 
            className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border rounded-full p-1.5 shadow-md hover:shadow-lg transition-all z-50"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </TooltipProvider>
      </aside>

      {/* Sign Out Dialog */}
      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSignOut} className="bg-red-600 hover:bg-red-700">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}