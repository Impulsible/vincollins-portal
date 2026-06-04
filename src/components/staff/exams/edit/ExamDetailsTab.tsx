// src/components/staff/exams/edit/ExamDetailsTab.tsx - WITH TARGET AUDIENCE
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { BookOpen, Clock, GraduationCap, FileText, Settings2, HelpCircle, Calendar, Users, Target } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ExamDetailsForm } from './types'

interface ExamDetailsTabProps {
  formData: ExamDetailsForm
  onChange: (data: Partial<ExamDetailsForm>) => void
  availableSubjects: string[]
  classes: string[]
  availableSessions: string[]
  currentSession: string
  hasTheory: boolean
  onHasTheoryChange: (value: boolean) => void
}

const termOptions = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' }
]

// ✅ Target Audience Options
const TARGET_AUDIENCE_OPTIONS = [
  { 
    value: 'all', 
    label: 'All Students', 
    description: 'Available to all students in this class/year',
    icon: '📚',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  { 
    value: 'Science', 
    label: 'Science Department Only', 
    description: 'Only students in Science department can see this exam',
    icon: '🔬',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  { 
    value: 'Arts', 
    label: 'Arts Department Only', 
    description: 'Only students in Arts department can see this exam',
    icon: '🎨',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  { 
    value: 'Commercial', 
    label: 'Commercial Department Only', 
    description: 'Only students in Commercial department can see this exam',
    icon: '💼',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  }
]

// Helper to get year from class
const getYearFromClass = (className: string): string => {
  if (!className) return ''
  if (className.includes('SS1')) return 'SS1'
  if (className.includes('SS2')) return 'SS2'
  if (className.includes('SS3')) return 'SS3'
  if (className.includes('JSS1')) return 'JSS1'
  if (className.includes('JSS2')) return 'JSS2'
  if (className.includes('JSS3')) return 'JSS3'
  return className
}

export function ExamDetailsTab({
  formData,
  onChange,
  availableSubjects,
  classes,
  availableSessions,
  currentSession,
  hasTheory,
  onHasTheoryChange
}: ExamDetailsTabProps) {
  const yearGroup = getYearFromClass(formData.class)
  const isSSClass = formData.class.includes('SS')
  const isJSSClass = formData.class.includes('JSS')
  const showAudienceSelector = formData.class && (isSSClass || isJSSClass)

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">
        {/* Basic Information Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <CardTitle className="text-base sm:text-lg">Basic Information</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Enter the fundamental details of your exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Exam Title */}
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <Label className="text-xs sm:text-sm font-medium">Exam Title</Label>
                  <span className="text-red-500 text-xs">*</span>
                </div>
                <Input
                  value={formData.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  placeholder="e.g., First Term Mathematics Examination"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              
              {/* Class */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs sm:text-sm font-medium">Class</Label>
                  <span className="text-red-500 text-xs">*</span>
                </div>
                <Select
                  value={formData.class}
                  onValueChange={(v) => onChange({ class: v, subject: '', target_audience: 'all' })}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Subject */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs sm:text-sm font-medium">Subject</Label>
                  <span className="text-red-500 text-xs">*</span>
                </div>
                <Select
                  value={formData.subject}
                  onValueChange={(v) => onChange({ subject: v })}
                  disabled={!formData.class}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder={formData.class ? 'Select subject' : 'Select class first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Duration */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs sm:text-sm font-medium">Duration (minutes)</Label>
                  <span className="text-red-500 text-xs">*</span>
                </div>
                <Input
                  type="number"
                  min={5}
                  max={240}
                  value={formData.duration}
                  onChange={(e) => onChange({ duration: parseInt(e.target.value) || 60 })}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ NEW: Target Audience Card - Who should see this exam */}
        {showAudienceSelector && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                <CardTitle className="text-base sm:text-lg">Target Audience</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Choose which students can see this exam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="grid gap-3">
                {TARGET_AUDIENCE_OPTIONS.map((option) => {
                  const isSelected = (formData.target_audience || 'all') === option.value
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex items-start gap-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-all border-2",
                        isSelected
                          ? `${option.bgColor} border-${option.color.split('-')[1]}-500`
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="target_audience"
                        value={option.value}
                        checked={isSelected}
                        onChange={(e) => onChange({ target_audience: e.target.value })}
                        className="mt-0.5 h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg">{option.icon}</span>
                          <p className={cn("font-medium text-sm sm:text-base", option.color)}>
                            {option.label}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </p>
                        {option.value === 'all' && (
                          <p className="text-xs text-emerald-600 mt-2">
                            ✓ All {yearGroup} students will see this exam (Science, Arts, Commercial)
                          </p>
                        )}
                        {option.value !== 'all' && (
                          <p className="text-xs text-blue-600 mt-2">
                            ✓ Only {option.value} department students in {yearGroup} will see this exam
                          </p>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
              <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Tip: Use "All Students" for general subjects like Mathematics, English. Use department-specific for specialized subjects.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Academic Period Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              <CardTitle className="text-base sm:text-lg">Academic Period</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Set the term and session for this exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Term */}
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Term</Label>
                <Select value={formData.term} onValueChange={(v) => onChange({ term: v })}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {termOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Session */}
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Session</Label>
                <Select value={formData.session_year} onValueChange={(v) => onChange({ session_year: v })}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSessions.map(s => (
                      <SelectItem key={s} value={s}>
                        {s} {s === currentSession && <span className="text-emerald-500 text-xs ml-1">(Current)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pass Mark & Instructions Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <CardTitle className="text-base sm:text-lg">Assessment Criteria</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Set the passing score and exam instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Pass Mark */}
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Pass Mark (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.pass_mark}
                onChange={(e) => onChange({ pass_mark: parseInt(e.target.value) || 50 })}
                className="h-9 sm:h-10 text-sm max-w-[150px]"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Students need this percentage to pass the exam
              </p>
            </div>

            {/* Instructions */}
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Instructions for Students</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => onChange({ instructions: e.target.value })}
                placeholder="Enter exam instructions for students..."
                rows={4}
                className="resize-none text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Exam Settings Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              <CardTitle className="text-base sm:text-lg">Exam Settings</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Configure how the exam behaves
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Shuffle Questions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
              <div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Shuffle Questions</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Randomize question order for each student</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Each student gets questions in a different order
                </p>
              </div>
              <Switch
                checked={formData.shuffle_questions}
                onCheckedChange={(v) => onChange({ shuffle_questions: v })}
              />
            </div>

            {/* Shuffle Options */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
              <div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Shuffle Options</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Randomize answer options order for objective questions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Each student sees answer choices in a different order
                </p>
              </div>
              <Switch
                checked={formData.shuffle_options}
                onCheckedChange={(v) => onChange({ shuffle_options: v })}
              />
            </div>

            {/* Negative Marking */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
              <div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Negative Marking</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Deduct points for wrong answers</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Penalize students for incorrect responses
                </p>
              </div>
              <Switch
                checked={formData.negative_marking}
                onCheckedChange={(v) => onChange({ negative_marking: v })}
              />
            </div>

            {/* Negative Marking Value (conditional) */}
            {formData.negative_marking && (
              <div className="pl-0 sm:pl-8 pt-2">
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Points Deducted per Wrong Answer</Label>
                <Input
                  type="number"
                  step={0.5}
                  min={0}
                  value={formData.negative_marking_value}
                  onChange={(e) => onChange({ negative_marking_value: parseFloat(e.target.value) || 0.5 })}
                  className="h-9 sm:h-10 text-sm max-w-[150px]"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Example: 0.5 means half a point deducted for wrong answers
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theory Questions Toggle Card */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  <h3 className="font-semibold text-sm sm:text-base">Include Theory Questions</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  Add essay-type questions to this exam for comprehensive assessment
                </p>
              </div>
              <Switch 
                checked={hasTheory} 
                onCheckedChange={onHasTheoryChange}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}