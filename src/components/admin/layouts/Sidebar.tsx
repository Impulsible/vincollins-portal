/* eslint-disable @typescript-eslint/no-explicit-any */
// components/admin/layouts/Sidebar.tsx
'use client'

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileCheck,
  Award,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  onSignOut: () => void
  schoolSettings: any
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'exams', label: 'Exams', icon: BookOpen },
  { id: 'submissions', label: 'Submissions', icon: FileCheck },
  { id: 'grading', label: 'Grade Theory', icon: Award },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'monitor', label: 'CBT Monitor', icon: Shield },
]

export function Sidebar({
  open,
  setOpen,
  activeTab,
  setActiveTab,
  onSignOut,
  schoolSettings,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'relative flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 shadow-lg',
        open ? 'w-72' : 'w-20'
      )}
    >
      {/* HEADER */}
      <div
        className={cn(
          'flex items-center border-b border-gray-200 dark:border-gray-700 py-4 transition-all duration-300',
          open ? 'px-6 justify-between' : 'px-3 justify-center'
        )}
      >
        {open && (
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 shadow-sm ring-1 ring-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 dark:ring-purple-800">
              {schoolSettings?.logo_path ? (
                <Image
                  src={schoolSettings.logo_path}
                  alt="Vincollins College"
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              )}
            </div>

            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                {schoolSettings?.school_name || 'Vincollins College'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Admin Portal
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition"
        >
          {open ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <ScrollArea className="flex-1 py-6">
        <div className="space-y-2 px-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'group relative flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                  open ? 'gap-3 justify-start' : 'justify-center',
                  isActive
                    ? 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 shadow-sm ring-1 ring-purple-200 dark:from-purple-900/30 dark:to-purple-800/20 dark:text-purple-300 dark:ring-purple-800'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-all',
                    isActive && 'scale-110'
                  )}
                />

                {open && <span>{item.label}</span>}

                {/* Tooltip */}
                {!open && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}

                {/* Active indicator */}
                {isActive && open && (
                  <div className="absolute left-0 h-8 w-1 bg-purple-600 rounded-r-full" />
                )}
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onSignOut}
          className={cn(
            'group relative flex w-full items-center rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200',
            open ? 'gap-3 justify-start' : 'justify-center',
            'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20'
          )}
        >
          <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-1" />

          {open && <span>Sign Out</span>}

          {!open && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}