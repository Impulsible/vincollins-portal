// src/components/student/exams/ExamTabs.tsx
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Unlock, Clock, CheckCircle2 } from 'lucide-react'
import type { TabType } from '@/app/student/exams/types'

interface ExamTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  availableCount: number
  upcomingCount: number
  completedCount: number
}

export function ExamTabs({
  activeTab,
  onTabChange,
  availableCount,
  upcomingCount,
  completedCount,
}: ExamTabsProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabType)}>
        <TabsList className="bg-background p-1 rounded-xl shadow-sm border w-full sm:w-auto flex">
          <TabsTrigger 
            value="available" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 flex-1 sm:flex-initial"
          >
            <Unlock className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Available</span>
            <span className="xs:hidden">Avail</span>
            <Badge variant="secondary" className="ml-1 sm:ml-2 bg-background/20 text-inherit text-xs">
              {availableCount}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="upcoming" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 flex-1 sm:flex-initial"
          >
            <Clock className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Upcoming</span>
            <span className="xs:hidden">Soon</span>
            <Badge variant="secondary" className="ml-1 sm:ml-2 bg-background/20 text-inherit text-xs">
              {upcomingCount}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="completed" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-2 flex-1 sm:flex-initial"
          >
            <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Completed</span>
            <span className="xs:hidden">Done</span>
            <Badge variant="secondary" className="ml-1 sm:ml-2 bg-background/20 text-inherit text-xs">
              {completedCount}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}