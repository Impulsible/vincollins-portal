// src/hooks/useQuestionParser.ts
import { Question } from '@/components/staff/exams/create/types';

export interface ParsedQuestion {
  id: string;
  type: 'mcq' | 'theory';
  question: string;
  options: string[];
  correct_answer: string;
  marks: number;
  image_url?: string;
  image_caption?: string;
  section_header?: string;
  section?: string;
}

export interface ParseResult<T = ParsedQuestion> {
  items: T[];
  warnings: string[];
  errors: string[];
}

// Section boundary & instruction detection regex
const SECTION_DIVIDER_REGEX =
  /^(?:---|___|\*\*\*|===|#+\s+|SECTION\b|PART\b|OBJECTIVES?\b|THEORY\b|INSTRUCTIONS?\b|DIRECTIONS?\b|CHOISISSEZ\b|CHOOSE\b|READ\b)/i;

const OPTION_START_REGEX = /^[\(\[]?([A-Ha-h])[\)\]\.\:\-]\s*(.*)$/;
const QUESTION_START_REGEX = /^(?:Question\s*)?(\d+)[\.\)\:]\s*(.+)$/i;
const ANSWER_KEY_REGEX = /^(?:Answer|Ans|Correct|Key)[\:\-\s]+[\(\[]?([A-Ha-h]|.+?)[\)\]]?$/i;
const MARKS_KEY_REGEX = /^(?:Marks?|Score|Points?)[\:\-\s]+(\d+(?:\.\d+)?)/i;

/**
 * Strips accidental markdown dividers or header text concatenated to an option string
 */
