// src/components/staff/exams/create/steps/ObjectiveQuestionsStep.tsx

"use client";

import { useState, useCallback } from "react";
import { Plus, CheckCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BulkImporter } from "../components/BulkImporter";
import { ObjectiveCard } from "../components/QuestionCard";
import { parseDocument } from "../hooks/useQuestionParser";
import { OBJECTIVE_TEMPLATE } from "../constants";
import type { Question, ParseResult } from "../types";

interface ObjectiveQuestionsStepProps {
  questions: Question[];
  onQuestionsChange: (q: Question[]) => void;
  objectiveMax: number;
  defaultMark: number;
  bulkText: string;
  onBulkTextChange: (v: string) => void;
  onParse: (text: string) => ParseResult<Question>;
}

export function ObjectiveQuestionsStep({
  questions,
  onQuestionsChange,
  objectiveMax,
  defaultMark,
  bulkText,
  onBulkTextChange,
  onParse,
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

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  const handleParse = useCallback(() => {
    if (!bulkText.trim()) {
      toast.error("Paste questions first");
      return;
    }
    setParseError(null);
    const result = onParse(bulkText);

    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => toast.warning(w, { duration: 5000 }));
    }
    if (result.items.length === 0) {
      setParseError(
        "No valid questions found. Check the format matches the template."
      );
      return;
    }

    onQuestionsChange([...questions, ...result.items]);
    onBulkTextChange("");
    toast.success(
      `✅ Added ${result.items.length} questions${
        result.skipped > 0 ? ` (${result.skipped} skipped)` : ""
      }`
    );
  }, [bulkText, onParse, questions, onQuestionsChange, onBulkTextChange]);

  const handleFileParse = useCallback(
    async (file: File) => {
      setIsParsingFile(true);
      try {
        const text = await parseDocument(file);
        const result = onParse(text);
        if (result.items.length > 0) {
          onQuestionsChange([...questions, ...result.items]);
          if (result.warnings.length > 0) {
            result.warnings.forEach((w) => toast.warning(w));
          }
          toast.success(`✅ ${result.items.length} questions imported from file`);
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
    [onParse, questions, onQuestionsChange]
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
        marks: manualQ.marks,
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

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-3 sm:space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard value={questions.length} label="Questions" color="blue" />
          <StatCard value={totalMarks.toFixed(1)} label="Marks" color="emerald" />
          <StatCard value={objectiveMax} label="Max" color="purple" />
        </div>

        {/* Mode Switcher */}
        <ModeSwitcher
          modes={[
            { id: "bulk", label: "Bulk Import", icon: Sparkles },
            { id: "manual", label: "Manual Add", icon: Plus },
          ]}
          active={mode}
          onChange={(v) => setMode(v as "bulk" | "manual")}
        />

        {/* Bulk Import */}
        {mode === "bulk" && (
          <BulkImporter
            value={bulkText}
            onChange={onBulkTextChange}
            onFileParse={handleFileParse}
            onParse={handleParse}
            isParsingFile={isParsingFile}
            parseError={parseError}
            placeholder={`1. Question?\nA. Option A\nB. Option B\nC. Option C\nD. Option D\nAnswer: B\nMarks: 0.5`}
            accentColor="emerald"
            onInsertExample={() => onBulkTextChange(OBJECTIVE_TEMPLATE)}
            onDownloadTemplate={downloadTemplate}
            parseButtonLabel="Parse & Add"
            parseButtonIcon={<CheckCheck className="mr-1.5 h-3.5 w-3.5" />}
          />
        )}

        {/* Manual Add */}
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
                className="mt-1 resize-none text-xs"
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
                    className="h-8 text-xs"
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
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Select answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualQ.options.map(
                      (o, i) =>
                        o.trim() && (
                          <SelectItem key={i} value={o}>
                            {String.fromCharCode(65 + i)}. {o}
                          </SelectItem>
                        )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-gray-600 uppercase">
                  Marks
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={manualQ.marks}
                  onChange={(e) =>
                    setManualQ((p) => ({
                      ...p,
                      marks: parseFloat(e.target.value) || defaultMark,
                    }))
                  }
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <Button
              onClick={handleAddManual}
              className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Question
            </Button>
          </div>
        )}

        {/* Question List */}
        {questions.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold text-gray-600 uppercase">
                Questions ({questions.length})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQuestionsChange([])}
                className="text-red-500 text-[10px] h-6"
              >
                Clear All
              </Button>
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
  color: "blue" | "emerald" | "purple";
}) {
  const styles = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
  }[color];
  const textSmall = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    purple: "text-purple-600",
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
  modes: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
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