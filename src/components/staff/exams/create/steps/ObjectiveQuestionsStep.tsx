// src/components/staff/exams/create/steps/ObjectiveQuestionsStep.tsx - UPDATED WITH MARK CALCULATION

"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Plus, CheckCheck, Sparkles, BookOpen, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BulkImporter } from "../components/BulkImporter";
import { ObjectiveCard } from "../components/QuestionCard";
import { parseDocument } from "../hooks/useQuestionParser";
import { OBJECTIVE_TEMPLATE } from "../constants";
import type { Question, ParseResult } from "../types";

// ✅ Mark distribution interface
interface MarkDistribution {
  objectiveTotal: number;
  theoryTotal: number;
  examTotal: number;
  ca1Max: number;
  ca2Max: number;
  caTotal: number;
  grandTotal: number;
  questionCount: number;
  theoryQuestionCount: number;
  marksPerTheoryQuestion: number;
  isBalanced: boolean;
  theoryMarksPerQuestion: number;
}

interface ObjectiveQuestionsStepProps {
  questions: Question[];
  onQuestionsChange: (q: Question[]) => void;
  objectiveMax: number;
  defaultMark: number;
  bulkText: string;
  onBulkTextChange: (v: string) => void;
  onParse: (text: string) => ParseResult<Question>;
  passageText: string;
  onPassageTextChange: (v: string) => void;
  hasPassage: boolean;
  onHasPassageChange: (v: boolean) => void;
  markDistribution?: MarkDistribution;
  onDefaultMarkChange?: (mark: number) => void;
}

