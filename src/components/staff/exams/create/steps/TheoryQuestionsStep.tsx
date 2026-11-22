// src/components/staff/exams/create/steps/TheoryQuestionsStep.tsx

"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  Plus, Brain, Calculator, ImageIcon, X, Loader2,
  Pencil, Check, Users, Target, Trash2, AlertCircle,
  Maximize2, Minimize2, Eye, Edit3, Columns, Sparkles,
  Table as TableIcon, Bold, Italic, ListOrdered, Copy,
  ArrowUp, ArrowDown, HelpCircle, UploadCloud
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

/* ─── Helpers ─── */

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
const DEFAULT_QUESTION_MARKS = 10;

/* ─── Types ─── */

interface TheoryQuestionsStepProps {
  questions: TheoryQuestion[];
  onQuestionsChange: (q: TheoryQuestion[]) => void;
  hasTheory: boolean;
  onHasTheoryChange: (v: boolean) => void;
  objectiveTotal: number;
  questionsToAnswer: number;
  onQuestionsToAnswerChange: (v: number) => void;
}

type EditorMode = "write" | "split" | "preview";

/* ─── Component ─── */

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
    marks: DEFAULT_QUESTION_MARKS,
    image_url: "",
    image_caption: "",
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("write");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null);
  const [editMarkVal, setEditMarkVal] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Derived Scoring ── */

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
    return sorted.slice(0, effectiveN).reduce((s, q) => s + (Number(q.marks) || 0), 0);
  }, [questions, effectiveN, totalQ]);

  const grandTotal = objectiveTotal + theoryTotal;
  const isBalanced = grandTotal === EXAM_TOTAL;
  const isOver = grandTotal > EXAM_TOTAL;

  /* ── Textarea Formatting Tools ── */

  const applyFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    const selected = val.substring(start, end) || placeholder;

    const updated = val.substring(0, start) + prefix + selected + suffix + val.substring(end);
    setManualQ((p) => ({ ...p, question: updated }));

    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + prefix.length + selected.length + suffix.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const insertSubparts = () => {
    const template = "\n\n(a) \n(b) \n(c) ";
    applyFormatting(template);
  };

  const insertTableTemplate = () => {
    const tableTemplate = "\n\n| Item / Parameter | Specification | Marks |\n| :--- | :--- | :--- |\n| Section 1 | Detail A | 4 |\n| Section 2 | Detail B | 6 |\n\n";
    applyFormatting(tableTemplate);
  };

  /* ── Handlers ── */

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
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

    const pre = !before ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const post = !after || after.startsWith("\n") ? "" : "\n\n";
    const insert = pre + md + post;

    setManualQ((p) => ({ ...p, question: before + insert + after }));
    const pos = (before + insert).length;
    requestAnimationFrame(() => el.setSelectionRange(pos, pos));
    toast.success("Table automatically parsed & formatted");
  };

  const handleAddOrUpdate = useCallback(() => {
    if (!manualQ.question.trim()) {
      toast.error("Enter question text");
      return;
    }
    if (manualQ.marks <= 0) {
      toast.error("Marks must be greater than 0");
      return;
    }

    const currentMark = Number(manualQ.marks) || DEFAULT_QUESTION_MARKS;

    if (editingQuestionId) {
      // Update existing question
      onQuestionsChange(
        questions.map((q) =>
          q.id === editingQuestionId
            ? {
                ...q,
                question: manualQ.question.trim(),
                marks: currentMark,
                image_url: manualQ.image_url || undefined,
                image_caption: manualQ.image_caption || undefined,
              }
            : q
        )
      );
      setEditingQuestionId(null);
      toast.success("Theory question updated");
    } else {
      // Add new question
      onQuestionsChange([
        ...questions,
        {
          id: crypto.randomUUID(),
          question: manualQ.question.trim(),
          marks: currentMark,
          image_url: manualQ.image_url || undefined,
          image_caption: manualQ.image_caption || undefined,
        },
      ]);
      toast.success("Theory question added");
    }

    // FIXED: Keep marks stable at whatever value the user was using, or standard default (10)
    // NEVER dynamically overwrite marks to 30!
    setManualQ({
      question: "",
      marks: currentMark,
      image_url: "",
      image_caption: "",
    });
  }, [manualQ, editingQuestionId, questions, onQuestionsChange]);

  const handleStartEdit = (q: TheoryQuestion) => {
    setEditingQuestionId(q.id);
    setManualQ({
      question: q.question,
      marks: q.marks,
      image_url: q.image_url || "",
      image_caption: q.image_caption || "",
    });
    if (textareaRef.current) {
      textareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      textareaRef.current.focus();
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setManualQ({
      question: "",
      marks: DEFAULT_QUESTION_MARKS,
      image_url: "",
      image_caption: "",
    });
  };

  const handleDuplicate = (q: TheoryQuestion) => {
    onQuestionsChange([
      ...questions,
      {
        ...q,
        id: crypto.randomUUID(),
      },
    ]);
    toast.success("Question duplicated");
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const updated = [...questions];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onQuestionsChange(updated);
  };

  const handleDistributeMarksEvenly = () => {
    if (totalQ === 0 || effectiveN <= 0) return;
    const splitMarks = Number((theoryRemaining / effectiveN).toFixed(1));
    if (splitMarks <= 0) return;

    onQuestionsChange(
      questions.map((q) => ({
        ...q,
        marks: splitMarks,
      }))
    );
    toast.success(`Marks balanced to ${splitMarks} each (${(splitMarks * effectiveN).toFixed(1)} total)`);
  };

  const startEditMark = (q: TheoryQuestion) => {
    setEditingMarkId(q.id);
    setEditMarkVal(q.marks.toString());
  };

  const commitEditMark = (id: string) => {
    const val = parseFloat(editMarkVal);
    if (isNaN(val) || val <= 0) {
      toast.error("Invalid mark");
      setEditingMarkId(null);
      return;
    }
    onQuestionsChange(
      questions.map((q) => (q.id === id ? { ...q, marks: val } : q))
    );
    setEditingMarkId(null);
    toast.success("Mark updated");
  };

  const deleteQuestion = (id: string) => {
    if (editingQuestionId === id) handleCancelEdit();
    onQuestionsChange(questions.filter((q) => q.id !== id));
  };

  /* ── Disabled State ── */

  if (!hasTheory) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
          <div className="text-center py-20 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm space-y-4">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/60 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
              <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Theory Section Disabled
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Activate the theory module to add structured essay questions, markdown tables, diagrams, and flexible Answer-N-of-M student options.
              </p>
            </div>
            <Button
              onClick={() => onHasTheoryChange(true)}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 h-10 px-5 text-sm text-white font-medium shadow-md shadow-purple-500/20"
            >
              <Brain className="mr-2 h-4 w-4" />
              Enable Theory Module
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Active View ── */

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950 transition-colors duration-300">
      <div className="p-3 sm:p-5 lg:p-6 max-w-4xl mx-auto w-full space-y-5">

        {/* SCORING COMMAND CENTER */}
        <div
          className={cn(
            "rounded-2xl border p-4 sm:p-5 space-y-4 shadow-sm transition-all duration-300 backdrop-blur-sm",
            isBalanced
              ? "bg-gradient-to-br from-emerald-50/80 via-emerald-50/30 to-green-50/80 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-green-950/30 border-emerald-200/80 dark:border-emerald-800/40"
              : isOver
              ? "bg-gradient-to-br from-rose-50/80 via-red-50/30 to-rose-50/80 dark:from-rose-950/40 dark:via-slate-900/60 dark:to-red-950/30 border-rose-200/80 dark:border-rose-800/40"
              : "bg-gradient-to-br from-amber-50/80 via-amber-50/30 to-yellow-50/80 dark:from-amber-950/40 dark:via-slate-900/60 dark:to-yellow-950/30 border-amber-200/80 dark:border-amber-800/40"
          )}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "p-1.5 rounded-lg",
                  isBalanced
                    ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                    : isOver
                    ? "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"
                    : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"
                )}
              >
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider block",
                    isBalanced
                      ? "text-emerald-800 dark:text-emerald-300"
                      : isOver
                      ? "text-rose-800 dark:text-rose-300"
                      : "text-amber-800 dark:text-amber-300"
                  )}
                >
                  {isBalanced
                    ? "Exam Marks Fully Balanced"
                    : isOver
                    ? "Scoring Over Maximum Limit"
                    : "Scoring Incomplete"}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Target: {EXAM_TOTAL} Marks Total ({objectiveTotal} Objective + {theoryTotal} Theory)
                </p>
              </div>
            </div>

            <Badge
              className={cn(
                "text-xs sm:text-sm font-bold px-2.5 py-1 border-0 shadow-sm",
                isBalanced
                  ? "bg-emerald-600 text-white dark:bg-emerald-500"
                  : isOver
                  ? "bg-rose-600 text-white dark:bg-rose-500"
                  : "bg-amber-500 text-white dark:bg-amber-600"
              )}
            >
              {grandTotal} / {EXAM_TOTAL} Marks
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
              style={{
                width: `${Math.min((objectiveTotal / EXAM_TOTAL) * 100, 100)}%`,
              }}
              title={`Objective: ${objectiveTotal} marks`}
            />
            <div
              className={cn(
                "h-full transition-all duration-500",
                isBalanced
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : isOver
                  ? "bg-rose-500 dark:bg-rose-400"
                  : "bg-amber-500 dark:bg-amber-400"
              )}
              style={{
                width: `${Math.min((theoryTotal / EXAM_TOTAL) * 100, 100)}%`,
              }}
              title={`Theory: ${theoryTotal} marks`}
            />
          </div>

          {/* Metric Tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2.5 sm:p-3 text-center border border-blue-100 dark:border-blue-900/40 shadow-2xs">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                Objective Portion
              </p>
              <p className="text-base sm:text-xl font-black text-blue-700 dark:text-blue-300 mt-0.5">
                {objectiveTotal}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">marks allocated</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-2.5 sm:p-3 text-center border border-purple-100 dark:border-purple-900/40 shadow-2xs">
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">
                Theory Portion
              </p>
              <p className="text-base sm:text-xl font-black text-purple-700 dark:text-purple-300 mt-0.5">
                {theoryTotal}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {effectiveN} of {totalQ} Qs
              </p>
            </div>

            <div
              className={cn(
                "rounded-xl p-2.5 sm:p-3 text-center border shadow-2xs transition-colors",
                isBalanced
                  ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40"
                  : isOver
                  ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40"
                  : "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40"
              )}
            >
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Unallocated
              </p>
              <p
                className={cn(
                  "text-base sm:text-xl font-black mt-0.5",
                  isBalanced
                    ? "text-emerald-700 dark:text-emerald-300"
                    : isOver
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {EXAM_TOTAL - grandTotal}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">marks to target</p>
            </div>
          </div>

          {/* Answer-N-of-M Configuration Bar */}
          <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Student Requirement Rule
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Candidates choose and answer any <span className="font-semibold text-purple-600 dark:text-purple-400">{effectiveN}</span> out of {totalQ} questions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Answer</span>
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
                  className="w-14 h-7 text-center font-bold text-xs bg-white dark:bg-slate-900 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 p-0"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">of {totalQ}</span>
              </div>

              {totalQ > 0 && !isBalanced && !isOver && theoryRemaining > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDistributeMarksEvenly}
                  className="h-8 text-[11px] font-semibold text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                  title="Evenly distribute remaining theory marks among required questions"
                >
                  <Sparkles className="h-3 w-3 mr-1 text-purple-500" />
                  Auto-Balance
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {isOver && (
          <Alert className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50">
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <AlertDescription className="text-rose-700 dark:text-rose-300 text-xs">
              Total is {grandTotal} marks — exceeds {EXAM_TOTAL} by {grandTotal - EXAM_TOTAL}. Reduce objective items or question marks to balance.
            </AlertDescription>
          </Alert>
        )}

        {!isOver && !isBalanced && theoryRemaining > 0 && totalQ > 0 && (
          <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
              Need {EXAM_TOTAL - grandTotal} more marks to reach {EXAM_TOTAL}. Add more questions or click <strong>Auto-Balance</strong> above.
            </AlertDescription>
          </Alert>
        )}

        {/* EXPANDABLE QUESTION CREATOR / EDITOR BOX */}
        <div
          className={cn(
            "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300",
            isFullscreen
              ? "fixed inset-3 sm:inset-6 z-50 flex flex-col p-4 sm:p-6 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl"
              : "p-4 sm:p-5 space-y-4"
          )}
        >
          {/* Header Row with Toolbar Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                {editingQuestionId ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  {editingQuestionId ? "Edit Theory Question" : "Compose Theory Question"}
                </Label>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Markdown tables, sub-questions (a, b, c), and diagram attachments supported
                </p>
              </div>
            </div>

            {/* View Mode & Fullscreen Controls */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditorMode("write")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all",
                    editorMode === "write"
                      ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("split")}
                  className={cn(
                    "hidden sm:block px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all",
                    editorMode === "split"
                      ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Split View
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("preview")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all",
                    editorMode === "preview"
                      ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Preview
                </button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen((p) => !p)}
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Quick Markdown Formatting Toolbar */}
          {editorMode !== "preview" && (
            <div className="flex flex-wrap items-center gap-1.5 py-1 px-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => applyFormatting("**", "**", "bold text")}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded hover:text-purple-600 transition-colors"
                title="Bold (**text**)"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting("*", "*", "italic text")}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded hover:text-purple-600 transition-colors"
                title="Italic (*text*)"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <div className="h-3.5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                type="button"
                onClick={insertSubparts}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium hover:bg-white dark:hover:bg-slate-800 rounded hover:text-purple-600 transition-colors"
                title="Insert subparts: (a), (b), (c)"
              >
                <ListOrdered className="h-3.5 w-3.5" />
                <span>(a)(b)(c) Subparts</span>
              </button>
              <button
                type="button"
                onClick={insertTableTemplate}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium hover:bg-white dark:hover:bg-slate-800 rounded hover:text-purple-600 transition-colors"
                title="Insert Markdown Table Structure"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table Template</span>
              </button>
            </div>
          )}

          {/* Text Area & Split-Screen View */}
          <div className={cn("grid gap-3", editorMode === "split" ? "grid-cols-1 sm:grid-cols-2 flex-1 min-h-0" : "flex-1 min-h-0")}>
            {/* Editor Side */}
            {editorMode !== "preview" && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) await handleImageFile(f);
                }}
                className={cn(
                  "relative rounded-xl border transition-all flex flex-col",
                  isDraggingFile
                    ? "border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 ring-2 ring-purple-400"
                    : "border-slate-200 dark:border-slate-800"
                )}
              >
                <Textarea
                  ref={textareaRef}
                  value={manualQ.question}
                  onChange={(e) =>
                    setManualQ((p) => ({ ...p, question: e.target.value }))
                  }
                  onPaste={handleQuestionPaste}
                  rows={isFullscreen ? 12 : 7}
                  className={cn(
                    "w-full resize-y text-xs sm:text-sm font-normal leading-relaxed bg-transparent border-0 focus-visible:ring-0 p-3 sm:p-4 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
                    isFullscreen ? "flex-1 min-h-[220px]" : "min-h-[160px]"
                  )}
                  placeholder={`e.g. 1. (a) With the aid of a well-labeled diagram, describe the carbon cycle.\n(b) State three economic benefits of legumes in crop rotation.\n\nTip: Paste Excel/Word tables or screenshots directly into this box.`}
                />

                {isDraggingFile && (
                  <div className="absolute inset-0 bg-purple-600/10 dark:bg-purple-900/30 backdrop-blur-2xs flex flex-col items-center justify-center rounded-xl pointer-events-none">
                    <UploadCloud className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-bounce" />
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mt-1">
                      Drop Diagram to Attach
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Live Preview Side */}
            {(editorMode === "preview" || editorMode === "split") && (
              <div
                className={cn(
                  "rounded-xl border border-dashed border-purple-200 dark:border-purple-800/60 p-4 bg-slate-50/50 dark:bg-slate-950/50 overflow-y-auto",
                  isFullscreen ? "flex-1" : "max-h-[300px]"
                )}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-100 dark:border-purple-900/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Live Formatting Preview
                  </span>
                  <Badge variant="outline" className="text-[9px] h-4 border-purple-200 dark:border-purple-800">
                    {manualQ.marks} Marks
                  </Badge>
                </div>

                {manualQ.question.trim() ? (
                  <QuestionContent
                    text={manualQ.question}
                    imageUrl={manualQ.image_url}
                    imageCaption={manualQ.image_caption}
                    className="text-slate-700 dark:text-slate-200"
                  />
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6 text-center">
                    Type question text on the left to see the rendered student preview here.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bottom Controls: Marks Allocation & Diagram Asset Section */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            {/* Marks Input */}
            <div className="sm:col-span-3">
              <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Question Marks
              </Label>
              <div className="flex items-center gap-2 mt-1">
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
                  className="h-10 text-center font-bold text-sm bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-purple-700 dark:text-purple-300"
                />
                <span className="text-xs font-medium text-slate-400">marks</span>
              </div>
            </div>

            {/* Diagram Attachment Staging */}
            <div className="sm:col-span-9">
              <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Attached Diagram / Figure (Optional)
              </Label>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="theory-diagram-input"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageFile(f);
                }}
              />

              {manualQ.image_url ? (
                <div className="flex items-center gap-2 mt-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <img
                    src={manualQ.image_url}
                    alt="Diagram preview"
                    className="h-8 w-8 rounded object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <Input
                    type="text"
                    placeholder="Caption (e.g. Figure 1: Structure of the heart)"
                    value={manualQ.image_caption}
                    onChange={(e) =>
                      setManualQ((p) => ({ ...p, image_caption: e.target.value }))
                    }
                    className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setManualQ((p) => ({
                        ...p,
                        image_url: "",
                        image_caption: "",
                      }))
                    }
                    className="h-7 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="theory-diagram-input"
                  className="mt-1 cursor-pointer flex items-center justify-center gap-2 h-10 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all text-slate-500 dark:text-slate-400"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-purple-500" />
                  )}
                  <span className="text-xs font-medium">
                    {isUploadingImage ? "Uploading diagram..." : "Upload Diagram or Paste Screenshot (Ctrl+V)"}
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {editingQuestionId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="h-10 text-xs font-semibold"
              >
                Cancel Edit
              </Button>
            )}

            <Button
              type="button"
              onClick={handleAddOrUpdate}
              disabled={isOver && !editingQuestionId}
              className={cn(
                "h-10 px-5 text-sm font-semibold text-white shadow-md transition-all",
                isOver && !editingQuestionId
                  ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 shadow-purple-500/20"
              )}
            >
              {editingQuestionId ? (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Update Question ({manualQ.marks} marks)
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add Question ({manualQ.marks} marks)
                </>
              )}
            </Button>
          </div>
        </div>

        {/* QUESTION REPOSITORY LIST */}
        {totalQ > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <span>Theory Questions ({totalQ})</span>
                {questionsToAnswer > 0 && (
                  <Badge variant="outline" className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                    Candidates Answer {effectiveN}
                  </Badge>
                )}
              </Label>

              <div className="flex items-center gap-2">
                <Badge className="text-xs bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-0">
                  {theoryTotal} Marks Total
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onQuestionsChange([])}
                  className="text-rose-500 hover:text-rose-600 text-xs h-7 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {questions.map((q, i) => {
                const isEditingMark = editingMarkId === q.id;
                const willBeAnswered = i < effectiveN;
                const isCurrentlyComposing = editingQuestionId === q.id;

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "group relative flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200",
                      isCurrentlyComposing
                        ? "bg-purple-50/40 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700 ring-1 ring-purple-400"
                        : willBeAnswered
                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-70"
                    )}
                  >
                    {/* Position Number */}
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-2xs",
                        willBeAnswered
                          ? "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                      )}
                    >
                      {i + 1}
                    </div>

                    {/* Question Content Display */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <QuestionContent
                        text={q.question}
                        imageUrl={q.image_url}
                        imageCaption={q.image_caption}
                        className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 max-h-48 overflow-y-auto"
                      />

                      {q.image_url && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <Badge variant="outline" className="text-[10px] h-5 border-slate-200 dark:border-slate-700 text-slate-500">
                            <ImageIcon className="h-3 w-3 mr-1 text-purple-500" />
                            {q.image_caption || "Diagram Attached"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Action Controls & Marks Editor */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Inline Marks Editor */}
                      {isEditingMark ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={editMarkVal}
                            onChange={(e) => setEditMarkVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEditMark(q.id);
                              if (e.key === "Escape") setEditingMarkId(null);
                            }}
                            autoFocus
                            className="w-16 h-7 text-center text-xs font-bold bg-white dark:bg-slate-950 border-purple-300 dark:border-purple-700 p-0"
                          />
                          <button
                            type="button"
                            onClick={() => commitEditMark(q.id)}
                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditMark(q)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors group/mark"
                          title="Click to quickly modify marks"
                        >
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                            {q.marks} mks
                          </span>
                          <Pencil className="h-2.5 w-2.5 text-purple-400 opacity-0 group-hover/mark:opacity-100 transition-opacity" />
                        </button>
                      )}

                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        onClick={() => handleMove(i, "up")}
                        disabled={i === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded"
                        title="Move question up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(i, "down")}
                        disabled={i === questions.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded"
                        title="Move question down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>

                      {/* Edit Full Prompt */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(q)}
                        className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded"
                        title="Edit question in composer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={() => handleDuplicate(q)}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                        title="Duplicate question"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => deleteQuestion(q.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                        title="Delete question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Footer */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {totalQ} questions total • Student answers top {effectiveN}
              </span>
              <span
                className={cn(
                  "font-bold",
                  isBalanced
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isOver
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {objectiveTotal} Obj + {theoryTotal} Theory = {grandTotal} / {EXAM_TOTAL} Marks
              </span>
            </div>
          </div>
        )}

        {totalQ === 0 && (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">
              No theory questions created yet. Use the composer box above to add your first question.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}