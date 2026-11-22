// src/hooks/useQuestionParser.ts

export interface ParsedQuestion {
  id: string;
  type: 'mcq' | 'objective';
  question: string;
  options: string[];
  correct_answer: string;
  marks: number;
  section_header?: string;
  image_url?: string;
  image_caption?: string;
}

export interface ParseResult<T = ParsedQuestion> {
  items: T[];
  warnings: string[];
  skipped: number;
}

/**
 * Universal Subject-Agnostic Bulk Question Parser
 * Supports English, French, Yoruba, Igbo, Hausa, Mathematics, Sciences, etc.
 */
export function parseObjectiveText(
  rawText: string,
  defaultMark = 1
): ParseResult<ParsedQuestion> {
  if (!rawText || !rawText.trim()) {
    return { items: [], warnings: [], skipped: 0 };
  }

  const rawLines = rawText.split(/\r?\n/);
  const questions: ParsedQuestion[] = [];
  const warnings: string[] = [];

  // Parser State
  let persistentSection = '';
  let transientInstruction = '';
  let currentPromptLines: string[] = [];
  let currentOptions: string[] = [];
  let currentAnswer = '';
  let currentMarks = defaultMark;
  let currentImageUrl = '';
  let currentImageCaption = '';

  /* ── Detection Regular Expressions ── */
  // Matches: "A.", "A)", "(A)", "A -", "A:", "a.", "a)"
  const OPTION_REGEX = /^\s*(?:\(?([A-F])\)|\b([A-F])[\.\)\-:])\s*(.*)$/i;

  // Matches: "Answer: A", "ANS: B", "Correct Answer: (C)", "Key: D", "Réponse: C", "Idahun: A"
  const ANSWER_REGEX =
    /^\s*(?:ANS|ANSWER|CORRECT\s*ANSWER|KEY|R[ÉE]PONSE|ÌDÁHÙN|IDAHUN|AZIZA)\s*[:=\-]\s*(.*)$/i;

  // Matches: "Marks: 0.5", "Mark: 1", "Points: 2", "[0.5 marks]", "(1 mk)"
  const MARKS_REGEX =
    /^\s*(?:MARKS?|POINTS?|MK|MKS)\s*[:=\-]\s*([0-9]+(?:\.[0-9]+)?)/i;
  const MARKS_BRACKET_REGEX =
    /\[\s*([0-9]+(?:\.[0-9]+)?)\s*(?:marks?|pts?|points?|mk)?\s*\]/i;

  // Matches: "1.", "1)", "Question 1:", "Q1.", "1 -", "(1)", "1:"
  const QUESTION_START_REGEX =
    /^\s*(?:(?:Q|QUESTION)\s*\d+[\.\)\-:]|\(?\d+\)[\.\)\-:]?|\d+[\.\)\-:])\s*(.*)$/i;

  // Image markdown: ![caption](url)
  const IMAGE_MD_REGEX = /!\[(.*?)\]\((https?:\/\/[^\s\)]+)\)/i;

  // International / Multilingual Header & Directive Keywords
  const SECTION_KEYWORDS = [
    'SECTION',
    'PART',
    'MODULE',
    'UNIT',
    'PAPER',
    'OBJECTIVES',
    'OBJECTIVE',
    'COMPREHENSION',
    'INSTRUCTION',
    'INSTRUCTIONS',
    'DIRECTION',
    'DIRECTIONS',
    'CHOISISSEZ',
    'COMPLETEZ',
    'REPONDEZ', // French
    'IPIN',
    'ÌPÍN',
    'AYOKA',
    'ÀYỌKÀ',
    'GBOLOHUN',
    'AKOLE', // Yoruba
    'NGALABA',
    'NKWUKWO',
    'IHE', // Igbo
    'SASHE',
    'KARANTA', // Hausa
  ];

  const isExplicitSectionHeader = (line: string): boolean => {
    const clean = line.replace(/[*_#\[\]]/g, '').trim();
    if (!clean || clean.length > 140) return false;
    const upper = clean.toUpperCase();
    return SECTION_KEYWORDS.some(
      (kw) =>
        upper.startsWith(kw) ||
        upper.startsWith(`**${kw}`) ||
        upper.includes(` ${kw} `) ||
        upper.includes(`: ${kw}`)
    );
  };

  const isTableLine = (line: string): boolean => {
    const t = line.trim();
    return t.startsWith('|') && t.endsWith('|');
  };

  /* ── Helper: Flush and build question ── */
  const flushCurrentQuestion = () => {
    const promptBody = currentPromptLines.join('\n').trim();

    if (promptBody && currentOptions.length >= 2) {
      const promptParts: string[] = [];

      if (persistentSection) {
        promptParts.push(`**[${persistentSection}]**`);
      }
      if (transientInstruction && transientInstruction !== persistentSection) {
        promptParts.push(`*${transientInstruction}*`);
      }
      promptParts.push(promptBody);

      const finalPrompt = promptParts.join('\n\n');

      // Resolve final answer
      let resolvedAnswer = currentAnswer;
      if (currentAnswer) {
        // If answer was given as letter: "A", "B", "(C)"
        const letterMatch = currentAnswer.match(/^\(?([A-F])\)?$/i);
        if (letterMatch) {
          const letterIdx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
          if (currentOptions[letterIdx]) {
            resolvedAnswer = currentOptions[letterIdx];
          }
        } else {
          // If answer is exact text of an option
          const matchingOption = currentOptions.find(
            (o) => o.trim().toLowerCase() === currentAnswer.trim().toLowerCase()
          );
          if (matchingOption) {
            resolvedAnswer = matchingOption;
          }
        }
      }

      // Fallback to Option A if undefined
      if (!resolvedAnswer) {
        resolvedAnswer = currentOptions[0];
        warnings.push(
          `Question "${promptBody.slice(0, 35)}..." had no verified answer. Defaulted to Option A.`
        );
      }

      questions.push({
        id: crypto.randomUUID(),
        type: 'mcq',
        question: finalPrompt,
        options: currentOptions,
        correct_answer: resolvedAnswer,
        marks: currentMarks > 0 ? currentMarks : defaultMark,
        section_header: persistentSection || transientInstruction || undefined,
        image_url: currentImageUrl || undefined,
        image_caption: currentImageCaption || undefined,
      });

      // Clear transient instruction after successfully applying to item
      transientInstruction = '';
    }

    // Reset item buffers
    currentPromptLines = [];
    currentOptions = [];
    currentAnswer = '';
    currentMarks = defaultMark;
    currentImageUrl = '';
    currentImageCaption = '';
  };

  /* ── Main Line-by-Line Tokenizer Engine ── */
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // 1. Embedded Image detection
    const imgMatch = line.match(IMAGE_MD_REGEX);
    if (imgMatch) {
      currentImageCaption = imgMatch[1];
      currentImageUrl = imgMatch[2];
      continue;
    }

    // 2. Marks detection: [0.5 marks] or Marks: 0.5
    const marksMatch =
      line.match(MARKS_REGEX) || line.match(MARKS_BRACKET_REGEX);
    if (marksMatch) {
      const val = parseFloat(marksMatch[1]);
      if (!isNaN(val) && val > 0) {
        currentMarks = val;
      }
      if (line.match(MARKS_REGEX)) continue; // skip standalone marks line
    }

    // 3. Answer line: "Answer: C"
    const ansMatch = line.match(ANSWER_REGEX);
    if (ansMatch) {
      currentAnswer = ansMatch[1].trim();
      continue;
    }

    // 4. Option line: "A. Option", "B) Option"
    const optMatch = line.match(OPTION_REGEX);
    if (optMatch) {
      const optionText = optMatch[3].trim();
      currentOptions.push(optionText);
      continue;
    }

    // 5. Explicit Section Header or Multi-lingual Directive
    if (isExplicitSectionHeader(line) && currentOptions.length === 0) {
      flushCurrentQuestion();
      const cleanHeader = line.replace(/[*_#]/g, '').trim();

      const upper = cleanHeader.toUpperCase();
      if (
        upper.startsWith('SECTION') ||
        upper.startsWith('PART') ||
        upper.startsWith('IPIN') ||
        upper.startsWith('ÌPÍN') ||
        upper.startsWith('SASHE')
      ) {
        persistentSection = cleanHeader;
        transientInstruction = '';
      } else {
        transientInstruction = cleanHeader;
      }
      continue;
    }

    // 6. Question Number Start (e.g. "1.", "12)", "Q1:")
    const qStartMatch = line.match(QUESTION_START_REGEX);
    if (qStartMatch) {
      flushCurrentQuestion();
      currentPromptLines.push(qStartMatch[1].trim());
      continue;
    }

    // 7. Markdown Tables & Figures
    if (isTableLine(line)) {
      currentPromptLines.push(line);
      continue;
    }

    // 8. Context lines / Floating instructions / Multi-line continuations
    if (currentOptions.length === 0) {
      if (currentPromptLines.length === 0) {
        // Line sits before any question number
        transientInstruction = line.replace(/[*_#]/g, '').trim();
      } else {
        // Multi-line question prompt body
        currentPromptLines.push(line);
      }
    } else {
      // Multi-line option continuation
      if (currentOptions.length > 0) {
        currentOptions[currentOptions.length - 1] += ` ${line}`;
      }
    }
  }

  // Flush final pending question
  flushCurrentQuestion();

  return {
    items: questions,
    warnings,
    skipped: 0,
  };
}

/**
 * Universal document text extractor (.txt, .docx fallback)
 */
export async function parseDocument(file: File): Promise<string> {
  return await file.text();
}