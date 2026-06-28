// src/components/student/exam/question/QuestionCard.tsx

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Flag, Hash, FileText, Table, BarChart3, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPoints } from '@/app/student/exam/[id]/utils/scoring'
import { ObjectiveAnswer } from '../answers/ObjectiveAnswer'
import { TheoryAnswer } from '../answers/TheoryAnswer'
import { TextAnswer } from '../answers/TextAnswer'
import type { Question } from '@/app/student/exam/[id]/types'

// ── Helper: Detect table in content ─────────────────────────────────────────
const hasTable = (text: string): boolean => {
  if (!text) return false;
  return (
    (text.includes('|') && text.includes('---') && /\|.+\|/.test(text)) ||
    (text.includes('<table') && text.includes('</table>')) ||
    (text.includes('+--') && text.includes('--+'))
  );
};

// ── Helper: Detect chart/graph ──────────────────────────────────────────────
const hasChart = (text: string): boolean => {
  if (!text) return false;
  const keywords = ['chart', 'graph', 'diagram', 'plot', 'bar chart', 'pie chart', 'line graph', 'histogram'];
  return keywords.some(kw => text.toLowerCase().includes(kw));
};

// ── Helper: Detect image ─────────────────────────────────────────────────────
const hasImage = (text: string): boolean => {
  if (!text) return false;
  return text.includes('![') && text.includes('](') || text.includes('<img');
};

// ── Convert markdown table to HTML ──────────────────────────────────────────
const convertMarkdownTableToHtml = (text: string): string => {
  if (!text) return '';
  
  const lines = text.split('\n').filter(line => line.includes('|'));
  if (lines.length < 2) return '';
  
  let html = '<table class="min-w-full divide-y divide-gray-200">';
  let isHeader = true;
  
  for (const line of lines) {
    if (line.includes('---') || line.includes('===')) {
      isHeader = false;
      continue;
    }
    const cells = line.split('|').filter(cell => cell.trim() !== '');
    if (cells.length === 0) continue;
    
    const tag = isHeader ? 'th' : 'td';
    const cellClass = isHeader 
      ? 'px-3 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gray-50'
      : 'px-3 py-2 text-sm text-gray-700 whitespace-nowrap';
    
    html += '<tr class="' + (isHeader ? '' : 'hover:bg-gray-50 transition-colors') + '">';
    cells.forEach((cell) => {
      const trimmed = cell.trim();
      html += `<${tag} class="${cellClass} border border-gray-200">${trimmed}</${tag}>`;
    });
    html += '</tr>';
    isHeader = false;
  }
  
  html += '</table>';
  return html;
};

// ── Render content with table support ───────────────────────────────────────
const renderContent = (text: string) => {
  if (!text) return null;

  // ── Markdown tables ──────────────────────────────────────────────────────
  if (text.includes('|') && text.includes('---')) {
    const tableHtml = convertMarkdownTableToHtml(text);
    if (tableHtml) {
      // Remove the table from text and render remaining content
      const lines = text.split('\n');
      const nonTableLines = lines.filter(line => !line.includes('|') && !line.includes('---'));
      const remainingText = nonTableLines.join('\n').trim();
      
      return (
        <div>
          {remainingText && (
            <p className="text-slate-700 leading-relaxed text-base mb-3">{remainingText}</p>
          )}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <div 
              className="w-full text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200 [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2 [&_th]:bg-gray-50 [&_th]:font-semibold [&_th]:text-left [&_td]:text-gray-700"
              dangerouslySetInnerHTML={{ __html: tableHtml }}
            />
          </div>
        </div>
      );
    }
  }

  // ── HTML tables ──────────────────────────────────────────────────────────
  if (text.includes('<table') && text.includes('</table>')) {
    const tableMatch = text.match(/<table[\s\S]*?<\/table>/i);
    if (tableMatch) {
      return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <div 
            className="w-full text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200 [&_th]:px-3 [&_td]:px-3 [&_th]:py-2 [&_td]:py-2 [&_th]:bg-gray-50 [&_th]:font-semibold [&_th]:text-left [&_td]:text-gray-700"
            dangerouslySetInnerHTML={{ __html: tableMatch[0] }}
          />
        </div>
      );
    }
  }

  // ── ASCII tables ─────────────────────────────────────────────────────────
  if (text.includes('+--') && text.includes('--+')) {
    return (
      <pre className="text-sm font-mono bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-x-auto whitespace-pre-wrap text-gray-700">
        {text}
      </pre>
    );
  }

  // ── Regular text ─────────────────────────────────────────────────────────
  const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
  
  if (paragraphs.length > 1) {
    return (
      <div className="space-y-2 text-slate-700 leading-relaxed text-base">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }

  return <span className="text-slate-700 leading-relaxed text-base">{text}</span>;
};

