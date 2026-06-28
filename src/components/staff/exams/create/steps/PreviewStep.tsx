// src/components/staff/exams/create/steps/PreviewStep.tsx

"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Clock, Eye, ChevronLeft, ChevronRight, Table, BarChart3, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ExamDetails, Question, TheoryQuestion, TheorySubQuestion } from "../types";

interface PreviewStepProps {
  examDetails: ExamDetails;
  questions: Question[];
  theoryQuestions: TheoryQuestion[];
  hasTheory: boolean;
  objectiveMax: number;
  theoryMax: number;
}

// ── Helper: Detect table in content ─────────────────────────────────────────
const hasTable = (text: string): boolean => {
  if (!text) return false;
  return (
    (text.includes('|') && text.includes('---') && /\|.+\|/.test(text)) ||
    (text.includes('<table') && text.includes('</table>')) ||
    (text.includes('+--') && text.includes('--+'))
  );
};

// ── Helper: Detect chart/graph ──────────────────────────────────────────────
const hasChart = (text: string): boolean => {
  if (!text) return false;
  const keywords = ['chart', 'graph', 'diagram', 'plot', 'bar chart', 'pie chart', 'line graph', 'histogram'];
  return keywords.some(kw => text.toLowerCase().includes(kw));
};

// ── Helper: Detect image ─────────────────────────────────────────────────────
const hasImage = (text: string): boolean => {
  if (!text) return false;
  return text.includes('![') && text.includes('](') || text.includes('<img');
};

// ── Convert markdown table to HTML ──────────────────────────────────────────
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

