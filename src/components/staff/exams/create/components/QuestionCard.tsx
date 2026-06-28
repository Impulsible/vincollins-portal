// src/components/staff/exams/create/components/QuestionCard.tsx

"use client";

import { useState } from "react";
import { Trash2, Table, BarChart3, Image, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Question, TheoryQuestion, TheorySubQuestion } from "../types";

// ── Helper: Detect table in content ─────────────────────────────────────────
const hasTable = (text: string): boolean => {
  if (!text) return false;
  // Check for markdown table pattern (| col1 | col2 |)
  if (text.includes('|') && text.includes('---') && text.match(/\|.+\|/)) {
    return true;
  }
  // Check for HTML table
  if (text.includes('<table') && text.includes('</table>')) {
    return true;
  }
  // Check for ASCII table
  if (text.includes('+--') && text.includes('--+')) {
    return true;
  }
  return false;
};

// ── Helper: Detect chart/graph indicators ────────────────────────────────────
const hasChart = (text: string): boolean => {
  if (!text) return false;
  const chartKeywords = ['chart', 'graph', 'diagram', 'plot', 'bar chart', 'pie chart', 'line graph', 'histogram', 'scatter plot'];
  return chartKeywords.some(keyword => text.toLowerCase().includes(keyword));
};

// ── Helper: Detect image ─────────────────────────────────────────────────────
const hasImage = (text: string): boolean => {
  if (!text) return false;
  return text.includes('![') && text.includes('](') ||
         text.includes('<img') ||
         text.includes('data:image');
};

// ── Helper: Detect math/equation ────────────────────────────────────────────
const hasMath = (text: string): boolean => {
  if (!text) return false;
  return text.includes('=') || 
         text.includes('+') || 
         text.includes('-') || 
         text.includes('*') || 
         text.includes('/') ||
         Boolean(text.match(/[a-z]=\d+/)) ||
         text.includes('∑') ||
         text.includes('∫') ||
         text.includes('√');
};

// ── Helper: Render content with table support using Tailwind ────────────────
const renderContent = (text: string, maxLength: number = 120, isExpanded: boolean = false) => {
  if (!text) return null;

  // ── Markdown tables ──────────────────────────────────────────────────────
  if (text.includes('|') && text.includes('---')) {
    const lines = text.split('\n').filter(line => line.includes('|'));
    if (lines.length > 1) {
      const tableHtml = convertMarkdownTableToHtml(lines);
      if (tableHtml) {
        return (
          <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <div 
              className="w-full text-xs md:text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200 dark:[&_th]:border-gray-700 dark:[&_td]:border-gray-700 [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2 [&_th]:bg-gray-50 dark:[&_th]:bg-gray-800 [&_th]:font-semibold [&_th]:text-left [&_td]:text-gray-700 dark:[&_td]:text-gray-300"
              dangerouslySetInnerHTML={{ __html: tableHtml }}
            />
          </div>
        );
      }
    }
  }

  // ── HTML tables ──────────────────────────────────────────────────────────
  if (text.includes('<table') && text.includes('</table>')) {
    const tableMatch = text.match(/<table[\s\S]*?<\/table>/i);
    if (tableMatch) {
      return (
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <div 
            className="w-full text-xs md:text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200 dark:[&_th]:border-gray-700 dark:[&_td]:border-gray-700 [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2 [&_th]:bg-gray-50 dark:[&_th]:bg-gray-800 [&_th]:font-semibold [&_th]:text-left [&_td]:text-gray-700 dark:[&_td]:text-gray-300"
            dangerouslySetInnerHTML={{ __html: tableMatch[0] }}
          />
        </div>
      );
    }
  }

  // ── ASCII tables ─────────────────────────────────────────────────────────
  if (text.includes('+--') && text.includes('--+')) {
    return (
      <pre className="mt-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-pre-wrap text-gray-700 dark:text-gray-300">
        {text}
      </pre>
    );
  }

  // ── Math/equations ──────────────────────────────────────────────────────
  if (hasMath(text) && !isExpanded) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const hasMultipleLines = lines.length > 3;
    const displayText = hasMultipleLines ? lines.slice(0, 3).join('\n') + (lines.length > 3 ? '\n...' : '') : text;
    return (
      <pre className="mt-1 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto text-gray-700 dark:text-gray-300">
        {displayText}
      </pre>
    );
  }

  // ── Regular text with truncation ────────────────────────────────────────
  let displayText = text;
  if (maxLength && !isExpanded && !text.includes('|') && !text.includes('<table') && !hasMath(text)) {
    displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // Handle line breaks
  const paragraphs = displayText.split('\n').filter(p => p.trim().length > 0);
  
  if (paragraphs.length > 1) {
    return (
      <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
        {paragraphs.slice(0, isExpanded ? paragraphs.length : 2).map((p, i) => (
          <p key={i} className="leading-relaxed">{p}</p>
        ))}
        {!isExpanded && paragraphs.length > 2 && (
          <p className="text-gray-400 text-xs">... {paragraphs.length - 2} more lines</p>
        )}
      </div>
    );
  }

  return <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{displayText}</span>;
};

