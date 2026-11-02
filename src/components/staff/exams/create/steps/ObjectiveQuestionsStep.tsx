// src/components/staff/exams/create/steps/ObjectiveQuestionsStep.tsx
// REDESIGNED: Production-grade objective step aligned with 60-mark scoring

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Plus, CheckCheck, Sparkles, BookOpen, Calculator,
  Target, TrendingUp, AlertCircle, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BulkImporter } from "../components/BulkImporter";
import { ObjectiveCard } from "../components/QuestionCard";
import { parseDocument } from "../hooks/useQuestionParser";
import { OBJECTIVE_TEMPLATE } from "../constants";
import type { Question, ParseResult } from "../types";

/* ─── constants ─── */

const EXAM_TOTAL = 60;
const MARK_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 5] as const;

/* ─── types ─── */

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

/* ─── component ─── */

export function ObjectiveQuestionsStep({
  questions,
  onQuestionsChange,
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
  });

  /* ── derived state ── */

  const objectiveTotal = useMemo(
    () => questions.reduce((s, q) => s + q.marks, 0),
    [questions]
  );

  const theoryTotal = markDistribution?.theoryTotal ?? 0;
  const grandTotal = objectiveTotal + theoryTotal;
  const remaining = Math.max(0, EXAM_TOTAL - grandTotal);
  const isOver = grandTotal > EXAM_TOTAL;
  const isBalanced = grandTotal === EXAM_TOTAL;

  // How many MORE questions could be added at current defaultMark before hitting 60?
  const roomForMoreQuestions = useMemo(() => {
    if (defaultMark <= 0) return 0;
    return Math.floor(remaining / defaultMark);
  }, [remaining, defaultMark]);

  /* ── handlers ── */

  const handleMarkUpdate = useCallback(
    (newMark: number) => {
      if (onDefaultMarkChange) onDefaultMarkChange(newMark);
      onQuestionsChange(questions.map((q) => ({ ...q, marks: newMark })));
    },
    [onDefaultMarkChange, onQuestionsChange, questions]
  );

  const handleParse = useCallback(() => {
    if (!bulkText.trim()) {
      toast.error("Paste questions first");
      return;
    }
    setParseError(null);
    const result = onParse(bulkText);

    const itemsWithMarks = result.items.map((q) => ({
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

    // Pre-check: would this overflow the exam?
    const projected = objectiveTotal + itemsWithMarks.length * defaultMark;
    if (projected + theoryTotal > EXAM_TOTAL) {
      toast.warning(
        `Importing ${itemsWithMarks.length} will push total to ${projected + theoryTotal} (max ${EXAM_TOTAL}). Imported anyway — review marks.`,
        { duration: 6000 }
      );
    }

    onQuestionsChange([...questions, ...itemsWithMarks]);
    onBulkTextChange("");
    toast.success(
      `✅ Added ${itemsWithMarks.length} question${itemsWithMarks.length === 1 ? "" : "s"}${
        result.skipped > 0 ? ` (${result.skipped} skipped)` : ""
      }`
    );
  }, [
    bulkText, onParse, questions, onQuestionsChange, onBulkTextChange,
    defaultMark, objectiveTotal, theoryTotal,
  ]);

  const handleFileParse = useCallback(
    async (file: File) => {
      setIsParsingFile(true);
      try {
        const text = await parseDocument(file);
        const result = onParse(text);
        const itemsWithMarks = result.items.map((q) => ({
          ...q,
          marks: defaultMark,
        }));
        if (itemsWithMarks.length > 0) {
          onQuestionsChange([...questions, ...itemsWithMarks]);
          if (result.warnings.length > 0) {
            result.warnings.forEach((w) => toast.warning(w));
          }
          toast.success(
            `✅ ${itemsWithMarks.length} question${
              itemsWithMarks.length === 1 ? "" : "s"
            } imported from file`
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

  const handleAddManual = useCallback(() => {
    if (!manualQ.question.trim()) {
      toast.error("Question text is required");
      return;
    }
    if (!manualQ.correct_answer) {
      toast.error("Select a correct answer");
      return;
    }
    const filledOptions = manualQ.options.filter((o) => o.trim());
    if (filledOptions.length < 2) {
      toast.error("Add at least 2 options");
      return;
    }

    onQuestionsChange([
      ...questions,
      {
        id: crypto.randomUUID(),
        type: "mcq",
        question: manualQ.question.trim(),
        options: manualQ.options,
        correct_answer: manualQ.correct_answer,
        marks: defaultMark,
      },
    ]);
    setManualQ({
      question: "",
      options: ["", "", "", ""],
      correct_answer: "",
    });
    toast.success("Question added");
  }, [manualQ, questions, onQuestionsChange, defaultMark]);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([OBJECTIVE_TEMPLATE], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "objective_template.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  /* ── render ── */

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-4">

        {/* ════════════════════════════════════════════
            SCORING DASHBOARD
            ════════════════════════════════════════════ */}
        <div
          className={cn(
            "rounded-xl border p-4 space-y-3",
            isBalanced
              ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800/50"
              : isOver
              ? "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800/50"
              : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800/50"
          )}
        >
          {/* title + grand total */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator
                className={cn(
                  "h-4 w-4",
                  isBalanced
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isOver
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isBalanced
                    ? "text-emerald-700 dark:text-emerald-300"
                    : isOver
                    ? "text-red-700 dark:text-red-300"
                    : "text-blue-700 dark:text-blue-300"
                )}
              >
                {isBalanced
                  ? "✅ Balanced"
                  : isOver
                  ? "⛔ Over Limit"
                  : "Objective Section"}
              </span>
            </div>
            <Badge
              className={cn(
                "text-xs font-bold border-0",
                isBalanced
                  ? "bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                  : isOver
                  ? "bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200"
                  : "bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200"
              )}
            >
              {grandTotal} / {EXAM_TOTAL}
            </Badge>
          </div>

          {/* visual bar */}
          <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
              style={{
                width: `${Math.min((objectiveTotal / EXAM_TOTAL) * 100, 100)}%`,
              }}
              title={`Objective: ${objectiveTotal}`}
            />
            <div
              className={cn(
                "h-full transition-all duration-500",
                isBalanced
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : isOver
                  ? "bg-red-500 dark:bg-red-400"
                  : "bg-purple-400 dark:bg-purple-500"
              )}
              style={{
                width: `${Math.min((theoryTotal / EXAM_TOTAL) * 100, 100)}%`,
              }}
              title={`Theory: ${theoryTotal}`}
            />
          </div>

          {/* stat grid */}
          <div className="grid grid-cols-4 gap-2">
            <StatBlock
              value={questions.length}
              label="Questions"
              color="blue"
            />
            <StatBlock
              value={objectiveTotal.toFixed(1)}
              label="Objective"
              color="blue"
              suffix="mk"
            />
            <StatBlock
              value={theoryTotal.toFixed(1)}
              label="Theory"
              color="purple"
              suffix="mk"
              dimmed={theoryTotal === 0}
            />
            <StatBlock
              value={remaining.toFixed(1)}
              label="Remaining"
              color={isBalanced ? "emerald" : isOver ? "red" : "amber"}
              suffix="mk"
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════
            MARK PER QUESTION SELECTOR
            ════════════════════════════════════════════ */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Mark per question
                </Label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Applied to all current and new questions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {MARK_OPTIONS.map((mk) => (
                  <button
                    key={mk}
                    onClick={() => handleMarkUpdate(mk)}
                    className={cn(
                      "min-w-[36px] h-8 px-2 rounded-md text-xs font-bold transition-all",
                      defaultMark === mk
                        ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm scale-105"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    {mk}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                {questions.length} × {defaultMark} ={" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {objectiveTotal} marks
                </span>
              </span>
              {!isOver && !isBalanced && roomForMoreQuestions > 0 && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Zap className="h-3 w-3" />
                  Room for {roomForMoreQuestions} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════
            WARNINGS
            ════════════════════════════════════════════ */}
        {isOver && (
          <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300 text-xs">
              Total ({grandTotal}) exceeds {EXAM_TOTAL} by{" "}
              {grandTotal - EXAM_TOTAL}. Reduce questions, lower marks, or
              adjust theory section.
            </AlertDescription>
          </Alert>
        )}

        {/* ════════════════════════════════════════════
            PASSAGE
            ════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={hasPassage ? "default" : "outline"}
            size="sm"
            onClick={() => onHasPassageChange(!hasPassage)}
            className={cn(
              "text-xs h-8",
              hasPassage
                ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white"
                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <BookOpen className="h-3 w-3 mr-1" />
            {hasPassage ? "📖 Passage Enabled" : "Add Comprehension Passage"}
          </Button>
          {hasPassage && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400">
              Shown above questions during exam
            </span>
          )}
        </div>

        {hasPassage && (
          <div className="space-y-1.5 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50">
            <Label className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Comprehension Passage
            </Label>
            <Textarea
              value={passageText}
              onChange={(e) => onPassageTextChange(e.target.value)}
              rows={8}
              className="mt-1 resize-y text-sm leading-relaxed bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[160px]"
              placeholder="Paste the reading passage here..."
            />
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              {passageText.length} characters •{" "}
              {passageText.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════
            MODE SWITCHER
            ════════════════════════════════════════════ */}
        <ModeSwitcher
          modes={[
            { id: "bulk", label: "Bulk Import", icon: Sparkles },
            { id: "manual", label: "Manual Add", icon: Plus },
          ]}
          active={mode}
          onChange={(v) => setMode(v as "bulk" | "manual")}
        />

        {/* ════════════════════════════════════════════
            BULK IMPORT
            ════════════════════════════════════════════ */}
        {mode === "bulk" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Each parsed question will be set to{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {defaultMark} mark{defaultMark === 1 ? "" : "s"}
                </span>
              </span>
              {!isOver && !isBalanced && roomForMoreQuestions > 0 && (
                <Badge className="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-0">
                  Can add up to {roomForMoreQuestions}
                </Badge>
              )}
            </div>
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
          </div>
        )}

        {/* ════════════════════════════════════════════
            MANUAL ADD
            ════════════════════════════════════════════ */}
        {mode === "manual" && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Question
              </Label>
              <Badge className="text-[10px] bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-0">
                {defaultMark} mark{defaultMark === 1 ? "" : "s"}
              </Badge>
            </div>

            {/* question */}
            <div>
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase">
                Question Text
              </Label>
              <Textarea
                value={manualQ.question}
                onChange={(e) =>
                  setManualQ((p) => ({ ...p, question: e.target.value }))
                }
                rows={3}
                className="mt-1 resize-y text-sm leading-relaxed bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[80px]"
                placeholder="Enter the question..."
              />
            </div>

            {/* options */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase">
                Options <span className="text-slate-400 normal-case">(click letter to mark as correct)</span>
              </Label>
              {manualQ.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isCorrect = opt && manualQ.correct_answer === opt;
                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (opt.trim()) {
                          setManualQ((p) => ({ ...p, correct_answer: opt }));
                        }
                      }}
                      disabled={!opt.trim()}
                      className={cn(
                        "w-7 h-9 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                        isCorrect
                          ? "bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-900"
                          : opt.trim()
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      )}
                      title={isCorrect ? "Correct answer" : "Click to mark correct"}
                    >
                      {letter}
                    </button>
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const opts = [...manualQ.options];
                        const oldVal = opts[idx];
                        opts[idx] = e.target.value;
                        setManualQ((p) => ({
                          ...p,
                          options: opts,
                          // keep correct_answer synced with new text
                          correct_answer:
                            p.correct_answer === oldVal
                              ? e.target.value
                              : p.correct_answer,
                        }));
                      }}
                      className={cn(
                        "h-9 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500",
                        isCorrect && "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
                      )}
                      placeholder={`Option ${letter}`}
                    />
                  </div>
                );
              })}
            </div>

            {/* fallback dropdown for accessibility */}
            <div>
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase">
                Correct Answer
              </Label>
              <Select
                value={manualQ.correct_answer}
                onValueChange={(v) =>
                  setManualQ((p) => ({ ...p, correct_answer: v }))
                }
              >
                <SelectTrigger className="mt-1 h-9 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder="Select correct answer" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {manualQ.options.map(
                    (o, i) =>
                      o.trim() && (
                        <SelectItem key={i} value={o} className="text-sm">
                          {String.fromCharCode(65 + i)}. {o}
                        </SelectItem>
                      )
                  )}
                  {manualQ.options.every((o) => !o.trim()) && (
                    <div className="px-2 py-1.5 text-xs text-slate-400">
                      Fill in options first
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddManual}
              disabled={isOver}
              className={cn(
                "w-full h-10 text-sm font-semibold text-white",
                isOver
                  ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              )}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Question ({defaultMark} mark{defaultMark === 1 ? "" : "s"})
            </Button>
          </div>
        )}

        {/* ════════════════════════════════════════════
            QUESTION LIST
            ════════════════════════════════════════════ */}
        {questions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" />
                Questions ({questions.length})
              </Label>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-[10px] border-0">
                  {objectiveTotal.toFixed(1)} marks
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete all ${questions.length} questions?`)) {
                      onQuestionsChange([]);
                      toast.success("Cleared");
                    }
                  }}
                  className="text-red-500 dark:text-red-400 text-[10px] h-6 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="max-h-[280px] sm:max-h-[380px] overflow-y-auto space-y-1.5 pr-1">
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

            {/* running total footer */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Obj {objectiveTotal} + Theory {theoryTotal} ={" "}
                <span
                  className={cn(
                    "font-bold",
                    isBalanced
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isOver
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {grandTotal} / {EXAM_TOTAL}
                </span>
              </span>
              {isBalanced && (
                <Badge className="text-[9px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-0">
                  ✓ Balanced
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* empty state */}
        {questions.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <CheckCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">
              No objective questions yet. Use bulk import or add one manually above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── sub-components ─── */

function StatBlock({
  value,
  label,
  color,
  suffix,
  dimmed,
}: {
  value: string | number;
  label: string;
  color: "blue" | "emerald" | "purple" | "amber" | "red";
  suffix?: string;
  dimmed?: boolean;
}) {
  const bgText = {
    blue: "text-blue-700 dark:text-blue-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
    purple: "text-purple-700 dark:text-purple-300",
    amber: "text-amber-700 dark:text-amber-300",
    red: "text-red-700 dark:text-red-300",
  }[color];

  const labelText = {
    blue: "text-blue-500 dark:text-blue-400",
    emerald: "text-emerald-500 dark:text-emerald-400",
    purple: "text-purple-500 dark:text-purple-400",
    amber: "text-amber-500 dark:text-amber-400",
    red: "text-red-500 dark:text-red-400",
  }[color];

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-lg p-2 text-center border border-slate-100 dark:border-slate-800",
        dimmed && "opacity-50"
      )}
    >
      <p className={cn("text-base sm:text-lg font-bold leading-tight", bgText)}>
        {value}
        {suffix && (
          <span className="text-[9px] font-medium ml-0.5 opacity-70">
            {suffix}
          </span>
        )}
      </p>
      <p className={cn("text-[9px] font-medium", labelText)}>{label}</p>
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
    <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
      {modes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all",
            active === id
              ? "bg-white dark:bg-slate-700 shadow-sm text-gray-800 dark:text-white"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}