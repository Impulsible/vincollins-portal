// src/components/staff/exams/create/steps/ExamDetailsStep.tsx - WITH DARK MODE

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, Settings, Target, Shuffle, Zap, Brain, Loader2,
  Calculator
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { CLASS_OPTIONS, JSS_SUBJECTS, SS_SUBJECTS, MARK_CONSTANTS } from "../constants";
import type { ExamDetails, MarkDistribution } from "../types";

interface ExamDetailsStepProps {
  examDetails: ExamDetails;
  onExamDetailsChange: (details: ExamDetails) => void;
  hasTheory: boolean;
  onHasTheoryChange: (v: boolean) => void;
  objectiveMax: number;
  onObjectiveMaxChange: (v: number) => void;
  theoryMax: number;
  onTheoryMaxChange: (v: number) => void;
  defaultMark: number;
  onDefaultMarkChange: (v: number) => void;
  questionCount?: number;
  markDistribution?: MarkDistribution;
}

interface TermOption {
  value: string;
  label: string;
  session_year: string;
  is_current: boolean;
}

export function ExamDetailsStep({
  examDetails,
  onExamDetailsChange,
  hasTheory,
  onHasTheoryChange,
  objectiveMax,
  onObjectiveMaxChange,
  theoryMax,
  onTheoryMaxChange,
  defaultMark,
  onDefaultMarkChange,
  questionCount = 0,
  markDistribution,
}: ExamDetailsStepProps) {
  const [termOptions, setTermOptions] = useState<TermOption[]>([])
  const [isLoadingTerms, setIsLoadingTerms] = useState(true)

  const update = (patch: Partial<ExamDetails>) =>
    onExamDetailsChange({ ...examDetails, ...patch });

  const availableSubjects = useMemo(() => {
    if (!examDetails.class) return [];
    return examDetails.class.startsWith("JSS") ? JSS_SUBJECTS : SS_SUBJECTS;
  }, [examDetails.class]);

  const objectiveTotal = markDistribution?.objectiveTotal || 0;
  const theoryTotal = markDistribution?.theoryTotal || 0;
  const examTotal = markDistribution?.examTotal || 0;
  const isBalanced = markDistribution?.isBalanced || false;
  const isOver = examTotal > MARK_CONSTANTS.EXAM_TOTAL;

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const { data, error } = await supabase
          .from('terms')
          .select('term_code, term_name, session_year')
          .order('session_year', { ascending: false })
          .order('term_code', { ascending: true })

        if (error) {
          console.error('Error fetching terms:', error)
          return
        }

        if (data) {
          const { data: settings } = await supabase
            .from('school_settings')
            .select('current_term, current_session')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const options = data.map((t: any) => ({
            value: t.term_code,
            label: t.term_name,
            session_year: t.session_year,
            is_current: t.term_code === settings?.current_term && 
                        t.session_year === settings?.current_session
          }))
          
          setTermOptions(options)
          
          if (!examDetails.term && settings?.current_term) {
            update({
              term: settings.current_term,
              session_year: settings.current_session
            })
          }
        }
      } catch (error) {
        console.error('Error fetching terms:', error)
      } finally {
        setIsLoadingTerms(false)
      }
    }

    fetchTerms()
  }, [])

  const handleTermChange = (termValue: string) => {
    const term = termOptions.find(t => t.value === termValue)
    if (term) {
      update({
        term: term.value,
        session_year: term.session_year
      })
    }
  }

  if (isLoadingTerms) {
    return (
      <div className="flex items-center justify-center py-12 bg-white dark:bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Loading terms...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-4 sm:space-y-5">

        {/* Mark Distribution Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Mark Distribution</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center border border-blue-100 dark:border-blue-900/50">
              <p className="text-[10px] text-blue-600 dark:text-blue-400">Objective</p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{objectiveTotal.toFixed(1)} marks</p>
              <p className="text-[9px] text-blue-500 dark:text-blue-400">{questionCount} questions × {defaultMark}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center border border-purple-100 dark:border-purple-900/50">
              <p className="text-[10px] text-purple-600 dark:text-purple-400">Theory</p>
              <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{theoryTotal.toFixed(1)} marks</p>
            </div>
            <div className={cn(
              "bg-white dark:bg-slate-900 rounded-lg p-2 text-center border",
              isBalanced 
                ? "border-emerald-100 dark:border-emerald-900/50" 
                : isOver 
                ? "border-red-100 dark:border-red-900/50" 
                : "border-amber-100 dark:border-amber-900/50"
            )}>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Total</p>
              <p className={cn(
                "text-sm font-bold",
                isBalanced 
                  ? "text-emerald-700 dark:text-emerald-300" 
                  : isOver 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-amber-600 dark:text-amber-400"
              )}>
                {examTotal} / {MARK_CONSTANTS.EXAM_TOTAL}
              </p>
              <p className="text-[9px]">
                {isBalanced ? "✅" : isOver ? "⛔ OVER" : "⚠️"}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
            <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-xs text-gray-700 dark:text-slate-200">Basic Information</h3>
          </div>

          <div>
            <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
              Exam Title <span className="text-red-500">*</span>
            </Label>
            <Input
              value={examDetails.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g., Third Term Mathematics Examination"
              className="mt-1 h-9 sm:h-10 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                Class <span className="text-red-500">*</span>
              </Label>
              <Select
                value={examDetails.class}
                onValueChange={(v) => update({ class: v, subject: "" })}
              >
                <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800">Junior</div>
                  {CLASS_OPTIONS.jss.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">Senior — All</div>
                  {CLASS_OPTIONS.general.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30">Science</div>
                  {CLASS_OPTIONS.science.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30">Arts</div>
                  {CLASS_OPTIONS.arts.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">Commercial</div>
                  {CLASS_OPTIONS.commercial.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Select
                value={examDetails.subject}
                onValueChange={(v) => update({ subject: v })}
                disabled={!examDetails.class}
              >
                <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder={examDetails.class ? "Select subject" : "Select class first"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {availableSubjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Period & Config */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
            <Settings className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-xs text-gray-700 dark:text-slate-200">Period & Config</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Term</Label>
              <Select value={examDetails.term} onValueChange={handleTermChange}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {termOptions.map((term) => (
                    <SelectItem key={`${term.value}-${term.session_year}`} value={term.value}>
                      {term.label} {term.is_current ? '✓' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Session</Label>
              <Select value={examDetails.session_year} onValueChange={(v) => update({ session_year: v })}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {[...new Set(termOptions.map(t => t.session_year))].map((session) => (
                    <SelectItem key={session} value={session}>{session}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Duration (min)</Label>
              <Input
                type="number"
                value={examDetails.duration}
                onChange={(e) => update({ duration: parseInt(e.target.value) || 0 })}
                className="mt-1 h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                min={1}
              />
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Pass Mark %</Label>
              <Input
                type="number"
                value={examDetails.pass_mark}
                onChange={(e) => update({ pass_mark: parseInt(e.target.value) || 0 })}
                className="mt-1 h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                min={1}
                max={100}
              />
            </div>
          </div>
        </section>

        {/* Toggles */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
            <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-xs text-gray-700 dark:text-slate-200">Settings</h3>
          </div>
          
          {[
            { key: "randomize_questions" as const, label: "Shuffle Questions", icon: Shuffle },
            { key: "randomize_options" as const, label: "Shuffle Options", icon: Zap },
          ].map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className={cn(
                "p-3 rounded-lg border-2 cursor-pointer transition-colors",
                examDetails[key]
                  ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
              onClick={() => update({ [key]: !examDetails[key] })}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn(
                    "h-3.5 w-3.5", 
                    examDetails[key] 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : "text-gray-400 dark:text-slate-500"
                  )} />
                  <span className={cn(
                    "text-xs font-semibold", 
                    examDetails[key] 
                      ? "text-emerald-700 dark:text-emerald-300" 
                      : "text-gray-600 dark:text-slate-300"
                  )}>
                    {label}
                  </span>
                </div>
                <Switch 
                  checked={examDetails[key]} 
                  onCheckedChange={(v) => update({ [key]: v })} 
                  onClick={(e) => e.stopPropagation()} 
                />
              </div>
            </div>
          ))}

          <div
            className={cn(
              "p-3 rounded-lg border-2 cursor-pointer transition-colors",
              hasTheory 
                ? "border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-950/30" 
                : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
            onClick={() => onHasTheoryChange(!hasTheory)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className={cn(
                  "h-4 w-4", 
                  hasTheory 
                    ? "text-purple-600 dark:text-purple-400" 
                    : "text-gray-400 dark:text-slate-500"
                )} />
                <div>
                  <p className={cn(
                    "text-xs font-semibold", 
                    hasTheory 
                      ? "text-purple-700 dark:text-purple-300" 
                      : "text-gray-600 dark:text-slate-300"
                  )}>
                    Include Theory Questions
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Add essay-type questions</p>
                </div>
              </div>
              <Switch 
                checked={hasTheory} 
                onCheckedChange={onHasTheoryChange} 
                onClick={(e) => e.stopPropagation()} 
              />
            </div>
          </div>
        </section>

        {/* Instructions */}
        <div>
          <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase">Instructions (Optional)</Label>
          <Textarea
            value={examDetails.instructions}
            onChange={(e) => update({ instructions: e.target.value })}
            rows={2}
            placeholder="Answer all questions in Section A..."
            className="mt-1 resize-none text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>
    </div>
  );
}