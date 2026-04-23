'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, RefreshCw, BookOpen, Calendar, User } from 'lucide-react'
import { Note } from '@/lib/staff/types'
import { cn } from '@/lib/utils'

interface NotesListProps {
  notes: Note[]
  onRefresh: () => void
  compact?: boolean
}

export function NotesList({ notes, onRefresh, compact = false }: NotesListProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson_note': return <BookOpen className="h-4 w-4" />
      case 'scheme_of_work': return <Calendar className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-700'
      case 'published': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No lesson notes</p>
        <Button variant="link" size="sm" onClick={onRefresh} className="mt-2">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <Card key={note.id} className="hover:shadow-md transition-shadow">
          <CardContent className={cn("p-4", compact && "p-3")}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg flex-shrink-0",
                note.type === 'lesson_note' ? "bg-blue-50" : 
                note.type === 'scheme_of_work' ? "bg-purple-50" : "bg-gray-50"
              )}>
                {getTypeIcon(note.type || 'general')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{note.title}</h4>
                  <Badge className={cn("text-xs", getStatusColor(note.status))}>
                    {note.status}
                  </Badge>
                </div>
                
                {(note.subject || note.class) && (
                  <p className="text-sm text-gray-500">
                    {note.subject && <span>{note.subject}</span>}
                    {note.subject && note.class && <span> • </span>}
                    {note.class && <span>{note.class}</span>}
                    {!note.subject && !note.class && <span>General</span>}
                  </p>
                )}
                
                {note.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{note.description}</p>
                )}
                
                {!note.description && note.content && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {note.content.substring(0, 100)}...
                  </p>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  {note.author_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {note.author_name}
                    </span>
                  )}
                  {note.week && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Week {note.week}
                    </span>
                  )}
                  {note.created_at && (
                    <span>{formatDate(note.created_at)}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}