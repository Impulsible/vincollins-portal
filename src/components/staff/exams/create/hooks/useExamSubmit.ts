// src/components/staff/exams/create/hooks/useExamSubmit.ts - UPDATED WITH MARK CALCULATION

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
  defaultMark: number; // ✅ Added
  markDistribution: MarkDistribution; // ✅ Added
  theoryTotalMarks: number; // ✅ Added
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
        objectiveMax,
        theoryQuestionsTotal,
        theoryQuestionsToAnswer,
        theoryMarksPerQuestion,
        scoringRule,
        teacherProfile,
        submitForApproval,
        passageText,
        defaultMark,
        markDistribution,
        theoryTotalMarks,
      } = options;

      // ── Validation ─────────────────────────────────────────────────────────
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
        toast.error("Add at least one question");
        return false;
      }

      // ✅ Validate total marks = 60
      const totalMarks = markDistribution.examTotal;
      if (totalMarks !== 60) {
        toast.error(`Exam total must be 60 marks. Current total: ${totalMarks}`);
        return false;
      }

      setLoading(true);
      let examId: string | null = null;

      try {
        // ── Auth ───────────────────────────────────────────────────────────
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user?.id) {
          toast.error("Session expired. Please log in again.");
          return false;
        }

        const createdBy = user.id;

        // ── Profile ────────────────────────────────────────────────────────
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, department")
          .eq("id", createdBy)
          .single();

        const teacherName =
          prof?.full_name ??
          teacherProfile?.full_name ??
          "Teacher";

        const department =
          prof?.department ??
          teacherProfile?.department ??
          "General";

        // ── Calculate objective count ──────────────────────────────────────
        const objectiveCount = questions.length;
        const theoryCount = theoryQuestions.length;

        // ✅ Use markDistribution for all mark calculations
        const objectiveTotal = markDistribution.objectiveTotal;
        const theoryTotal = markDistribution.theoryTotal;
        const examTotal = markDistribution.examTotal;
        const marksPerTheoryQuestion = markDistribution.marksPerTheoryQuestion;

        // ── Build exam payload ─────────────────────────────────────────────
        const examPayload = {
          title: examDetails.title.trim(),
          duration: examDetails.duration,
          subject: examDetails.subject,
          class: examDetails.class,
          pass_mark: examDetails.pass_mark,
          instructions: examDetails.instructions?.trim() ?? "",
          shuffle_questions: examDetails.randomize_questions,
          shuffle_options: examDetails.randomize_options,
          has_theory: hasTheory,
          status: submitForApproval ? "pending" : "draft",
          created_by: createdBy,
          teacher_name: teacherName,
          department,
          term: examDetails.term,
          session_year: examDetails.session_year,
          
          // ✅ Mark distribution fields
          default_mark: defaultMark,
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
          
          // Theory configuration
          theory_questions_total: theoryCount,
          theory_questions_to_answer: theoryQuestionsToAnswer || theoryCount,
          theory_marks_per_question: marksPerTheoryQuestion,
          scoring_rule: scoringRule,
          
          total_questions: objectiveCount + theoryCount,
          passage_text: passageText || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // ── Insert exam ────────────────────────────────────────────────────
        const { data: examResult, error: examError } = await supabase
          .from("exams")
          .insert([examPayload])
          .select("id")
          .single();

        if (examError) {
          throw new Error(`Exam creation failed: ${examError.message}`);
        }

        examId = examResult.id;
        let savedCount = 0;

        // ── Insert objective questions ──────────────────────────────────────
        if (questions.length > 0) {
          const objectiveRows = questions.map((q, i) => ({
            exam_id: examId,
            question_text: q.question,
            question_type: "objective",
            type: "mcq",
            options: q.options ?? [],
            correct_answer: q.correct_answer,
            marks: q.marks || defaultMark, // ✅ Use defaultMark
            points: q.marks || defaultMark,
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
            throw new Error(`Question insert failed: ${objError.message}`);
          }

          savedCount += insertedObj?.length ?? 0;
        }

        // ── Insert theory questions ─────────────────────────────────────────
        if (hasTheory && theoryQuestions.length > 0) {
          const theoryRows = theoryQuestions.map((q, i) => ({
            exam_id: examId,
            question_text: q.question,
            question_type: "theory",
            type: "theory",
            marks: q.marks || marksPerTheoryQuestion, // ✅ Use calculated marks
            points: q.marks || marksPerTheoryQuestion,
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
            throw new Error(`Theory insert failed: ${theoryError.message}`);
          }

          savedCount += insertedTheory?.length ?? 0;
        }

        // ── Build JSONB snapshot ────────────────────────────────────────────
        const questionsJsonb = [
          ...questions.map((q, i) => ({
            id: q.id,
            type: "objective",
            question: q.question,
            options: q.options ?? [],
            correct_answer: q.correct_answer,
            marks: q.marks || defaultMark,
            order: i + 1,
          })),
          ...(hasTheory
            ? theoryQuestions.map((q, i) => ({
                id: q.id,
                type: "theory",
                question: q.question,
                marks: q.marks || marksPerTheoryQuestion,
                order: questions.length + i + 1,
                sub_questions: q.sub_questions ?? [],
                image_url: q.image_url ?? null,
                image_caption: q.image_caption ?? null,
              }))
            : []),
        ];

        // ── Update exam snapshot ────────────────────────────────────────────
        const { error: updateError } = await supabase
          .from("exams")
          .update({
            questions: questionsJsonb,
            total_questions: savedCount,
            total_marks: examTotal,
            total_points: examTotal,
            updated_at: new Date().toISOString(),
          })
          .eq("id", examId);

        if (updateError) {
          console.warn("[useExamSubmit] Snapshot update failed:", updateError.message);
        }

        toast.success(
          submitForApproval
            ? `✅ Submitted for approval — ${savedCount} questions`
            : `✅ Draft saved — ${savedCount} questions`
        );

        onSuccess();
        onClose();
        return true;
      } catch (err: unknown) {
        // ── Rollback orphaned exam ───────────────────────────────────────────
        if (examId) {
          try {
            await supabase.from("exams").delete().eq("id", examId);
            console.info("[useExamSubmit] Rolled back exam", examId);
          } catch (rollbackErr) {
            console.error("[useExamSubmit] Rollback failed:", rollbackErr);
          }
        }

        const message =
          err instanceof Error ? err.message : "Failed to create exam";
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