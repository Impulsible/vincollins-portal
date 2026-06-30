// src/components/staff/exams/create/hooks/useQuestionParser.ts

"use client";

import { useCallback } from "react";
import type { Question, TheoryQuestion, ParseResult } from "../types";

// ── PDF ──────────────────────────────────────────────────────────────────────
const parsePDFWithPDFJS = async (ab: ArrayBuffer): Promise<string> => {
  const pdfjsLib = await import("pdfjs-dist");
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((x) => ("str" in x ? x.str : ""))
        .join(" ") + "\n";
  }
  return text.trim();
};

// ── Document ─────────────────────────────────────────────────────────────────
export const parseDocument = async (file: File): Promise<string> => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "txt" || ext === "md") return file.text();
  if (ext === "docx" || ext === "doc") {
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return result.value;
  }
  if (ext === "pdf") return parsePDFWithPDFJS(await file.arrayBuffer());
  throw new Error(
    `Unsupported file format: .${ext}. Use .txt, .doc, .docx, or .pdf`
  );
};

// ── Helper: Detect section header ────────────────────────────────────────────
const isSectionHeader = (line: string): string | null => {
  // Match: **SECTION A: COMPRÉHENSION (1–5)** or SECTION A: GRAMMAR
  const match = line.match(/^\*{0,2}SECTION\s+([A-E])\s*:\s*(.+?)\*{0,2}\s*(?:\(\d+[–-]\d+\))?$/i);
  if (match) {
    return `SECTION ${match[1].toUpperCase()}: ${match[2].trim()}`;
  }
  return null;
};

// ── Helper: Skip passage/comprehension text ──────────────────────────────────
const isPassageHeader = (line: string): boolean => {
  const passageKeywords = ['TEXTE', 'PASSAGE', 'COMPRÉHENSION', 'READING', 'COMPREHENSION'];
  const cleaned = line.replace(/\*+/g, '').trim().toUpperCase();
  return passageKeywords.some(kw => cleaned === kw || cleaned.startsWith(kw));
};

