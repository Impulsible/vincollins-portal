// src/components/staff/exams/edit/ExamDetailsTab.tsx - COMPLETE FIXED VERSION
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

// ✅ Senior Secondary Class Options with proper targeting
const SENIOR_CLASS_OPTIONS = {
  general: [
    { value: 'SS1', label: '📚 SS1 (All Students)', description: 'Visible to ALL SS1 students - Science, Arts, Commercial', year: 'SS1' },
    { value: 'SS2', label: '📚 SS2 (All Students)', description: 'Visible to ALL SS2 students - Science, Arts, Commercial', year: 'SS2' },
    { value: 'SS3', label: '📚 SS3 (All Students)', description: 'Visible to ALL SS3 students - Science, Arts, Commercial', year: 'SS3' },
  ],
  science: [
    { value: 'SS1 Science', label: '🔬 SS1 Science', description: 'Science department only', year: 'SS1', department: 'Science' },
    { value: 'SS2 Science', label: '🔬 SS2 Science', description: 'Science department only', year: 'SS2', department: 'Science' },
    { value: 'SS3 Science', label: '🔬 SS3 Science', description: 'Science department only', year: 'SS3', department: 'Science' },
  ],
  arts: [
    { value: 'SS1 Arts', label: '🎨 SS1 Arts', description: 'Arts department only', year: 'SS1', department: 'Arts' },
    { value: 'SS2 Arts', label: '🎨 SS2 Arts', description: 'Arts department only', year: 'SS2', department: 'Arts' },
    { value: 'SS3 Arts', label: '🎨 SS3 Arts', description: 'Arts department only', year: 'SS3', department: 'Arts' },
  ],
  commercial: [
    { value: 'SS1 Commercial', label: '💼 SS1 Commercial', description: 'Commercial department only', year: 'SS1', department: 'Commercial' },
    { value: 'SS2 Commercial', label: '💼 SS2 Commercial', description: 'Commercial department only', year: 'SS2', department: 'Commercial' },
    { value: 'SS3 Commercial', label: '💼 SS3 Commercial', description: 'Commercial department only', year: 'SS3', department: 'Commercial' },
  ]
}

// JSS Options
const JSS_OPTIONS = [
  { value: 'JSS 1', label: 'JSS 1', description: 'Junior Secondary 1' },
  { value: 'JSS 2', label: 'JSS 2', description: 'Junior Secondary 2' },
  { value: 'JSS 3', label: 'JSS 3', description: 'Junior Secondary 3' },
]

// Target Audience Options
const TARGET_AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Students', description: 'All students in this class/year can see this exam', icon: '🌍' },
  { value: 'Science', label: 'Science Department Only', description: 'Only Science department students can see this exam', icon: '🔬' },
  { value: 'Arts', label: 'Arts Department Only', description: 'Only Arts department students can see this exam', icon: '🎨' },
  { value: 'Commercial', label: 'Commercial Department Only', description: 'Only Commercial department students can see this exam', icon: '💼' },
]

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
  const isSeniorClass = formData.class?.startsWith('SS') || false
  const isJSSClass = formData.class?.startsWith('JSS') || false
  const showTargetAudience = isSeniorClass && formData.class && !formData.class.includes(' ')

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
              
              {/* Class Selection */}
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
                  <SelectContent className="max-h-[400px]">
                    {/* All Students (General Subjects) - Senior Secondary */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 sticky top-0">
                      📚 All Students (General Subjects)
                    </div>
                    {SENIOR_CLASS_OPTIONS.general.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Science Department */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 mt-2">
                      🔬 Science Department
                    </div>
                    {SENIOR_CLASS_OPTIONS.science.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <div>{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Arts Department */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 mt-2">
                      🎨 Arts Department
                    </div>
                    {SENIOR_CLASS_OPTIONS.arts.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <div>{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Commercial Department */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 mt-2">
                      💼 Commercial Department
                    </div>
                    {SENIOR_CLASS_OPTIONS.commercial.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <div>{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* Junior Secondary */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 mt-2">
                      📖 Junior Secondary School
                    </div>
                    {JSS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <div>{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
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

        {/* Target Audience Card - Only for Senior Secondary General Classes */}
        {showTargetAudience && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                <CardTitle className="text-base sm:text-lg">Target Audience</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Choose which students can see this exam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="grid gap-3">
                {TARGET_AUDIENCE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex items-start gap-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-all border-2",
                      formData.target_audience === option.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="target_audience"
                      value={option.value}
                      checked={formData.target_audience === option.value}
                      onChange={(e) => onChange({ target_audience: e.target.value })}
                      className="mt-0.5 h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg">{option.icon}</span>
                        <p className="font-medium text-sm sm:text-base">{option.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </p>
                      {option.value === 'all' && (
                        <p className="text-xs text-emerald-600 mt-2">
                          ✓ All {formData.class} students will see this exam
                        </p>
                      )}
                      {option.value !== 'all' && (
                        <p className="text-xs text-blue-600 mt-2">
                          ✓ Only {option.value} department students in {formData.class} will see this exam
                        </p>
                      )}
                    </div>
                  </label>
                ))}
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

        {/* Assessment Criteria Card */}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
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