interface QuestionCardProps {
  question: Question
  questionIndex: number
  answer: string
  isFlagged: boolean
  examId: string
  studentId?: string
  onAnswer: (value: string) => void
  onToggleFlag: () => void
}

export function QuestionCard({
  question, questionIndex, answer, isFlagged,
  examId, studentId, onAnswer, onToggleFlag,
}: QuestionCardProps) {
  const questionType = question.type || 'objective'
  const isTheory = questionType === 'theory'
  const displayNumber = questionIndex + 1
  
  // Get question text
  const questionText = question.question_text || question.question || ''
  const hasTableContent = hasTable(questionText)
  const hasChartContent = hasChart(questionText)
  const hasImageContent = hasImage(questionText)

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center",
            isTheory ? "bg-purple-50" : "bg-blue-50"
          )}>
            {isTheory ? (
              <FileText className="h-5 w-5 text-purple-500" />
            ) : (
              <Hash className="h-5 w-5 text-blue-500" />
            )}
          </div>
          <span className="font-bold text-slate-800 text-base">
            {isTheory ? 'Theory' : 'Question'} {displayNumber}
          </span>
          <Badge variant="outline" className={cn(
            "text-xs font-semibold px-2.5 py-0.5",
            isTheory 
              ? "bg-purple-50 text-purple-600 border-purple-200"
              : "bg-blue-50 text-blue-600 border-blue-200"
          )}>
            {isTheory ? 'Theory' : 'MCQ'}
          </Badge>
          
          {/* Content type badges */}
          {hasTableContent && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
              <Table className="h-3 w-3 mr-0.5" />
              Table
            </Badge>
          )}
          {hasChartContent && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
              <BarChart3 className="h-3 w-3 mr-0.5" />
              Chart
            </Badge>
          )}
          {hasImageContent && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
              <ImageIcon className="h-3 w-3 mr-0.5" />
              Image
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-lg font-semibold">
            <Award className="h-4 w-4" />
            <span>{formatPoints(question.points || 1)}</span>
          </div>
          <button
            onClick={onToggleFlag}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isFlagged 
                ? "bg-amber-100 text-amber-600" 
                : "hover:bg-slate-100 text-slate-300"
            )}
            title={isFlagged ? "Unflag" : "Flag for review"}
          >
            <Flag className="h-5 w-5" fill={isFlagged ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <CardContent className="p-5 sm:p-6">
        {/* Question Text */}
        <div className={cn(
          "rounded-xl p-5 mb-5 border-2",
          isTheory ? "bg-purple-50/50 border-purple-100" : "bg-slate-50 border-slate-100"
        )}>
          {renderContent(questionText)}
        </div>

        {/* Answer Area */}
        {isTheory ? (
          <TheoryAnswer key={question.id} answer={answer} onChange={onAnswer} examId={examId} studentId={studentId} />
        ) : question.options && question.options.length > 0 ? (
          <ObjectiveAnswer options={question.options} selectedValue={answer} onChange={onAnswer} />
        ) : (
          <TextAnswer answer={answer} onChange={onAnswer} />
        )}
      </CardContent>
    </Card>
  )
}