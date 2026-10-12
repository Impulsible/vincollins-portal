// ============================================
// SECTION CARD COMPONENT - DARK MODE
// ============================================

'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  description?: string
  icon: ReactNode
  iconColor: 'blue' | 'emerald' | 'purple' | 'amber'
  viewAllLink?: string
  onViewAll?: () => void
  children: ReactNode
  className?: string
}

const iconColorClasses = {
  blue: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  purple: 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
  amber: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
}

export function SectionCard({
  title,
  description,
  icon,
  iconColor,
  onViewAll,
  children,
  className
}: SectionCardProps) {
  return (
    <Card 
      className={cn(
        "border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-300", 
        className
      )}
    >
      <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-800 px-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              iconColorClasses[iconColor]
            )}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {onViewAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              View All <ArrowRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  )
}