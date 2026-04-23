// ============================================
// SECTION CARD COMPONENT
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
  blue: 'bg-blue-100 text-blue-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  purple: 'bg-purple-100 text-purple-600',
  amber: 'bg-amber-100 text-amber-600'
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
    <Card className={cn("border-0 shadow-sm bg-white overflow-hidden", className)}>
      <CardHeader className="pb-4 border-b px-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              iconColorClasses[iconColor]
            )}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-xs sm:text-sm">
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
              className="text-xs sm:text-sm"
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