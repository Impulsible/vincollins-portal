import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ArrowRight, File, Download } from 'lucide-react'

// ✅ FIXED: Import from the correct location
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
    <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-purple-800">
            <BookOpen className="h-5 w-5 shrink-0" />
            Recent Notes
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/student/courses')}  // ✅ Changed from /student/notes to /student/courses
            className="text-purple-700"
          >
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-purple-700/70">
          {allNotesCount} note{allNotesCount !== 1 ? 's' : ''} available
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-purple-400 mx-auto mb-3" />
            <p className="text-purple-700/70 text-sm">No notes available</p>
            <p className="text-xs text-purple-600/50">Study notes from teachers will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-white/70 rounded-xl hover:bg-white transition-all">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm break-words flex-1">{note.title}</p>
                    <Badge variant="outline" className="text-xs shrink-0 bg-white">{note.subject}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-2 break-words">{note.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <File className="h-3 w-3 shrink-0" />
                      {note.teacher_name || 'Teacher'}
                    </span>
                    {note.file_url && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs"
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
                className="w-full mt-3 text-purple-700"
                onClick={() => router.push('/student/courses')}  // ✅ Changed from /student/notes to /student/courses
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