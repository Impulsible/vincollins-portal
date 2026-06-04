// components/student/StudentClassRoster.tsx - FULLY CORRECTED WITH PROPER JSS/SS FILTERING
'use client'

import { useState, useMemo, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, Search, GraduationCap, Grid3x3, List, Eye, 
  Calendar, User, School, Maximize2, Phone, MapPin, X
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'

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
  department?: string
  photo_url?: string | null
  cover_photo_url?: string | null
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

// ============================================
// CONSTANTS
// ============================================
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
  
  // Normalize: remove spaces and convert to uppercase
  const normalized = className.trim().toUpperCase().replace(/\s/g, '')
  
  // Handle JSS classes
  if (normalized === 'JSS1') return 'JSS1'
  if (normalized === 'JSS2') return 'JSS2'
  if (normalized === 'JSS3') return 'JSS3'
  
  // Handle SS classes
  if (normalized === 'SS1') return 'SS1'
  if (normalized === 'SS2') return 'SS2'
  if (normalized === 'SS3') return 'SS3'
  
  // Handle subject-specific SS classes (SS1SCIENCE -> SS1)
  if (normalized.startsWith('SS1')) return 'SS1'
  if (normalized.startsWith('SS2')) return 'SS2'
  if (normalized.startsWith('SS3')) return 'SS3'
  
  return className
}

function getDisplayName(classmate: Classmate): string {
  if (classmate.display_name) return classmate.display_name
  if (classmate.first_name && classmate.last_name) {
    return `${classmate.first_name} ${classmate.last_name}`
  }
  return classmate.full_name || 'Student'
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function getAvatarColor(name: string): string {
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

// ============================================
// FULL SCREEN IMAGE VIEWER
// ============================================
function FullScreenImageViewer({ 
  imageUrl, 
  title, 
  open, 
  onClose 
}: { 
  imageUrl?: string | null; 
  title: string; 
  open: boolean; 
  onClose: () => void;
}) {
  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden rounded-xl border-0 bg-black/95">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Full screen image viewer</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[300px] p-4">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
          ) : (
            <div className="text-center">
              <User className="h-16 w-16 text-slate-500 mx-auto" />
              <p className="mt-4 text-slate-400 text-sm">No image available</p>
            </div>
          )}
        </div>
        <DialogClose className="absolute right-4 top-4 text-white/70 hover:text-white">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// CLASSMATE PROFILE MODAL
// ============================================
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

  const displayName = getDisplayName(classmate)

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md rounded-xl p-0 overflow-hidden border-0 bg-white">
          <DialogHeader className="sr-only">
            <DialogTitle>{displayName}'s Profile</DialogTitle>
            <DialogDescription>
              View {displayName}'s profile information including department, class, and contact details.
            </DialogDescription>
          </DialogHeader>
          
          {/* Cover Photo */}
          <div 
            className="relative h-28 w-full cursor-pointer overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500"
            onClick={() => classmate.cover_photo_url && setShowFullCover(true)}
            role="button"
            tabIndex={0}
            aria-label="View cover photo full screen"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                classmate.cover_photo_url && setShowFullCover(true)
              }
            }}
          >
            {classmate.cover_photo_url && (
              <img 
                src={classmate.cover_photo_url}
                alt="Cover"
                className="w-full h-28 object-cover"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="h-5 w-5 text-white" />
              <span className="sr-only">Full screen</span>
            </div>
          </div>
          
          {/* Avatar */}
          <div className="flex justify-center -mt-10 mb-3">
            <div 
              className="relative cursor-pointer"
              onClick={() => classmate.photo_url && setShowFullImage(true)}
              role="button"
              tabIndex={0}
              aria-label="View profile photo full screen"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  classmate.photo_url && setShowFullImage(true)
                }
              }}
            >
              <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                <AvatarImage src={classmate.photo_url || undefined} alt={displayName} />
                <AvatarFallback className={cn("bg-gradient-to-br text-white text-xl font-bold", getAvatarColor(displayName))}>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <div className="px-5 pb-5">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">{displayName}</h3>
              <Badge className="mt-1 bg-emerald-100 text-emerald-700 text-xs" aria-label={`Class: ${classmate.class}`}>
                <GraduationCap className="h-3 w-3 mr-1" aria-hidden="true" />
                {classmate.class}
              </Badge>
            </div>

            <div className="space-y-2">
              {classmate.department && (
                <InfoCard icon={School} label="Department" value={classmate.department} />
              )}
              {classmate.admission_year && (
                <InfoCard icon={Calendar} label="Class of" value={classmate.admission_year.toString()} />
              )}
              {classmate.phone && (
                <InfoCard icon={Phone} label="Phone" value={classmate.phone} />
              )}
              {classmate.address && (
                <InfoCard icon={MapPin} label="Location" value={classmate.address} />
              )}
            </div>

            <DialogClose asChild>
              <Button className="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 text-white">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <FullScreenImageViewer imageUrl={classmate.photo_url} title={displayName} open={showFullImage} onClose={() => setShowFullImage(false)} />
      <FullScreenImageViewer imageUrl={classmate.cover_photo_url} title={`${displayName}'s cover`} open={showFullCover} onClose={() => setShowFullCover(false)} />
    </>
  )
}

