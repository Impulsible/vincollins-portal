// ============================================
// ASSIGNMENTS TAB COMPONENT
// ============================================

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AssignmentsList } from '@/components/staff/AssignmentsList'
import { Assignment, TermInfo } from '@/lib/staff/types'
import { Upload, Search } from 'lucide-react'

interface AssignmentsTabProps {
  assignments: Assignment[]
  termInfo: TermInfo
  onRefresh: () => void
  onUploadAssignment: () => void
}

export function AssignmentsTab({ assignments, termInfo, onRefresh, onUploadAssignment }: AssignmentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div 
      key="assignments" 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Assignments</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {termInfo.termName} {termInfo.sessionYear}
          </p>
        </div>
        <Button 
          onClick={onUploadAssignment} 
          size="sm" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 w-full sm:w-auto"
        >
          <Upload className="mr-2 h-4 w-4" />Upload Assignment
        </Button>
      </div>
      
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assignments by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm bg-gray-50 border-0 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <AssignmentsList assignments={filteredAssignments} onRefresh={onRefresh} />
        </CardContent>
      </Card>
    </motion.div>
  )
}