// ── Objective Parser ─────────────────────────────────────────────────────────
export function useQuestionParser(defaultMark: number) {
  const parseObjective = useCallback(
    (text: string): ParseResult<Question> => {
      const items: Question[] = [];
      const warnings: string[] = [];
      let skipped = 0;

      const lines = text.split(/\r?\n/);
      let current: Partial<Question> | null = null;
      let currentOptions: string[] = [];
      let currentSection = '';
      let skipUntilNextSection = false;

      const flush = (lineNumber: number) => {
        if (!current) return;
        const hasOptions = currentOptions.some((o) => o.trim());
        const hasAnswer = !!current.correct_answer;
        const hasQuestion = !!current.question?.trim();

        if (!hasQuestion) {
          skipped++;
          current = null;
          currentOptions = [];
          return;
        }
        if (!hasOptions) {
          warnings.push(
            `Q${items.length + 1} (line ~${lineNumber}): No options found — skipped`
          );
          skipped++;
          current = null;
          currentOptions = [];
          return;
        }
        if (!hasAnswer) {
          warnings.push(
            `Q${items.length + 1} (line ~${lineNumber}): No answer found — skipped`
          );
          skipped++;
          current = null;
          currentOptions = [];
          return;
        }

        // ✅ Prefix with section header if present
        const questionText = currentSection 
          ? `**${currentSection}**\n${current.question!.trim()}`
          : current.question!.trim();

        items.push({
          id: crypto.randomUUID(),
          type: "mcq",
          question: questionText,
          options: currentOptions.filter((o) => o.trim()),
          correct_answer: current.correct_answer!,
          marks: current.marks ?? defaultMark,
        });

        current = null;
        currentOptions = [];
      };

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // ✅ Check for section header
        const sectionMatch = isSectionHeader(trimmed);
        if (sectionMatch) {
          flush(idx);
          currentSection = sectionMatch;
          skipUntilNextSection = false;
          return;
        }

        // ✅ Skip passage/comprehension content
        if (isPassageHeader(trimmed)) {
          skipUntilNextSection = true;
          flush(idx);
          return;
        }

        // ✅ Skip lines while in passage mode
        if (skipUntilNextSection) {
          // Check if we've reached a section header or question number
          if (isSectionHeader(trimmed) || trimmed.match(/^\d+[\.\)]/)) {
            skipUntilNextSection = false;
          } else {
            return; // Skip passage content
          }
        }

        // New question: starts with number
        const questionMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)/);
        if (questionMatch && !trimmed.match(/^[A-D][\.\)]/i)) {
          flush(idx);
          current = { question: questionMatch[2], marks: defaultMark };
          currentOptions = [];
          return;
        }

        // Option line: A. / A) / (A)
        const optionMatch = trimmed.match(/^[(\s]*([A-D])[\.\)\s]\s*(.+)/i);
        if (optionMatch && current) {
          const index = optionMatch[1].toUpperCase().charCodeAt(0) - 65;
          currentOptions[index] = optionMatch[2].trim();
          return;
        }

        // Answer line
        const answerMatch = trimmed.match(/^(?:ans(?:wer)?|key)\s*[:\-]\s*([A-D])/i);
        if (answerMatch && current) {
          const idx2 = answerMatch[1].toUpperCase().charCodeAt(0) - 65;
          current.correct_answer = currentOptions[idx2] || answerMatch[1].toUpperCase();
          return;
        }

        // Marks line
        const marksMatch = trimmed.match(/^marks?\s*[:\-]\s*([\d.]+)/i);
        if (marksMatch && current) {
          current.marks = parseFloat(marksMatch[1]);
          return;
        }

        // Continuation of question text
        if (current) {
          current.question = (current.question || "") + " " + trimmed;
        }
      });

      flush(lines.length);

      return { items, warnings, skipped };
    },
    [defaultMark]
  );

  const parseTheory = useCallback((text: string): ParseResult<TheoryQuestion> => {
    const items: TheoryQuestion[] = [];
    const warnings: string[] = [];
    let skipped = 0;
    const seen = new Set<string>();

    let normalized = text.replace(/\r\n/g, "\n");

    // Preserve table blocks
    const tableMap = new Map<string, string>();
    let tableCount = 0;
    normalized = normalized.replace(
      /(\n\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g,
      (match) => {
        const placeholder = `__TABLE_${tableCount}__`;
        tableMap.set(placeholder, match);
        tableCount++;
        return `\n${placeholder}\n`;
      }
    );

    const lines = normalized.split("\n");
    let currentQ: TheoryQuestion | null = null;
    let contentLines: string[] = [];
    let subQuestions: string[] = [];
    let inSubSection = false;
    let currentSection = '';
    let skipUntilNextSection = false;

    const finalize = () => {
      if (!currentQ || !contentLines.length) return;

      let questionText = contentLines.join("\n").trim();
      tableMap.forEach((value, key) => {
        questionText = questionText.replace(new RegExp(key, "g"), value);
      });

      // ✅ Prefix with section header
      if (currentSection) {
        questionText = `**${currentSection}**\n${questionText}`;
      }

      currentQ.question = questionText;

      if (subQuestions.length > 0) {
        const perSub = Math.floor((currentQ.marks || 10) / subQuestions.length);
        currentQ.sub_questions = subQuestions.map((text) => ({
          text: text.trim(),
          marks: perSub,
        }));
      }

      const key = currentQ.question.substring(0, 100);
      if (!seen.has(key) && currentQ.question.length > 5) {
        seen.add(key);
        items.push(currentQ);
      } else {
        skipped++;
      }

      currentQ = null;
      contentLines = [];
      subQuestions = [];
      inSubSection = false;
    };

    for (const line of lines) {
      const trimmed = line.trim();

      // ✅ Section header
      const sectionMatch = isSectionHeader(trimmed);
      if (sectionMatch) {
        finalize();
        currentSection = sectionMatch;
        skipUntilNextSection = false;
        continue;
      }

      // ✅ Skip passage content
      if (isPassageHeader(trimmed)) {
        skipUntilNextSection = true;
        finalize();
        continue;
      }

      if (skipUntilNextSection) {
        if (isSectionHeader(trimmed) || trimmed.match(/^\d+[\.\)]/)) {
          skipUntilNextSection = false;
        } else {
          continue;
        }
      }

      // New numbered question
      const questionMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (questionMatch) {
        finalize();
        currentQ = {
          id: crypto.randomUUID(),
          question: "",
          marks: 10,
        };
        if (questionMatch[2]) contentLines.push(questionMatch[2]);
        continue;
      }

      if (!currentQ) continue;

      // Marks declaration
      const marksMatch = trimmed.match(/^(\d+)\s*marks?\.?$/i);
      if (marksMatch) {
        currentQ.marks = parseInt(marksMatch[1]);
        continue;
      }

      // Sub-question (a., b., c.)
      const subMatch = trimmed.match(/^([a-z])\.\s+(.*)/i);
      if (subMatch) {
        inSubSection = true;
        subQuestions.push(subMatch[2]);
        continue;
      }

      // Roman numeral sub-sub
      if (inSubSection && trimmed.match(/^[ivx]+\./i)) {
        if (subQuestions.length > 0) {
          subQuestions[subQuestions.length - 1] += "\n  " + trimmed;
        }
        continue;
      }

      // Skip section headers
      if (trimmed.match(/^sub-?questions?:?$/i)) {
        inSubSection = true;
        continue;
      }

      if (!inSubSection) {
        contentLines.push(trimmed);
      }
    }

    finalize();

    if (items.length === 0) {
      warnings.push("No questions detected. Ensure questions start with '1.' '2.' etc.");
    }

    return { items, warnings, skipped };
  }, []);

  return { parseObjective, parseTheory, parseDocument };
}