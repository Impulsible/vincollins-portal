// src/components/staff/exams/create/steps/TheoryQuestionsStep.tsx
// REDESIGNED: Manual-only, per-question marks, Answer-N-of-M scoring with bulletproof table & diagram support

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Plus, Brain, Calculator, ImageIcon, X, Loader2,
  Pencil, Check, Users, Target, Trash2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { clipboardToMarkdown } from "@/lib/table-paste";
import { QuestionContent, hasTable } from "@/components/shared/QuestionContent";
import type { TheoryQuestion } from "../types";

/* ─── helpers ─── */

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const uploadImage = async (file: File): Promise<{ url: string; isFallback: boolean }> => {
  try {
    const ext = file.name.split(".").pop() || "png";
    const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
    const filePath = `exam-images/temp/${Date.now()}-${crypto.randomUUID()}.${cleanExt}`;

    const { error } = await supabase.storage
      .from("exam-assets")
      .upload(filePath, file, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (error) {
      console.warn("Storage upload failed, using Base64 fallback:", error.message);
      const base64 = await fileToBase64(file);
      return { url: base64, isFallback: true };
    }

    const { data } = supabase.storage
      .from("exam-assets")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      const base64 = await fileToBase64(file);
      return { url: base64, isFallback: true };
    }

    return { url: data.publicUrl, isFallback: false };
  } catch (err) {
    console.warn("Storage exception, using Base64 fallback:", err);
    const base64 = await fileToBase64(file);
    return { url: base64, isFallback: true };
  }
};

const EXAM_TOTAL = 60;

/* ─── types ─── */

interface TheoryQuestionsStepProps {
  questions: TheoryQuestion[];
  onQuestionsChange: (q: TheoryQuestion[]) => void;
  hasTheory: boolean;
  onHasTheoryChange: (v: boolean) => void;
  objectiveTotal: number;
  questionsToAnswer: number;
  onQuestionsToAnswerChange: (v: number) => void;
}

/* ─── component ─── */

