// src/components/staff/exams/create/steps/PreviewStep.tsx

"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Clock, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ExamDetails, Question, TheoryQuestion } from "../types";

interface PreviewStepProps {
  examDetails: ExamDetails;
  questions: Question[];
  theoryQuestions: TheoryQuestion[];
  hasTheory: boolean;
  objectiveMax: number;
  theoryMax: number;
}

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
          {allQuestions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-7 h-7 rounded-md text-[10px] font-semibold transition-colors",
                idx === currentIndex
                  ? "bg-blue-600 text-white"
                  : answers[q.id]
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600 border"
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Body */}
      {current && (
        <div className="p-3 sm:p-4">
          <div className="bg-white rounded-lg border p-3 mb-3 shadow-sm">
            <p className="text-[10px] font-semibold text-blue-600 mb-1">
              Question {currentIndex + 1}{" "}
              <span className="text-gray-400 font-normal">
                ({current._type === "objective" ? "Objective" : "Theory"})
              </span>
            </p>
            <div className="whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
              {current.question}
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
                  {current.sub_questions.map((sq, si) => (
                    <p key={si} className="text-gray-700">
                      <span className="font-semibold text-purple-600">
                        {String.fromCharCode(97 + si)}.
                      </span>{" "}
                      {sq.text}
                    </p>
                  ))}
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