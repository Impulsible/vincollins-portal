// src/components/student/exam/views/InstructionsView.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen, User, Clock, Calendar, Camera,
  FileText, Shield, Lock, Loader2, Award,
  Target, AlertCircle, CheckCircle2, ArrowLeft,
  MonitorPlay, Wifi, Eye, EyeOff
} from 'lucide-react'
import Image from 'next/image'
import { TERM_NAMES, CURRENT_TERM, CURRENT_SESSION, TAB_SWITCH_LIMIT, FULLSCREEN_EXIT_LIMIT } from '@/app/student/exam/[id]/constants'
import type { Exam, StudentProfile, Question } from '@/app/student/exam/[id]/types'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface InstructionsViewProps {
  exam: Exam
  profile: StudentProfile | null
  allQuestions: Question[]
  startingExam: boolean
  onStart: () => void
  onCancel: () => void
}

export function InstructionsView({
  exam,
  profile,
  allQuestions,
  startingExam,
  onStart,
  onCancel,
}: InstructionsViewProps) {
  const [agreedToRules, setAgreedToRules] = useState(false)
  const objectiveQuestions = allQuestions.filter(q => q.type !== 'theory')
  const theoryQuestions = allQuestions.filter(q => q.type === 'theory')
  const totalPoints = allQuestions.reduce((sum, q) => sum + Number(q.points || 1), 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex h-10 w-10 rounded-lg bg-primary/10 items-center justify-center shrink-0">
                <MonitorPlay className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {exam?.title}
                </h1>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />{exam?.subject}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />{exam?.class}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {TERM_NAMES[exam?.term || CURRENT_TERM]} {exam?.session_year || CURRENT_SESSION}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Available
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          
          {/* Left Column - Candidate Card */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card className="border shadow-md bg-white overflow-hidden">
                <div className="bg-primary p-3">
                  <h3 className="text-white font-medium text-sm text-center flex items-center justify-center gap-2">
                    <Camera className="h-4 w-4" />
                    Candidate Verification
                  </h3>
                </div>
                <CardContent className="p-4 sm:p-5 flex flex-col items-center">
                  <div className="relative mb-3">
                    {profile?.photo_url ? (
                      <div className="w-40 h-48 sm:w-48 sm:h-56 border-4 border-primary/20 rounded-lg overflow-hidden shadow-lg">
                        <Image
                          src={profile.photo_url}
                          alt={profile.full_name || 'Student'}
                          width={192}
                          height={224}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-40 h-48 sm:w-48 sm:h-56 border-4 border-gray-100 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                        <User className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                      <Badge className="bg-primary text-white text-xs px-4 py-1 shadow-lg">
                        {profile?.vin_id || 'Student ID'}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="text-gray-900 font-bold text-lg text-center">
                    {profile?.full_name || 'Student'}
                  </h3>
                  <p className="text-gray-500 text-sm text-center">{profile?.class}</p>
                  <p className="text-gray-400 text-xs text-center mt-0.5">{profile?.email}</p>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border shadow-sm bg-white hidden lg:block">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> Duration
                    </span>
                    <span className="font-semibold text-gray-900">{exam?.duration} min</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Award className="h-4 w-4" /> Total Points
                    </span>
                    <span className="font-semibold text-gray-900">{totalPoints} pts</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Target className="h-4 w-4" /> Pass Mark
                    </span>
                    <span className="font-semibold text-gray-900">{exam?.passing_percentage || 50}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: FileText, label: 'Questions', value: allQuestions.length, color: 'bg-blue-50 text-blue-600' },
                { icon: Award, label: 'Total Points', value: `${totalPoints} pts`, color: 'bg-amber-50 text-amber-600' },
                { icon: Target, label: 'Pass Mark', value: `${exam?.passing_percentage || 50}%`, color: 'bg-green-50 text-green-600' },
                { icon: Lock, label: 'Attempt', value: '1 of 1', color: 'bg-purple-50 text-purple-600' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl border shadow-sm p-4 text-center">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mx-auto mb-2", item.color)}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Question Breakdown */}
            <Card className="border shadow-sm bg-white">
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Question Breakdown</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-blue-50 rounded-lg px-4 py-3 flex-1 min-w-[180px]">
                    <div className="h-3 w-3 rounded-full bg-blue-500 shrink-0"></div>
                    <div>
                      <p className="text-lg font-bold text-blue-700">{objectiveQuestions.length}</p>
                      <p className="text-xs text-blue-600">Objective Questions</p>
                    </div>
                  </div>
                  {theoryQuestions.length > 0 && (
                    <div className="flex items-center gap-3 bg-purple-50 rounded-lg px-4 py-3 flex-1 min-w-[180px]">
                      <div className="h-3 w-3 rounded-full bg-purple-500 shrink-0"></div>
                      <div>
                        <p className="text-lg font-bold text-purple-700">{theoryQuestions.length}</p>
                        <p className="text-xs text-purple-600">Theory Questions</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            {exam?.instructions && (
              <Card className="border shadow-sm bg-white border-l-4 border-l-blue-500">
                <CardContent className="p-4 sm:p-5">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Exam Instructions
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{exam.instructions}</p>
                </CardContent>
              </Card>
            )}

            {/* Security Rules */}
            <Card className="border shadow-sm bg-white border-l-4 border-l-amber-500">
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-600" />
                  Exam Security Rules
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: Eye, text: `Tab switching limit: ${TAB_SWITCH_LIMIT} (exceed = auto-submit)` },
                    { icon: MonitorPlay, text: `Fullscreen exit limit: ${FULLSCREEN_EXIT_LIMIT} (exceed = auto-submit)` },
                    { icon: Clock, text: 'Timer auto-submits when time expires' },
                    { icon: Wifi, text: 'Progress auto-saved every 30 seconds' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <item.icon className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Theory Notice */}
            {theoryQuestions.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-purple-800 text-sm font-medium">Theory Questions Included</p>
                  <p className="text-purple-600 text-sm mt-0.5">
                    Objective answers are graded immediately. Theory answers will be reviewed by your instructor.
                  </p>
                </div>
              </div>
            )}

            {/* Agreement & Actions */}
            <Card className="border shadow-sm bg-white">
              <CardContent className="p-4 sm:p-5">
                <label className="flex items-start gap-3 cursor-pointer mb-5">
                  <input
                    type="checkbox"
                    checked={agreedToRules}
                    onChange={(e) => setAgreedToRules(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">
                    I understand the exam rules and agree to take this exam under the specified conditions. 
                    I acknowledge that violating security rules will result in automatic submission.
                  </span>
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 order-2 sm:order-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Exams
                  </Button>
                  <Button
                    onClick={onStart}
                    disabled={startingExam || !agreedToRules}
                    className="flex-1 order-1 sm:order-2"
                    size="lg"
                  >
                    {startingExam ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Lock className="mr-2 h-5 w-5" />
                    )}
                    Start Exam Now
                  </Button>
                </div>

                {!agreedToRules && (
                  <p className="text-center text-xs text-amber-600 mt-3 flex items-center justify-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Please agree to the exam rules before starting
                  </p>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-xs text-gray-400">
              This exam can only be taken once. Ensure you&apos;re in a quiet environment with stable internet.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}