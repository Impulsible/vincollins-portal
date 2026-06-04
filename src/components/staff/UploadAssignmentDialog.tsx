// components/staff/UploadAssignmentDialog.tsx - UPDATED VERSION
'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Loader2, Upload, X, FileText, Calendar as CalendarIcon,
  Send, Users, BookOpen, Bell, GraduationCap
} from 'lucide-react'
import { format } from 'date-fns'

interface UploadAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  teacherProfile: any
}

// ✅ UPDATED: Changed Computer Studies to Information Technology
const subjects = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Economics', 'Government', 'Literature in English', 'Geography',
  'Commerce', 'Financial Accounting', 'Agricultural Science',
  'Christian Religious Studies', 'Civic Education', 'Information Technology',
  'Data Processing', 'Further Mathematics', 'Basic Science', 'Basic Technology', 
  'Social Studies', 'Business Studies'
]

// ✅ UPDATED: Department-specific class options for Senior Secondary
const classCategories = {
  jss: ['JSS 1', 'JSS 2', 'JSS 3'],
  allStudents: ['SS1', 'SS2', 'SS3'],
  science: ['SS1 Science', 'SS2 Science', 'SS3 Science'],
  arts: ['SS1 Arts', 'SS2 Arts', 'SS3 Arts'],
  commercial: ['SS1 Commercial', 'SS2 Commercial', 'SS3 Commercial']
}

// Flatten all classes for selection
const allClasses = [
  ...classCategories.jss,
  ...classCategories.allStudents,
  ...classCategories.science,
  ...classCategories.arts,
  ...classCategories.commercial
]

