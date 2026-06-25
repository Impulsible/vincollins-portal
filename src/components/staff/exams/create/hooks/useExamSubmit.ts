// src/components/staff/exams/create/hooks/useExamSubmit.ts

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
  teacherProfile: TeacherProfile;
  submitForApproval: boolean;
}

export function useExamSubmit(onSuccess: () => void, onClose: () => void) {
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (options: SubmitOptions) => {
      const {
        examDetails,
        questions,
        theoryQuestions,
        hasTheory,
        objectiveMax,
        theoryMax,
        theoryQuestionsTotal,
        theoryQuestionsToAnswer,
        theoryMarksPerQuestion,
        scoringRule,
        teacherProfile,
        submitForApproval,
      } = options;

      // ── Validation ──────────────────────────────────────────────────────────
      if (!examDetails.title || !examDetails.subject || !examDetails.class) {
        toast.error("Complete exam details first");
        return false;
      }
      if (questions.length === 0 && (!hasTheory || theoryQuestions.length === 0)) {
        toast.error("Add at least one question");
        return false;
      }

      setLoading(true);
      let examId: string | null = null;

      try {
        // ── Get session — trust server, not client ───────────────────────────
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          toast.error("Session expired. Please log in again.");
          return false;
        }

        const createdBy = session.user.id; // Always use verified session ID

        // ── Fetch profile for display info only ──────────────────────────────
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, department")
          .eq("id", createdBy) // Use ID not email
          .single();

        const teacherName =
          prof?.full_name || teacherProfile.full_name || "Teacher";
        const department =
          prof?.department || teacherProfile.department || "General";

        // ── Calculate marks ──────────────────────────────────────────────────
        const theoryTotalMarks =
          hasTheory
            ? scoringRule !== "standard" && theoryQuestionsToAnswer
              ? theoryQuestionsToAnswer * theoryMarksPerQuestion
              : theoryQuestionsTotal * theoryMarksPerQuestion
            : 0;

        const examPayload = {
          title: examDetails.title.trim(),
          duration: examDetails.duration,
          subject: examDetails.subject,
          class: examDetails.class,
          pass_mark: examDetails.pass_mark,
          instructions: examDetails.instructions.trim(),
          randomize_questions: examDetails.randomize_questions,
          randomize_options: examDetails.randomize_options,
          has_theory: hasTheory,
          status: submitForApproval ? "pending" : "draft",
          created_by: createdBy,
          teacher_name: teacherName,
          department,
          term: examDetails.term,
          session_year: examDetails.session_year,
          objective_max: objectiveMax,
          theory_max: hasTheory ? theoryTotalMarks : 0,
          theory_questions_total: theoryQuestionsTotal,
          theory_questions_to_answer: theoryQuestionsToAnswer,
          theory_marks_per_question: theoryMarksPerQuestion,
          scoring_rule: scoringRule,
          total_questions: 0,
          total_marks: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // ── Insert exam ──────────────────────────────────────────────────────
        const { data: examResult, error: examError } = await supabase
          .from("exams")
          .insert([examPayload])
          .select("id")
          .single();

        if (examError) throw new Error(`Exam creation failed: ${examError.message}`);
        examId = examResult.id;

        // ── Insert objective questions ────────────────────────────────────────
        let savedCount = 0;

        if (questions.length > 0) {
          const objectiveRows = questions.map((q, i) => ({
            exam_id: examId,
            question_text: q.question,
            question_type: "mcq",
            type: "objective",
            options: q.options ?? [],
            correct_answer: q.correct_answer,
            points: q.marks,
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

          if (objError) throw new Error(`Question insert failed: ${objError.message}`);
          savedCount += insertedObj?.length ?? 0;
        }

        // ── Insert theory questions ──────────────────────────────────────────
        if (hasTheory && theoryQuestions.length > 0) {
          const theoryRows = theoryQuestions.map((q, i) => ({
            exam_id: examId,
            question_text: q.question,
            question_type: "theory",
            type: "theory",
            points: q.marks,
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

          if (theoryError)
            throw new Error(`Theory insert failed: ${theoryError.message}`);
          savedCount += insertedTheory?.length ?? 0;
        }

        // ── Build JSONB snapshot for fast reads ──────────────────────────────
        const questionsJsonb = [
          ...questions.map((q, i) => ({
            id: q.id,
            type: "objective",
            question: q.question,
            options: q.options ?? [],
            correct_answer: q.correct_answer,
            marks: q.marks,
            order: i + 1,
          })),
          ...(hasTheory
            ? theoryQuestions.map((q, i) => ({
                id: q.id,
                type: "theory",
                question: q.question,
                marks: q.marks,
                order: questions.length + i + 1,
                sub_questions: q.sub_questions ?? [],
                image_url: q.image_url ?? null,
                image_caption: q.image_caption ?? null,
              }))
            : []),
        ];

        const totalMarks =
          questions.reduce((s, q) => s + q.marks, 0) +
          (hasTheory ? theoryQuestions.reduce((s, q) => s + q.marks, 0) : 0);

        const { error: updateError } = await supabase
          .from("exams")
          .update({
            questions: questionsJsonb,
            total_questions: savedCount,
            total_marks: totalMarks,
            total_points: totalMarks,
            updated_at: new Date().toISOString(),
          })
          .eq("id", examId);

        if (updateError) {
          // Non-fatal — exam and questions are saved
          console.warn("Snapshot update failed:", updateError.message);
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
          await supabase.from("exams").delete().eq("id", examId).then(
            () => console.info("Rolled back exam", examId),
            (e) => console.error("Rollback failed", e)
          );
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