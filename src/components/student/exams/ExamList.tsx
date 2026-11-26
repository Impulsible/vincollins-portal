"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { ExamCard } from "./ExamCard";
import type { Exam, ExamAttempt, ExamStatus, ViewMode } from "@/app/student/exams/types";

interface ExamListProps {
  exams: Exam[];
  examAttempts: Record<string, ExamAttempt>;
  viewMode: ViewMode;
  getSubjectConfig: (
    subject: string,
  ) => ComponentProps<typeof ExamCard>["config"];
  onTakeExam: (examId: string) => void;
  onViewResult: (examId: string) => void;
  showCount?: boolean;
  termName?: string;
  sessionYear?: string;
}

export function ExamList({
  exams,
  examAttempts,
  viewMode,
  getSubjectConfig,
  onTakeExam,
  onViewResult,
  showCount = false,
  termName,
  sessionYear,
}: ExamListProps) {
  if (exams.length === 0) return null;

  return (
    <div className="w-full">
      {showCount && (
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {exams.length}
            </span>{" "}
            exam{exams.length !== 1 ? "s" : ""}
            {termName && sessionYear && (
              <span className="ml-1">
                for {termName} {sessionYear}
              </span>
            )}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {viewMode === "grid" ? "Grid View" : "List View"}
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "pb-12",
            viewMode === "grid"
              ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-3 max-w-4xl mx-auto",
          )}
        >
          {exams.map((exam, i) => {
            // Resilient lookup: handles dictionary by exam.id, attempt.id, or direct attachment
            const attempt =
              (exam as any).attempt ||
              (exam as any).latest_attempt ||
              (examAttempts && !Array.isArray(examAttempts) ? examAttempts[exam.id] : undefined) ||
              (examAttempts && !Array.isArray(examAttempts) ? examAttempts[(exam as any).exam_id] : undefined) ||
              (examAttempts && !Array.isArray(examAttempts)
                ? Object.values(examAttempts).find((a: any) => a?.exam_id === exam.id || a?.id === exam.id || a?.exam_id === (exam as any).exam_id)
                : undefined) ||
              (Array.isArray(examAttempts)
                ? (examAttempts as any[]).find((a: any) => a?.exam_id === exam.id || a?.id === exam.id)
                : undefined);

            const isCompleted = Boolean(
              (exam as any).status === "completed" ||
              (exam as any).status === "graded" ||
              (exam as any).status === "pending_theory" ||
              (attempt && (
                attempt.status === "completed" ||
                attempt.status === "graded" ||
                attempt.status === "pending_theory" ||
                attempt.status === "submitted" ||
                Boolean((attempt as any).is_theory_pending) ||
                (attempt.percentage !== undefined && attempt.percentage !== null) ||
                (attempt.objective_score !== undefined &&
                  attempt.objective_score !== null &&
                  attempt.status !== "in_progress")
              ))
            );

            const status: ExamStatus = isCompleted
              ? "completed"
              : attempt?.status === "in_progress"
              ? "in_progress"
              : (exam as any).status === "upcoming"
              ? "upcoming"
              : "available";

            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ExamCard
                  exam={exam}
                  attempt={attempt}
                  status={status}
                  config={getSubjectConfig(exam.subject)}
                  viewMode={viewMode}
                  onTakeExam={onTakeExam}
                  onViewResult={onViewResult}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}