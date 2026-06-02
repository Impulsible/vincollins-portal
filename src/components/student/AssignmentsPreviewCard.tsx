// components/student/AssignmentsPreviewCard.tsx
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowRight, Calendar, Download, FolderOpen, Paperclip, Eye } from 'lucide-react'
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

  const getFileName = (assignment: Assignment, index: number): string => {
    // Use stored original filename if available
    if (assignment.attachment_names && assignment.attachment_names[index]) {
      return assignment.attachment_names[index]
    }
    // Fallback to extracting from URL
    const url = assignment.attachment_urls?.[index] || assignment.file_url
    if (url) {
      try {
        const decoded = decodeURIComponent(url)
        const parts = decoded.split('/')
        let fileName = parts[parts.length - 1]
        // Remove timestamp prefix
        fileName = fileName.replace(/^\d+_/, '')
        return fileName
      } catch {
        return 'Attachment'
      }
    }
    return 'Attachment'
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return <FileText className="h-3 w-3 text-red-500" />
      case 'doc':
      case 'docx': return <FileText className="h-3 w-3 text-blue-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <Eye className="h-3 w-3 text-green-500" />
      case 'xls':
      case 'xlsx': return <FileText className="h-3 w-3 text-emerald-500" />
      default: return <Paperclip className="h-3 w-3 text-slate-400" />
    }
  }

  const hasAttachments = (assignment: Assignment): boolean => {
    return (assignment.attachment_urls && assignment.attachment_urls.length > 0) || !!assignment.file_url
  }

  const getAttachmentCount = (assignment: Assignment): number => {
    return assignment.attachment_urls?.length || (assignment.file_url ? 1 : 0)
  }

  // Get recent assignments (first 3)
  const recentAssignments = assignments.slice(0, 3)

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
        {recentAssignments.length === 0 ? (
          <div className="text-center py-6 sm:py-8 md:py-10">
            <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400 mx-auto mb-2 sm:mb-3" />
            <p className="text-blue-700/70 text-xs sm:text-sm">No assignments yet</p>
            <p className="text-[10px] sm:text-xs text-blue-600/50 mt-1">Assignments from teachers will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 sm:space-y-3">
              {recentAssignments.map((assignment) => {
                const hasFiles = hasAttachments(assignment)
                const fileCount = getAttachmentCount(assignment)
                
                return (
                  <div key={assignment.id} className="p-2.5 sm:p-3 bg-white/70 rounded-lg sm:rounded-xl hover:bg-white transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                      <p className="font-medium text-xs sm:text-sm break-words flex-1 line-clamp-2">
                        {assignment.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 bg-white w-fit">
                          {assignment.subject}
                        </Badge>
                        {hasFiles && (
                          <Badge variant="secondary" className="text-[9px] sm:text-[10px] bg-blue-100 text-blue-700">
                            <Paperclip className="h-2.5 w-2.5 mr-0.5" />
                            {fileCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-2 mb-2 break-words">
                      {assignment.description || 'No description provided.'}
                    </p>
                    
                    {/* Attachments Preview */}
                    {hasFiles && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {assignment.attachment_urls?.slice(0, 2).map((url: string, idx: number) => {
                          const fileName = getFileName(assignment, idx)
                          return (
                            <div key={idx} className="flex items-center gap-1 bg-slate-100 rounded px-1.5 py-0.5">
                              {getFileIcon(fileName)}
                              <span className="text-[8px] text-slate-600 truncate max-w-[60px]">{fileName}</span>
                              <button
                                onClick={() => onDownload(url, assignment.title)}
                                className="hover:bg-slate-200 rounded p-0.5"
                              >
                                <Download className="h-2.5 w-2.5 text-slate-400" />
                              </button>
                            </div>
                          )
                        })}
                        {assignment.file_url && !assignment.attachment_urls?.length && (
                          <div className="flex items-center gap-1 bg-slate-100 rounded px-1.5 py-0.5">
                            {getFileIcon(assignment.file_name || 'file')}
                            <span className="text-[8px] text-slate-600 truncate max-w-[60px]">
                              {assignment.file_name?.replace(/^\d+_/, '') || 'Attachment'}
                            </span>
                            <button
                              onClick={() => onDownload(assignment.file_url!, assignment.title)}
                              className="hover:bg-slate-200 rounded p-0.5"
                            >
                              <Download className="h-2.5 w-2.5 text-slate-400" />
                            </button>
                          </div>
                        )}
                        {fileCount > 2 && (
                          <span className="text-[8px] text-slate-400">+{fileCount - 2} more</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                      <span className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        Due: {formatDate(assignment.due_date)}
                      </span>
                      {(assignment.total_marks || assignment.total_points) && (
                        <span className="text-[9px] sm:text-[10px] text-slate-400">
                          {assignment.total_marks || assignment.total_points} marks
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
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