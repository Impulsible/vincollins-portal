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
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
  { id: 'monitor', label: 'CBT Monitor', icon: Activity },
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
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-gray-200 bg-white shadow-sm transition-all duration-300 dark:border-gray-700 dark:bg-gray-900',
        open ? 'w-72' : 'w-20'
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700">
        {open ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-purple-50 ring-1 ring-purple-100 dark:bg-purple-900/20 dark:ring-purple-800">
              {schoolSettings?.logo_path ? (
                <img
                  src={schoolSettings.logo_path}
                  alt="Vincollins College Logo"
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
          </div>
        ) : (
          <div className="mx-auto flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-purple-50 ring-1 ring-purple-100 dark:bg-purple-900/20 dark:ring-purple-800">
            {schoolSettings?.logo_path ? (
              <img
                src={schoolSettings.logo_path}
                alt="Vincollins College Logo"
                className="h-8 w-8 object-contain"
              />
            ) : (
              <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            )}
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'rounded-xl p-2 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
            !open && 'ml-0'
          )}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-2 p-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'group relative flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200',
                  open ? 'justify-start gap-3' : 'justify-center',
                  isActive
                    ? 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 shadow-sm ring-1 ring-purple-200 dark:from-purple-900/30 dark:to-purple-800/20 dark:text-purple-300 dark:ring-purple-800'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                )}
                aria-label={item.label}
                title={!open ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105',
                    isActive && 'scale-105'
                  )}
                />

                {open && <span className="truncate">{item.label}</span>}

                {item.badge && pendingSubmissions > 0 && open && (
                  <Badge className="ml-auto border-0 bg-red-500 px-2 py-0.5 text-white shadow-sm">
                    {pendingSubmissions}
                  </Badge>
                )}

                {item.badge && pendingSubmissions > 0 && !open && (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
                )}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <button
          onClick={onSignOut}
          className={cn(
            'group flex w-full items-center rounded-xl border border-red-100 bg-red-50/70 px-3 py-3 font-medium text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 hover:shadow-sm dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300',
            open ? 'justify-start gap-3' : 'justify-center'
          )}
          aria-label="Sign Out"
          title={!open ? 'Sign Out' : undefined}
        >
          <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
          {open && <span className="font-semibold">Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}