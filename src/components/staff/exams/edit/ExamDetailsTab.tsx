// src/components/staff/exams/edit/ExamDetailsTab.tsx

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, GraduationCap, FileText, Settings2, HelpCircle, Calendar, Target, Calculator } from 'lucide-react'
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
  objectiveTotal?: number
  theoryTotal?: number
  examTotal?: number
  defaultMark?: number
  questionCount?: number
  theoryQuestionCount?: number
  ca1Max?: number
  ca2Max?: number
  caTotal?: number
  grandTotal?: number
}

const termOptions = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' }
]

const SENIOR_CLASS_OPTIONS = {
  general: [
    { value: 'SS1', label: '📚 SS1 (All Students)', description: 'Visible to ALL SS1 students' },
    { value: 'SS2', label: '📚 SS2 (All Students)', description: 'Visible to ALL SS2 students' },
    { value: 'SS3', label: '📚 SS3 (All Students)', description: 'Visible to ALL SS3 students' },
  ],
  science: [
    { value: 'SS1 Science', label: '🔬 SS1 Science', description: 'Science department only' },
    { value: 'SS2 Science', label: '🔬 SS2 Science', description: 'Science department only' },
    { value: 'SS3 Science', label: '🔬 SS3 Science', description: 'Science department only' },
  ],
  arts: [
    { value: 'SS1 Arts', label: '🎨 SS1 Arts', description: 'Arts department only' },
    { value: 'SS2 Arts', label: '🎨 SS2 Arts', description: 'Arts department only' },
    { value: 'SS3 Arts', label: '🎨 SS3 Arts', description: 'Arts department only' },
  ],
  commercial: [
    { value: 'SS1 Commercial', label: '💼 SS1 Commercial', description: 'Commercial department only' },
    { value: 'SS2 Commercial', label: '💼 SS2 Commercial', description: 'Commercial department only' },
    { value: 'SS3 Commercial', label: '💼 SS3 Commercial', description: 'Commercial department only' },
  ]
}

const JSS_OPTIONS = [
  { value: 'JSS 1', label: 'JSS 1', description: 'Junior Secondary 1' },
  { value: 'JSS 2', label: 'JSS 2', description: 'Junior Secondary 2' },
  { value: 'JSS 3', label: 'JSS 3', description: 'Junior Secondary 3' },
]

const TARGET_AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Students', description: 'All students in this class can see this exam', icon: '🌍' },
  { value: 'Science', label: 'Science Department Only', description: 'Only Science department students', icon: '🔬' },
  { value: 'Arts', label: 'Arts Department Only', description: 'Only Arts department students', icon: '🎨' },
  { value: 'Commercial', label: 'Commercial Department Only', description: 'Only Commercial department students', icon: '💼' },
]

