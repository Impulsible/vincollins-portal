// ============================================
// STUDENTS TAB COMPONENT - WITH SEARCH
// ============================================

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StudentRoster } from '@/components/staff/StudentRoster'
import { Student } from '@/lib/staff/types'
import { Download, Search } from 'lucide-react'

interface StudentsTabProps {
  students: Student[]
}

export function StudentsTab({ students }: StudentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.class?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.vin_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div 
      key="students" 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Student Roster</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {filteredStudents.length} of {students.length} students
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-10 w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />Export Roster
        </Button>
      </div>
      
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name, class, or VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm bg-gray-50 border-0 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <StudentRoster students={filteredStudents} fullView />
        </CardContent>
      </Card>
    </motion.div>
  )
}