import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowLeft, FileText, Calendar, Download, Paperclip, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssignmentsTabProps {
  stats: any
  handleTabChange: (tab: string) => void
}

export function AssignmentsTab({ stats, handleTabChange }: AssignmentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    if (!fileUrl) return
    try {
      window.open(fileUrl, '_blank')
    } catch (error) {
      console.error('Error opening file:', error)
    }
  }

  const handlePreviewFile = (fileUrl: string, fileName: string) => {
    if (!fileUrl) return
    window.open(fileUrl, '_blank')
  }

  const getFileName = (assignment: any, index: number): string => {
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
        return `Attachment ${index + 1}`
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

  const filteredAssignments = stats.allAssignments.filter((assignment: any) =>
    assignment.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (assignment.description && assignment.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <motion.div 
      key="assignments" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="w-full overflow-hidden space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 sm:mb-4">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">All Assignments</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleTabChange('overview')}
          className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto"
        >
          <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Back to Overview
        </Button>
      </div>
      
      {/* Stats Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1">
          <FileText className="h-3 w-3 mr-1" />
          {stats.allAssignments.length} total assignment{stats.allAssignments.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
        <Input
          placeholder="Search assignments by title, subject, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm bg-white w-full"
        />
      </div>
      
      {/* Assignments Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssignments.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 sm:p-10 md:p-12 text-center">
              <FileText className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-slate-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No Assignments Found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {searchQuery ? 'No assignments match your search criteria.' : 'No assignments available for your class yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment: any, index: number) => {
            const hasAttachments = (assignment.attachment_urls && assignment.attachment_urls.length > 0) || assignment.file_url
            const attachmentCount = assignment.attachment_urls?.length || (assignment.file_url ? 1 : 0)
            
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-emerald-500 h-full flex flex-col">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4">
                    <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2">
                      <CardTitle className="text-sm sm:text-base md:text-lg break-words flex-1 line-clamp-2">
                        {assignment.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 w-fit">
                        {assignment.subject}
                      </Badge>
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {formatDate(assignment.due_date)}
                      </span>
                      <span className="flex items-center gap-1 ml-0 sm:ml-2">
                        <FileText className="h-3 w-3" />
                        Marks: {assignment.total_marks || assignment.total_points || 0}
                      </span>
                      {hasAttachments && (
                        <span className="flex items-center gap-1 ml-0 sm:ml-2">
                          <Paperclip className="h-3 w-3" />
                          {attachmentCount} file{attachmentCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between px-3 sm:px-4 pb-3 sm:pb-4">
                    <p className="text-[11px] sm:text-sm text-slate-600 mb-3 sm:mb-4 line-clamp-3">
                      {assignment.description || 'No description provided.'}
                    </p>
                    
                    {/* Attachments Section */}
                    {hasAttachments && (
                      <div className="mb-3 space-y-1.5">
                        <p className="text-[10px] font-medium text-slate-500">Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {assignment.attachment_urls?.map((url: string, i: number) => {
                            const fileName = getFileName(assignment, i)
                            return (
                              <div key={i} className="flex items-center gap-1 bg-slate-50 rounded-md px-2 py-1">
                                {getFileIcon(fileName)}
                                <span className="text-[9px] text-slate-600 truncate max-w-[100px]">{fileName}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-transparent"
                                  onClick={() => handleDownloadFile(url, fileName)}
                                >
                                  <Download className="h-2.5 w-2.5 text-slate-400" />
                                </Button>
                              </div>
                            )
                          })}
                          {assignment.file_url && !assignment.attachment_urls?.length && (
                            <div className="flex items-center gap-1 bg-slate-50 rounded-md px-2 py-1">
                              {getFileIcon(assignment.file_name || 'file')}
                              <span className="text-[9px] text-slate-600 truncate max-w-[100px]">
                                {assignment.file_name || 'Attachment'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-transparent"
                                onClick={() => handleDownloadFile(assignment.file_url, assignment.file_name || 'Attachment')}
                              >
                                <Download className="h-2.5 w-2.5 text-slate-400" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 mt-auto">
                      <span className="text-[10px] sm:text-xs text-slate-500">
                        Posted: {formatDate(assignment.created_at)}
                        {assignment.teacher_name && (
                          <span className="block xs:inline xs:ml-1">
                            {` by ${assignment.teacher_name}`}
                          </span>
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
      
      {/* Show result count */}
      {searchQuery && filteredAssignments.length > 0 && (
        <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
          Found {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
        </p>
      )}
    </motion.div>
  )
}