import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowRight, Calendar, Download, FolderOpen } from 'lucide-react'

// ✅ FIXED: Import from the correct location
import { Assignment } from '@/app/student/types'

interface AssignmentsPreviewCardProps {
  assignments: Assignment[]
  allAssignmentsCount: number
  onDownload: (fileUrl: string, title: string) => void
  formatDate: (dateString?: string) => string
}

export function AssignmentsPreviewCard({ 
  assignments, 
  allAssignmentsCount, 
  onDownload, 
  formatDate 
}: AssignmentsPreviewCardProps) {
  const router = useRouter()

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-blue-800">
            <FileText className="h-5 w-5 shrink-0" />
            Recent Assignments
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/student/assignments')}
            className="text-blue-700"
          >
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-blue-700/70">
          {allAssignmentsCount} total assignment{allAssignmentsCount !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <p className="text-blue-700/70 text-sm">No assignments yet</p>
            <p className="text-xs text-blue-600/50">Assignments from teachers will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-3 bg-white/70 rounded-xl hover:bg-white transition-all">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm break-words flex-1">{assignment.title}</p>
                    <Badge variant="outline" className="text-xs shrink-0 bg-white">{assignment.subject}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-2 break-words">{assignment.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      Due: {formatDate(assignment.due_date)}
                    </span>
                    {assignment.file_url && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => onDownload(assignment.file_url!, assignment.title)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {allAssignmentsCount > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 text-blue-700"
                onClick={() => router.push('/student/assignments')}
              >
                View all {allAssignmentsCount} assignments
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}