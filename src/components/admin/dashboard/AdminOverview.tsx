// components/admin/dashboard/AdminOverview.tsx
'use client'

import { WelcomeBanner } from '@/components/admin/dashboard/WelcomeBanner'
import { StatsCards } from '@/components/admin/dashboard/StatsCards'
import { QuickActions } from '@/components/admin/dashboard/QuickActions'
import { RecentActivityFeed } from '@/components/admin/dashboard/RecentActivityFeed'
import { Button } from '@/components/ui/button'
import { Bell, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface AdminOverviewProps {
  profile: any
  stats: any
  students: any[]
  pendingExamsCount: number
  onNavigate: (tab: string) => void
  onRefresh: () => void
  refreshing: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
}

export function AdminOverview({ profile, stats, students, pendingExamsCount, onNavigate }: AdminOverviewProps) {
  return (
    <motion.div
      key="overview"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 sm:space-y-6 overflow-hidden"
    >
      <motion.div variants={itemVariants}>
        <WelcomeBanner adminProfile={profile} activeTab="overview" />
      </motion.div>

      {/* Pending Exams Alert */}
      {pendingExamsCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-amber-600" />
            <div>
              <p className="font-bold text-amber-800">{pendingExamsCount} exam(s) pending approval</p>
              <p className="text-sm text-amber-600">Review and publish exams submitted by teachers</p>
            </div>
          </div>
          <Button onClick={() => onNavigate('exams')} className="bg-amber-600 hover:bg-amber-700 shrink-0">
            Review Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <StatsCards
          stats={stats}
          onStudentClick={() => onNavigate('students')}
          onStaffClick={() => onNavigate('staff')}
          onExamsClick={() => onNavigate('exams')}
          onSubmissionsClick={() => {}}
          onResultsClick={() => {}}
          onAttendanceClick={() => {}}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <QuickActions
          onStudentClick={() => onNavigate('students')}
          onStaffClick={() => onNavigate('staff')}
          onExamsClick={() => onNavigate('exams')}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <RecentActivityFeed />
      </motion.div>
    </motion.div>
  )
}