// ── Render content with table support ───────────────────────────────────────
const renderContent = (text: string, maxLength?: number) => {
  if (!text) return null;

  // ── Markdown tables ──────────────────────────────────────────────────────
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

  // ── HTML tables ──────────────────────────────────────────────────────────
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

  // ── ASCII tables ─────────────────────────────────────────────────────────
  if (text.includes('+--') && text.includes('--+')) {
    return (
      <pre className="mt-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-pre-wrap text-gray-700 dark:text-gray-300">
        {text}
      </pre>
    );
  }

  // ── Regular text ─────────────────────────────────────────────────────────
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

// ── Render Sub-Questions ─────────────────────────────────────────────────────
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
                {level === 0 ? String.fromCharCode(startCharCode + idx) : String.fromCharCode(startCharCode + idx)}.
              </span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">
                {renderContent(sq.text || '', 100)}
              </span>
              {(sq as any).points && (
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({(sq as any).points} marks)</span>
              )}
              {hasTableContent && (
                <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                  <Table className="h-2.5 w-2.5 mr-0.5" />
                  Table
                </Badge>
              )}
              {hasChartContent && (
                <Badge variant="outline" className="ml-1 text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  <BarChart3 className="h-2.5 w-2.5 mr-0.5" />
                  Chart
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
}: PreviewStepProps) {
  const totalMarks = objectiveMax + theoryMax;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-4">

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border p-3 sm:p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-gray-900 truncate">
                {examDetails.title || "Untitled Exam"}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {examDetails.subject} • {examDetails.class}
              </p>
            </div>
            <Badge
              className={cn(
                "text-[10px] flex-shrink-0",
                examDetails.title && examDetails.subject
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {examDetails.title && examDetails.subject ? "✅ Ready" : "⚠️ Incomplete"}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Duration", value: `${examDetails.duration}m` },
              { label: "Pass Mark", value: `${examDetails.pass_mark}%` },
              {
                label: "Term",
                value:
                  examDetails.term.charAt(0).toUpperCase() +
                  examDetails.term.slice(1),
              },
              { label: "Session", value: examDetails.session_year },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-2 bg-white rounded-lg border">
                <p className="text-xs font-bold text-gray-800">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <p className="text-lg font-bold text-blue-700">{questions.length}</p>
              <p className="text-[10px] text-blue-600">Objective</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 text-center">
              <p className="text-lg font-bold text-purple-700">
                {theoryQuestions.length}
              </p>
              <p className="text-[10px] text-purple-600">Theory</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
              <p className="text-lg font-bold text-emerald-700">{totalMarks}</p>
              <p className="text-[10px] text-emerald-600">Total Marks</p>
            </div>
          </div>
        </div>

        {/* CBT Preview */}
        <div>
          <p className="text-[10px] font-semibold text-gray-600 uppercase mb-2">
            Student View Preview
          </p>
          <CBTPreview
            examDetails={examDetails}
            questions={questions}
            theoryQuestions={theoryQuestions}
            hasTheory={hasTheory}
          />
        </div>
      </div>
    </div>
  );
}

// ── CBT Preview ───────────────────────────────────────────────────────────────
type PreviewQuestion =
  | (Question & { _type: "objective" })
  | (TheoryQuestion & { _type: "theory" });

function CBTPreview({
  examDetails,
  questions,
  theoryQuestions,
  hasTheory,
}: {
  examDetails: ExamDetails;
  questions: Question[];
  theoryQuestions: TheoryQuestion[];
  hasTheory: boolean;
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

  // Timer — stop at zero, pause when hidden
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
      if (document.hidden) {
        clearInterval(timerRef.current!);
      } else if (timeLeft > 0) {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60)
      .toString()
      .padStart(2, "0")}`;

  const current = allQuestions[currentIndex];
  const total = allQuestions.length;

  if (total === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground rounded-xl border bg-gray-50">
        <Eye className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No questions to preview</p>
      </div>
    );
  }

  // Check if current question has table content
  const hasTableContent = hasTable(current?.question || '');
  const hasChartContent = hasChart(current?.question || '');
  const hasImageContent = hasImage(current?.question || '');
  const hasSubTable = current?._type === "theory" && 
    current.sub_questions?.some(sq => hasTable(sq.text || ''));

  return (
    <div className="rounded-xl overflow-hidden border shadow-md bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex justify-between items-center mb-2">
          <div className="min-w-0 flex-1 mr-3">
            <h3 className="font-bold text-xs sm:text-sm truncate">
              {examDetails.title || "Untitled"}
            </h3>
            <p className="text-blue-200 text-[10px] truncate">
              {examDetails.subject} • {examDetails.class}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full flex-shrink-0">
            <Clock className="h-3 w-3" />
            <span className="font-mono text-xs font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <Progress
          value={((currentIndex + 1) / total) * 100}
          className="h-1 bg-blue-800/50"
        />
      </div>

      {/* Question Nav */}
      <div className="bg-white border-b px-2 py-1.5 overflow-x-auto">
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
                    ? "bg-blue-600 text-white"
                    : answers[q.id]
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-600 border"
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

      {/* Question Body */}
      {current && (
        <div className="p-3 sm:p-4">
          <div className="bg-white rounded-lg border p-3 mb-3 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold text-blue-600">
                Question {currentIndex + 1}{" "}
                <span className="text-gray-400 font-normal">
                  ({current._type === "objective" ? "Objective" : "Theory"})
                </span>
              </p>
              <div className="flex gap-1">
                {hasTableContent && (
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">
                    <Table className="h-2.5 w-2.5 mr-0.5" />
                    Table
                  </Badge>
                )}
                {hasChartContent && (
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                    <BarChart3 className="h-2.5 w-2.5 mr-0.5" />
                    Chart
                  </Badge>
                )}
                {hasImageContent && (
                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-600 border-green-200">
                    <ImageIcon className="h-2.5 w-2.5 mr-0.5" />
                    Image
                  </Badge>
                )}
              </div>
            </div>
            <div className="whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
              {renderContent(current.question)}
            </div>
          </div>

          {/* Objective Options */}
          {current._type === "objective" &&
            current.options?.map((opt, idx) => (
              <label
                key={idx}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer mb-1.5 transition-colors",
                  answers[current.id] === opt
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 bg-white hover:border-gray-300"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                    answers[current.id] === opt
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300 text-gray-500"
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <input
                  type="radio"
                  className="hidden"
                  checked={answers[current.id] === opt}
                  onChange={() =>
                    setAnswers((prev) => ({ ...prev, [current.id]: opt }))
                  }
                />
                <span className="text-xs">{opt}</span>
              </label>
            ))}

          {/* Theory Answer Box */}
          {current._type === "theory" && (
            <div className="space-y-2">
              {current.image_url && (
                <img
                  src={current.image_url}
                  alt={current.image_caption || "Diagram"}
                  className="max-h-32 rounded border object-contain"
                />
              )}
              {current.sub_questions && current.sub_questions.length > 0 && (
                <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
                  {renderSubQuestions(current.sub_questions)}
                </div>
              )}
              <Textarea
                placeholder="Type your answer here..."
                rows={4}
                className="resize-none text-xs"
                disabled
              />
            </div>
          )}
        </div>
      )}

      {/* Footer Nav */}
      <div className="bg-white border-t px-3 py-2 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="h-7 text-xs px-2"
        >
          <ChevronLeft className="h-3 w-3 mr-0.5" />
          Prev
        </Button>
        <span className="text-[10px] text-muted-foreground">
          {currentIndex + 1} / {total}
        </span>
        {currentIndex === total - 1 ? (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-2"
          >
            Submit
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex(Math.min(total - 1, currentIndex + 1))}
            className="h-7 text-xs px-2"
          >
            Next
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </div>
    </div>
  );
}