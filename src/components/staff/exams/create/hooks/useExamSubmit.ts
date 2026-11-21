"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type {
  ExamDetails,
  Question,
  TheoryQuestion,
  ScoringRule,
  TeacherProfile,
  MarkDistribution,
} from "../types";

interface SubmitOptions {
  examDetails: ExamDetails;
  questions: Question[];
  theoryQuestions: TheoryQuestion[];
  hasTheory: boolean;
  objectiveMax: number;
  theoryMax: number;
  theoryQuestionsTotal: number;
  theoryQuestionsToAnswer: number | null;
  theoryMarksPerQuestion: number;
  scoringRule: ScoringRule;
  teacherProfile: TeacherProfile | null;
  submitForApproval: boolean;
  passageText?: string | null;
  defaultMark: number;
  markDistribution: MarkDistribution;
  theoryTotalMarks: number;
}

// Helper: Ensure value is a valid UUID, otherwise return null
function sanitizeUUID(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed) ? trimmed : null;
}

// Helper: Ensure value is a safe finite integer/number
function sanitizeNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

export function useExamSubmit(onSuccess: () => void, onClose: () => void) {
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (options: SubmitOptions): Promise<boolean> => {
      const {
        examDetails,
        questions,
        theoryQuestions,
        hasTheory,
        theoryQuestionsToAnswer,
        scoringRule,
        teacherProfile,
        submitForApproval,
        passageText,
        defaultMark,
        markDistribution,
      } = options;

      // ── 1. Validation ────────────────────────────────────────────────────────
      if (!examDetails.title?.trim()) {
        toast.error("Exam title is required");
        return false;
      }
      if (!examDetails.subject) {
        toast.error("Subject is required");
        return false;
      }
      if (!examDetails.class) {
        toast.error("Class is required");
        return false;
      }
      if (
        questions.length === 0 &&
        (!hasTheory || theoryQuestions.length === 0)
      ) {
        toast.error("Add at least one question before saving");
        return false;
      }

      // Validate total marks = 60
      const totalMarks = markDistribution.examTotal;
      if (totalMarks !== 60) {
        toast.error(`Exam total must be 60 marks. Current total: ${totalMarks}`);
        return false;
      }

      setLoading(true);
      let examId: string | null = null;

      try {
        // ── 2. Authenticate User ──────────────────────────────────────────────
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user?.id) {
          toast.error("Session expired. Please log in again.");
          return false;
        }

        const createdBy = user.id;

        // ── 3. Fetch Profile Metadata ─────────────────────────────────────────
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, department")
          .eq("id", createdBy)
          .maybeSingle();

        const teacherName =
          prof?.full_name ??
          teacherProfile?.full_name ??
          "Teacher";

        const department =
          prof?.department ??
          teacherProfile?.department ??
          "General";

        // ── 4. Calculate Normalized Metrics ──────────────────────────────────
        const rawDuration = (examDetails as any).duration_minutes ?? examDetails.duration;
        const parsedDurationMinutes = Math.max(1, sanitizeNumber(rawDuration, 60));

        const objectiveCount = questions.length;
        const theoryCount = theoryQuestions.length;
        const objectiveTotal = sanitizeNumber(markDistribution.objectiveTotal, 0);
        const theoryTotal = sanitizeNumber(markDistribution.theoryTotal, 0);
        const examTotal = sanitizeNumber(markDistribution.examTotal, 60);
        const marksPerTheoryQuestion = sanitizeNumber(markDistribution.marksPerTheoryQuestion, 0);
        const requiredTheory =
          theoryQuestionsToAnswer && theoryQuestionsToAnswer > 0
            ? theoryQuestionsToAnswer
            : theoryCount;

        const passMark = sanitizeNumber(examDetails.pass_mark, 0);

        // ── 5. Build Complete Sanitized Payload ───────────────────────────────
        const examPayload: Record<string, any> = {
          title: examDetails.title.trim(),
          duration: parsedDurationMinutes,
          duration_minutes: parsedDurationMinutes,
          subject: examDetails.subject,
          class: examDetails.class,
          class_id: sanitizeUUID((examDetails as any).class_id),
          subject_id: sanitizeUUID((examDetails as any).subject_id),
          pass_mark: passMark,
          passing_percentage: passMark,
          instructions: examDetails.instructions?.trim() || null,
          shuffle_questions: Boolean(examDetails.randomize_questions),
          shuffle_options: Boolean(examDetails.randomize_options),
          has_theory: Boolean(hasTheory),
          status: submitForApproval ? "pending" : "draft",
          is_published: false,
          created_by: createdBy,
          teacher_name: teacherName,
          department: department,
          term: examDetails.term || null,
          session_year: examDetails.session_year || null,
          default_mark: sanitizeNumber(defaultMark, 1),
          objective_count: objectiveCount,
          objective_max: objectiveTotal,
          theory_max: theoryTotal,
          theory_total_marks: theoryTotal,
          objective_total_marks: objectiveTotal,
          exam_total_marks: examTotal,
          ca1_max: 10,
          ca2_max: 10,
          ca_total_marks: 20,
          grand_total_marks: 100,
          total_marks: examTotal,
          total_points: examTotal,
          theory_questions_total: theoryCount,
          theory_questions_to_answer: requiredTheory,
          required_theory_count: requiredTheory,
          theory_marks_per_question: marksPerTheoryQuestion,
          scoring_rule: typeof scoringRule === "object" ? JSON.stringify(scoringRule) : scoringRule,
          excluded_student_ids: [],
          total_questions: objectiveCount + theoryCount,
          passage_text: passageText || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // ── 6. Insert Exam Record with Auto-Fallback on Missing Columns ────────
        let { data: examResult, error: examError } = await supabase
          .from("exams")
          .insert([examPayload])
          .select("id")
          .single();

        // Fallback: If DB rejected due to optional non-existent columns (e.g. ca1_max, scoring_rule, passage_text)
        if (examError && (examError.code === "PGRST204" || examError.code === "42703" || examError.message?.includes("column"))) {
          console.warn("[useExamSubmit] Retrying insert with standard core schema...", examError.message);

          const corePayload = {
            title: examPayload.title,
            duration: examPayload.duration,
            duration_minutes: examPayload.duration_minutes,
            subject: examPayload.subject,
            class: examPayload.class,
            pass_mark: examPayload.pass_mark,
            instructions: examPayload.instructions,
            shuffle_questions: examPayload.shuffle_questions,
            shuffle_options: examPayload.shuffle_options,
            has_theory: examPayload.has_theory,
            status: examPayload.status,
            is_published: false,
            created_by: examPayload.created_by,
            teacher_name: examPayload.teacher_name,
            term: examPayload.term,
            session_year: examPayload.session_year,
            total_questions: examPayload.total_questions,
            total_marks: examPayload.total_marks,
            theory_questions_to_answer: examPayload.theory_questions_to_answer,
            excluded_student_ids: [],
            created_at: examPayload.created_at,
            updated_at: examPayload.updated_at,
          };

          const retry = await supabase
            .from("exams")
            .insert([corePayload])
            .select("id")
            .single();

          examResult = retry.data;
          examError = retry.error;
        }

        if (examError || !examResult?.id) {
          console.error("[useExamSubmit] Exam creation failed:", examError);
          throw new Error(examError?.message || "Failed to create exam record");
        }

        examId = examResult.id;
        let savedCount = 0;

        // ── 7. Insert Objective Questions ────────────────────────────────────
        if (questions.length > 0) {
          const objectiveRows = questions.map((q, i) => ({
            exam_id: examId,
            question_text: q.question,
            question_type: "objective",
            type: "mcq",
            options: q.options ?? [],
            correct_answer: q.correct_answer,
            marks: sanitizeNumber(q.marks, defaultMark),
            points: sanitizeNumber(q.marks, defaultMark),
            order_number: i + 1,
            is_draft: true,
            sub_questions: [],
            keywords: [],
            model_answer: "",
            deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { data: insertedObj, error: objError } = await supabase
            .from("questions")
            .insert(objectiveRows)
            .select("id");

          if (objError) {
            console.error("[useExamSubmit] Question insert failed:", objError);
            throw new Error(`Objective question insert failed: ${objError.message}`);
          }

          savedCount += insertedObj?.length ?? 0;
        }

        // ── 8. Insert Theory Questions ───────────────────────────────────────
        if (hasTheory && theoryQuestions.length > 0) {
          const theoryRows = theoryQuestions.map((q, i) => ({
            exam_id: examId,
            question_text: q.question,
            question_type: "theory",
            type: "theory",
            marks: sanitizeNumber(q.marks, marksPerTheoryQuestion),
            points: sanitizeNumber(q.marks, marksPerTheoryQuestion),
            order_number: questions.length + i + 1,
            is_draft: true,
            sub_questions: q.sub_questions ?? [],
            keywords: [],
            model_answer: "",
            image_url: q.image_url ?? null,
            image_caption: q.image_caption ?? null,
            deleted_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { data: insertedTheory, error: theoryError } = await supabase
            .from("questions")
            .insert(theoryRows)
            .select("id");

          if (theoryError) {
            console.error("[useExamSubmit] Theory insert failed:", theoryError);
            throw new Error(`Theory question insert failed: ${theoryError.message}`);
          }

          savedCount += insertedTheory?.length ?? 0;
        }

        // ── 9. Build and Save JSONB Snapshot to Exam ─────────────────────────
        const questionsJsonb = [
          ...questions.map((q, i) => ({
            id: q.id,
            type: "objective",
            question: q.question,
            options: q.options ?? [],
            correct_answer: q.correct_answer,
            marks: sanitizeNumber(q.marks, defaultMark),
            order: i + 1,
          })),
          ...(hasTheory
            ? theoryQuestions.map((q, i) => ({
                id: q.id,
                type: "theory",
                question: q.question,
                marks: sanitizeNumber(q.marks, marksPerTheoryQuestion),
                order: questions.length + i + 1,
                sub_questions: q.sub_questions ?? [],
                image_url: q.image_url ?? null,
                image_caption: q.image_caption ?? null,
              }))
            : []),
        ];

        const { error: updateError } = await supabase
          .from("exams")
          .update({
            questions: questionsJsonb,
            total_questions: savedCount,
            total_marks: examTotal,
            updated_at: new Date().toISOString(),
          })
          .eq("id", examId);

        if (updateError) {
          console.warn("[useExamSubmit] Questions snapshot update warning:", updateError.message);
        }

        toast.success(
          submitForApproval
            ? `Exam submitted for review (${parsedDurationMinutes} mins, ${savedCount} questions)`
            : `Draft saved (${parsedDurationMinutes} mins, ${savedCount} questions)`
        );

        onSuccess();
        onClose();
        return true;
      } catch (err: unknown) {
        // Rollback orphaned exam if questions failed to insert
        if (examId) {
          try {
            await supabase.from("exams").delete().eq("id", examId);
            console.info("[useExamSubmit] Rolled back exam record", examId);
          } catch (rollbackErr) {
            console.error("[useExamSubmit] Rollback failed:", rollbackErr);
          }
        }

        const message = err instanceof Error ? err.message : "Failed to create exam";
        toast.error(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onClose]
  );

  return { loading, submit };
}