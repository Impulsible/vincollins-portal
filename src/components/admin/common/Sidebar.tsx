/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
// components/admin/common/Sidebar.tsx
'use client'

import {
  GraduationCap,
  Home,
  Users,
  BookOpen,
  FileCheck,
  Award,
  BarChart3,
  Activity,
  LogOut,
  MonitorPlay,
  Shield,
  Eye,
  Settings,
  TrendingUp,
  ChevronLeft,
  X,
  Menu,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  onSignOut: () => void
  pendingSubmissions: number
  schoolSettings: any
  adminProfile?: any
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: Home, color: 'text-blue-500' },
  { id: 'students', label: 'Students', icon: GraduationCap, color: 'text-emerald-500' },
  { id: 'staff', label: 'Staff', icon: Users, color: 'text-purple-500' },
  { id: 'exams', label: 'Exams', icon: BookOpen, color: 'text-amber-500' },
  { id: 'submissions', label: 'Submissions', icon: FileCheck, badge: true, color: 'text-cyan-500' },
  { id: 'grading', label: 'Grade Theory', icon: Award, color: 'text-rose-500' },
  { id: 'results', label: 'Results', icon: BarChart3, color: 'text-indigo-500' },
  { id: 'cbt-monitor', label: 'CBT Monitor', icon: MonitorPlay, highlight: true, color: 'text-violet-500' },
  { id: 'violations', label: 'Violations', icon: Shield, color: 'text-red-500' },
  { id: 'live-proctoring', label: 'Proctoring', icon: Eye, color: 'text-orange-500' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'text-green-500' },
  { id: 'attendance', label: 'Attendance', icon: Activity, color: 'text-pink-500' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-500' },
]

export function Sidebar({
  open,
  setOpen,
  activeTab,
  setActiveTab,
  onSignOut,
  pendingSubmissions,
  schoolSettings,
  adminProfile,
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when clicking a nav item on mobile
  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId)
    if (isMobile) {
      setOpen(false)
    }
  }

  // Handle sign out with confirmation
  const handleSignOutClick = () => {
    if (isMobile) {
      setShowSignOutConfirm(true)
    } else {
      onSignOut()
    }
  }

  const confirmSignOut = () => {
    setShowSignOutConfirm(false)
    setOpen(false)
    onSignOut()
  }

  const sidebarWidth = isMobile ? (open ? 280 : 0) : (open ? 280 : 80)

  return (
    <TooltipProvider>
      <>
        {/* Mobile Hamburger Button - Only visible when sidebar is closed on mobile */}
        {isMobile && !open && (
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-50 h-10 w-10 rounded-xl shadow-lg border-2 bg-white dark:bg-slate-900"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Sidebar */}
        <motion.aside
          className={cn(
            'fixed md:relative z-50 flex h-screen flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900',
            !open && isMobile && 'pointer-events-none'
          )}
          initial={false}
          animate={{ width: sidebarWidth }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Logo Section */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div 
                  key="expanded"
                  className="flex min-w-0 items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                    {schoolSettings?.logo_path ? (
                      <img
                        src={schoolSettings.logo_path}
                        alt="School Logo"
                        className="h-7 w-7 object-contain"
                      />
                    ) : (
                      <GraduationCap className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {schoolSettings?.school_name || 'Vincollins College'}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      Admin Portal v2.0
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="collapsed"
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {schoolSettings?.logo_path ? (
                    <img
                      src={schoolSettings.logo_path}
                      alt="Logo"
                      className="h-7 w-7 object-contain"
                    />
                  ) : (
                    <GraduationCap className="h-5 w-5 text-white" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close button for mobile */}
            {isMobile && open && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            )}

            {/* Collapse Button - Desktop Only */}
            {!isMobile && (
              <Button
                onClick={() => setOpen(!open)}
                variant="ghost"
                size="icon"
                className="hidden md:flex rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {open ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
          </div>

          {/* User Profile Section (Mobile only - shows when expanded) */}
          {isMobile && open && adminProfile && (
            <div className="border-b border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={adminProfile?.photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {adminProfile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {adminProfile?.full_name || 'Administrator'}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {adminProfile?.email || 'admin@vincollins.edu.ng'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3">
            <nav className="space-y-1.5 py-4">
              {navItems.map((item) => {
                const isActive = activeTab === item.id
                const Icon = item.icon

                const navButton = (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      'group relative flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                      open ? 'justify-start gap-3' : 'justify-center',
                      isActive
                        ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50',
                      item.highlight && !isActive && 'ring-1 ring-primary/30'
                    )}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={cn(
                      'h-5 w-5 shrink-0 transition-all duration-200',
                      isActive ? item.color : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                      isActive && 'scale-110'
                    )} />

                    {open && (
                      <>
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {item.id === 'cbt-monitor' && (
                          <Badge className="ml-auto bg-gradient-to-r from-primary to-secondary text-white border-0">
                            <span className="relative flex h-2 w-2 mr-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            Live
                          </Badge>
                        )}
                        {item.badge && pendingSubmissions > 0 && (
                          <Badge className="ml-auto border-0 bg-red-500 px-2 py-0.5 text-white shadow-sm">
                            {pendingSubmissions}
                          </Badge>
                        )}
                      </>
                    )}

                    {/* Badge indicators for collapsed state */}
                    {!open && item.badge && pendingSubmissions > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md">
                        {pendingSubmissions > 9 ? '9+' : pendingSubmissions}
                      </span>
                    )}
                    
                    {!open && item.id === 'cbt-monitor' && (
                      <span className="absolute right-1 top-1">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                      </span>
                    )}
                  </button>
                )

                return open ? (
                  navButton
                ) : (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      {navButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                      {item.label}
                      {item.id === 'cbt-monitor' && (
                        <Badge className="bg-primary text-primary-foreground text-[10px]">Live</Badge>
                      )}
                      {item.badge && pendingSubmissions > 0 && (
                        <Badge className="bg-red-500 text-white text-[10px]">{pendingSubmissions}</Badge>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Sign Out Button */}
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            {open ? (
              <motion.button
                onClick={handleSignOutClick}
                className="group flex w-full items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 font-medium text-red-600 transition-all duration-200 hover:from-red-100 hover:to-rose-100 hover:text-red-700 hover:shadow-md dark:border-red-900/40 dark:from-red-950/20 dark:to-rose-950/20 dark:text-red-400 dark:hover:from-red-950/30 dark:hover:to-rose-950/30 dark:hover:text-red-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Sign Out"
              >
                <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                <span className="font-semibold">Sign Out</span>
              </motion.button>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={handleSignOutClick}
                    className="group flex w-full items-center justify-center rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-3 font-medium text-red-600 transition-all duration-200 hover:from-red-100 hover:to-rose-100 hover:text-red-700 hover:shadow-md dark:border-red-900/40 dark:from-red-950/20 dark:to-rose-950/20 dark:text-red-400 dark:hover:from-red-950/30 dark:hover:to-rose-950/30 dark:hover:text-red-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Sign Out"
                  >
                    <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <span className="flex items-center gap-2">
                    Sign Out
                    <LogOut className="h-3 w-3" />
                  </span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </motion.aside>

        {/* Mobile Sign Out Confirmation Dialog */}
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-2">Sign Out?</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSignOutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={confirmSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Mobile Overlay */}
        {isMobile && open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </>
    </TooltipProvider>
  )
}

export default Sidebar