'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ArrowRight, File, Download } from 'lucide-react'
import { StudyNote } from '@/app/student/types'

interface NotesPreviewCardProps {
  notes: StudyNote[]
  allNotesCount: number
  onDownload: (fileUrl: string, title: string) => void
  formatDate: (dateString?: string) => string
}

export function NotesPreviewCard({ notes, allNotesCount, onDownload, formatDate }: NotesPreviewCardProps) {
  const router = useRouter()

  return (
    <Card className="border border-purple-200/60 dark:border-purple-900/40 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 overflow-hidden w-full rounded-2xl transition-colors duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-purple-800 dark:text-purple-300">
            <BookOpen className="h-5 w-5 shrink-0" />
            Recent Notes
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/student/courses')}
            className="text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-100/50 dark:hover:bg-purple-950/40 cursor-pointer"
          >
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-purple-700/70 dark:text-purple-400/70">
          {allNotesCount} note{allNotesCount !== 1 ? 's' : ''} available
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-purple-400 dark:text-purple-500/60 mx-auto mb-3" />
            <p className="text-purple-700/70 dark:text-purple-300/70 text-sm">No notes available</p>
            <p className="text-xs text-purple-600/50 dark:text-purple-400/50">Study notes from teachers will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl hover:bg-white dark:hover:bg-slate-900 border border-transparent dark:border-slate-800/50 hover:border-purple-200/50 dark:hover:border-purple-800/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm break-words flex-1 text-slate-800 dark:text-slate-100">{note.title}</p>
                    <Badge variant="outline" className="text-xs shrink-0 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {note.subject}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 break-words">{note.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <File className="h-3 w-3 shrink-0" />
                      {note.teacher_name || 'Teacher'}
                    </span>
                    {note.file_url && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                        onClick={() => onDownload(note.file_url!, note.title)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {allNotesCount > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-100/50 dark:hover:bg-purple-950/40 cursor-pointer"
                onClick={() => router.push('/student/courses')}
              >
                View all {allNotesCount} notes
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}