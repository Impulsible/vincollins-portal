/* eslint-disable @typescript-eslint/no-unused-vars */
// components/staff/NotesList.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Notebook, Download, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'

interface Note {
  id: string
  title: string
  subject: string
  class: string
  description: string
  file_url?: string
  status: string
  created_at: string
}

interface NotesListProps {
  notes: Note[]
  onRefresh: () => void
  compact?: boolean
}

export function NotesList({ notes, onRefresh, compact = false }: NotesListProps) {
  const getStatusBadge = (status: string) => {
    return status === 'published' 
      ? <Badge className="bg-green-100 text-green-700">Published</Badge>
      : <Badge variant="outline">Draft</Badge>
  }

  const displayNotes = compact ? notes.slice(0, 3) : notes

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Notebook className="h-5 w-5 text-primary" />
          Study Notes
        </CardTitle>
        <CardDescription>{notes.length} notes uploaded</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayNotes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No notes uploaded yet</p>
        ) : (
          displayNotes.map((note) => (
            <div key={note.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{note.title}</p>
                  {getStatusBadge(note.status)}
                </div>
                <p className="text-sm text-muted-foreground">{note.subject} • {note.class}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                {note.file_url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={note.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                    <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}