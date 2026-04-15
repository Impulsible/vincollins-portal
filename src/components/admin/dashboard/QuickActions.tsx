/* eslint-disable @typescript-eslint/no-unused-vars */
// components/admin/dashboard/QuickActions.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  UserPlus, 
  Users, 
  FileText, 
  BarChart3, 
  Bell, 
  Settings,
  GraduationCap,
  BookOpen
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface QuickActionsProps {
  onStudentClick: () => void
  onStaffClick: () => void
  onExamsClick: () => void
}

export function QuickActions({ onStudentClick, onStaffClick, onExamsClick }: QuickActionsProps) {
  const actions = [
    { label: 'Add Student', icon: UserPlus, onClick: onStudentClick, color: 'from-blue-500 to-cyan-500' },
    { label: 'Add Staff', icon: Users, onClick: onStaffClick, color: 'from-purple-500 to-pink-500' },
    { label: 'Create Exam', icon: FileText, onClick: onExamsClick, color: 'from-emerald-500 to-teal-500' },
    { label: 'Reports', icon: BarChart3, onClick: () => {}, color: 'from-amber-500 to-orange-500' },
    { label: 'Notify All', icon: Bell, onClick: () => {}, color: 'from-rose-500 to-red-500' },
    { label: 'Settings', icon: Settings, onClick: () => {}, color: 'from-slate-500 to-gray-500' },
  ]

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Frequently used operations</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button 
                variant="outline" 
                className={cn(
                  "w-full h-auto py-4 flex-col gap-2 border-2 hover:shadow-lg transition-all duration-300",
                  "hover:border-transparent hover:text-white group relative overflow-hidden"
                )}
                onClick={action.onClick}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  action.color
                )} />
                <action.icon className="h-5 w-5 relative z-10 group-hover:text-white transition-colors" />
                <span className="text-xs font-medium relative z-10 group-hover:text-white transition-colors">
                  {action.label}
                </span>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}