// ============================================
// INFO CARD
// ============================================
function InfoCard({ icon: Icon, label, value }: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center" aria-hidden="true">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700">{value}</p>
      </div>
    </div>
  )
}

// ============================================
// CLASSMATE CARD (GRID VIEW)
// ============================================
function ClassmateCard({ classmate, onClick }: { classmate: Classmate; onClick: () => void }) {
  const displayName = getDisplayName(classmate)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div 
      className="group cursor-pointer bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${displayName}'s profile`}
    >
      <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-500" aria-hidden="true">
        {classmate.cover_photo_url && (
          <img src={classmate.cover_photo_url} alt="" className="w-full h-20 object-cover" />
        )}
      </div>
      
      <div className="flex justify-center -mt-8">
        <Avatar className="h-16 w-16 ring-3 ring-white shadow-sm">
          <AvatarImage src={classmate.photo_url || undefined} alt={displayName} />
          <AvatarFallback className={cn("bg-gradient-to-br text-white text-sm font-bold", getAvatarColor(displayName))}>
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="px-3 pb-3 pt-1 text-center">
        <h3 className="font-medium text-sm text-slate-800 truncate">{displayName}</h3>
        <Badge variant="outline" className="text-[10px] mt-1 bg-slate-50" aria-label={`Class: ${classmate.class}`}>
          {classmate.class}
        </Badge>
      </div>
    </div>
  )
}

