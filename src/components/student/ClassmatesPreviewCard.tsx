// components/student/ClassmatesPreviewCard.tsx - FULL NAME DISPLAY
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, ArrowRight, UserPlus, GraduationCap, Sparkles, Trophy, Heart, Smile, Star, Coffee, Rocket, Music, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

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

// Fun facts and emojis for different departments
const departmentFunFact: Record<string, { emoji: string; fact: string; icon: React.ElementType; color: string }> = {
  Science: { 
    emoji: '🔬', 
    fact: 'Future scientists', 
    icon: Rocket, 
    color: 'text-blue-500' 
  },
  Arts: { 
    emoji: '🎨', 
    fact: 'Creative minds', 
    icon: Music, 
    color: 'text-purple-500' 
  },
  Commercial: { 
    emoji: '💼', 
    fact: 'Future leaders', 
    icon: Star, 
    color: 'text-amber-500' 
  },
  General: { 
    emoji: '🌟', 
    fact: 'Awesome students', 
    icon: Sparkles, 
    color: 'text-emerald-500' 
  },
}

const funGreetings = [
  '✨ Study buddy!', '🎓 Classmate!', '📚 Learning partner!', '⭐ Star student!', 
  '🚀 Future leader!', '🎯 Goal getter!', '💡 Bright mind!', '🏆 Champion!',
  '🎨 Creative genius!', '🔍 Problem solver!', '💪 Hard worker!', '🤝 Team player!',
  '🌈 Positive energy!', '🦁 Brave heart!', '🦉 Wise owl!', '🐝 Busy bee!'
]

function getRandomGreeting(): string {
  return funGreetings[Math.floor(Math.random() * funGreetings.length)]
}

// Helper functions
function getInitials(first_name?: string | null, last_name?: string | null, displayName?: string): string {
  // Use display name first
  if (displayName) {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }
    return parts[0].charAt(0).toUpperCase()
  }
  // Fallback to first and last name
  if (first_name && last_name) {
    return (first_name.charAt(0) + last_name.charAt(0)).toUpperCase()
  }
  if (first_name) {
    return first_name.charAt(0).toUpperCase()
  }
  return 'S'
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600',
  ]
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

// Helper to extract year from class name
function extractYear(className: string): string {
  if (!className) return ''
  if (className.startsWith('JSS')) return 'JSS'
  if (className.startsWith('SS1')) return 'SS1'
  if (className.startsWith('SS2')) return 'SS2'
  if (className.startsWith('SS3')) return 'SS3'
  return className
}

// Get best display name for a classmate
function getBestDisplayName(classmate: Classmate): string {
  // Priority: display_name > full_name > first_name + last_name > first_name > 'Student'
  if (classmate.display_name) {
    return classmate.display_name
  }
  if (classmate.full_name) {
    return classmate.full_name
  }
  if (classmate.first_name && classmate.last_name) {
    return `${classmate.first_name} ${classmate.last_name}`
  }
  if (classmate.first_name) {
    return classmate.first_name
  }
  return 'Student'
}

// Fun badge component
function FunBadge({ department }: { department?: string }) {
  const dept = department || 'General'
  const funFact = departmentFunFact[dept] || departmentFunFact.General
  const Icon = funFact.icon
  
  return (
    <Badge className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] sm:text-[10px] px-1.5 py-0.5">
      <Icon className="h-2.5 w-2.5 mr-0.5" />
      {funFact.fact}
    </Badge>
  )
}

// Motivational quote component
function MotivationalQuote() {
  const quotes = [
    { text: "Learning is a treasure that will follow its owner everywhere", emoji: "💎" },
    { text: "The beautiful thing about learning is that no one can take it away from you", emoji: "📚" },
    { text: "Education is the most powerful weapon which you can use to change the world", emoji: "🌍" },
    { text: "The future belongs to those who believe in the beauty of their dreams", emoji: "⭐" },
    { text: "Your classmates are your greatest resource", emoji: "🤝" },
    { text: "Together we achieve more", emoji: "🤝" },
    { text: "Study smarter, not harder", emoji: "🧠" },
  ]
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
  
  return (
    <div className="text-center text-[10px] text-slate-400 italic flex items-center justify-center gap-1">
      <span>{randomQuote.emoji}</span>
      <span className="truncate">{randomQuote.text}</span>
    </div>
  )
}

export function ClassmatesPreviewCard({ classmates, studentClass, onViewAll }: ClassmatesPreviewCardProps) {
  const displayClassmates = classmates.slice(0, 4)
  const hasMore = classmates.length > 4
  const yearGroup = extractYear(studentClass)

  return (
    <Card className="border-0 shadow-sm bg-white overflow-hidden w-full group">
      {/* Gradient top bar */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
      
      <CardHeader className="pb-2 px-4 sm:px-5 pt-4 sm:pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <span>{yearGroup} Classmates</span>
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                {classmates.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-1 flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {yearGroup} • {classmates.length} amazing student{classmates.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewAll}
            className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 w-fit"
          >
            View All 👥
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
        {classmates.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 sm:py-10"
          >
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mx-auto mb-3">
              <Coffee className="h-7 w-7 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">No classmates yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Grab a coffee ☕ and check back soon! Your classmates will appear here
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {displayClassmates.map((classmate, index) => {
                const displayName = getBestDisplayName(classmate)
                const firstName = displayName.split(' ')[0]
                const greeting = getRandomGreeting()
                
                return (
                  <motion.div
                    key={classmate.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group/item cursor-pointer"
                    onClick={() => onViewAll()}
                  >
                    <div className="flex flex-col items-center p-3 rounded-xl hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 border border-slate-100 hover:border-emerald-200 hover:shadow-md">
                      <div className="relative">
                        <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-3 ring-white shadow-md">
                          <AvatarImage src={classmate.photo_url || undefined} />
                          <AvatarFallback className={cn(
                            "bg-gradient-to-br text-white text-base font-bold",
                            getAvatarColor(displayName)
                          )}>
                            {getInitials(classmate.first_name, classmate.last_name, displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1">
                          <div className="h-3 w-3 sm:h-3.5 sm:w-3.5 bg-green-500 rounded-full ring-2 ring-white" />
                        </div>
                      </div>
                      
                      <div className="mt-2 text-center">
                        {/* ✅ Show full display name */}
                        <p className="font-semibold text-xs sm:text-sm truncate max-w-[100px]" title={displayName}>
                          {displayName.length > 15 ? displayName.substring(0, 12) + '...' : displayName}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <FunBadge department={classmate.department} />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1.5 flex items-center justify-center gap-0.5">
                          <Smile className="h-2.5 w-2.5" />
                          {greeting}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            
            {hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-4 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-9 text-sm"
                  onClick={onViewAll}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Meet all {classmates.length} amazing classmates
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
                
                {/* Motivational quote */}
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <MotivationalQuote />
                </div>
              </motion.div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}