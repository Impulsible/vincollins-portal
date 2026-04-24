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
      <CardHeader className="pb-2 px-3 sm:px-4 md:px-6">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
          <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2 text-blue-800">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Recent Assignments
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/student/assignments')}
            className="text-blue-700 h-7 sm:h-8 text-xs sm:text-sm w-fit self-start xs:self-auto"
          >
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-blue-700/70 text-[11px] sm:text-xs">
          {allAssignmentsCount} total assignment{allAssignmentsCount !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
        {assignments.length === 0 ? (
          <div className="text-center py-6 sm:py-8 md:py-10">
            <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400 mx-auto mb-2 sm:mb-3" />
            <p className="text-blue-700/70 text-xs sm:text-sm">No assignments yet</p>
            <p className="text-[10px] sm:text-xs text-blue-600/50 mt-1">Assignments from teachers will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 sm:space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-2.5 sm:p-3 bg-white/70 rounded-lg sm:rounded-xl hover:bg-white transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                    <p className="font-medium text-xs sm:text-sm break-words flex-1 line-clamp-2">
                      {assignment.title}
                    </p>
                    <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 bg-white w-fit">
                      {assignment.subject}
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-2 mb-2 break-words">
                    {assignment.description}
                  </p>
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      Due: {formatDate(assignment.due_date)}
                    </span>
                    {assignment.file_url && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] sm:text-xs w-fit"
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
                className="w-full mt-3 sm:mt-4 text-blue-700 text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => router.push('/student/assignments')}
              >
                View all {allAssignmentsCount} assignments
                <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}