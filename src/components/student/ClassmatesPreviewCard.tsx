// components/student/ClassmatesPreviewCard.tsx - DARK MODE READY
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, ArrowRight, GraduationCap, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================
interface Classmate {
  id: string
  first_name?: string | null
  last_name?: string | null
  full_name: string
  display_name?: string | null
  class: string
  photo_url?: string | null
  department?: string
}

interface ClassmatesPreviewCardProps {
  classmates: Classmate[]
  studentClass: string
  onViewAll: () => void
}

// ============================================
// CONSTANTS
// ============================================
const DEPARTMENT_BADGES: Record<string, { label: string; color: string }> = {
  Science: { label: '🔬 Science', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  Arts: { label: '🎨 Arts', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  Commercial: { label: '💼 Commercial', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  General: { label: '🌟 Student', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
}

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-orange-500 to-red-600',
]

// ============================================
// HELPER FUNCTIONS
// ============================================
function extractYear(className: string): string {
  if (!className) return ''
  
  const normalized = className.trim().replace(/\s+/g, ' ')
  
  if (normalized === 'JSS 1' || normalized === 'JSS1') return 'JSS1'
  if (normalized === 'JSS 2' || normalized === 'JSS2') return 'JSS2'
  if (normalized === 'JSS 3' || normalized === 'JSS3') return 'JSS3'
  if (normalized === 'SS 1' || normalized === 'SS1') return 'SS1'
  if (normalized === 'SS 2' || normalized === 'SS2') return 'SS2'
  if (normalized === 'SS 3' || normalized === 'SS3') return 'SS3'
  if (normalized.startsWith('SS1')) return 'SS1'
  if (normalized.startsWith('SS2')) return 'SS2'
  if (normalized.startsWith('SS3')) return 'SS3'
  
  return className
}

function getBestDisplayName(classmate: Classmate): string {
  if (classmate.display_name) return classmate.display_name
  if (classmate.full_name) return classmate.full_name
  if (classmate.first_name && classmate.last_name) return `${classmate.first_name} ${classmate.last_name}`
  if (classmate.first_name) return classmate.first_name
  return 'Student'
}

function getInitials(first_name?: string | null, last_name?: string | null, displayName?: string): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    return parts[0].charAt(0).toUpperCase()
  }
  if (first_name && last_name) return (first_name.charAt(0) + last_name.charAt(0)).toUpperCase()
  if (first_name) return first_name.charAt(0).toUpperCase()
  return 'S'
}

function getAvatarColor(name: string): string {
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function getDepartmentBadge(department?: string) {
  const dept = department || 'General'
  return DEPARTMENT_BADGES[dept] || DEPARTMENT_BADGES.General
}

// ============================================
// COMPONENTS
// ============================================
function ClassmateAvatar({ classmate, displayName }: { classmate: Classmate; displayName: string }) {
  return (
    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-white dark:ring-slate-900 shadow-md">
      <AvatarImage src={classmate.photo_url || undefined} />
      <AvatarFallback className={cn("bg-gradient-to-br text-white text-base font-bold", getAvatarColor(displayName))}>
        {getInitials(classmate.first_name, classmate.last_name, displayName)}
      </AvatarFallback>
    </Avatar>
  )
}

function ClassmateCard({ classmate, onClick }: { classmate: Classmate; onClick: () => void }) {
  const displayName = getBestDisplayName(classmate)
  const deptBadge = getDepartmentBadge(classmate.department)
  
  return (
    <div 
      className="flex flex-col items-center p-3 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-200 cursor-pointer border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/50"
      onClick={onClick}
    >
      <ClassmateAvatar classmate={classmate} displayName={displayName} />
      <div className="mt-2 text-center">
        <p className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate max-w-[100px]" title={displayName}>
          {displayName.length > 15 ? displayName.substring(0, 12) + '...' : displayName}
        </p>
        <Badge className={cn("text-[10px] mt-1 border", deptBadge.color)}>
          {deptBadge.label}
        </Badge>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-8 sm:py-10">
      <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
        <Users className="h-7 w-7 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">No classmates yet</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Check back soon!</p>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ClassmatesPreviewCard({ classmates, studentClass, onViewAll }: ClassmatesPreviewCardProps) {
  const displayClassmates = classmates.slice(0, 4)
  const hasMore = classmates.length > 4
  const yearGroup = extractYear(studentClass)

  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden w-full rounded-2xl transition-colors duration-300">
      <CardHeader className="pb-2 px-4 sm:px-5 pt-4 sm:pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{yearGroup} Classmates</span>
              <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {classmates.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-1 text-slate-500 dark:text-slate-400">
              <GraduationCap className="h-3 w-3 inline mr-1" />
              {classmates.length} student{classmates.length !== 1 ? 's' : ''} in {yearGroup}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewAll}
            className="h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            View All
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
        {classmates.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {displayClassmates.map((classmate) => (
                <ClassmateCard 
                  key={classmate.id} 
                  classmate={classmate} 
                  onClick={onViewAll}
                />
              ))}
            </div>
            
            {hasMore && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 h-8 text-xs cursor-pointer"
                onClick={onViewAll}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                View all {classmates.length} classmates
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}