export function ExamDetailsTab({
  formData,
  onChange,
  availableSubjects,
  classes,
  availableSessions,
  currentSession,
  hasTheory,
  onHasTheoryChange,
  objectiveTotal = 0,
  theoryTotal = 0,
  examTotal = 0,
  defaultMark = 0.5,
  questionCount = 0,
  theoryQuestionCount = 0,
  ca1Max = 0,
  ca2Max = 0,
  caTotal = 0,
  grandTotal = 0,
}: ExamDetailsTabProps) {
  const isSeniorClass = formData.class?.startsWith('SS') || false
  const showTargetAudience = isSeniorClass && formData.class && !formData.class.includes(' ')
  
  const isBalanced = examTotal === 60
  const isOver = examTotal > 60

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">

        {/* Marks Summary */}
        {(objectiveTotal > 0 || theoryTotal > 0 || examTotal > 0) && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Marks:</span>
            <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300">
              Obj: {objectiveTotal}mk
              <span className="text-[9px] text-blue-400/70 dark:text-blue-400/50 ml-1">({questionCount}×{defaultMark})</span>
            </Badge>
            <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300">
              Theory: {theoryTotal}mk
              {theoryQuestionCount > 0 && (
                <span className="text-[9px] text-purple-400/70 dark:text-purple-400/50 ml-1">({theoryQuestionCount} Qs)</span>
              )}
            </Badge>
            <Badge className={cn(
              "text-xs border-0",
              isBalanced ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : 
              isOver ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400" : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
            )}>
              {isBalanced ? "✅" : isOver ? "⛔" : "⚠️"} Total: {examTotal}/60
            </Badge>
            {ca1Max > 0 && ca2Max > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300">
                CA: {ca1Max}+{ca2Max}={caTotal}mk
              </Badge>
            )}
            {grandTotal > 0 && (
              <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300">
                Grand: {grandTotal}mk
              </Badge>
            )}
          </div>
        )}

        {/* Basic Information */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-base sm:text-lg text-slate-800 dark:text-slate-100">Basic Information</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter the fundamental details of your exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

              {/* Title */}
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Exam Title</Label>
                  <span className="text-red-500 dark:text-red-400 text-xs">*</span>
                </div>
                <Input
                  value={formData.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  placeholder="e.g., First Term Mathematics Examination"
                  className="h-9 sm:h-10 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Class */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Class</Label>
                  <span className="text-red-500 dark:text-red-400 text-xs">*</span>
                </div>
                <Select
                  value={formData.class}
                  onValueChange={(v) => onChange({ class: v, subject: '', target_audience: 'all' })}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    <div className="px-2 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 sticky top-0 z-10 backdrop-blur-sm">
                      📚 All Students (General Subjects)
                    </div>
                    {SENIOR_CLASS_OPTIONS.general.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="focus:bg-slate-100 dark:focus:bg-slate-800">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                    
                    <div className="px-2 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 mt-1">
                      🔬 Science Department
                    </div>
                    {SENIOR_CLASS_OPTIONS.science.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="focus:bg-slate-100 dark:focus:bg-slate-800">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}

                    <div className="px-2 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 mt-1">
                      🎨 Arts Department
                    </div>
                    {SENIOR_CLASS_OPTIONS.arts.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="focus:bg-slate-100 dark:focus:bg-slate-800">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}

                    <div className="px-2 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 mt-1">
                      💼 Commercial Department
                    </div>
                    {SENIOR_CLASS_OPTIONS.commercial.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="focus:bg-slate-100 dark:focus:bg-slate-800">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}

                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 mt-1">
                      📖 Junior Secondary School
                    </div>
                    {JSS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="focus:bg-slate-100 dark:focus:bg-slate-800">
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">{opt.label}</div>
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
                  <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Subject</Label>
                  <span className="text-red-500 dark:text-red-400 text-xs">*</span>
                </div>
                <Select
                  value={formData.subject}
                  onValueChange={(v) => onChange({ subject: v })}
                  disabled={!formData.class}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder={formData.class ? 'Select subject' : 'Select class first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Duration (minutes)</Label>
                  <span className="text-red-500 dark:text-red-400 text-xs">*</span>
                </div>
                <Input
                  type="number"
                  min={5}
                  max={240}
                  value={formData.duration}
                  onChange={(e) => onChange({ duration: parseInt(e.target.value) || 60 })}
                  className="h-9 sm:h-10 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Target Audience - Only for SS General classes */}
        {showTargetAudience && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                <CardTitle className="text-base sm:text-lg text-slate-800 dark:text-slate-100">Target Audience</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-500"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <input
                      type="radio"
                      name="target_audience"
                      value={option.value}
                      checked={formData.target_audience === option.value}
                      onChange={(e) => onChange({ target_audience: e.target.value })}
                      className="mt-0.5 h-4 w-4 accent-indigo-600 dark:accent-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg">{option.icon}</span>
                        <p className="font-medium text-sm sm:text-base text-slate-800 dark:text-slate-200">{option.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Academic Period */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-base sm:text-lg text-slate-800 dark:text-slate-100">Academic Period</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Set the term and session for this exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">Term</Label>
                <Select value={formData.term} onValueChange={(v) => onChange({ term: v })}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {termOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">Session</Label>
                <Select value={formData.session_year} onValueChange={(v) => onChange({ session_year: v })}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSessions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s} {s === currentSession && <span className="text-emerald-500 dark:text-emerald-400 text-xs ml-1">(Current)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Criteria */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-base sm:text-lg text-slate-800 dark:text-slate-100">Assessment Criteria</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Set the passing score and exam instructions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">Pass Mark (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.pass_mark}
                onChange={(e) => onChange({ pass_mark: parseInt(e.target.value) || 50 })}
                className="h-9 sm:h-10 text-sm max-w-[150px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Students need this percentage to pass the exam
              </p>
            </div>
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-1.5 block text-slate-700 dark:text-slate-300">Instructions for Students</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => onChange({ instructions: e.target.value })}
                placeholder="Enter exam instructions for students..."
                rows={4}
                className="resize-none text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
          </CardContent>
        </Card>

        {/* Exam Settings */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-500" />
              <CardTitle className="text-base sm:text-lg text-slate-800 dark:text-slate-100">Exam Settings</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Configure how the exam behaves
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">

            {/* Shuffle Questions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-transparent dark:border-slate-800">
              <div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium text-slate-800 dark:text-slate-200">Shuffle Questions</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                      <p className="text-xs">Randomize question order for each student</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Each student gets questions in a different order
                </p>
              </div>
              <Switch
                checked={formData.shuffle_questions || false}
                onCheckedChange={(v) => onChange({ shuffle_questions: v })}
              />
            </div>

            {/* Shuffle Options */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-transparent dark:border-slate-800">
              <div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium text-slate-800 dark:text-slate-200">Shuffle Options</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                      <p className="text-xs">Randomize answer options for objective questions</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Each student sees answer choices in a different order
                </p>
              </div>
              <Switch
                checked={formData.shuffle_options || false}
                onCheckedChange={(v) => onChange({ shuffle_options: v })}
              />
            </div>

          </CardContent>
        </Card>

        {/* Theory Questions Toggle */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100">Include Theory Questions</h3>
                </div>
                <p className="text-[10px] sm:text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                  Add essay-type questions to this exam for comprehensive assessment
                </p>
              </div>
              <Switch
                checked={hasTheory}
                onCheckedChange={onHasTheoryChange}
                className="data-[state=checked]:bg-purple-600 dark:data-[state=checked]:bg-purple-500"
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </TooltipProvider>
  )
}