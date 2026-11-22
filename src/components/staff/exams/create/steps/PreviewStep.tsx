// src/components/staff/exams/create/steps/PreviewStep.tsx
// WITH ENHANCED DARK MODE, SUB-HEADER / SECTION PARSER RENDERER & TABLE/DIAGRAM SUPPORT

"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Table,
  Image as ImageIcon,
  BookOpen,
  Calculator,
  Layers,
  Sparkles,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { MARK_CONSTANTS } from "../constants";
import { QuestionContent, hasTable } from "@/components/shared/QuestionContent";
import type {
  ExamDetails,
  Question,
  TheoryQuestion,
  TheorySubQuestion,
  MarkDistribution,
} from "../types";

/* ─── Helpers & Sanitizers ─── */

function cleanOptionText(opt: string): { cleanText: string; leakedHeader?: string } {
  if (!opt || typeof opt !== "string") return { cleanText: "" };

  let text = opt;
  let leakedHeader: string | undefined;

  const delimiterMatch = text.match(/\s*(?:---|___|\*\*\*|===|##+|###+)\s*([\s\S]*?)$/i);
  if (delimiterMatch && delimiterMatch.index !== undefined) {
    const after = text.substring(delimiterMatch.index).replace(/^[#\s\-*_=>]+/, "").trim();
    if (after) leakedHeader = after;
    text = text.substring(0, delimiterMatch.index).trim();
  }

  const keywordMatch = text.match(
    /\s+(?:SECTION\s+[A-Z0-9]|PART\s+[A-Z0-9]|OBJECTIVES?|INSTRUCTIONS?|CHOISISSEZ\b|CHOOSE\b)\s*([\s\S]*?)$/i
  );
  if (keywordMatch && keywordMatch.index !== undefined && keywordMatch.index > 0) {
    const after = text.substring(keywordMatch.index).trim();
    if (after && !leakedHeader) leakedHeader = after;
    text = text.substring(0, keywordMatch.index).trim();
  }

  return { cleanText: text, leakedHeader };
}

interface PreviewStepProps {
  examDetails: ExamDetails;
  questions: Question[];
  theoryQuestions: TheoryQuestion[];
  hasTheory: boolean;
  objectiveMax: number;
  theoryMax: number;
  passageText?: string;
  defaultMark?: number;
  markDistribution?: MarkDistribution;
  theoryTotalMarks?: number;
}

const renderSubQuestions = (subQuestions: TheorySubQuestion[], level: number = 0) => {
  if (!subQuestions || subQuestions.length === 0) return null;

  const startCharCode = level === 0 ? 97 : 105;

  return (
    <div className={`mt-2.5 ${level > 0 ? "ml-6" : "ml-3"} space-y-2`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
        {level === 0 ? "Sub-questions:" : "Parts:"}
      </p>
      {subQuestions.map((sq, idx) => {
        return (
          <div
            key={idx}
            className="pl-3 border-l-2 border-purple-200 dark:border-purple-800 space-y-1"
          >
            <div className="flex items-start gap-1.5 text-xs sm:text-sm">
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {String.fromCharCode(startCharCode + idx)}.
              </span>
              <div className="flex-1 min-w-0">
                <QuestionContent text={sq.text || ""} className="text-xs sm:text-sm" />
              </div>
              {(sq as any).points && (
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  ({(sq as any).points} marks)
                </span>
              )}
            </div>
            {sq.sub_sub_questions && sq.sub_sub_questions.length > 0 && (
              renderSubQuestions(sq.sub_sub_questions, level + 1)
            )}
          </div>
        );
      })}
    </div>
  );
};

export function PreviewStep({
  examDetails,
  questions,
  theoryQuestions,
  hasTheory,
  objectiveMax,
  theoryMax,
  passageText,
  defaultMark,
  markDistribution,
  theoryTotalMarks,
}: PreviewStepProps) {
  const EXAM_TOTAL = MARK_CONSTANTS.EXAM_TOTAL;
  const CA1_MAX = MARK_CONSTANTS.CA1_MAX;
  const CA2_MAX = MARK_CONSTANTS.CA2_MAX;
  const CA_TOTAL = MARK_CONSTANTS.CA_TOTAL;
  const GRAND_TOTAL = MARK_CONSTANTS.GRAND_TOTAL;

  const objectiveCount = questions.length;
  const theoryCount = hasTheory ? theoryQuestions.length : 0;
  const totalObjectivePoints = questions.reduce(
    (acc, q) => acc + (Number(q.marks) || defaultMark || 0.5),
    0
  );
  const totalTheoryPoints = theoryTotalMarks || theoryMax || 0;
  const totalMarks = totalObjectivePoints + totalTheoryPoints;
  const isBalanced = totalMarks === EXAM_TOTAL;
  const isOver = totalMarks > EXAM_TOTAL;

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-4">
        {/* MARK SUMMARY DASHBOARD */}
        <div
          className={cn(
            "rounded-xl border p-3 sm:p-4 space-y-3",
            isBalanced
              ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-900/50"
              : isOver
              ? "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-900/50"
              : "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-900/50"
          )}
        >
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
                "text-xs font-semibold uppercase tracking-wider",
                isBalanced
                  ? "text-emerald-700 dark:text-emerald-300"
                  : isOver
                  ? "text-red-700 dark:text-red-300"
                  : "text-amber-700 dark:text-amber-300"
              )}
            >
              {isBalanced
                ? "✅ Balanced — Ready to Publish"
                : isOver
                ? "⛔ OVER LIMIT"
                : "⚠️ Needs Adjustment"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center border border-blue-100 dark:border-blue-900/50">
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Objective</p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                {totalObjectivePoints.toFixed(1)} marks
              </p>
              <p className="text-[9px] text-blue-500 dark:text-blue-400">
                {objectiveCount} questions
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center border border-purple-100 dark:border-purple-900/50">
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Theory</p>
              <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                {totalTheoryPoints.toFixed(1)} marks
              </p>
              <p className="text-[9px] text-purple-500 dark:text-purple-400">
                {theoryCount} questions
              </p>
            </div>

            <div
              className={cn(
                "bg-white dark:bg-slate-900 rounded-lg p-2 text-center border",
                isBalanced
                  ? "border-emerald-100 dark:border-emerald-900/50"
                  : isOver
                  ? "border-red-100 dark:border-red-900/50"
                  : "border-amber-100 dark:border-amber-900/50"
              )}
            >
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Exam Total</p>
              <p
                className={cn(
                  "text-sm font-bold",
                  isBalanced
                    ? "text-emerald-700 dark:text-emerald-300"
                    : isOver
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {totalMarks.toFixed(1)} / {EXAM_TOTAL}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center border border-amber-100 dark:border-amber-900/50">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pass Mark</p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {examDetails.pass_mark}%
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-[9px] text-slate-500 dark:text-slate-400">CA1</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{CA1_MAX} marks</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-slate-500 dark:text-slate-400">CA2</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{CA2_MAX} marks</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-slate-500 dark:text-slate-400">CA Total</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{CA_TOTAL} marks</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-slate-500 dark:text-slate-400">Grand Total</p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{GRAND_TOTAL} marks</p>
            </div>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                {examDetails.title || "Untitled Exam"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {examDetails.subject} • {examDetails.class}
              </p>
            </div>
            <Badge
              className={cn(
                "text-[10px] flex-shrink-0 border-0",
                examDetails.title && examDetails.subject && isBalanced
                  ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
              )}
            >
              {examDetails.title && examDetails.subject && isBalanced ? "✅ Ready" : "⚠️ Incomplete"}
            </Badge>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-800" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Duration", value: `${examDetails.duration}m` },
              { label: "Pass Mark", value: `${examDetails.pass_mark}%` },
              {
                label: "Term",
                value: examDetails.term.charAt(0).toUpperCase() + examDetails.term.slice(1),
              },
              { label: "Session", value: examDetails.session_year },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{value}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CBT PREVIEW */}
        <div>
          <p className="text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>Student CBT Card Preview</span>
          </p>

          {passageText && (
            <div className="mb-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  📖 Comprehension Passage
                </span>
              </div>
              <div className="text-gray-800 dark:text-slate-200 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">
                {passageText}
              </div>
            </div>
          )}

          <CBTPreview
            examDetails={examDetails}
            questions={questions}
            theoryQuestions={theoryQuestions}
            hasTheory={hasTheory}
            defaultMark={defaultMark}
          />
        </div>
      </div>
    </div>
  );
}

type PreviewQuestion = {
  id: string;
  _type: "objective" | "theory";
  question: string;
  options?: string[];
  correct_answer?: string;
  marks?: number;
  image_url?: string;
  image_caption?: string;
  section_header?: string;
  sub_questions?: TheorySubQuestion[];
};

function CBTPreview({
  examDetails,
  questions,
  theoryQuestions,
  hasTheory,
  defaultMark,
}: {
  examDetails: ExamDetails;
  questions: Question[];
  theoryQuestions: TheoryQuestion[];
  hasTheory: boolean;
  defaultMark?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(examDetails.duration * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize questions and sanitize options
  const allQuestions = useMemo<PreviewQuestion[]>(() => {
    let carryOverHeader = "";

    const objItems: PreviewQuestion[] = questions.map((q) => {
      let qSectionHeader =
        (q as any).section_header || (q as any).section || carryOverHeader || undefined;
      carryOverHeader = "";

      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const cleanOptions: string[] = [];

      for (const opt of rawOptions) {
        const { cleanText, leakedHeader } = cleanOptionText(opt);
        cleanOptions.push(cleanText);
        if (leakedHeader) {
          carryOverHeader = carryOverHeader
            ? `${carryOverHeader} — ${leakedHeader}`
            : leakedHeader;
        }
      }

      return {
        id: q.id,
        _type: "objective",
        question: q.question,
        options: cleanOptions,
        correct_answer: q.correct_answer,
        marks: q.marks,
        image_url: q.image_url,
        image_caption: q.image_caption,
        section_header: qSectionHeader,
      };
    });

    const theoryItems: PreviewQuestion[] = hasTheory
      ? theoryQuestions.map((q) => ({
          id: q.id,
          _type: "theory",
          question: q.question,
          marks: q.marks,
          image_url: q.image_url,
          image_caption: q.image_caption,
          sub_questions: q.sub_questions,
          section_header:
            (q as any).section_header || (q as any).section || carryOverHeader || undefined,
        }))
      : [];

    return [...objItems, ...theoryItems];
  }, [questions, theoryQuestions, hasTheory]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const current = allQuestions[currentIndex];
  const total = allQuestions.length;

  if (total === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/60">
        <Eye className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No questions to preview</p>
      </div>
    );
  }

  const hasTableContent = hasTable(current?.question || "");
  const hasDiagram = !!current?.image_url;
  const sectionHeader = current?.section_header;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 dark:from-purple-800 dark:to-indigo-900 text-white px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex justify-between items-center mb-2">
          <div className="min-w-0 flex-1 mr-3">
            <h3 className="font-bold text-xs sm:text-sm truncate">
              {examDetails.title || "Untitled"}
            </h3>
            <p className="text-purple-200 text-[10px] truncate">
              {examDetails.subject} • {examDetails.class}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full flex-shrink-0 backdrop-blur-sm">
            <Clock className="h-3 w-3" />
            <span className="font-mono text-xs font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <Progress
          value={((currentIndex + 1) / total) * 100}
          className="h-1 bg-purple-900/50"
        />
      </div>

      {/* QUICK QUESTION NAV JUMPER */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-2 py-2 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {allQuestions.map((q, idx) => {
            const hasTableIndicator = hasTable(q.question);
            const hasDiagramIndicator = !!q.image_url;
            const hasSectionIndicator = !!q.section_header;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-7 h-7 rounded-md text-[10px] font-bold transition-all relative flex items-center justify-center",
                  idx === currentIndex
                    ? "bg-purple-600 dark:bg-purple-500 text-white shadow-sm ring-2 ring-purple-300 dark:ring-purple-700"
                    : answers[q.id]
                    ? "bg-emerald-500 dark:bg-emerald-600 text-white"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
                title={`Question ${idx + 1}${
                  q.section_header ? ` - [${q.section_header}]` : ""
                }${hasTableIndicator ? " (Contains Table)" : ""}${
                  hasDiagramIndicator ? " (Contains Diagram)" : ""
                }`}
              >
                {idx + 1}
                {(hasTableIndicator || hasDiagramIndicator || hasSectionIndicator) && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                      hasSectionIndicator ? "bg-amber-500" : "bg-blue-500"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* QUESTION BODY */}
      {current && (
        <div className="p-3 sm:p-5 space-y-4">
          {/* SECTION HEADER / INSTRUCTION BANNER */}
          {sectionHeader && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-50 via-indigo-50/60 to-transparent dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-transparent border-l-4 border-purple-600 dark:border-purple-400 border-y border-r dark:border-purple-900/40 text-purple-900 dark:text-purple-200 shadow-2xs">
              <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  {sectionHeader}
                </span>
              </div>
            </div>
          )}

          <div className="bg-slate-50/70 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <span>Question {currentIndex + 1}</span>
                <span className="text-slate-400 dark:text-slate-500 font-normal">
                  ({current._type === "objective" ? "Objective" : "Theory"})
                </span>
              </p>
              <div className="flex items-center gap-1.5">
                {hasTableContent && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                  >
                    <Table className="h-2.5 w-2.5 mr-0.5" /> Table
                  </Badge>
                )}
                {hasDiagram && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  >
                    <ImageIcon className="h-2.5 w-2.5 mr-0.5" /> Diagram
                  </Badge>
                )}
                <Badge className="text-[10px] bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-0">
                  {current.marks || defaultMark || 0.5}{" "}
                  {current.marks === 1 ? "mark" : "marks"}
                </Badge>
              </div>
            </div>

            {/* UNIFIED QUESTION CONTENT */}
            <QuestionContent
              text={current.question}
              imageUrl={current.image_url}
              imageCaption={current.image_caption}
              className="text-xs sm:text-sm"
            />
          </div>

          {/* OBJECTIVE: DYNAMIC MCQ OPTIONS (A through H) */}
          {current._type === "objective" && current.options && (
            <div
              className={cn(
                "grid gap-2 pt-1",
                current.options.length <= 4
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1"
              )}
            >
              {current.options.map((opt, idx) => {
                const isSelected = answers[current.id] === opt;
                return (
                  <label
                    key={idx}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all",
                      isSelected
                        ? "border-purple-500 dark:border-purple-400 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 font-medium ring-1 ring-purple-500"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors",
                        isSelected
                          ? "bg-purple-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <input
                      type="radio"
                      name={`option_${current.id}`}
                      className="hidden"
                      checked={isSelected}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [current.id]: opt }))
                      }
                    />
                    <span className="text-xs sm:text-sm flex-1">{opt}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* THEORY: SUB-QUESTIONS AND ANSWER AREA */}
          {current._type === "theory" && (
            <div className="space-y-3 pt-1">
              {current.sub_questions && current.sub_questions.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  {renderSubQuestions(current.sub_questions)}
                </div>
              )}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Student Answer Input Area
                </span>
                <Textarea
                  placeholder="Type your essay or detailed answer here during the exam..."
                  rows={5}
                  className="resize-none text-xs sm:text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  disabled
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOTER CONTROLS */}
      <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2.5 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
        </Button>

        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Question {currentIndex + 1} of {total}
        </span>

        {currentIndex === total - 1 ? (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs px-3"
          >
            Submit
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(Math.min(total - 1, currentIndex + 1))}
            className="h-8 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
          >
            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}