export function UploadAssignmentDialog({
  open,
  onOpenChange,
  onSuccess,
  teacherProfile
}: UploadAssignmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [notifyStudents, setNotifyStudents] = useState(true)
  const [dueDate, setDueDate] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    instructions: '',
    total_marks: 100
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size should be less than 20MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const toggleClass = (className: string) => {
    setSelectedClasses(prev =>
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    )
  }

  // Select all classes in a category
  const selectCategory = (category: keyof typeof classCategories) => {
    const categoryClasses = classCategories[category]
    const allSelected = categoryClasses.every(c => selectedClasses.includes(c))
    
    if (allSelected) {
      // Remove all classes in this category
      setSelectedClasses(prev => prev.filter(c => !categoryClasses.includes(c)))
    } else {
      // Add all classes in this category
      setSelectedClasses(prev => [...new Set([...prev, ...categoryClasses])])
    }
  }

  // Get minimum date for due date input (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.subject || selectedClasses.length === 0) {
      toast.error('Please fill in all required fields and select at least one class')
      return
    }

    if (!dueDate) {
      toast.error('Please select a due date')
      return
    }

    setLoading(true)
    
    try {
      let fileUrl = null
      let fileName = null

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        fileName = `${Date.now()}-${selectedFile.name}`
        const filePath = `assignments/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('assignment-files')
          .upload(filePath, selectedFile)

        if (uploadError) {
          // Try alternative bucket
          const { error: uploadError2 } = await supabase.storage
            .from('student-photos')
            .upload(filePath, selectedFile)
          if (uploadError2) throw uploadError2
        }

        const { data: { publicUrl } } = supabase.storage
          .from('assignment-files')
          .getPublicUrl(filePath)
        
        fileUrl = publicUrl
      }

      // ✅ Create assignments for each selected class using classes array
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          title: formData.title,
          subject: formData.subject,
          classes: selectedClasses,  // ✅ Use classes array instead of single class
          description: formData.description,
          instructions: formData.instructions,
          due_date: new Date(dueDate).toISOString(),
          total_points: formData.total_marks,
          file_url: fileUrl,
          file_name: selectedFile?.name || null,
          created_by: teacherProfile?.id,
          created_by_name: teacherProfile?.full_name || 'Teacher',
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (assignmentError) throw assignmentError

      // Send notifications to students in selected classes
      if (notifyStudents && assignment) {
        // Get all students in selected classes
        const { data: students } = await supabase
          .from('profiles')
          .select('id, full_name, class')
          .in('class', selectedClasses)
          .eq('role', 'student')

        if (students && students.length > 0) {
          const notifications = students.map((student: any) => ({
            user_id: student.id,
            title: '📚 New Assignment',
            message: `${formData.title} - ${formData.subject}. Due: ${format(new Date(dueDate), 'MMM dd, yyyy')}`,
            type: 'new_assignment',
            link: '/student/assignments',
            metadata: {
              assignment_id: assignment.id,
              classes: selectedClasses,
              subject: formData.subject,
              due_date: new Date(dueDate).toISOString()
            },
            read: false,
            created_at: new Date().toISOString()
          }))

          // Batch insert notifications
          await supabase.from('notifications').insert(notifications)
          toast.success(`Notified ${students.length} students`)
        }
      }

      toast.success(`Assignment published to ${selectedClasses.length} class(es)!`)
      onSuccess()
      handleClose()
      
    } catch (error) {
      console.error('Error creating assignment:', error)
      toast.error('Failed to publish assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ title: '', subject: '', description: '', instructions: '', total_marks: 100 })
    setSelectedFile(null)
    setSelectedClasses([])
    setDueDate('')
    setNotifyStudents(true)
    onOpenChange(false)
  }

  // Count classes by category for display
  const categoryCounts = {
    jss: selectedClasses.filter(c => classCategories.jss.includes(c)).length,
    allStudents: selectedClasses.filter(c => classCategories.allStudents.includes(c)).length,
    science: selectedClasses.filter(c => classCategories.science.includes(c)).length,
    arts: selectedClasses.filter(c => classCategories.arts.includes(c)).length,
    commercial: selectedClasses.filter(c => classCategories.commercial.includes(c)).length
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish New Assignment
          </DialogTitle>
          <DialogDescription>
            Upload an assignment and publish it to selected classes. Students will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Assignment Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Mid-Term Project"
            />
          </div>

          {/* Subject and Marks */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="marks">Total Marks</Label>
              <Input
                id="marks"
                type="number"
                min="1"
                max="100"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 100 })}
              />
            </div>
          </div>

          {/* Target Classes - Updated with categories */}
          <div>
            <Label>Publish to Classes *</Label>
            <div className="space-y-3 mt-2">
              {/* JSS Section */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-slate-600" />
                    <span className="font-medium text-sm">Junior Secondary School</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => selectCategory('jss')}
                    className="h-6 text-xs"
                  >
                    {categoryCounts.jss === classCategories.jss.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classCategories.jss.map(className => (
                    <Badge
                      key={className}
                      variant={selectedClasses.includes(className) ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer hover:bg-primary/10 transition-all px-3 py-1.5 text-sm",
                        selectedClasses.includes(className) && "bg-primary text-white"
                      )}
                      onClick={() => toggleClass(className)}
                    >
                      {className}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* All Students (General Subjects) */}
              <div className="p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-sm">📚 All Students (General Subjects)</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => selectCategory('allStudents')}
                    className="h-6 text-xs"
                  >
                    {categoryCounts.allStudents === classCategories.allStudents.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classCategories.allStudents.map(className => (
                    <Badge
                      key={className}
                      variant={selectedClasses.includes(className) ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer hover:bg-primary/10 transition-all px-3 py-1.5 text-sm",
                        selectedClasses.includes(className) && "bg-primary text-white"
                      )}
                      onClick={() => toggleClass(className)}
                    >
                      {className}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Science Department */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">🔬 Science Department</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => selectCategory('science')}
                    className="h-6 text-xs"
                  >
                    {categoryCounts.science === classCategories.science.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classCategories.science.map(className => (
                    <Badge
                      key={className}
                      variant={selectedClasses.includes(className) ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer hover:bg-primary/10 transition-all px-3 py-1.5 text-sm",
                        selectedClasses.includes(className) && "bg-primary text-white"
                      )}
                      onClick={() => toggleClass(className)}
                    >
                      {className}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Arts Department */}
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">🎨 Arts Department</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => selectCategory('arts')}
                    className="h-6 text-xs"
                  >
                    {categoryCounts.arts === classCategories.arts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classCategories.arts.map(className => (
                    <Badge
                      key={className}
                      variant={selectedClasses.includes(className) ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer hover:bg-primary/10 transition-all px-3 py-1.5 text-sm",
                        selectedClasses.includes(className) && "bg-primary text-white"
                      )}
                      onClick={() => toggleClass(className)}
                    >
                      {className}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Commercial Department */}
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-sm">💼 Commercial Department</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => selectCategory('commercial')}
                    className="h-6 text-xs"
                  >
                    {categoryCounts.commercial === classCategories.commercial.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classCategories.commercial.map(className => (
                    <Badge
                      key={className}
                      variant={selectedClasses.includes(className) ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer hover:bg-primary/10 transition-all px-3 py-1.5 text-sm",
                        selectedClasses.includes(className) && "bg-primary text-white"
                      )}
                      onClick={() => toggleClass(className)}
                    >
                      {className}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedClasses.length} class(es) selected
            </p>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <div className="relative">
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={getMinDate()}
                className="w-full"
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            {dueDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Due: {format(new Date(dueDate), 'EEEE, MMMM dd, yyyy')}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the assignment..."
              rows={2}
            />
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Detailed instructions for students..."
              rows={3}
            />
          </div>

          {/* File Attachment */}
          <div>
            <Label>Attachment (Optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            <div 
              className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="text-sm truncate">{selectedFile.name}</span>
                    <span className="text-xs text-slate-500">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Click to upload a file</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, TXT, JPG, PNG (Max 20MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Notify Students */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Bell className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-blue-800">Notify Students</p>
              <p className="text-xs text-blue-600">Send notification to all students in selected classes</p>
            </div>
            <Badge
              variant={notifyStudents ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer",
                notifyStudents && "bg-blue-600"
              )}
              onClick={() => setNotifyStudents(!notifyStudents)}
            >
              {notifyStudents ? 'ON' : 'OFF'}
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Publish Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}