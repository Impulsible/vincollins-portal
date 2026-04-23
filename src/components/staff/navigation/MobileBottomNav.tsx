// ============================================
// MOBILE BOTTOM NAVIGATION - UPDATED WITH ALL FEATURES
// ============================================

'use client'

import { useState } from 'react'
import { 
  Home, MonitorPlay, FileText, BookOpen, Users,
  Calculator, PenTool, UserCheck, FileCheck, Award, Clock,
  Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabType } from '@/lib/staff/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MobileBottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  pendingGrading?: number
  pendingCAScores?: number
  onlineStudents?: number
}

const mainNavItems = [
  { id: 'overview' as TabType, icon: Home, label: 'Home' },
  { id: 'exams' as TabType, icon: MonitorPlay, label: 'Exams' },
  { id: 'grade' as TabType, icon: PenTool, label: 'Grade' },
  { id: 'attendance' as TabType, icon: UserCheck, label: 'Attend' },
  { id: 'students' as TabType, icon: Users, label: 'Students' },
]

const moreNavItems = [
  { id: 'ca-scores' as TabType, icon: Calculator, label: 'CA Scores', color: 'blue' },
  { id: 'assignments' as TabType, icon: FileText, label: 'Assignments', color: 'emerald' },
  { id: 'notes' as TabType, icon: BookOpen, label: 'Notes', color: 'purple' },
  { id: 'report-cards' as TabType, icon: FileCheck, label: 'Report Cards', color: 'amber' },
  { id: 'results' as TabType, icon: Award, label: 'Results', color: 'pink' },
  { id: 'schedule' as TabType, icon: Clock, label: 'Schedule', color: 'indigo' },
]

export function MobileBottomNav({ 
  activeTab, 
  onTabChange, 
  pendingGrading = 0,
  pendingCAScores = 0,
  onlineStudents = 0
}: MobileBottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const getBadgeCount = (id: TabType): number => {
    switch (id) {
      case 'grade': return pendingGrading
      case 'ca-scores': return pendingCAScores
      case 'attendance': return onlineStudents
      default: return 0
    }
  }

  const handleTabSelect = (tab: TabType) => {
    onTabChange(tab)
    setSheetOpen(false)
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      amber: 'bg-amber-50 text-amber-600 border-amber-200',
      pink: 'bg-pink-50 text-pink-600 border-pink-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    }
    return colors[color] || 'bg-gray-50 text-gray-600 border-gray-200'
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t shadow-lg safe-area-pb">
      <div className="grid grid-cols-6 gap-1 p-2">
        {mainNavItems.map(({ id, icon: Icon, label }) => {
          const badgeCount = getBadgeCount(id)
          
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex flex-col items-center py-1.5 rounded-xl transition-all duration-200 relative",
                activeTab === id 
                  ? "text-blue-600 bg-blue-50 scale-105" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badgeCount > 0 && activeTab !== id && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white">
                    <span className="text-[8px] font-bold text-white">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-0.5">{label}</span>
              {badgeCount > 0 && activeTab === id && (
                <Badge className="absolute -top-1 right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[8px]">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </Badge>
              )}
            </button>
          )
        })}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center py-1.5 rounded-xl transition-all duration-200",
                sheetOpen 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium mt-0.5">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl p-0">
            <SheetHeader className="px-4 py-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-bold">More Features</SheetTitle>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>
            
            <ScrollArea className="h-full">
              <div className="p-4">
                {/* Quick Stats Summary */}
                {(pendingGrading > 0 || pendingCAScores > 0 || onlineStudents > 0) && (
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {pendingGrading > 0 && (
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-amber-600 font-medium">Pending</p>
                        <p className="text-xl font-bold text-amber-700">{pendingGrading}</p>
                        <p className="text-[8px] text-amber-500">To Grade</p>
                      </div>
                    )}
                    {pendingCAScores > 0 && (
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-purple-600 font-medium">CA Pending</p>
                        <p className="text-xl font-bold text-purple-700">{pendingCAScores}</p>
                        <p className="text-[8px] text-purple-500">Scores</p>
                      </div>
                    )}
                    {onlineStudents > 0 && (
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-[10px] text-green-600 font-medium">Online</p>
                        <p className="text-xl font-bold text-green-700">{onlineStudents}</p>
                        <p className="text-[8px] text-green-500">Students</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Teaching Section */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Teaching & Assessment
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {moreNavItems.slice(0, 4).map(({ id, icon: Icon, label, color }) => {
                      const badgeCount = getBadgeCount(id)
                      
                      return (
                        <button
                          key={id}
                          onClick={() => handleTabSelect(id)}
                          className={cn(
                            "flex flex-col items-center p-4 rounded-xl border transition-all duration-200 relative",
                            getColorClasses(color),
                            activeTab === id && "ring-2 ring-offset-1"
                          )}
                        >
                          <div className="relative">
                            <Icon className="h-6 w-6 mb-2" />
                            {badgeCount > 0 && (
                              <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                <span className="text-[9px] font-bold text-white">
                                  {badgeCount > 9 ? '9+' : badgeCount}
                                </span>
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-center">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* More Section */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    More
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {moreNavItems.slice(4).map(({ id, icon: Icon, label, color }) => (
                      <button
                        key={id}
                        onClick={() => handleTabSelect(id)}
                        className={cn(
                          "flex flex-col items-center p-4 rounded-xl border transition-all duration-200",
                          getColorClasses(color),
                          activeTab === id && "ring-2 ring-offset-1"
                        )}
                      >
                        <Icon className="h-6 w-6 mb-2" />
                        <span className="text-xs font-medium text-center">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Indicator */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 text-center">
                    Currently on: <span className="font-semibold text-gray-700 capitalize">{activeTab.replace('-', ' ')}</span>
                  </p>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}