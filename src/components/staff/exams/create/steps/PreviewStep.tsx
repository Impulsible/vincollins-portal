// src/components/staff/exams/create/steps/PreviewStep.tsx - WITH DARK MODE

"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Clock, Eye, ChevronLeft, ChevronRight, Table, BarChart3, Image as ImageIcon, BookOpen, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { MARK_CONSTANTS } from "../constants";
import type { ExamDetails, Question, TheoryQuestion, TheorySubQuestion, MarkDistribution } from "../types";

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

const hasTable = (text: string): boolean => {
  if (!text) return false;
  return (
    (text.includes('|') && text.includes('---') && /\|.+\|/.test(text)) ||
    (text.includes('<table') && text.includes('</table>')) ||
    (text.includes('+--') && text.includes('--+'))
  );
};

const hasChart = (text: string): boolean => {
  if (!text) return false;
  const keywords = ['chart', 'graph', 'diagram', 'plot', 'bar chart', 'pie chart', 'line graph', 'histogram'];
  return keywords.some(kw => text.toLowerCase().includes(kw));
};

const hasImage = (text: string): boolean => {
  if (!text) return false;
  return text.includes('![') && text.includes('](') || text.includes('<img');
};

const convertMarkdownTableToHtml = (text: string): string => {
  if (!text) return '';
  const lines = text.split('\n').filter(line => line.includes('|'));
  if (lines.length < 2) return '';
  
  let html = '<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">';
  let isHeader = true;
  
  for (const line of lines) {
    if (line.includes('---') || line.includes('===')) {
      isHeader = false;
      continue;
    }
    const cells = line.split('|').filter(cell => cell.trim() !== '');
    if (cells.length === 0) continue;
    
    const tag = isHeader ? 'th' : 'td';
    const cellClass = isHeader 
      ? 'px-3 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider bg-gray-50 dark:bg-gray-800'
      : 'px-3 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap';
    
    html += '<tr class="' + (isHeader ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors') + '">';
    cells.forEach((cell) => {
      const trimmed = cell.trim();
      html += `<${tag} class="${cellClass} border border-gray-200 dark:border-gray-700">${trimmed}</${tag}>`;
    });
    html += '</tr>';
    isHeader = false;
  }
  
  html += '</table>';
  return html;
};

const renderContent = (text: string, maxLength?: number) => {
  if (!text) return null;

  if (text.includes('|') && text.includes('---')) {
    const tableHtml = convertMarkdownTableToHtml(text);
    if (tableHtml) {
      return (
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <div 
            className="w-full text-xs md:text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200 dark:[&_th]:border-gray-700 dark:[&_td]:border-gray-700 [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2 [&_th]:bg-gray-50 dark:[&_th]:bg-gray-800 [&_th]:font-semibold [&_th]:text-left [&_td]:text-gray-700 dark:[&_td]:text-gray-300"
            dangerouslySetInnerHTML={{ __html: tableHtml }}
          />
        </div>
      );
    }
  }

  if (text.includes('<table') && text.includes('</table>')) {
    const tableMatch = text.match(/<table[\s\S]*?<\/table>/i);
    if (tableMatch) {
      return (
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <div 
            className="w-full text-xs md:text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200 dark:[&_th]:border-gray-700 dark:[&_td]:border-gray-700 [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2 [&_th]:bg-gray-50 dark:[&_th]:bg-gray-800 [&_th]:font-semibold [&_th]:text-left [&_td]:text-gray-700 dark:[&_td]:text-gray-300"
            dangerouslySetInnerHTML={{ __html: tableMatch[0] }}
          />
        </div>
      );
    }
  }

  if (text.includes('+--') && text.includes('--+')) {
    return (
      <pre className="mt-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-pre-wrap text-gray-700 dark:text-gray-300">
        {text}
      </pre>
    );
  }

  let displayText = text;
  if (maxLength && !text.includes('|') && !text.includes('<table')) {
    displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  const paragraphs = displayText.split('\n').filter(p => p.trim().length > 0);
  
  if (paragraphs.length > 1) {
    return (
      <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
        {paragraphs.map((p, i) => (
          <p key={i} className="leading-relaxed">{p}</p>
        ))}
      </div>
    );
  }

  return <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{displayText}</span>;
};

const renderSubQuestions = (subQuestions: TheorySubQuestion[], level: number = 0) => {
  if (!subQuestions || subQuestions.length === 0) return null;
  
  const startCharCode = level === 0 ? 97 : 105;
  
  return (
    <div className={`mt-2 ${level > 0 ? 'ml-6' : 'ml-4'} space-y-1.5`}>
      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
        {level === 0 ? 'Sub-questions:' : 'Parts:'}
      </p>
      {subQuestions.map((sq, idx) => {
        const hasTableContent = hasTable(sq.text || '');
        const hasChartContent = hasChart(sq.text || '');
        
        return (
          <div key={idx} className="pl-3 border-l-2 border-purple-200 dark:border-purple-800">
            <div className="text-sm">
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {String.fromCharCode(startCharCode + idx)}.
              </span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">
                {renderContent(sq.text || '', 100)}
              </span>
              {(sq as any).points && (
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({(sq as any).points} marks)</span>
              )}
              {hasTableContent && (
                <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                  <Table className="h-2.5 w-2.5 mr-0.5" />Table
                </Badge>
              )}
              {hasChartContent && (
                <Badge variant="outline" className="ml-1 text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  <BarChart3 className="h-2.5 w-2.5 mr-0.5" />Chart
                </Badge>
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
  const totalObjectivePoints = objectiveCount * (defaultMark || 0.5);
  const totalTheoryPoints = theoryTotalMarks || theoryMax || 0;
  const totalMarks = totalObjectivePoints + totalTheoryPoints;
  const isBalanced = totalMarks === EXAM_TOTAL;
  const isOver = totalMarks > EXAM_TOTAL;
  const totalQuestions = objectiveCount + theoryCount;

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-4">

        {/* Mark Summary */}
        <div className={cn(
          "rounded-xl border p-3 sm:p-4 space-y-3",
          isBalanced 
            ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-900/50" 
            : isOver 
            ? "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-900/50" 
            : "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-900/50"
        )}>
          <div className="flex items-center gap-2">
            <Calculator className={cn(
              "h-4 w-4",
              isBalanced 
                ? "text-emerald-600 dark:text-emerald-400" 
                : isOver 
                ? "text-red-600 dark:text-red-400" 
                : "text-amber-600 dark:text-amber-400"
            )} />
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              isBalanced 
                ? "text-emerald-700 dark:text-emerald-300" 
                : isOver 
                ? "text-red-700 dark:text-red-300" 
                : "text-amber-700 dark:text-amber-300"
            )}>
              {isBalanced ? "✅ Balanced" : isOver ? "⛔ OVER LIMIT" : "⚠️ Needs Adjustment"}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center border border-blue-100 dark:border-blue-900/50">
              <p className="text-[10px] text-blue-600 dark:text-blue-400">Objective</p>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{totalObjectivePoints} marks</p>
              <p className="text-[9px] text-blue-500 dark:text-blue-400">{objectiveCount} × {defaultMark || 0.5}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center border border-purple-100 dark:border-purple-900/50">
              <p className="text-[10px] text-purple-600 dark:text-purple-400">Theory</p>
              <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{totalTheoryPoints} marks</p>
              <p className="text-[9px] text-purple-500 dark:text-purple-400">{theoryCount} questions</p>
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
                {totalMarks} / {EXAM_TOTAL}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center border border-amber-100 dark:border-amber-900/50">
              <p className="text-[10px] text-amber-600 dark:text-amber-400">Pass Mark</p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{examDetails.pass_mark}%</p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-[9px] text-slate-500 dark:text-slate-400">CA1</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{CA1_MAX} marks</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-slate-500 dark:text-slate-400">CA2</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{CA2_MAX} marks</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-slate-500 dark:text-slate-400">CA Total</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{CA_TOTAL} marks</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-slate-500 dark:text-slate-400">Grand Total</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{GRAND_TOTAL} marks</p>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3">
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
              { label: "Term", value: examDetails.term.charAt(0).toUpperCase() + examDetails.term.slice(1) },
              { label: "Session", value: examDetails.session_year },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{value}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50 text-center">
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{questions.length}</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400">Objective</p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-100 dark:border-purple-900/50 text-center">
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{theoryQuestions.length}</p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400">Theory</p>
            </div>
            <div className={cn(
              "p-2 rounded-lg border text-center",
              isBalanced 
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50" 
                : isOver 
                ? "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50" 
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50"
            )}>
              <p className={cn(
                "text-lg font-bold",
                isBalanced 
                  ? "text-emerald-700 dark:text-emerald-300" 
                  : isOver 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-amber-700 dark:text-amber-300"
              )}>{totalMarks}</p>
              <p className={cn(
                "text-[10px]",
                isBalanced 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : isOver 
                  ? "text-red-600 dark:text-red-400" 
                  : "text-amber-600 dark:text-amber-400"
              )}>Total Marks</p>
            </div>
          </div>
        </div>

        {/* CBT Preview */}
        <div>
          <p className="text-[10px] font-semibold text-gray-600 dark:text-slate-400 uppercase mb-2">
            Student View Preview
          </p>

          {passageText && (
            <div className="mb-3 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-900/50 rounded-xl p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  📖 Read the passage below and answer the questions
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-gray-800 dark:text-slate-200 leading-relaxed font-serif text-[13px] whitespace-pre-wrap">
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

type PreviewQuestion =
  | (Question & { _type: "objective" })
  | (TheoryQuestion & { _type: "theory" });

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

  const allQuestions = useMemo<PreviewQuestion[]>(
    () => [
      ...questions.map((q) => ({ ...q, _type: "objective" as const })),
      ...(hasTheory
        ? theoryQuestions.map((q) => ({ ...q, _type: "theory" as const }))
        : []),
    ],
    [questions, theoryQuestions, hasTheory]
  );

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

    const handleVisibility = () => {
      if (document.hidden) clearInterval(timerRef.current!);
      else if (timeLeft > 0) {
        timerRef.current = setInterval(() => {
          setTimeLeft((p) => Math.max(0, p - 1));
        }, 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(timerRef.current!);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

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

  const hasTableContent = hasTable(current?.question || '');
  const hasChartContent = hasChart(current?.question || '');
  const hasImageContent = hasImage(current?.question || '');

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-gray-50 dark:bg-slate-900">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 text-white px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex justify-between items-center mb-2">
          <div className="min-w-0 flex-1 mr-3">
            <h3 className="font-bold text-xs sm:text-sm truncate">{examDetails.title || "Untitled"}</h3>
            <p className="text-blue-200 text-[10px] truncate">{examDetails.subject} • {examDetails.class}</p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full flex-shrink-0">
            <Clock className="h-3 w-3" />
            <span className="font-mono text-xs font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <Progress value={((currentIndex + 1) / total) * 100} className="h-1 bg-blue-800/50" />
      </div>

      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-2 py-1.5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {allQuestions.map((q, idx) => {
            const hasTableIndicator = hasTable(q.question) || 
              (q._type === "theory" && q.sub_questions?.some(sq => hasTable(sq.text || '')));
            
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-7 h-7 rounded-md text-[10px] font-semibold transition-colors relative",
                  idx === currentIndex
                    ? "bg-blue-600 dark:bg-blue-500 text-white"
                    : answers[q.id]
                    ? "bg-emerald-500 dark:bg-emerald-600 text-white"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                )}
                title={hasTableIndicator ? "Contains table" : ""}
              >
                {idx + 1}
                {hasTableIndicator && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {current && (
        <div className="p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-3 mb-3 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                Question {currentIndex + 1}{" "}
                <span className="text-gray-400 dark:text-slate-500 font-normal">
                  ({current._type === "objective" ? "Objective" : "Theory"})
                </span>
              </p>
              <div className="flex gap-1">
                {hasTableContent && (
                  <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                    <Table className="h-2.5 w-2.5 mr-0.5" /> Table
                  </Badge>
                )}
                {hasChartContent && (
                  <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                    <BarChart3 className="h-2.5 w-2.5 mr-0.5" /> Chart
                  </Badge>
                )}
                {hasImageContent && (
                  <Badge variant="outline" className="text-[10px] bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                    <ImageIcon className="h-2.5 w-2.5 mr-0.5" /> Image
                  </Badge>
                )}
                {current._type === "objective" && (
                  <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                    {defaultMark || 0.5} mark
                  </Badge>
                )}
              </div>
            </div>
            <div className="whitespace-pre-wrap text-xs leading-relaxed text-gray-800 dark:text-slate-200">
              {renderContent(current.question)}
            </div>
          </div>

          {current._type === "objective" &&
            current.options?.map((opt, idx) => (
              <label
                key={idx}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer mb-1.5 transition-colors",
                  answers[current.id] === opt
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-gray-300 dark:hover:border-slate-700"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                  answers[current.id] === opt
                    ? "border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400 text-white"
                    : "border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400"
                )}>
                  {String.fromCharCode(65 + idx)}
                </div>
                <input 
                  type="radio" 
                  className="hidden" 
                  checked={answers[current.id] === opt}
                  onChange={() => setAnswers((prev) => ({ ...prev, [current.id]: opt }))} 
                />
                <span className="text-xs text-gray-800 dark:text-slate-200">{opt}</span>
              </label>
            ))}

          {current._type === "theory" && (
            <div className="space-y-2">
              {current.image_url && (
                <img src={current.image_url} alt={current.image_caption || "Diagram"} className="max-h-32 rounded border border-slate-200 dark:border-slate-700 object-contain" />
              )}
              {current.sub_questions && current.sub_questions.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-900/60 rounded p-2 text-xs space-y-1">
                  {renderSubQuestions(current.sub_questions)}
                </div>
              )}
              <Textarea 
                placeholder="Type your answer here..." 
                rows={4} 
                className="resize-none text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                disabled 
              />
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0} 
          className="h-7 text-xs px-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-3 w-3 mr-0.5" /> Prev
        </Button>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">{currentIndex + 1} / {total}</span>
        {currentIndex === total - 1 ? (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white h-7 text-xs px-2">Submit</Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentIndex(Math.min(total - 1, currentIndex + 1))}
            className="h-7 text-xs px-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Next <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </div>
    </div>
  );
}