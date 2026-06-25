// src/components/staff/exams/create/steps/ExamDetailsStep.tsx

"use client";

import { useMemo } from "react";
import {
  BookOpen, Settings, Target, Shuffle, Zap, Brain,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CLASS_OPTIONS, JSS_SUBJECTS, SS_SUBJECTS } from "../constants";
import type { ExamDetails } from "../types";

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
}: ExamDetailsStepProps) {
  const update = (patch: Partial<ExamDetails>) =>
    onExamDetailsChange({ ...examDetails, ...patch });

  const availableSubjects = useMemo(() => {
    if (!examDetails.class) return [];
    return examDetails.class.startsWith("JSS") ? JSS_SUBJECTS : SS_SUBJECTS;
  }, [examDetails.class]);

  const total = objectiveMax + theoryMax;
  const totalOk = total === 60;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-4 sm:space-y-5">

        {/* Basic Info */}
        <section className="space-y-3">
          <SectionHeader icon={BookOpen} color="emerald" label="Basic Information" />

          <div>
            <Label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
              Exam Title <span className="text-red-500">*</span>
            </Label>
            <Input
              value={examDetails.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g., Third Term Mathematics Examination"
              className="mt-1 h-9 sm:h-10 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                Class <span className="text-red-500">*</span>
              </Label>
              <Select
                value={examDetails.class}
                onValueChange={(v) => update({ class: v, subject: "" })}
              >
                <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <GroupLabel color="slate" label="Junior" />
                  {CLASS_OPTIONS.jss.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                  <GroupLabel color="emerald" label="Senior — All" />
                  {CLASS_OPTIONS.general.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                  <GroupLabel color="blue" label="Science" />
                  {CLASS_OPTIONS.science.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                  <GroupLabel color="purple" label="Arts" />
                  {CLASS_OPTIONS.arts.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                  <GroupLabel color="amber" label="Commercial" />
                  {CLASS_OPTIONS.commercial.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Select
                value={examDetails.subject}
                onValueChange={(v) => update({ subject: v })}
                disabled={!examDetails.class}
              >
                <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
                  <SelectValue
                    placeholder={
                      examDetails.class ? "Select subject" : "Select class first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
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
          <SectionHeader icon={Settings} color="blue" label="Period & Config" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <FieldWrap label="Term">
              <Select
                value={examDetails.term}
                onValueChange={(v) => update({ term: v })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">First</SelectItem>
                  <SelectItem value="second">Second</SelectItem>
                  <SelectItem value="third">Third</SelectItem>
                </SelectContent>
              </Select>
            </FieldWrap>

            <FieldWrap label="Session">
              <Select
                value={examDetails.session_year}
                onValueChange={(v) => update({ session_year: v })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                  <SelectItem value="2026/2027">2026/2027</SelectItem>
                </SelectContent>
              </Select>
            </FieldWrap>

            <FieldWrap label="Duration (min)">
              <Input
                type="number"
                value={examDetails.duration}
                onChange={(e) => update({ duration: parseInt(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
                className="h-8 text-xs"
                min={1}
              />
            </FieldWrap>

            <FieldWrap label="Pass Mark %">
              <Input
                type="number"
                value={examDetails.pass_mark}
                onChange={(e) => update({ pass_mark: parseInt(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
                className="h-8 text-xs"
                min={1}
                max={100}
              />
            </FieldWrap>
          </div>
        </section>

        {/* Marks */}
        <section className="space-y-3">
          <SectionHeader icon={Target} color="purple" label="Marks" />

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Label className="text-[10px] font-semibold text-blue-700 uppercase">
                Objective Max
              </Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={objectiveMax}
                onChange={(e) =>
                  onObjectiveMaxChange(
                    Math.min(60, Math.max(0, parseInt(e.target.value) || 0))
                  )
                }
                className="mt-1.5 h-9 bg-white border-blue-200 text-lg font-bold text-blue-700"
              />
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <Label className="text-[10px] font-semibold text-purple-700 uppercase">
                Theory Max
              </Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={theoryMax}
                onChange={(e) =>
                  onTheoryMaxChange(
                    Math.min(60, Math.max(0, parseInt(e.target.value) || 0))
                  )
                }
                className="mt-1.5 h-9 bg-white border-purple-200 text-lg font-bold text-purple-700"
              />
            </div>
          </div>

          <div
            className={cn(
              "rounded-lg p-2 flex items-center justify-between border",
              totalOk
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            )}
          >
            <span
              className={cn(
                "text-xs font-semibold",
                totalOk ? "text-emerald-700" : "text-amber-700"
              )}
            >
              Total: {total} marks
            </span>
            <Badge
              className={cn(
                "text-[10px]",
                totalOk
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {totalOk ? "✅ Perfect" : "Recommended: 60"}
            </Badge>
          </div>

          {/* Default Mark */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <Label className="text-[10px] font-semibold text-gray-600 uppercase mb-2 block">
              Default mark / question
            </Label>
            <RadioGroup
              value={defaultMark.toString()}
              onValueChange={(v) => onDefaultMarkChange(parseFloat(v))}
              className="flex gap-2"
            >
              {[
                { v: "0.5", l: "½ Mark" },
                { v: "1", l: "1 Mark" },
                { v: "2", l: "2 Marks" },
              ].map(({ v, l }) => (
                <label
                  key={v}
                  className={cn(
                    "flex-1 text-center p-2 rounded-lg border-2 cursor-pointer text-xs font-semibold",
                    defaultMark.toString() === v
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-600"
                  )}
                >
                  <RadioGroupItem value={v} className="sr-only" />
                  {l}
                </label>
              ))}
            </RadioGroup>
          </div>
        </section>

        {/* Toggles */}
        <section className="space-y-2">
          {[
            {
              key: "randomize_questions" as const,
              label: "Shuffle Questions",
              icon: Shuffle,
            },
            {
              key: "randomize_options" as const,
              label: "Shuffle Options",
              icon: Zap,
            },
          ].map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className={cn(
                "p-3 rounded-lg border-2 cursor-pointer",
                examDetails[key]
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-200 bg-white"
              )}
              onClick={() => update({ [key]: !examDetails[key] })}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5",
                      examDetails[key] ? "text-emerald-600" : "text-gray-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      examDetails[key] ? "text-emerald-700" : "text-gray-600"
                    )}
                  >
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
              "p-3 rounded-lg border-2 cursor-pointer",
              hasTheory ? "border-purple-400 bg-purple-50" : "border-gray-200 bg-white"
            )}
            onClick={() => onHasTheoryChange(!hasTheory)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain
                  className={cn(
                    "h-4 w-4",
                    hasTheory ? "text-purple-600" : "text-gray-400"
                  )}
                />
                <div>
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      hasTheory ? "text-purple-700" : "text-gray-600"
                    )}
                  >
                    Include Theory Questions
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Add essay-type questions
                  </p>
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
          <Label className="text-[10px] font-semibold text-gray-600 uppercase">
            Instructions (Optional)
          </Label>
          <Textarea
            value={examDetails.instructions}
            onChange={(e) => update({ instructions: e.target.value })}
            rows={2}
            placeholder="Answer all questions in Section A..."
            className="mt-1 resize-none text-xs"
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  color,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 pb-1.5 border-b">
      <Icon className={`h-3.5 w-3.5 text-${color}-600`} />
      <h3 className="font-semibold text-xs text-gray-700">{label}</h3>
    </div>
  );
}

function FieldWrap({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
        {label}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function GroupLabel({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "px-2 py-1 text-[10px] font-bold uppercase mt-1",
        `text-${color}-600 bg-${color}-50`
      )}
    >
      {label}
    </div>
  );
}