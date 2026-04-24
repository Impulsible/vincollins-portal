// components/staff/notes/NotesTab.tsx - FIXED undefined subject
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, Plus, Search, Eye, Edit, Trash2, 
  Calendar, User, FileText, Tag, AlertCircle
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Note {
  id: string
  title: string
  subject?: string | null
  class?: string | null
  content?: string
  created_at: string
  updated_at: string
  created_by?: string
}

interface NotesTabProps {
  notes: Note[]
  onRefresh: () => void
  onEdit: (note: Note) => void
  onDelete: (id: string) => Promise<void>
}

export function NotesTab({ notes, onRefresh, onEdit, onDelete }: NotesTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ✅ FIXED: Handle undefined subject by using optional chaining and fallback
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.subject && n.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (n.class && n.class.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    try {
      await onDelete(deleteId)
      toast.success('Note deleted successfully')
      onRefresh()
    } catch (error) {
      toast.error('Failed to delete note')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (notes.length === 0 && !searchQuery) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Study Notes
          </CardTitle>
          <Button size="sm" onClick={() => onEdit({} as Note)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Note
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No study notes yet</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => onEdit({} as Note)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Your First Note
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Study Notes
            <Badge variant="secondary" className="ml-2">
              {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
            </Badge>
          </CardTitle>
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes by title, subject, or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button size="sm" onClick={() => onEdit({} as Note)}>
              <Plus className="h-4 w-4 mr-1" />
              New Note
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground">No notes found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {note.title}
                      </h3>
                      <div className="flex gap-1">
                        {note.subject && (
                          <Badge variant="outline" className="text-[10px]">
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {note.subject}
                          </Badge>
                        )}
                        {note.class && (
                          <Badge variant="secondary" className="text-[10px]">
                            <User className="h-2.5 w-2.5 mr-1" />
                            {note.class}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(note.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(note)}
                      className="h-8 px-2"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(note.id)}
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}