import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowLeft, FileText, Calendar, Download } from 'lucide-react'

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
      className="w-full overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">All Assignments</h1>
        <Button variant="outline" size="sm" onClick={() => handleTabChange('overview')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <Badge className="bg-blue-100 text-blue-700 w-fit">
          {stats.allAssignments.length} total
        </Badge>
      </div>
      
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white w-full"
          />
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {filteredAssignments.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'No assignments match your search.' : 'No assignments available for your class yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment: any) => (
            <Card key={assignment.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg break-words flex-1">{assignment.title}</CardTitle>
                  <Badge variant="outline" className="shrink-0">{assignment.subject}</Badge>
                </div>
                <CardDescription className="flex items-center gap-2 text-xs flex-wrap">
                  <Calendar className="h-3 w-3" />
                  Due: {formatDate(assignment.due_date)}
                  {assignment.total_marks && (
                    <span className="ml-2">Total Marks: {assignment.total_marks}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                  {assignment.description || 'No description provided.'}
                </p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-slate-500">
                    Posted: {formatDate(assignment.created_at)}
                    {assignment.teacher_name && ` by ${assignment.teacher_name}`}
                  </span>
                  {assignment.file_url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadFile(assignment.file_url!, assignment.title)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  )
}