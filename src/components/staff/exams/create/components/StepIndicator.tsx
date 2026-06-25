// src/components/staff/exams/create/components/StepIndicator.tsx

"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS } from "../constants";
import type { StepId } from "../types";

interface StepIndicatorProps {
  currentStep: StepId;
  completedSteps: Set<StepId>;
  onStepClick: (id: StepId) => void;
}

export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center w-full gap-1">
      {STEPS.map((step, idx) => {
        const isDone = completedSteps.has(step.id);
        const isCurrent = step.id === currentStep;
        const isPast = idx < currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => onStepClick(step.id)}
              className="flex items-center gap-1.5 group"
            >
              <div
                className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all",
                  isCurrent
                    ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/25"
                    : isDone || isPast
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                    : "bg-white/5 border-white/20 text-gray-500"
                )}
              >
                {isDone && !isCurrent ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-semibold hidden sm:inline",
                  isCurrent
                    ? "text-white"
                    : isDone || isPast
                    ? "text-emerald-400"
                    : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-1 rounded-full",
                  isPast || isDone ? "bg-emerald-500/50" : "bg-white/10"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}