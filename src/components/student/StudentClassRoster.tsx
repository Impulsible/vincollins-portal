// components/student/StudentClassRoster.tsx - NO LOADING SKELETON
'use client'

import { useState, useMemo, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, Search, GraduationCap, Sparkles, Grid3x3, List, Eye, 
  Calendar, User, School, X, Maximize2, 
  Phone, MapPin, ChevronRight, Star, 
  Heart, Coffee, Target, Brain, Lightbulb
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'

interface Classmate {
  id: string
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  full_name: string
  display_name?: string | null
  class: string
  photo_url?: string | null
  cover_photo_url?: string | null
  is_active?: boolean
  department?: string
  admission_year?: number
  phone?: string
  address?: string
}

interface StudentClassRosterProps {
  studentClass?: string
  studentId?: string
  compact?: boolean
  className?: string
  onClassmateClick?: (classmate: Classmate) => void
}

// Fun facts
const funFacts = [
  { emoji: "🌟", message: "Star student" },
  { emoji: "🚀", message: "Future leader" },
  { emoji: "💡", message: "Bright mind" },
  { emoji: "🎯", message: "Goal getter" },
  { emoji: "📚", message: "Book worm" },
  { emoji: "🎨", message: "Creative soul" },
  { emoji: "🔬", message: "Science geek" },
  { emoji: "💪", message: "Hard worker" },
  { emoji: "🏆", message: "Champion" },
  { emoji: "⭐", message: "All-star" },
  { emoji: "🌈", message: "Positive vibes" },
  { emoji: "🦁", message: "Brave heart" },
  { emoji: "🦉", message: "Wise owl" },
  { emoji: "🐝", message: "Busy bee" },
  { emoji: "🦋", message: "Social butterfly" },
  { emoji: "🐉", message: "Dragon energy" },
]

const departmentFacts: Record<string, { emoji: string; fact: string; color: string }> = {
  Science: { emoji: '🔬', fact: 'Science whiz', color: 'text-blue-500' },
  Arts: { emoji: '🎨', fact: 'Creative genius', color: 'text-purple-500' },
  Commercial: { emoji: '💼', fact: 'Business star', color: 'text-amber-500' },
  General: { emoji: '🌟', fact: 'Awesome student', color: 'text-emerald-500' },
}

const motivationalMessages = [
  "✨ Believe in yourself!",
  "💪 You've got this!",
  "⭐ Keep shining!",
  "🎯 Make today count!",
  "🌈 Dream big!",
  "🚀 Be awesome today!",
]

function getRandomFunFact(): { emoji: string; message: string } {
  return funFacts[Math.floor(Math.random() * funFacts.length)]
}

function getRandomMotivationalMessage(): string {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
}

function getBestDisplayName(classmate: Classmate): string {
  if (classmate.display_name) return classmate.display_name
  if (classmate.last_name && classmate.first_name) {
    const parts = [classmate.last_name, classmate.first_name]
    if (classmate.middle_name) parts.push(classmate.middle_name)
    return parts.join(' ')
  }
  return classmate.full_name || 'Student'
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
  ]
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}

