// components/staff/StaffMobileBottomNav.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, BookOpen, FileText, User, Menu, 
  Users, Notebook, ClipboardList, CalendarDays, Bell 
} from 'lucide-react'

interface StaffMobileBottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export function StaffMobileBottomNav({ 
  activeTab, 
  onTabChange, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}: StaffMobileBottomNavProps) {
  const mainTabs = [
    { id: 'overview', icon: LayoutDashboard, label: 'Home' },
    { id: 'exams', icon: BookOpen, label: 'Exams' },
    { id: 'students', icon: Users, label: 'Students' },
    { id: 'profile', icon: User, label: 'Profile' }
  ]

  const moreTabs = [
    { id: 'assignments', icon: FileText, label: 'Assignments' },
    { id: 'notes', icon: Notebook, label: 'Notes' },
    { id: 'attendance', icon: ClipboardList, label: 'Attendance' },
    { id: 'schedule', icon: CalendarDays, label: 'Schedule' },
    { id: 'notifications', icon: Bell, label: 'Alerts' },
    { id: 'settings', icon: User, label: 'Settings' }
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg w-full overflow-hidden">
      <div className="grid grid-cols-5 gap-1 p-2 max-w-full">
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center py-2 rounded-lg transition-all",
              activeTab === tab.id 
                ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" 
                : "text-slate-500 dark:text-slate-400"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] mt-1 truncate">{tab.label}</span>
          </button>
        ))}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={cn(
            "flex flex-col items-center py-2 rounded-lg transition-all",
            mobileMenuOpen 
              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" 
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-1 truncate">More</span>
        </button>
      </div>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg p-4 rounded-t-xl max-h-[60vh] overflow-y-auto"
          >
            <div className="grid grid-cols-3 gap-2">
              {moreTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id)
                    setMobileMenuOpen(false)
                  }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg transition-all",
                    activeTab === tab.id 
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="text-xs mt-1 truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}