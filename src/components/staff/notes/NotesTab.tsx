// ============================================
// NOTES TAB COMPONENT
// ============================================

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NotesList } from '@/components/staff/NotesList'
import { Note, TermInfo } from '@/lib/staff/types'
import { BookOpen, Search } from 'lucide-react'

interface NotesTabProps {
  notes: Note[]
  termInfo: TermInfo
  onRefresh: () => void
  onUploadNote: () => void
}

export function NotesTab({ notes, termInfo, onRefresh, onUploadNote }: NotesTabProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div 
      key="notes" 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Study Notes</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {termInfo.termName} {termInfo.sessionYear}
          </p>
        </div>
        <Button 
          onClick={onUploadNote} 
          size="sm" 
          className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-full sm:w-auto"
        >
          <BookOpen className="mr-2 h-4 w-4" />Upload Note
        </Button>
      </div>
      
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notes by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm bg-gray-50 border-0 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <NotesList notes={filteredNotes} onRefresh={onRefresh} />
        </CardContent>
      </Card>
    </motion.div>
  )
}