export function TheoryQuestionsStep({
  questions,
  onQuestionsChange,
  hasTheory,
  onHasTheoryChange,
  objectiveTotal,
  questionsToAnswer,
  onQuestionsToAnswerChange,
}: TheoryQuestionsStepProps) {
  const [manualQ, setManualQ] = useState({
    question: "",
    marks: 10,
    image_url: "",
    image_caption: "",
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMarkVal, setEditMarkVal] = useState("");

  /* ── derived scoring ── */

  const theoryRemaining = useMemo(
    () => Math.max(0, EXAM_TOTAL - objectiveTotal),
    [objectiveTotal]
  );

  const totalQ = questions.length;

  const effectiveN = useMemo(() => {
    if (!questionsToAnswer || questionsToAnswer <= 0) return totalQ;
    return Math.min(questionsToAnswer, totalQ);
  }, [questionsToAnswer, totalQ]);

  const theoryTotal = useMemo(() => {
    if (totalQ === 0) return 0;
    const sorted = [...questions].sort((a, b) => b.marks - a.marks);
    return sorted.slice(0, effectiveN).reduce((s, q) => s + q.marks, 0);
  }, [questions, effectiveN, totalQ]);

  const grandTotal = objectiveTotal + theoryTotal;
  const isBalanced = grandTotal === EXAM_TOTAL;
  const isOver = grandTotal > EXAM_TOTAL;
  const allMarksEqual =
    totalQ > 0 && questions.every((q) => q.marks === questions[0].marks);

  /* ── handlers ── */

  const handleAdd = useCallback(() => {
    if (!manualQ.question.trim()) {
      toast.error("Enter question text");
      return;
    }
    if (manualQ.marks <= 0) {
      toast.error("Marks must be greater than 0");
      return;
    }
    onQuestionsChange([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: manualQ.question.trim(),
        marks: manualQ.marks,
        image_url: manualQ.image_url || undefined,
        image_caption: manualQ.image_caption || undefined,
      },
    ]);

    setManualQ({
      question: "",
      marks: 10,
      image_url: "",
      image_caption: "",
    });
    toast.success("Theory question added");
  }, [manualQ, questions, onQuestionsChange]);

  const handleImageFile = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const { url, isFallback } = await uploadImage(file);
      setManualQ((p) => ({ ...p, image_url: url }));
      if (isFallback) {
        toast.info("Diagram attached locally");
      } else {
        toast.success("Diagram attached successfully");
      }
    } catch {
      toast.error("Failed to attach diagram");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleQuestionPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // 1. Direct Screenshot/Image Paste Detection
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        await handleImageFile(file);
        return;
      }
    }

    // 2. Table Paste Detection
    const md = clipboardToMarkdown(e.clipboardData);
    if (!md) return; // normal text paste

    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: en, value } = el;
    const before = value.slice(0, s);
    const after = value.slice(en);

    const pre = !before
      ? ""
      : before.endsWith("\n\n")
      ? ""
      : before.endsWith("\n")
      ? "\n"
      : "\n\n";
    const post = !after || after.startsWith("\n") ? "" : "\n\n";
    const insert = pre + md + post;

    setManualQ((p) => ({ ...p, question: before + insert + after }));
    const pos = (before + insert).length;
    requestAnimationFrame(() => el.setSelectionRange(pos, pos));
    toast.success("Table automatically parsed & formatted");
  };

  const startEditMark = (q: TheoryQuestion) => {
    setEditingId(q.id);
    setEditMarkVal(q.marks.toString());
  };

  const commitEditMark = (id: string) => {
    const val = parseFloat(editMarkVal);
    if (isNaN(val) || val <= 0) {
      toast.error("Invalid mark");
      setEditingId(null);
      return;
    }
    onQuestionsChange(
      questions.map((q) => (q.id === id ? { ...q, marks: val } : q))
    );
    setEditingId(null);
    toast.success("Mark updated");
  };

  const deleteQuestion = (id: string) => {
    onQuestionsChange(questions.filter((q) => q.id !== id));
  };

  /* ── disabled state ── */

  if (!hasTheory) {
    return (
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full">
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/50 rounded-xl mx-auto flex items-center justify-center">
              <Brain className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-slate-200">
                Theory Disabled
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enable theory to add essay-type questions
              </p>
            </div>
            <Button
              onClick={() => onHasTheoryChange(true)}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 h-9 text-sm text-white"
            >
              <Brain className="mr-1.5 h-3.5 w-3.5" />
              Enable Theory
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── render ── */

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-4">

        {/* SCORING DASHBOARD */}
        <div
          className={cn(
            "rounded-xl border p-4 space-y-3",
            isBalanced
              ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800/50"
              : isOver
              ? "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800/50"
              : "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800/50"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator
                className={cn(
                  "h-4 w-4",
                  isBalanced
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isOver
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isBalanced
                    ? "text-emerald-700 dark:text-emerald-300"
                    : isOver
                    ? "text-red-700 dark:text-red-300"
                    : "text-amber-700 dark:text-amber-300"
                )}
              >
                {isBalanced
                  ? "✅ Balanced — Ready"
                  : isOver
                  ? "⛔ Over Limit"
                  : "⚠️ Needs More Marks"}
              </span>
            </div>
            <Badge
              className={cn(
                "text-xs font-bold border-0",
                isBalanced
                  ? "bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                  : isOver
                  ? "bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200"
                  : "bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
              )}
            >
              {grandTotal} / {EXAM_TOTAL}
            </Badge>
          </div>

          <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
              style={{
                width: `${Math.min((objectiveTotal / EXAM_TOTAL) * 100, 100)}%`,
              }}
            />
            <div
              className={cn(
                "h-full transition-all duration-500",
                isBalanced
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : isOver
                  ? "bg-red-500 dark:bg-red-400"
                  : "bg-amber-500 dark:bg-amber-400"
              )}
              style={{
                width: `${Math.min((theoryTotal / EXAM_TOTAL) * 100, 100)}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 text-center border border-blue-100 dark:border-blue-900/50">
              <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">
                Objective
              </p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {objectiveTotal}
              </p>
              <p className="text-[9px] text-blue-400 dark:text-blue-500">marks</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 text-center border border-purple-100 dark:border-purple-900/50">
              <p className="text-[10px] text-purple-500 dark:text-purple-400 font-medium">
                Theory
              </p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {theoryTotal}
              </p>
              <p className="text-[9px] text-purple-400 dark:text-purple-500">
                {effectiveN} of {totalQ} Qs
              </p>
            </div>
            <div
              className={cn(
                "rounded-lg p-2.5 text-center border",
                isBalanced
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50"
                  : isOver
                  ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50"
              )}
            >
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Remaining
              </p>
              <p
                className={cn(
                  "text-lg font-bold",
                  isBalanced
                    ? "text-emerald-700 dark:text-emerald-300"
                    : isOver
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {EXAM_TOTAL - grandTotal}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">marks</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Students must answer
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={totalQ || 1}
                  value={questionsToAnswer || ""}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 0;
                    onQuestionsToAnswerChange(Math.max(1, v));
                  }}
                  placeholder={totalQ > 0 ? totalQ.toString() : "—"}
                  className="w-16 h-8 text-center font-bold text-sm bg-white dark:bg-slate-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  out of{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {totalQ}
                  </span>{" "}
                  questions
                </span>
              </div>
            </div>

            {totalQ > 0 && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <Target className="h-3 w-3" />
                {allMarksEqual ? (
                  <span>
                    {effectiveN} × {questions[0].marks} ={" "}
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {theoryTotal} marks
                    </span>
                  </span>
                ) : (
                  <span>
                    Top {effectiveN} questions ={" "}
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {theoryTotal} marks
                    </span>{" "}
                    (mixed values)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* warnings */}
        {isOver && (
          <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300 text-xs">
              Total is {grandTotal} marks — exceeds {EXAM_TOTAL} by{" "}
              {grandTotal - EXAM_TOTAL}. Reduce objective questions or theory
              marks.
            </AlertDescription>
          </Alert>
        )}

        {!isOver && !isBalanced && theoryRemaining > 0 && totalQ > 0 && (
          <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
              Need {EXAM_TOTAL - grandTotal} more marks to reach {EXAM_TOTAL}.
              Add more questions or increase marks per question.
            </AlertDescription>
          </Alert>
        )}

        {questionsToAnswer > totalQ && totalQ > 0 && (
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs">
              "Answer {questionsToAnswer}" exceeds available questions (
              {totalQ}). Add {questionsToAnswer - totalQ} more or reduce the
              count.
            </AlertDescription>
          </Alert>
        )}

        {/* ADD QUESTION FORM */}
        <div className="p-4 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Theory Question
            </Label>
            {theoryRemaining > 0 && (
              <Badge className="text-[10px] bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-0">
                Target: {theoryRemaining} marks remaining
              </Badge>
            )}
          </div>

          <Textarea
            value={manualQ.question}
            onChange={(e) =>
              setManualQ((p) => ({ ...p, question: e.target.value }))
            }
            onPaste={handleQuestionPaste}
            rows={5}
            className="resize-y text-sm leading-relaxed min-h-[120px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder={`e.g. 1. Explain the process of photosynthesis and its importance to the ecosystem.\n\na. Define photosynthesis\nb. List three factors affecting the rate\n\nOr paste a table from Word / Excel / Google Sheets or a screenshot directly.`}
          />

          {/* LIVE PREVIEW FOR TABLE AND DIAGRAM */}
          {(hasTable(manualQ.question) || manualQ.image_url) && (
            <div className="rounded-lg border border-dashed border-purple-300 dark:border-purple-800 p-3 bg-white dark:bg-slate-950">
              <p className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 mb-2">
                Formatting & Diagram Preview
              </p>
              <QuestionContent
                text={manualQ.question}
                imageUrl={manualQ.image_url}
                imageCaption={manualQ.image_caption}
                className="text-slate-700 dark:text-slate-300 max-h-64 overflow-y-auto"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 sm:max-w-[180px]">
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase">
                Marks for this question
              </Label>
              <div className="flex items-center gap-1.5 mt-1">
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={manualQ.marks}
                  onChange={(e) =>
                    setManualQ((p) => ({
                      ...p,
                      marks: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-center font-bold text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-purple-700 dark:text-purple-300"
                />
                <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  marks
                </span>
              </div>
            </div>

            <div className="flex-1">
              <Label className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase">
                Image / Diagram (Optional)
              </Label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="theory-img"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageFile(f);
                }}
              />
              {manualQ.image_url ? (
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={manualQ.image_url}
                    alt="preview"
                    className="h-9 w-9 rounded border border-slate-200 dark:border-slate-700 object-cover"
                  />
                  <button
                    onClick={() =>
                      setManualQ((p) => ({
                        ...p,
                        image_url: "",
                        image_caption: "",
                      }))
                    }
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Remove Diagram
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="theory-img"
                  className="mt-1 cursor-pointer flex items-center justify-center gap-2 h-9 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-colors"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500" />
                  )}
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    {isUploadingImage ? "Attaching diagram…" : "Upload Diagram or Paste Screenshot"}
                  </span>
                </label>
              )}
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={isOver}
            className={cn(
              "w-full h-10 text-sm font-semibold text-white",
              isOver
                ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500"
            )}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Question ({manualQ.marks} marks)
          </Button>
        </div>

        {/* QUESTION LIST */}
        {totalQ > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wide">
                Theory Questions ({totalQ})
                {questionsToAnswer > 0 && (
                  <span className="ml-1 text-purple-600 dark:text-purple-400 normal-case">
                    — answer {effectiveN}
                  </span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-0">
                  {theoryTotal} marks total
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuestionsChange([])}
                  className="text-red-500 dark:text-red-400 text-[10px] h-6 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="max-h-[320px] sm:max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
              {questions.map((q, i) => {
                const isEditing = editingId === q.id;
                const willBeAnswered = i < effectiveN;

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "group flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors",
                      willBeAnswered
                        ? "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800"
                        : "bg-gray-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/50 opacity-60"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5",
                        willBeAnswered
                          ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300"
                          : "bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-500"
                      )}
                    >
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <QuestionContent
                        text={q.question}
                        imageUrl={q.image_url}
                        imageCaption={q.image_caption}
                        className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-h-48 overflow-auto"
                      />
                      {q.image_url && (
                        <Badge
                          variant="outline"
                          className="text-[9px] mt-1 h-4 border-slate-200 dark:border-slate-700"
                        >
                          <ImageIcon className="h-2.5 w-2.5 mr-0.5" />
                          Diagram
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-0.5">
                          <Input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={editMarkVal}
                            onChange={(e) => setEditMarkVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEditMark(q.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="w-14 h-6 text-center text-xs font-bold bg-white dark:bg-slate-950 border-purple-300 dark:border-purple-700"
                          />
                          <button
                            onClick={() => commitEditMark(q.id)}
                            className="p-0.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditMark(q)}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors group/mark"
                          title="Click to edit marks"
                        >
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                            {q.marks}
                          </span>
                          <Pencil className="h-2.5 w-2.5 text-purple-400 dark:text-purple-500 opacity-0 group-hover/mark:opacity-100 transition-opacity" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {totalQ} questions total • student answers {effectiveN}
              </span>
              <span
                className={cn(
                  "text-xs font-bold",
                  isBalanced
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isOver
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {objectiveTotal} + {theoryTotal} = {grandTotal} / {EXAM_TOTAL}
              </span>
            </div>
          </div>
        )}

        {totalQ === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">
              No theory questions yet. Add your first question above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}