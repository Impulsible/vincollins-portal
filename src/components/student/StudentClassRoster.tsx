// components/student/StudentClassRoster.tsx - NO EMAIL, NO VIN ID (Fixed)
'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Search, GraduationCap, Sparkles, Grid3x3, List, Eye, Calendar, User, School, X, Maximize2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'
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

// Helper function to get best display name
function getBestDisplayName(classmate: Classmate): string {
  if (classmate.display_name) return classmate.display_name
  if (classmate.last_name && classmate.first_name) {
    const parts = [classmate.last_name, classmate.first_name]
    if (classmate.middle_name) parts.push(classmate.middle_name)
    return parts.join(' ')
  }
  return classmate.full_name || 'Student'
}

// Full Screen Image Viewer - Dark theme
function FullScreenImageViewer({ 
  imageUrl, 
  name, 
  open, 
  onClose 
}: { 
  imageUrl: string | null | undefined; 
  name: string; 
  open: boolean; 
  onClose: () => void;
}) {
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/70 to-transparent">
            <h3 className="text-white font-medium text-sm sm:text-base truncate">{name}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] max-h-[70vh] p-4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`${name}'s profile`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <Avatar className="h-32 w-32 sm:h-48 sm:w-48">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-4xl sm:text-6xl font-bold">
                    {name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-4 text-slate-400 text-sm">No profile picture available</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Classmate Profile Modal - DARK/SLEEK THEME (No email, no VIN)
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
  
  if (!classmate) return null

  const displayName = getBestDisplayName(classmate)
  const firstName = classmate.first_name || displayName.split(' ')[0] || 'Student'
  
  const getAvatarColor = (name: string): string => {
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

  const getInitials = (name: string): string => {
    if (!name) return 'S'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-2xl p-0 overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-slate-800 to-slate-900">
          {/* Header gradient accent */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          
          <div className="p-5 sm:p-6">
            <DialogHeader className="text-center sm:text-left">
              <DialogTitle className="text-2xl font-bold text-white">Classmate Profile</DialogTitle>
              <DialogDescription className="text-slate-300 text-sm">
                View classmate information
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 flex flex-col items-center sm:flex-row sm:items-start gap-5">
              {/* Avatar section */}
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => classmate.photo_url && setShowFullImage(true)}
                >
                  <Avatar className="h-24 w-24 ring-4 ring-emerald-400/30 shadow-xl">
                    <AvatarImage src={classmate.photo_url || undefined} />
                    <AvatarFallback className={cn(
                      "bg-gradient-to-br text-white text-2xl font-bold",
                      getAvatarColor(displayName)
                    )}>
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  {classmate.photo_url && (
                    <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <Maximize2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-0.5">
                  Classmate
                </Badge>
              </div>

              {/* Info Grid - Dark theme (NO email, NO VIN) */}
              <div className="flex-1 space-y-3 w-full">
                {/* Name section */}
                <div className="text-center sm:text-left pb-2 border-b border-slate-700">
                  <h3 className="text-xl font-bold text-white">{displayName}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{firstName}&apos;s Profile</p>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Class */}
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Class</p>
                      <p className="text-sm font-semibold text-white truncate">{classmate.class || 'Not assigned'}</p>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                    <div className="h-7 w-7 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                      <School className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Department</p>
                      <p className="text-sm font-semibold text-white truncate">{classmate.department || 'General'}</p>
                    </div>
                  </div>

                  {/* Phone - Only if exists */}
                  {classmate.phone && (
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                      <div className="h-7 w-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                        <svg className="h-3.5 w-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Phone</p>
                        <p className="text-sm font-semibold text-white">{classmate.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Admission Year */}
                  {classmate.admission_year && (
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                      <div className="h-7 w-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Admission Year</p>
                        <p className="text-sm font-semibold text-white">{classmate.admission_year}</p>
                      </div>
                    </div>
                  )}

                  {/* Address - Only if exists */}
                  {classmate.address && (
                    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-700/50 border border-slate-600 sm:col-span-2">
                      <div className="h-7 w-7 rounded-lg bg-slate-500/20 flex items-center justify-center shrink-0">
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Address</p>
                        <p className="text-sm font-medium text-slate-300">{classmate.address}</p>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-700/50 border border-slate-600">
                    <div className="h-7 w-7 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Status</p>
                      <Badge className="mt-0.5 bg-green-500/20 text-green-300 border border-green-500/30 text-[10px]">
                        Active Student
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogClose asChild>
              <Button className="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 text-white">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <FullScreenImageViewer
        imageUrl={classmate.photo_url}
        name={displayName}
        open={showFullImage}
        onClose={() => setShowFullImage(false)}
      />
    </>
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
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedClassmate, setSelectedClassmate] = useState<Classmate | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch classmates from the same class (NO email, NO vin_id)
  useEffect(() => {
    const fetchClassmates = async () => {
      if (!studentClass) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, middle_name, last_name, full_name, display_name, class, photo_url, department, admission_year, phone, address')
          .eq('class', studentClass)
          .eq('role', 'student')
          .order('display_name')

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
      } finally {
        setLoading(false)
      }
    }

    fetchClassmates()

    const classmatesChannel = supabase
      .channel('classmates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `class=eq.${studentClass}`
        },
        () => {
          fetchClassmates()
        }
      )
      .subscribe()

    return () => {
      classmatesChannel.unsubscribe()
    }
  }, [studentClass, studentId])

  // Filter classmates by search
  const filteredClassmates = useMemo(() => {
    return classmates.filter(classmate => {
      const displayName = getBestDisplayName(classmate)
      return displayName.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [classmates, searchQuery])

  // Get initials for avatar
  const getInitials = (classmate: Classmate): string => {
    const displayName = getBestDisplayName(classmate)
    if (!displayName) return 'S'
    const parts = displayName.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Get avatar color
  const getAvatarColor = (name: string): string => {
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

  const handleClassmateClick = (classmate: Classmate) => {
    setSelectedClassmate(classmate)
    setModalOpen(true)
    onClassmateClick?.(classmate)
  }

  if (loading) {
    return (
      <Card className={cn("border-0 shadow-sm", className)}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!studentClass) {
    return (
      <Card className={cn("border-0 shadow-sm", className)}>
        <CardContent className="py-8 text-center">
          <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Class not assigned</p>
          <p className="text-xs text-slate-400 mt-1">
            Please contact your administrator to assign a class.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (classmates.length === 0 && !loading) {
    return (
      <Card className={cn("border-0 shadow-sm", className)}>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No classmates found</p>
          <p className="text-sm text-slate-400 mt-1">
            Students in {studentClass} will appear here once enrolled.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={cn(
        "border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 overflow-hidden",
        className
      )}>
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                </div>
                <span>My Classmates</span>
                <Badge className="bg-emerald-100 text-emerald-700 ml-1 sm:ml-2 text-xs">
                  {classmates.length}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1 text-xs sm:text-sm">
                <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {studentClass} • {classmates.length} student{classmates.length !== 1 ? 's' : ''} enrolled
              </CardDescription>
            </div>
            
            {!compact && classmates.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 self-start">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 p-0",
                    viewMode === 'list' && "bg-white shadow-sm"
                  )}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 p-0",
                    viewMode === 'grid' && "bg-white shadow-sm"
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
          </div>

          {!compact && classmates.length > 0 && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
              <Input
                placeholder="Search classmates by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 sm:h-10 text-sm"
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {filteredClassmates.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <Search className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No classmates found matching "{searchQuery}"</p>
              <Button variant="link" size="sm" onClick={() => setSearchQuery('')} className="mt-2">
                Clear search
              </Button>
            </div>
          ) : viewMode === 'list' ? (
            <ScrollArea className="px-3 sm:px-4 max-h-[400px] sm:max-h-[450px]">
              <div className="space-y-1 pb-4">
                {filteredClassmates.map((classmate, index) => {
                  const displayName = getBestDisplayName(classmate)
                  return (
                    <motion.div
                      key={classmate.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer group"
                      onClick={() => handleClassmateClick(classmate)}
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-white shadow-sm">
                          <AvatarImage src={classmate.photo_url || undefined} />
                          <AvatarFallback className={cn(
                            "bg-gradient-to-br text-white text-xs font-medium",
                            getAvatarColor(displayName)
                          )}>
                            {getInitials(classmate)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 bg-green-500 rounded-full ring-2 ring-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm sm:text-base truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {classmate.class}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <Badge className="bg-green-100 text-green-700 text-[9px] sm:text-[10px]">
                          Active
                        </Badge>
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="max-h-[400px] sm:max-h-[450px] px-3 sm:px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {filteredClassmates.map((classmate, index) => {
                  const displayName = getBestDisplayName(classmate)
                  return (
                    <motion.div
                      key={classmate.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-3 sm:p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer text-center"
                      onClick={() => handleClassmateClick(classmate)}
                    >
                      <div className="relative inline-block">
                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 ring-2 ring-white shadow-md mx-auto">
                          <AvatarImage src={classmate.photo_url || undefined} />
                          <AvatarFallback className={cn(
                            "bg-gradient-to-br text-white text-sm sm:text-base md:text-lg font-medium",
                            getAvatarColor(displayName)
                          )}>
                            {getInitials(classmate)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 rounded-full ring-2 ring-white" />
                        </div>
                      </div>
                      <p className="font-medium text-slate-900 text-xs sm:text-sm mt-2 truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                        {classmate.class}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {!compact && filteredClassmates.length > 0 && (
            <div className="px-4 sm:px-6 py-2 sm:py-3 border-t border-slate-200 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] sm:text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
                  Showing {filteredClassmates.length} of {classmates.length} classmates
                </span>
                <span className="text-slate-400">
                  {studentClass} • {classmates.length} total
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ClassmateProfileModal
        classmate={selectedClassmate}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}