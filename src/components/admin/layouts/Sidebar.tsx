/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/common/Sidebar.tsx
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
  Menu,
  X,
  MonitorPlay,
  Shield,
  Eye,
  Settings,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  onSignOut: () => void
  pendingSubmissions: number
  schoolSettings: any
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'exams', label: 'Exams', icon: BookOpen },
  { id: 'submissions', label: 'Submissions', icon: FileCheck, badge: true },
  { id: 'grading', label: 'Grade Theory', icon: Award },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'cbt-monitor', label: 'CBT Monitor', icon: MonitorPlay, highlight: true },
  { id: 'live-proctoring', label: 'Live Proctoring', icon: Eye },
  { id: 'violations', label: 'Violations', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({
  open,
  setOpen,
  activeTab,
  setActiveTab,
  onSignOut,
  pendingSubmissions,
  schoolSettings,
}: SidebarProps) {
  return (
    <TooltipProvider>
      <motion.aside
        className={cn(
          'fixed md:relative z-50 flex h-screen flex-col border-r border-gray-200 bg-white shadow-lg transition-all duration-300 dark:border-gray-700 dark:bg-gray-900',
          open ? 'w-72' : 'w-20',
          // Mobile styles
          'md:translate-x-0',
          !open && 'max-md:-translate-x-full'
        )}
        initial={false}
        animate={{ width: open ? 288 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Mobile overlay */}
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}

        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div 
                className="flex min-w-0 items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 ring-1 ring-purple-100 dark:ring-purple-800">
                  {schoolSettings?.logo_path ? (
                    <img
                      src={schoolSettings.logo_path}
                      alt="Vincollins College Logo"
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <GraduationCap className="h-6 w-6 text-white" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {schoolSettings?.school_name || 'Vincollins College'}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    Admin Portal
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="mx-auto flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 ring-1 ring-purple-100 dark:ring-purple-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {schoolSettings?.logo_path ? (
                  <img
                    src={schoolSettings.logo_path}
                    alt="Vincollins College Logo"
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <GraduationCap className="h-6 w-6 text-white" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={() => setOpen(!open)}
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-xl text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
              !open && 'absolute -right-3 top-4 z-50 bg-white shadow-md border md:hidden'
            )}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {open ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1 py-4">
            {navItems.map((item) => {
              const isActive = activeTab === item.id

              const navButton = (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    if (window.innerWidth < 768) {
                      setOpen(false)
                    }
                  }}
                  className={cn(
                    'group relative flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                    open ? 'justify-start gap-3' : 'justify-center',
                    isActive
                      ? 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 shadow-sm ring-1 ring-purple-200 dark:from-purple-900/30 dark:to-purple-800/20 dark:text-purple-300 dark:ring-purple-800'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
                    item.highlight && !isActive && 'border border-purple-200 dark:border-purple-800'
                  )}
                  aria-label={item.label}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105',
                      isActive && 'scale-105',
                      item.id === 'cbt-monitor' && 'text-purple-500'
                    )}
                  />

                  {open && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.id === 'cbt-monitor' && (
                        <Badge className="ml-auto bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                          <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
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

                  {item.badge && pendingSubmissions > 0 && !open && (
                    <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
                    </span>
                  )}

                  {item.id === 'cbt-monitor' && !open && (
                    <span className="absolute right-2 top-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
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
                      <Badge className="bg-purple-100 text-purple-700 text-xs">Live</Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          {open ? (
            <motion.button
              onClick={onSignOut}
              className="group flex w-full items-center gap-3 rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-rose-50 px-3 py-3 font-medium text-red-600 transition-all duration-200 hover:from-red-100 hover:to-rose-100 hover:text-red-700 hover:shadow-md dark:border-red-900/40 dark:from-red-900/10 dark:to-rose-900/10 dark:text-red-400 dark:hover:from-red-900/20 dark:hover:to-rose-900/20 dark:hover:text-red-300"
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
                  onClick={onSignOut}
                  className="group flex w-full items-center justify-center rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-rose-50 px-3 py-3 font-medium text-red-600 transition-all duration-200 hover:from-red-100 hover:to-rose-100 hover:text-red-700 hover:shadow-md dark:border-red-900/40 dark:from-red-900/10 dark:to-rose-900/10 dark:text-red-400 dark:hover:from-red-900/20 dark:hover:to-rose-900/20 dark:hover:text-red-300"
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
                  <LogOut className="h-3 w-3" />y
                </span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}