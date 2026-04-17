// components/admin/AdminSidebar.tsx
'use client'

import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen, FileText,
  Settings, LogOut, ChevronLeft, ChevronRight,
  Award, Calendar, Bell, School, GraduationCap,
  FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface AdminSidebarProps {
  profile: any
  onLogout: () => void
  collapsed: boolean
  onToggle: () => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

const navigationItems = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard, route: '/admin' },
  { id: 'users', name: 'Users', icon: Users, route: '/admin/users' },
  { id: 'students', name: 'Students', icon: GraduationCap, route: '/admin/students' },
  { id: 'staff', name: 'Staff', icon: School, route: '/admin/staff' },
  { id: 'exams', name: 'Exams', icon: BookOpen, route: '/admin/exams' },
  { id: 'report-cards', name: 'Report Cards', icon: FileCheck, route: '/admin/report-cards' },
  { id: 'settings', name: 'Settings', icon: Settings, route: '/admin/settings' },
]

export function AdminSidebar({ profile, onLogout, collapsed, onToggle, activeTab, setActiveTab }: AdminSidebarProps) {
  const router = useRouter()

  const handleNavigation = (tabId: string, route: string) => {
    setActiveTab(tabId)
    router.push(route)
  }

  const getInitials = (name?: string) => {
    if (!name) return 'AD'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <aside className={cn(
      "hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
      collapsed ? "w-20" : "w-72"
    )}>
      <TooltipProvider>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <School className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Admin Portal</h2>
                <p className="text-xs text-slate-500">Vincollins College</p>
              </div>
            )}
          </div>
        </div>

        <div className={cn("p-4 border-b border-slate-200 dark:border-slate-800", collapsed && "flex justify-center")}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.photo_url} />
                  <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{profile?.full_name || 'Administrator'}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.photo_url} />
                <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile?.full_name || 'Administrator'}</p>
                <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              const buttonContent = (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id, item.route)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full",
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                      : "text-slate-600 hover:bg-slate-100",
                    collapsed ? "justify-center" : ""
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                </button>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                    <TooltipContent side="right">{item.name}</TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={item.id}>{buttonContent}</div>
            })}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={onLogout} className="w-full justify-center text-red-600">
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="ghost" onClick={onLogout} className="w-full justify-start text-red-600">
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          )}
        </div>

        <button 
          onClick={onToggle} 
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border rounded-full p-1.5 shadow-md"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </TooltipProvider>
    </aside>
  )
}