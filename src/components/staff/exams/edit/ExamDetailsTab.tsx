// src/components/staff/exams/edit/ExamDetailsTab.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Details</CardTitle>
        <CardDescription>Edit the basic information about this exam</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Exam Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g., First Term Mathematics Exam"
            />
          </div>
          <div>
            <Label>Class *</Label>
            <Select
              value={formData.class}
              onValueChange={(v) => onChange({ class: v, subject: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subject *</Label>
            <Select
              value={formData.subject}
              onValueChange={(v) => onChange({ subject: v })}
              disabled={!formData.class}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.class ? 'Select subject' : 'Select class first'} />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Duration (minutes) *</Label>
            <Input
              type="number"
              min={5}
              max={240}
              value={formData.duration}
              onChange={(e) => onChange({ duration: parseInt(e.target.value) || 60 })}
            />
          </div>
        </div>

        {/* Term and Session */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Term *</Label>
            <Select value={formData.term} onValueChange={(v) => onChange({ term: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {termOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Session *</Label>
            <Select value={formData.session_year} onValueChange={(v) => onChange({ session_year: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSessions.map(s => (
                  <SelectItem key={s} value={s}>
                    {s} {s === currentSession && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pass Mark */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Pass Mark (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={formData.pass_mark}
              onChange={(e) => onChange({ pass_mark: parseInt(e.target.value) || 50 })}
            />
          </div>
        </div>

        {/* Instructions */}
        <div>
          <Label>Instructions</Label>
          <Textarea
            value={formData.instructions}
            onChange={(e) => onChange({ instructions: e.target.value })}
            placeholder="Enter exam instructions for students..."
            rows={4}
          />
        </div>

        {/* Exam Settings */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">Exam Settings</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Shuffle Questions</Label>
              <p className="text-xs text-muted-foreground">Randomize question order for each student</p>
            </div>
            <Switch
              checked={formData.shuffle_questions}
              onCheckedChange={(v) => onChange({ shuffle_questions: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Shuffle Options</Label>
              <p className="text-xs text-muted-foreground">Randomize answer options order</p>
            </div>
            <Switch
              checked={formData.shuffle_options}
              onCheckedChange={(v) => onChange({ shuffle_options: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Negative Marking</Label>
              <p className="text-xs text-muted-foreground">Deduct points for wrong answers</p>
            </div>
            <Switch
              checked={formData.negative_marking}
              onCheckedChange={(v) => onChange({ negative_marking: v })}
            />
          </div>

          {formData.negative_marking && (
            <div className="pl-0 sm:pl-8">
              <Label>Negative Marking Value</Label>
              <Input
                type="number"
                step={0.5}
                min={0}
                value={formData.negative_marking_value}
                onChange={(e) => onChange({ negative_marking_value: parseFloat(e.target.value) || 0.5 })}
                className="max-w-[200px]"
              />
            </div>
          )}
        </div>

        {/* Theory Questions Toggle */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <Label>Include Theory Questions</Label>
              <p className="text-xs text-muted-foreground">Add essay-type questions to this exam</p>
            </div>
            <Switch checked={hasTheory} onCheckedChange={onHasTheoryChange} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}