function cleanOptionLine(rawOptionText: string): { text: string; headerRemainder?: string } {
  if (!rawOptionText) return { text: '' };

  let text = rawOptionText.trim();
  let headerRemainder: string | undefined;

  // Split on inline markdown divider or header symbols
  const inlineSplit = text.split(/\s+(?:---|___|\*\*\*|===|##+|###+|SECTION\b|PART\b|OBJECTIVES?\b|CHOISISSEZ\b)/i);
  if (inlineSplit.length > 1) {
    text = inlineSplit[0].trim();
    const leaked = rawOptionText.slice(inlineSplit[0].length).replace(/^[#\s\-*_=>]+/, '').trim();
    if (leaked) {
      headerRemainder = leaked;
    }
  }

  return { text, headerRemainder };
}

/**
 * Universal Bulk Objective Question Parser
 */
export function parseObjectiveText(
  rawText: string,
  defaultMark: number = 1
): ParseResult<ParsedQuestion> {
  const lines = rawText.split(/\r?\n/);
  const items: ParsedQuestion[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  let currentQ: Partial<ParsedQuestion> | null = null;
  let currentOptions: string[] = [];
  let pendingSectionHeader = '';
  let currentOptIndex = -1;

  const commitCurrentQuestion = () => {
    if (!currentQ || !currentQ.question) return;

    // Filter non-empty options
    const filteredOptions = currentOptions.map((o) => o.trim()).filter(Boolean);

    if (filteredOptions.length < 2) {
      warnings.push(
        `Question "${currentQ.question?.slice(0, 35)}..." has fewer than 2 valid options.`
      );
    }

    // Resolve correct answer letter (e.g. "B" -> option text or keep string)
    let resolvedAnswer = (currentQ.correct_answer || '').trim();
    if (resolvedAnswer.length === 1 && /^[A-Ha-h]$/i.test(resolvedAnswer)) {
      const idx = resolvedAnswer.toUpperCase().charCodeAt(0) - 65;
      if (filteredOptions[idx]) {
        resolvedAnswer = filteredOptions[idx];
      }
    }

    items.push({
      id: currentQ.id || crypto.randomUUID(),
      type: 'mcq',
      question: (currentQ.question || '').trim(),
      options: filteredOptions,
      correct_answer: resolvedAnswer || filteredOptions[0] || '',
      marks: Number(currentQ.marks) || defaultMark,
      image_url: currentQ.image_url,
      image_caption: currentQ.image_caption,
      section_header: currentQ.section_header || undefined,
      section: currentQ.section_header || undefined,
    });

    currentQ = null;
    currentOptions = [];
    currentOptIndex = -1;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // 1. Detect section headers, dividers (---), or instructions
    if (SECTION_DIVIDER_REGEX.test(line)) {
      const cleanHeader = line.replace(/^[#\s\-*_=>]+/, '').trim();
      if (cleanHeader) {
        pendingSectionHeader = pendingSectionHeader
          ? `${pendingSectionHeader} — ${cleanHeader}`
          : cleanHeader;
      }
      currentOptIndex = -1; // Immediately end active option accumulation
      continue;
    }

    // 2. Detect Question start (e.g., "1. What is...", "Question 9:")
    const qMatch = line.match(QUESTION_START_REGEX);
    if (qMatch) {
      commitCurrentQuestion();

      currentQ = {
        id: crypto.randomUUID(),
        question: qMatch[2].trim(),
        marks: defaultMark,
        section_header: pendingSectionHeader || undefined,
      };
      pendingSectionHeader = '';
      currentOptions = [];
      currentOptIndex = -1;
      continue;
    }

    // 3. Detect Option choice (e.g., "A. London", "B) Paris", "(C) Rome")
    const optMatch = line.match(OPTION_START_REGEX);
    if (optMatch && currentQ) {
      const letter = optMatch[1].toUpperCase();
      const targetIdx = letter.charCodeAt(0) - 65;

      const { text: cleanOpt, headerRemainder } = cleanOptionLine(optMatch[2]);

      // Ensure array length
      while (currentOptions.length < targetIdx) {
        currentOptions.push('');
      }
      currentOptions[targetIdx] = cleanOpt;
      currentOptIndex = targetIdx;

      if (headerRemainder) {
        pendingSectionHeader = pendingSectionHeader
          ? `${pendingSectionHeader} — ${headerRemainder}`
          : headerRemainder;
        currentOptIndex = -1;
      }
      continue;
    }

    // 4. Detect Explicit Answer line (e.g., "Answer: B", "Ans: Abuja")
    const ansMatch = line.match(ANSWER_KEY_REGEX);
    if (ansMatch && currentQ) {
      currentQ.correct_answer = ansMatch[1].trim();
      currentOptIndex = -1;
      continue;
    }

    // 5. Detect Explicit Marks line (e.g., "Marks: 2", "Mark: 1.5")
    const markMatch = line.match(MARKS_KEY_REGEX);
    if (markMatch && currentQ) {
      currentQ.marks = parseFloat(markMatch[1]) || defaultMark;
      currentOptIndex = -1;
      continue;
    }

    // 6. Multiline Continuation handling
    if (currentQ && currentOptIndex >= 0 && currentOptions[currentOptIndex] !== undefined) {
      // Continuation of current option choice
      const { text: cleanContinuation, headerRemainder } = cleanOptionLine(line);
      currentOptions[currentOptIndex] = `${currentOptions[currentOptIndex]} ${cleanContinuation}`.trim();

      if (headerRemainder) {
        pendingSectionHeader = pendingSectionHeader
          ? `${pendingSectionHeader} — ${headerRemainder}`
          : headerRemainder;
        currentOptIndex = -1;
      }
    } else if (currentQ && currentOptIndex === -1) {
      // Continuation of question prompt
      currentQ.question = `${currentQ.question || ''}\n${line}`.trim();
    }
  }

  // Commit last question
  commitCurrentQuestion();

  return {
    items,
    warnings,
    errors,
  };
}

/**
 * Universal Bulk Theory Question Parser
 */
export function parseTheoryText(
  rawText: string,
  defaultMark: number = 10
): ParseResult<ParsedQuestion> {
  const lines = rawText.split(/\r?\n/);
  const items: ParsedQuestion[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  let currentQ: Partial<ParsedQuestion> | null = null;
  let pendingSectionHeader = '';

  const commitTheory = () => {
    if (!currentQ || !currentQ.question) return;

    items.push({
      id: currentQ.id || crypto.randomUUID(),
      type: 'theory',
      question: (currentQ.question || '').trim(),
      options: [],
      correct_answer: (currentQ.correct_answer || '').trim(),
      marks: Number(currentQ.marks) || defaultMark,
      image_url: currentQ.image_url,
      image_caption: currentQ.image_caption,
      section_header: currentQ.section_header || undefined,
      section: currentQ.section_header || undefined,
    });

    currentQ = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    if (SECTION_DIVIDER_REGEX.test(line)) {
      const cleanHeader = line.replace(/^[#\s\-*_=>]+/, '').trim();
      if (cleanHeader) {
        pendingSectionHeader = pendingSectionHeader
          ? `${pendingSectionHeader} — ${cleanHeader}`
          : cleanHeader;
      }
      continue;
    }

    const qMatch = line.match(QUESTION_START_REGEX);
    if (qMatch) {
      commitTheory();

      currentQ = {
        id: crypto.randomUUID(),
        question: qMatch[2].trim(),
        marks: defaultMark,
        section_header: pendingSectionHeader || undefined,
      };
      pendingSectionHeader = '';
      continue;
    }

    const markMatch = line.match(MARKS_KEY_REGEX);
    if (markMatch && currentQ) {
      currentQ.marks = parseFloat(markMatch[1]) || defaultMark;
      continue;
    }

    const rubMatch = line.match(/^(?:Rubric|Guide|Model Answer|Answer)[\:\-\s]+(.+)$/i);
    if (rubMatch && currentQ) {
      currentQ.correct_answer = rubMatch[1].trim();
      continue;
    }

    if (currentQ) {
      currentQ.question = `${currentQ.question || ''}\n${line}`.trim();
    }
  }

  commitTheory();

  return {
    items,
    warnings,
    errors,
  };
}

/**
 * Universal Document Text Extractor (.docx / .txt)
 */
export async function parseDocument(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'txt') {
    return await file.text();
  }

  if (extension === 'docx') {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (err) {
      console.error('DOCX parsing error:', err);
      throw new Error('Failed to read .docx file. You can paste the text directly into the bulk box.');
    }
  }

  throw new Error('Unsupported file format. Please upload a .txt or .docx file.');
}