// ── Convert markdown table to HTML with Tailwind classes ────────────────────
const convertMarkdownTableToHtml = (tableLines: string[]): string => {
  let html = '<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">';
  let isHeader = true;
  
  for (const line of tableLines) {
    if (line.includes('---') || line.includes('===')) {
      isHeader = false;
      continue;
    }
    if (line.startsWith('|')) {
      const cells = line.split('|').filter((cell: string) => cell.trim() !== '');
      if (cells.length === 0) continue;
      const tag = isHeader ? 'th' : 'td';
      const cellClass = isHeader 
        ? 'px-3 py-2 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider bg-gray-50 dark:bg-gray-800'
        : 'px-3 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap';
      html += '<tr class="' + (isHeader ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors') + '">';
      cells.forEach((cell: string) => {
        html += `<${tag} class="${cellClass} border border-gray-200 dark:border-gray-700">${cell.trim()}</${tag}>`;
      });
      html += '</tr>';
      isHeader = false;
    }
  }
  html += '</table>';
  return html;
};

// ── Render Sub-Questions ─────────────────────────────────────────────────────
const renderSubQuestions = (subQuestions: TheorySubQuestion[], level: number = 0) => {
  if (!subQuestions || subQuestions.length === 0) return null;
  
  const startCharCode = level === 0 ? 97 : 105;
  
  return (
    <div className={`mt-2 ${level > 0 ? 'ml-6' : 'ml-4'} space-y-1.5`}>
      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
        {level === 0 ? 'Sub-questions:' : 'Parts:'}
      </p>
      {subQuestions.map((sq, idx) => {
        const hasTableContent = hasTable(sq.text || '');
        const hasChartContent = hasChart(sq.text || '');
        // ✅ Use points or default to 0 if not available
        const subPoints = (sq as any).points || 0;
        
        return (
          <div key={idx} className="pl-3 border-l-2 border-purple-200 dark:border-purple-800">
            <div className="text-sm">
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {level === 0 ? String.fromCharCode(startCharCode + idx) : String.fromCharCode(startCharCode + idx)}.
              </span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">
                {renderContent(sq.text || '', 100, false)}
              </span>
              {/* ✅ Use subPoints variable instead of direct access */}
              {subPoints > 0 && (
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">({subPoints} marks)</span>
              )}
              {hasTableContent && (
                <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                  <Table className="h-2.5 w-2.5 mr-0.5" />
                  Table
                </Badge>
              )}
              {hasChartContent && (
                <Badge variant="outline" className="ml-1 text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  <BarChart3 className="h-2.5 w-2.5 mr-0.5" />
                  Chart
                </Badge>
              )}
            </div>
            {sq.sub_sub_questions && sq.sub_sub_questions.length > 0 && (
              renderSubQuestions(sq.sub_sub_questions, level + 1)
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Objective Card ────────────────────────────────────────────────────────────
interface ObjectiveCardProps {
  question: Question;
  index: number;
  onDelete: (id: string) => void;
}

export function ObjectiveCard({ question, index, onDelete }: ObjectiveCardProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group shadow-sm hover:shadow">
      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-400 flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          {question.question}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs h-5">
            {question.marks} marks
          </Badge>
          {question.options && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {question.options.length} options
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(question.id)}
        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ── Theory Card ──────────────────────────────────────────────────────────────
interface TheoryCardProps {
  question: TheoryQuestion;
  index: number;
  onDelete: (id: string) => void;
}

export function TheoryCard({ question, index, onDelete }: TheoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasTableContent = hasTable(question.question);
  const hasChartContent = hasChart(question.question);
  const hasImageContent = hasImage(question.question);
  const hasMathContent = hasMath(question.question);
  const hasSubQuestions = question.sub_questions && question.sub_questions.length > 0;
  const hasSubTable = question.sub_questions?.some(sq => hasTable(sq.text || ''));

  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group shadow-sm hover:shadow",
        isExpanded ? "p-4" : "p-3"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-400 flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          {/* Question content */}
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {renderContent(question.question, isExpanded ? 1000 : 120, isExpanded)}
          </div>

          {/* Tags and indicators */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge variant="outline" className="text-xs h-5">
              {question.marks} marks
            </Badge>

            {hasSubQuestions && (
              <Badge variant="secondary" className="text-xs h-5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                {question.sub_questions?.length || 0} part{question.sub_questions && question.sub_questions.length > 1 ? 's' : ''}
              </Badge>
            )}

            {hasTableContent && (
              <Badge variant="outline" className="text-xs h-5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                <Table className="h-3 w-3 mr-0.5" />
                Table
              </Badge>
            )}

            {hasSubTable && (
              <Badge variant="outline" className="text-xs h-5 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800">
                <Table className="h-3 w-3 mr-0.5" />
                Sub-table
              </Badge>
            )}

            {hasChartContent && (
              <Badge variant="outline" className="text-xs h-5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                <BarChart3 className="h-3 w-3 mr-0.5" />
                Chart
              </Badge>
            )}

            {hasMathContent && (
              <Badge variant="outline" className="text-xs h-5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                <span className="font-mono text-[10px]">∑</span>
                Math
              </Badge>
            )}

            {hasImageContent && (
              <Badge variant="outline" className="text-xs h-5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                <Image className="h-3 w-3 mr-0.5" />
                Image
              </Badge>
            )}

            {question.image_url && (
              <Badge variant="outline" className="text-xs h-5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                <Image className="h-3 w-3 mr-0.5" />
                Image
              </Badge>
            )}

            {(question as any).model_answer && (
              <Badge variant="outline" className="text-xs h-5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                📝 Model Answer
              </Badge>
            )}
          </div>

          {/* Sub-questions */}
          {hasSubQuestions && question.sub_questions && (
            <div className="mt-3">
              {renderSubQuestions(question.sub_questions)}
            </div>
          )}

          {/* Expand/Collapse button */}
          {(question.question.length > 200 || hasTableContent || hasMathContent) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronRight className="h-3 w-3" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(question.id)}
          className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}