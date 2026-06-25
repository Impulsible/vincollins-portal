// src/components/staff/exams/create/components/QuestionCard.tsx

"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Question, TheoryQuestion } from "../types";

// ── Objective ─────────────────────────────────────────────────────────────────
interface ObjectiveCardProps {
  question: Question;
  index: number;
  onDelete: (id: string) => void;
}

export function ObjectiveCard({ question, index, onDelete }: ObjectiveCardProps) {
  return (
    <div className="flex items-start gap-2 p-2 bg-white rounded-lg border hover:border-gray-300 group">
      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-[10px] font-bold text-blue-700 flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">
          {question.question}
        </p>
        <Badge variant="outline" className="text-[10px] h-4 mt-0.5">
          {question.marks}mk
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(question.id)}
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 flex-shrink-0"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ── Theory ────────────────────────────────────────────────────────────────────
interface TheoryCardProps {
  question: TheoryQuestion;
  index: number;
  onDelete: (id: string) => void;
}

export function TheoryCard({ question, index, onDelete }: TheoryCardProps) {
  return (
    <div className="flex items-start gap-2 p-2 bg-white rounded-lg border hover:border-gray-300 group">
      <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-[10px] font-bold text-purple-700 flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">
          {question.question.substring(0, 80)}
          {question.question.length > 80 ? "..." : ""}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="outline" className="text-[10px] h-4">
            {question.marks}mk
          </Badge>
          {question.sub_questions && question.sub_questions.length > 0 && (
            <span className="text-[10px] text-purple-600">
              {question.sub_questions.length} parts
            </span>
          )}
          {question.image_url && (
            <span className="text-[10px] text-blue-600">📷</span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(question.id)}
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 flex-shrink-0"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}