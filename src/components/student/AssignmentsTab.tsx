import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowLeft, FileText, Calendar, Download } from 'lucide-react'
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

  const handleDownloadFile = async (fileUrl: string, title: string) => {
    if (!fileUrl) return
    try {
      window.open(fileUrl, '_blank')
    } catch (error) {
      console.error('Error opening file:', error)
    }
  }

  const filteredAssignments = stats.allAssignments.filter((assignment: any) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      {/* Header - Responsive */}
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
      
      {/* Stats Badge - Responsive */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge className="bg-blue-100 text-blue-700 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1">
          <FileText className="h-3 w-3 mr-1" />
          {stats.allAssignments.length} total assignment{stats.allAssignments.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {/* Search Bar - Responsive */}
      <div className="relative">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
        <Input
          placeholder="Search assignments by title, subject, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm bg-white w-full"
        />
      </div>
      
      {/* Assignments Grid - Responsive */}
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
          filteredAssignments.map((assignment: any, index: number) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-blue-500 h-full flex flex-col">
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
                    {assignment.total_marks && (
                      <span className="flex items-center gap-1 ml-0 sm:ml-2">
                        <FileText className="h-3 w-3" />
                        Marks: {assignment.total_marks}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between px-3 sm:px-4 pb-3 sm:pb-4">
                  <p className="text-[11px] sm:text-sm text-slate-600 mb-3 sm:mb-4 line-clamp-3">
                    {assignment.description || 'No description provided.'}
                  </p>
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-500">
                      Posted: {formatDate(assignment.created_at)}
                      {assignment.teacher_name && (
                        <span className="block xs:inline xs:ml-1">
                          {` by ${assignment.teacher_name}`}
                        </span>
                      )}
                    </span>
                    {assignment.file_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadFile(assignment.file_url!, assignment.title)}
                        className="gap-1.5 sm:gap-2 h-7 sm:h-8 text-[11px] sm:text-xs w-fit"
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
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