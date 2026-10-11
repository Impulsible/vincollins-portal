'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  MonitorPlay, 
  Users, 
  User, 
  MoreHorizontal, 
  FileText, 
  Notebook, 
  ClipboardList, 
  CalendarDays, 
  Bell, 
  Megaphone, 
  Settings,
  X 
} from 'lucide-react'

interface StaffMobileBottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  notificationCount?: number
  announcementCount?: number
}

export function StaffMobileBottomNav({ 
  activeTab, 
  onTabChange, 
  mobileMenuOpen, 
  setMobileMenuOpen,
  notificationCount = 0,
  announcementCount = 0
}: StaffMobileBottomNavProps) {
  // 4 Primary bottom tabs
  const mainTabs = [
    { id: 'overview', icon: LayoutDashboard, label: 'Home' },
    { id: 'exams', icon: MonitorPlay, label: 'Exams' },
    { id: 'students', icon: Users, label: 'Students' },
    { id: 'profile', icon: User, label: 'Profile' }
  ]

  // Secondary items (Includes Announcements)
  const moreTabs = [
    { id: 'announcements', icon: Megaphone, label: 'Announcements', badge: announcementCount },
    { id: 'assignments', icon: FileText, label: 'Assignments' },
    { id: 'attendance', icon: ClipboardList, label: 'Attendance' },
    { id: 'schedule', icon: CalendarDays, label: 'Schedule' },
    { id: 'notes', icon: Notebook, label: 'Notes' },
    { id: 'notifications', icon: Bell, label: 'Alerts', badge: notificationCount },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ]

  const isMoreActive = moreTabs.some(t => t.id === activeTab)

  return (
    <>
      {/* Backdrop overlay to dismiss when tapping outside */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-around px-2 py-1">
          {mainTabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id)
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative",
                  active 
                    ? "text-blue-600 dark:text-blue-400 font-semibold" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="staffActiveTabPill"
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-950/40 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            )
          })}

          {/* More Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative",
              mobileMenuOpen || isMoreActive
                ? "text-blue-600 dark:text-blue-400 font-semibold" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {(notificationCount > 0 || announcementCount > 0) && (
              <span className="absolute top-1 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
            <MoreHorizontal className={cn("h-5 w-5 transition-transform", mobileMenuOpen && "rotate-90 scale-110")} />
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>

        {/* More Menu Drawer Popup */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl rounded-t-3xl p-4 max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Staff Tools & Navigation
                </p>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {moreTabs.map((tab) => {
                  const Icon = tab.icon
                  const active = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id)
                        setMobileMenuOpen(false)
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl transition-all relative border",
                        active 
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50 font-semibold shadow-sm" 
                          : "border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {tab.badge && tab.badge > 0 ? (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-500 text-white leading-none">
                          {tab.badge}
                        </span>
                      ) : null}
                      <Icon className={cn("h-5 w-5 mb-1.5", active ? "text-blue-600 dark:text-blue-400" : "text-slate-500")} />
                      <span className="text-xs truncate w-full text-center">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}