// Full Screen Image Viewer
function FullScreenImageViewer({ 
  imageUrl, 
  title, 
  open, 
  onClose 
}: { 
  imageUrl: string | null | undefined; 
  title: string; 
  open: boolean; 
  onClose: () => void;
}) {
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden rounded-2xl border-0 bg-black/95">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/70 to-transparent">
            <h3 className="text-white font-medium text-sm sm:text-base truncate">{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center min-h-[300px] max-h-[85vh] p-4">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <User className="h-16 w-16 text-slate-500" />
                <p className="mt-4 text-slate-400">No image available</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Classmate Profile Modal
function ClassmateProfileModal({ 
  classmate, 
  open, 
  onClose 
}: { 
  classmate: Classmate | null; 
  open: boolean; 
  onClose: () => void;
}) {
  const [showFullImage, setShowFullImage] = useState(false)
  const [showFullCover, setShowFullCover] = useState(false)
  
  if (!classmate) return null

  const displayName = getBestDisplayName(classmate)
  const funFact = getRandomFunFact()
  const motivationalMessage = getRandomMotivationalMessage()
  const coverPhotoUrl = classmate.cover_photo_url || '/images/default-cover.jpg'
  const deptFact = classmate.department ? departmentFacts[classmate.department] || departmentFacts.General : departmentFacts.General

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-2xl p-0 overflow-hidden shadow-2xl border-0 bg-white">
          {/* Cover Photo */}
          <div 
            className="relative h-32 w-full cursor-pointer overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500"
            onClick={() => setShowFullCover(true)}
          >
            <img 
              src={coverPhotoUrl}
              alt="Cover"
              className="w-full h-32 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="h-6 w-6 text-white" />
            </div>
          </div>
          
          {/* Avatar - Below cover, centered */}
          <div className="flex justify-center -mt-12 mb-3">
            <div 
              className="relative cursor-pointer"
              onClick={() => classmate.photo_url && setShowFullImage(true)}
            >
              <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
                <AvatarImage src={classmate.photo_url || undefined} />
                <AvatarFallback className={cn(
                  "bg-gradient-to-br text-white text-2xl font-bold",
                  getAvatarColor(displayName)
                )}>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              {classmate.photo_url && (
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <Maximize2 className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 pb-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">{displayName}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Badge className="bg-emerald-100 text-emerald-700">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {classmate.class}
                </Badge>
                <Badge variant="outline" className="text-slate-500">
                  <User className="h-3 w-3 mr-1" />
                  Student
                </Badge>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-full">
                <span className="text-sm">{funFact.emoji}</span>
                <span className="text-xs text-amber-600">{funFact.message}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classmate.department && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center">
                      <School className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Department</p>
                      <p className="text-sm font-medium text-slate-700">{classmate.department}</p>
                    </div>
                  </div>
                )}

                {classmate.admission_year && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Class of</p>
                      <p className="text-sm font-medium text-slate-700">{classmate.admission_year}</p>
                    </div>
                  </div>
                )}

                {classmate.phone && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="text-sm font-medium text-slate-700">{classmate.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {classmate.address && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm font-medium text-slate-700">{classmate.address}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl text-center">
              <Lightbulb className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-emerald-700">{motivationalMessage}</p>
            </div>

            <DialogClose asChild>
              <Button className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <FullScreenImageViewer
        imageUrl={classmate.photo_url}
        title={displayName}
        open={showFullImage}
        onClose={() => setShowFullImage(false)}
      />
      <FullScreenImageViewer
        imageUrl={classmate.cover_photo_url}
        title={`${displayName}'s cover photo`}
        open={showFullCover}
        onClose={() => setShowFullCover(false)}
      />
    </>
  )
}

// Classmate Card - Grid View
function ClassmateCard({ classmate, onClick }: { classmate: Classmate; onClick: () => void }) {
  const displayName = getBestDisplayName(classmate)
  const funFact = getRandomFunFact()
  const coverPhotoUrl = classmate.cover_photo_url || '/images/default-cover.jpg'

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-500 overflow-hidden">
          <img 
            src={coverPhotoUrl}
            alt="Cover"
            className="w-full h-24 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/default-cover.jpg'
            }}
          />
        </div>
        
        <div className="flex justify-center -mt-10">
          <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
            <AvatarImage src={classmate.photo_url || undefined} />
            <AvatarFallback className={cn(
              "bg-gradient-to-br text-white text-lg font-bold",
              getAvatarColor(displayName)
            )}>
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="px-3 pb-4 pt-2 text-center">
          <h3 className="font-semibold text-slate-800 text-sm mt-1 truncate">{displayName}</h3>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
              {classmate.class}
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-0.5 mt-2">
            <span className="text-xs">{funFact.emoji}</span>
            <p className="text-[9px] text-slate-400 truncate">{funFact.message}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <Eye className="h-3 w-3 mr-1" />
            View Profile
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Classmate Row - List View
function ClassmateRow({ classmate, onClick }: { classmate: Classmate; onClick: () => void }) {
  const displayName = getBestDisplayName(classmate)
  const funFact = getRandomFunFact()
  const coverPhotoUrl = classmate.cover_photo_url || '/images/default-cover.jpg'

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden">
              <img 
                src={coverPhotoUrl} 
                alt="Cover" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/default-cover.jpg'
                }}
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar className="h-9 w-9 ring-2 ring-white">
                  <AvatarImage src={classmate.photo_url || undefined} />
                  <AvatarFallback className={cn(
                    "bg-gradient-to-br text-white text-xs font-bold",
                    getAvatarColor(displayName)
                  )}>
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-800 text-sm">{displayName}</h3>
              <Badge className="bg-green-100 text-green-700 text-[9px]">
                Active
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <GraduationCap className="h-3 w-3" />
                {classmate.class}
              </span>
              {classmate.department && (
                <span className="text-xs text-slate-400">• {classmate.department}</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs">{funFact.emoji}</span>
              <span className="text-[10px] text-slate-400">{funFact.message}</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export function StudentClassRoster({ 
  studentClass, 
  studentId, 
  compact = false,
  className,
  onClassmateClick 
}: StudentClassRosterProps) {
  const [classmates, setClassmates] = useState<Classmate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedClassmate, setSelectedClassmate] = useState<Classmate | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [motivationalMessage] = useState(getRandomMotivationalMessage())

  // Fetch classmates - NO LOADING STATE
  useEffect(() => {
    const fetchClassmates = async () => {
      if (!studentClass) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, middle_name, last_name, full_name, display_name, class, photo_url, cover_photo_url, department, admission_year, phone, address')
          .eq('class', studentClass)
          .eq('role', 'student')
          .order('first_name')

        if (error) {
          console.error('Error fetching classmates:', error)
          return
        }

        if (data && data.length > 0) {
          const filteredData = studentId 
            ? data.filter(student => student.id !== studentId)
            : data

          const mappedClassmates = filteredData.map((student: any) => ({
            id: student.id,
            first_name: student.first_name,
            middle_name: student.middle_name,
            last_name: student.last_name,
            full_name: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            display_name: student.display_name,
            class: student.class,
            photo_url: student.photo_url,
            cover_photo_url: student.cover_photo_url,
            department: student.department,
            admission_year: student.admission_year,
            phone: student.phone,
            address: student.address,
            is_active: true
          }))
          
          setClassmates(mappedClassmates)
        } else {
          setClassmates([])
        }
      } catch (error) {
        console.error('Error in fetchClassmates:', error)
      }
    }

    fetchClassmates()
  }, [studentClass, studentId])

  const filteredClassmates = useMemo(() => {
    return classmates.filter(classmate => {
      const displayName = getBestDisplayName(classmate)
      return displayName.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [classmates, searchQuery])

  const handleClassmateClick = (classmate: Classmate) => {
    setSelectedClassmate(classmate)
    setModalOpen(true)
    onClassmateClick?.(classmate)
  }

  if (!studentClass) {
    return (
      <div className={cn("bg-white rounded-xl border p-8 text-center", className)}>
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Class Assigned</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          You haven't been assigned to a class yet. Please contact your administrator.
        </p>
      </div>
    )
  }

  if (classmates.length === 0) {
    return (
      <div className={cn("bg-white rounded-xl border p-8 text-center", className)}>
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mx-auto mb-4">
          <Coffee className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Classmates Yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Grab a coffee ☕ and check back soon! Students in <span className="font-medium text-emerald-600">{studentClass}</span> will appear here once enrolled.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className={cn("space-y-5", className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-600" />
              Classmates
              <Badge className="bg-emerald-100 text-emerald-700 ml-2">
                {classmates.length} {classmates.length === 1 ? 'Student' : 'Students'}
              </Badge>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-slate-500">
                <GraduationCap className="h-3.5 w-3.5 inline mr-1" />
                {studentClass}
              </p>
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                {motivationalMessage}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Find a classmate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-56 text-sm bg-white border-slate-200 focus:border-emerald-300"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  viewMode === 'grid' && "bg-white shadow-sm text-emerald-600"
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  viewMode === 'list' && "bg-white shadow-sm text-emerald-600"
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && filteredClassmates.length !== classmates.length && (
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Found {filteredClassmates.length} of {classmates.length} classmates matching "{searchQuery}"
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setSearchQuery('')}
              className="h-auto p-0 text-xs text-emerald-600"
            >
              Clear search
            </Button>
          </div>
        )}

        {/* Classmates Display */}
        {filteredClassmates.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No classmates found</p>
            <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredClassmates.map((classmate) => (
              <ClassmateCard
                key={classmate.id}
                classmate={classmate}
                onClick={() => handleClassmateClick(classmate)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClassmates.map((classmate) => (
              <ClassmateRow
                key={classmate.id}
                classmate={classmate}
                onClick={() => handleClassmateClick(classmate)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {!compact && filteredClassmates.length > 0 && (
          <div className="pt-2 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Heart className="h-3 w-3 text-red-400" />
              Showing <span className="font-medium text-slate-500">{filteredClassmates.length}</span> of{' '}
              <span className="font-medium text-slate-500">{classmates.length}</span> classmates
              <Star className="h-3 w-3 text-amber-400" />
            </p>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <ClassmateProfileModal
        classmate={selectedClassmate}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}