// ============================================
// CLASSMATE ROW (LIST VIEW)
// ============================================
function ClassmateRow({ classmate, onClick }: { classmate: Classmate; onClick: () => void }) {
  const displayName = getDisplayName(classmate)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div 
      className="group cursor-pointer bg-white rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${displayName}'s profile`}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
          <AvatarImage src={classmate.photo_url || undefined} alt={displayName} />
          <AvatarFallback className={cn("bg-gradient-to-br text-white text-xs font-bold", getAvatarColor(displayName))}>
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-slate-800">{displayName}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">{classmate.class}</span>
            {classmate.department && (
              <span className="text-xs text-slate-400">• {classmate.department}</span>
            )}
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 rounded-full text-slate-400 hover:text-emerald-600"
          aria-label={`View ${displayName}'s profile`}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

// ============================================
// EMPTY STATES
// ============================================
function NoClassAssigned() {
  return (
    <div className="bg-white rounded-lg border p-8 text-center" role="status" aria-live="polite">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3" aria-hidden="true">
        <GraduationCap className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="font-medium text-slate-800 mb-1">No Class Assigned</h3>
      <p className="text-sm text-slate-500">Please contact your administrator.</p>
    </div>
  )
}

function NoClassmatesFound() {
  return (
    <div className="bg-white rounded-lg border p-8 text-center" role="status" aria-live="polite">
      <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" aria-hidden="true" />
      <h3 className="font-medium text-slate-800 mb-1">No Classmates Found</h3>
      <p className="text-sm text-slate-500">Other students will appear here once enrolled.</p>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
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

  const yearGroup = extractYear(studentClass || '')
  const isJSS = studentClass?.toUpperCase().includes('JSS') || false
  const isSS = studentClass?.toUpperCase().includes('SS') || false

  useEffect(() => {
    const fetchClassmates = async () => {
      if (!studentClass) return

      try {
        let query = supabase
          .from('profiles')
          .select('id, first_name, last_name, full_name, display_name, class, photo_url, cover_photo_url, department, admission_year, phone, address')
          .eq('role', 'student')
          .neq('id', studentId || '')
          .order('first_name')

        // ✅ FIXED: JSS students see ONLY their exact class
        // ✅ SS students see ALL students in the same year (across departments)
        if (isJSS) {
          // JSS: Exact match (JSS 1 only sees JSS 1)
          query = query.eq('class', studentClass)
          console.log(`🔍 JSS Student - Fetching exact class: ${studentClass}`)
        } else if (isSS) {
          // SS: Match by year (SS1 Arts sees SS1 Science, SS1 Commercial)
          query = query.ilike('class', `%${yearGroup}%`)
          console.log(`🔍 SS Student - Fetching year group: ${yearGroup}%`)
        } else {
          // Fallback: Exact match
          query = query.eq('class', studentClass)
        }

        const { data, error } = await query
        if (error) throw error

        console.log(`✅ Found ${data?.length || 0} classmates`)

        if (data) {
          const mappedClassmates = data.map((student: any) => ({
            id: student.id,
            first_name: student.first_name,
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
          }))
          
          setClassmates(mappedClassmates)
        }
      } catch (error) {
        console.error('Error fetching classmates:', error)
      }
    }

    fetchClassmates()
  }, [studentClass, studentId, yearGroup, isJSS, isSS])

  const filteredClassmates = useMemo(() => {
    return classmates.filter(classmate => {
      const name = getDisplayName(classmate)
      return name.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [classmates, searchQuery])

  const handleClassmateClick = (classmate: Classmate) => {
    setSelectedClassmate(classmate)
    setModalOpen(true)
    onClassmateClick?.(classmate)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('')
    }
  }

  if (!studentClass) return <NoClassAssigned />
  if (classmates.length === 0) return <NoClassmatesFound />

  const totalCount = filteredClassmates.length
  const showDepartmentsNote = isSS

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              {isJSS ? studentClass : `${yearGroup} Classmates`}
              <Badge variant="secondary" className="text-xs" aria-label={`${classmates.length} students`}>
                {classmates.length}
              </Badge>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              <GraduationCap className="h-3 w-3 inline mr-1" aria-hidden="true" />
              {isJSS 
                ? `${studentClass} • ${classmates.length} student${classmates.length !== 1 ? 's' : ''}`
                : showDepartmentsNote 
                  ? `${yearGroup} • Science, Arts, Commercial`
                  : yearGroup
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-8 h-8 w-48 text-sm"
                aria-label="Search classmates"
              />
            </div>
            
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-md p-0.5" role="group" aria-label="View mode">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 w-7 p-0", viewMode === 'grid' && "bg-white shadow-sm")}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid3x3 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 w-7 p-0", viewMode === 'list' && "bg-white shadow-sm")}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search results info */}
        {searchQuery && totalCount !== classmates.length && (
          <div className="text-sm text-slate-500" role="status" aria-live="polite">
            Found {totalCount} of {classmates.length} classmates matching "{searchQuery}"
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setSearchQuery('')} 
              className="h-auto p-0 text-xs text-emerald-600 ml-2"
              aria-label="Clear search"
            >
              Clear
            </Button>
          </div>
        )}

        {/* No results */}
        {totalCount === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center" role="status" aria-live="polite">
            <Search className="h-10 w-10 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-slate-500">No students found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredClassmates.map((classmate) => (
              <ClassmateCard key={classmate.id} classmate={classmate} onClick={() => handleClassmateClick(classmate)} />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredClassmates.map((classmate) => (
              <ClassmateRow key={classmate.id} classmate={classmate} onClick={() => handleClassmateClick(classmate)} />
            ))}
          </div>
        )}

        {/* Footer */}
        {!compact && totalCount > 0 && (
          <div className="pt-1 text-center">
            <p className="text-xs text-slate-400" aria-live="polite">
              Showing {totalCount} of {classmates.length} students
            </p>
          </div>
        )}
      </div>

      <ClassmateProfileModal classmate={selectedClassmate} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}