import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LayoutDashboard, MonitorPlay, Award, User, Menu, FileText, BookOpen, Users, TrendingUp, FileCheck } from 'lucide-react'

interface MobileBottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export function MobileBottomNav({ activeTab, onTabChange, mobileMenuOpen, setMobileMenuOpen }: MobileBottomNavProps) {
  const mainTabs = [
    { id: 'overview', icon: LayoutDashboard, label: 'Home' },
    { id: 'exams', icon: MonitorPlay, label: 'Exams' },
    { id: 'results', icon: Award, label: 'Results' },
    { id: 'profile', icon: User, label: 'Profile' }
  ]

  const moreTabs = [
    { id: 'assignments', icon: FileText, label: 'Assignments' },
    { id: 'notes', icon: BookOpen, label: 'Notes' },
    { id: 'classmates', icon: Users, label: 'Classmates' },
    { id: 'performance', icon: TrendingUp, label: 'Performance' },
    { id: 'report-card', icon: FileCheck, label: 'Report Card' }
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg w-full overflow-hidden">
      <div className="grid grid-cols-5 gap-1 p-2 max-w-full">
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center py-2 rounded-lg transition-all",
              activeTab === tab.id ? "text-emerald-600 bg-emerald-50" : "text-slate-500"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] mt-1 truncate">{tab.label}</span>
          </button>
        ))}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex flex-col items-center py-2 rounded-lg text-slate-500"
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
            className="absolute bottom-full left-0 right-0 bg-white border-t shadow-lg p-4 rounded-t-xl max-h-[60vh] overflow-y-auto"
          >
            <div className="grid grid-cols-3 gap-2">
              {moreTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-slate-100"
                >
                  <tab.icon className="h-5 w-5 text-slate-600" />
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