export function ObjectiveQuestionsStep({
  questions,
  onQuestionsChange,
  objectiveMax,
  defaultMark,
  bulkText,
  onBulkTextChange,
  onParse,
  passageText,
  onPassageTextChange,
  hasPassage,
  onHasPassageChange,
  markDistribution,
  onDefaultMarkChange,
}: ObjectiveQuestionsStepProps) {
  const [mode, setMode] = useState<"bulk" | "manual">("bulk");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [manualQ, setManualQ] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: "",
    marks: defaultMark,
  });

  // ✅ Calculate objective total from questions
  const objectiveTotal = useMemo(() => {
    return questions.reduce((s, q) => s + q.marks, 0);
  }, [questions]);

  // ✅ Check if balanced
  const isBalanced = useMemo(() => {
    return markDistribution?.isBalanced ?? (objectiveTotal + 0 === 60);
  }, [objectiveTotal, markDistribution]);

  // ✅ Marks per question
  const marksPerQuestion = useMemo(() => {
    if (questions.length > 0) {
      return objectiveTotal / questions.length;
    }
    return defaultMark;
  }, [objectiveTotal, questions.length, defaultMark]);

  // ✅ Update all questions when defaultMark changes
  useEffect(() => {
    if (questions.length > 0 && onDefaultMarkChange) {
      // This will be handled by the parent via onDefaultMarkChange
    }
  }, [defaultMark, questions.length, onDefaultMarkChange]);

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  const handleParse = useCallback(() => {
    if (!bulkText.trim()) {
      toast.error("Paste questions first");
      return;
    }
    setParseError(null);
    const result = onParse(bulkText);

    // ✅ Apply default mark to parsed questions
    const itemsWithMarks = result.items.map(q => ({
      ...q,
      marks: defaultMark,
    }));

    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => toast.warning(w, { duration: 5000 }));
    }
    if (itemsWithMarks.length === 0) {
      setParseError(
        "No valid questions found. Check the format matches the template."
      );
      return;
    }

    onQuestionsChange([...questions, ...itemsWithMarks]);
    onBulkTextChange("");
    toast.success(
      `✅ Added ${itemsWithMarks.length} questions${
        result.skipped > 0 ? ` (${result.skipped} skipped)` : ""
      }`
    );
  }, [bulkText, onParse, questions, onQuestionsChange, onBulkTextChange, defaultMark]);

  const handleFileParse = useCallback(
    async (file: File) => {
      setIsParsingFile(true);
      try {
        const text = await parseDocument(file);
        const result = onParse(text);
        // ✅ Apply default mark
        const itemsWithMarks = result.items.map(q => ({
          ...q,
          marks: defaultMark,
        }));
        if (itemsWithMarks.length > 0) {
          onQuestionsChange([...questions, ...itemsWithMarks]);
          if (result.warnings.length > 0) {
            result.warnings.forEach((w) => toast.warning(w));
          }
          toast.success(
            `✅ ${itemsWithMarks.length} questions imported from file`
          );
        } else {
          toast.warning("No questions found in file. Check the format.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "File parse failed";
        setParseError(msg);
        toast.error(msg);
      } finally {
        setIsParsingFile(false);
      }
    },
    [onParse, questions, onQuestionsChange, defaultMark]
  );

  const handleAddManual = () => {
    if (!manualQ.question.trim()) {
      toast.error("Question text is required");
      return;
    }
    if (!manualQ.correct_answer) {
      toast.error("Select a correct answer");
      return;
    }
    if (manualQ.options.filter((o) => o.trim()).length < 2) {
      toast.error("Add at least 2 options");
      return;
    }

    onQuestionsChange([
      ...questions,
      {
        id: crypto.randomUUID(),
        type: "mcq",
        question: manualQ.question,
        options: manualQ.options,
        correct_answer: manualQ.correct_answer,
        marks: defaultMark, // ✅ Use defaultMark
      },
    ]);
    setManualQ({
      question: "",
      options: ["", "", "", ""],
      correct_answer: "",
      marks: defaultMark,
    });
    toast.success("Question added");
  };

  const downloadTemplate = () => {
    const blob = new Blob([OBJECTIVE_TEMPLATE], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "objective_template.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ✅ Handle mark update for all questions
  const handleMarkUpdate = (newMark: number) => {
    if (onDefaultMarkChange) {
      onDefaultMarkChange(newMark);
    }
    // Update all existing questions with new mark
    onQuestionsChange(questions.map(q => ({
      ...q,
      marks: newMark,
    })));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-3 sm:space-y-4">

        {/* ── Mark Distribution Warning ── */}
        {markDistribution && !markDistribution.isBalanced && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-xs">
              Total marks ({markDistribution.objectiveTotal + markDistribution.theoryTotal}) is not 60. 
              Objective: {markDistribution.objectiveTotal} marks, Theory: {markDistribution.theoryTotal} marks.
              {markDistribution.objectiveTotal + markDistribution.theoryTotal > 60 
                ? " Reduce objective questions or marks." 
                : " Add more objective questions or increase marks."}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard value={questions.length} label="Questions" color="blue" />
          <StatCard value={totalMarks.toFixed(1)} label="Total Marks" color="emerald" />
          <StatCard value={objectiveMax} label="Max" color="purple" />
          <StatCard value={marksPerQuestion.toFixed(2)} label="Per Question" color="amber" />
        </div>

        {/* ── Default Mark Selector ── */}
        <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <Calculator className="h-4 w-4 text-blue-600" />
          <span className="text-xs text-blue-700 font-medium">Mark per question:</span>
          <Select 
            value={defaultMark.toString()} 
            onValueChange={(v) => handleMarkUpdate(parseFloat(v))}
          >
            <SelectTrigger className="h-7 text-xs w-24 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
            </SelectContent>
          </Select>
          <Badge className="bg-blue-200 text-blue-700 text-[10px] ml-auto">
            {questions.length} questions × {defaultMark} = {totalMarks.toFixed(1)} marks
          </Badge>
        </div>

        {/* ── Comprehension Passage Toggle ── */}
        <div className="flex items-center gap-2">
          <Button
            variant={hasPassage ? "default" : "outline"}
            size="sm"
            onClick={() => onHasPassageChange(!hasPassage)}
            className={cn(
              "text-xs",
              hasPassage && "bg-amber-500 hover:bg-amber-600 text-white"
            )}
          >
            <BookOpen className="h-3 w-3 mr-1" />
            {hasPassage ? "📖 Passage Enabled" : "Add Comprehension Passage"}
          </Button>
          {hasPassage && (
            <span className="text-[10px] text-amber-600 hidden sm:inline">
              Passage will appear above questions during exam
            </span>
          )}
        </div>

        {/* ── Passage Text Area ── */}
        {hasPassage && (
          <div className="space-y-1.5 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <Label className="text-[10px] font-semibold text-amber-700 uppercase flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Comprehension Passage
            </Label>
            <Textarea
              value={passageText}
              onChange={(e) => onPassageTextChange(e.target.value)}
              rows={8}
              className="mt-1 resize-none text-sm sm:text-base leading-relaxed bg-white"
              placeholder={`Paste the reading passage here...

Example:
Kofi was a young boy who lived in a small village near the Volta River. 
He was known for his kindness and bravery. Every morning, he helped 
the elderly fetch water before going to school.

One day, he found an injured eagle and nursed it back to health. 
The eagle became his loyal companion, and the villagers called him 
"The Eagle Boy."

Read the passage above and answer the following questions.`}
            />
            <p className="text-[10px] text-amber-600">
              Students will see this passage during the exam.
            </p>
          </div>
        )}

        {/* ── Mode Switcher ── */}
        <ModeSwitcher
          modes={[
            { id: "bulk", label: "Bulk Import", icon: Sparkles },
            { id: "manual", label: "Manual Add", icon: Plus },
          ]}
          active={mode}
          onChange={(v) => setMode(v as "bulk" | "manual")}
        />

        {/* ── Bulk Import ── */}
        {mode === "bulk" && (
          <BulkImporter
            value={bulkText}
            onChange={onBulkTextChange}
            onFileParse={handleFileParse}
            onParse={handleParse}
            isParsingFile={isParsingFile}
            parseError={parseError}
            placeholder={`1. Question?\nA. Option A\nB. Option B\nC. Option C\nD. Option D\nAnswer: B\nMarks: ${defaultMark}`}
            accentColor="emerald"
            onInsertExample={() => onBulkTextChange(OBJECTIVE_TEMPLATE)}
            onDownloadTemplate={downloadTemplate}
            parseButtonLabel="Parse & Add"
            parseButtonIcon={<CheckCheck className="mr-1.5 h-3.5 w-3.5" />}
            textareaClassName="text-sm sm:text-base leading-relaxed font-mono"
            textareaRows={14}
          />
        )}

        {/* ── Manual Add ── */}
        {mode === "manual" && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
            <div>
              <Label className="text-[10px] font-semibold text-gray-600 uppercase">
                Question
              </Label>
              <Textarea
                value={manualQ.question}
                onChange={(e) =>
                  setManualQ((p) => ({ ...p, question: e.target.value }))
                }
                rows={3}
                className="mt-1 resize-none text-sm sm:text-base leading-relaxed"
                placeholder="Enter question text..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-gray-600 uppercase">
                Options
              </Label>
              {manualQ.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const opts = [...manualQ.options];
                      opts[idx] = e.target.value;
                      setManualQ((p) => ({ ...p, options: opts }));
                    }}
                    className="h-9 text-sm sm:text-base"
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] font-semibold text-gray-600 uppercase">
                  Correct Answer
                </Label>
                <Select
                  value={manualQ.correct_answer}
                  onValueChange={(v) =>
                    setManualQ((p) => ({ ...p, correct_answer: v }))
                  }
                >
                  <SelectTrigger className="mt-1 h-9 text-sm sm:text-base">
                    <SelectValue placeholder="Select answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualQ.options.map(
                      (o, i) =>
                        o.trim() && (
                          <SelectItem
                            key={i}
                            value={o}
                            className="text-sm sm:text-base"
                          >
                            {String.fromCharCode(65 + i)}. {o}
                          </SelectItem>
                        )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-gray-600 uppercase">
                  Marks (Auto)
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={defaultMark}
                  disabled
                  className="mt-1 h-9 text-sm sm:text-base bg-gray-100 text-gray-600"
                />
                <p className="text-[9px] text-gray-400 mt-0.5">
                  Using default mark: {defaultMark}
                </p>
              </div>
            </div>

            <Button
              onClick={handleAddManual}
              className="w-full h-9 text-sm bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Question
            </Button>
          </div>
        )}

        {/* ── Question List ── */}
        {questions.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold text-gray-600 uppercase">
                Questions ({questions.length})
              </Label>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                  {totalMarks.toFixed(1)} marks total
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuestionsChange([])}
                  className="text-red-500 text-[10px] h-6"
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="max-h-[200px] sm:max-h-[280px] lg:max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
              {questions.map((q, i) => (
                <ObjectiveCard
                  key={q.id}
                  question={q}
                  index={i}
                  onDelete={(id) =>
                    onQuestionsChange(questions.filter((x) => x.id !== id))
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: "blue" | "emerald" | "purple" | "amber";
}) {
  const styles = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
  }[color];
  const textSmall = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    purple: "text-purple-600",
    amber: "text-amber-600",
  }[color];

  return (
    <div className={cn("p-2 rounded-lg border text-center", styles)}>
      <p className="text-lg font-bold">{value}</p>
      <p className={cn("text-[10px]", textSmall)}>{label}</p>
    </div>
  );
}

function ModeSwitcher({
  modes,
  active,
  onChange,
}: {
  modes: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
      {modes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all",
            active === id
              ? "bg-white shadow-sm text-gray-800"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}