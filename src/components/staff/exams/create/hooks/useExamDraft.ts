// src/components/staff/exams/create/hooks/useExamDraft.ts

"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { STORAGE_KEY } from "../constants";
import type { DraftData } from "../types";

const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
  let timer: NodeJS.Timeout;
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
};

export function useExamDraft() {
  const saveTimerRef = useRef<ReturnType<typeof debounce> | null>(null);

  const saveToStorage = useCallback((data: Omit<DraftData, "savedAt">) => {
    try {
      const payload: DraftData = {
        ...data,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage might be full or unavailable
    }
  }, []);

  const debouncedSave = useCallback(
    (data: Omit<DraftData, "savedAt">) => {
      if (!saveTimerRef.current) {
        saveTimerRef.current = debounce(saveToStorage, 1000);
      }
      saveTimerRef.current(data);
    },
    [saveToStorage]
  );

  const loadFromStorage = useCallback((): DraftData | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DraftData;
      // Validate it has meaningful data
      const hasData =
        parsed.examDetails?.title ||
        parsed.examDetails?.subject ||
        parsed.questions?.length > 0 ||
        parsed.theoryQuestions?.length > 0;
      return hasData ? parsed : null;
    } catch {
      return null;
    }
  }, []);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  useEffect(() => {
    return () => {
      saveTimerRef.current?.cancel();
    };
  }, []);

  return { debouncedSave, loadFromStorage, clearStorage };
}