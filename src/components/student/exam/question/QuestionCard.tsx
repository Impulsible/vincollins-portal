'use client'

import { Badge } from '@/components/ui/badge'
import {
  Award, Flag, Hash, FileText, Table as TableIcon,
  BarChart3, Image as ImageIcon, Code2, Sigma,
  ListOrdered, Quote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPoints } from '@/app/student/exam/[id]/utils/scoring'
import { ObjectiveAnswer } from '../answers/ObjectiveAnswer'
import { TheoryAnswer } from '../answers/TheoryAnswer'
import { TextAnswer } from '../answers/TextAnswer'
import type { Question } from '@/app/student/exam/[id]/types'
import { motion } from 'framer-motion'
import React from 'react'

// ═════════════════════════════════════════════════════════════════════════════
// CONTENT DETECTION
// ═════════════════════════════════════════════════════════════════════════════

const detect = {
  mdTable: (t: string) => !!t && t.includes('|') && /\n\s*\|?[\s:|-]*-{3,}[\s:|-]*\|?/.test(t),
  htmlTable: (t: string) => !!t && /<table[\s\S]*?<\/table>/i.test(t),
  asciiTable: (t: string) => !!t && t.includes('+--') && t.includes('--+'),
  codeBlock: (t: string) => !!t && /```[\s\S]*?```/.test(t),
  inlineCode: (t: string) => !!t && /`[^`\n]+`/.test(t),
  mdImage: (t: string) => !!t && /!\[[^\]]*\]\([^)]+\)/.test(t),
  htmlImage: (t: string) => !!t && /<img[^>]+>/i.test(t),
  math: (t: string) => !!t && (/\$\$[\s\S]+?\$\$/.test(t) || /\\\([\s\S]+?\\\)/.test(t) || /\\\[[\s\S]+?\\\]/.test(t)),
  chart: (t: string) => !!t && /\b(chart|graph|diagram|plot|histogram|bar chart|pie chart|line graph|scatter plot)\b/i.test(t),
  list: (t: string) => !!t && (/^\s*[-*+]\s+/m.test(t) || /^\s*\d+\.\s+/m.test(t)),
  heading: (t: string) => !!t && /^#{1,6}\s+/m.test(t),
  blockquote: (t: string) => !!t && /^>\s+/m.test(t),
  bold: (t: string) => !!t && /\*\*[^*\n]+\*\*/.test(t),
  italic: (t: string) => !!t && /(?<!\*)\*[^*\n]+\*(?!\*)/.test(t),
}

const hasTable = (t: string) => detect.mdTable(t) || detect.htmlTable(t) || detect.asciiTable(t)
const hasImage = (t: string) => detect.mdImage(t) || detect.htmlImage(t)

// ═════════════════════════════════════════════════════════════════════════════
// SANITIZATION — prevents XSS in dangerouslySetInnerHTML
// ═════════════════════════════════════════════════════════════════════════════

const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\s*on\w+\s*=\s*(["'])[\s\S]*?\1/gi, '')
    .replace(/javascript:/gi, '')
}

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ═════════════════════════════════════════════════════════════════════════════
// MARKDOWN TABLE → HTML
// ═════════════════════════════════════════════════════════════════════════════

const extractMarkdownTables = (text: string): { html: string; remaining: string } => {
  const lines = text.split('\n')
  const output: string[] = []
  const tables: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const next = lines[i + 1]
    const isTableStart =
      line.includes('|') &&
      next &&
      /^\s*\|?[\s:|-]*-{3,}[\s:|-]*\|?\s*$/.test(next)

    if (isTableStart) {
      const headerLine = line
      const separator = next
      const rows: string[] = []
      let j = i + 2
      while (j < lines.length && lines[j].includes('|') && lines[j].trim() !== '') {
        rows.push(lines[j])
        j++
      }

      // Build HTML
      const parseCells = (ln: string) => ln.split('|').map(c => c.trim()).filter((_, idx, arr) => {
        // drop leading/trailing empty cells created by | pipes
        return !(idx === 0 && arr[0] === '') && !(idx === arr.length - 1 && arr[arr.length - 1] === '')
      })

      const headers = parseCells(headerLine)
      const alignments = parseCells(separator).map(s => {
        if (/^:-+:$/.test(s)) return 'center'
        if (/^-+:$/.test(s)) return 'right'
        return 'left'
      })

      let tableHtml = '<table class="min-w-full border-collapse"><thead><tr>'
      headers.forEach((h, idx) => {
        tableHtml += `<th class="px-4 py-2.5 text-${alignments[idx] || 'left'} text-xs font-bold text-slate-700 uppercase tracking-wider bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">${escapeHtml(h)}</th>`
      })
      tableHtml += '</tr></thead><tbody>'
      rows.forEach((row, rowIdx) => {
        const cells = parseCells(row)
        const bg = rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
        tableHtml += `<tr class="${bg} hover:bg-indigo-50/40 transition-colors">`
        cells.forEach((c, idx) => {
          tableHtml += `<td class="px-4 py-2.5 text-${alignments[idx] || 'left'} text-sm text-slate-700 border border-slate-200">${escapeHtml(c)}</td>`
        })
        tableHtml += '</tr>'
      })
      tableHtml += '</tbody></table>'
      tables.push(tableHtml)
      output.push(`[[TABLE_${tables.length - 1}]]`)

      i = j
    } else {
      output.push(line)
      i++
    }
  }

  return {
    html: tables.join('\n'),
    remaining: output.join('\n'),
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// INLINE MARKDOWN FORMATTING (bold, italic, code, links)
// ═════════════════════════════════════════════════════════════════════════════

const renderInline = (text: string): React.ReactNode => {
  // Split by code first, then handle other formatting
  const parts: Array<{ type: string; content: string }> = []
  let remaining = text
  let safety = 0

  const patterns: { type: string; re: RegExp }[] = [
    { type: 'code', re: /`([^`\n]+)`/ },
    { type: 'bold', re: /\*\*([^*\n]+)\*\*/ },
    { type: 'italic', re: /(?<!\*)\*([^*\n]+)\*(?!\*)/ },
    { type: 'link', re: /\[([^\]]+)\]\(([^)]+)\)/ },
  ]

  while (remaining && safety++ < 500) {
    let earliest: { match: RegExpExecArray; type: string } | null = null
    for (const p of patterns) {
      const m = p.re.exec(remaining)
      if (m && (!earliest || m.index < earliest.match.index)) {
        earliest = { match: m, type: p.type }
      }
    }
    if (!earliest) {
      parts.push({ type: 'text', content: remaining })
      break
    }
    if (earliest.match.index > 0) {
      parts.push({ type: 'text', content: remaining.slice(0, earliest.match.index) })
    }
    const content = earliest.type === 'link'
      ? JSON.stringify({ text: earliest.match[1], href: earliest.match[2] })
      : earliest.match[1]
    parts.push({ type: earliest.type, content })
    remaining = remaining.slice(earliest.match.index + earliest.match[0].length)
  }

  return parts.map((p, i) => {
    switch (p.type) {
      case 'code':
        return (
          <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[13px] ring-1 ring-slate-200">
            {p.content}
          </code>
        )
      case 'bold':
        return <strong key={i} className="font-bold text-slate-900">{p.content}</strong>
      case 'italic':
        return <em key={i} className="italic text-slate-800">{p.content}</em>
      case 'link': {
        const { text, href } = JSON.parse(p.content)
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2 font-medium">
            {text}
          </a>
        )
      }
      default:
        return <React.Fragment key={i}>{p.content}</React.Fragment>
    }
  })
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK RENDERERS
// ═════════════════════════════════════════════════════════════════════════════

const renderCodeBlock = (code: string, lang?: string, key?: React.Key) => (
  <div key={key} className="my-3 relative overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-800 shadow-sm">
    {lang && (
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <Code2 className="h-3 w-3 text-slate-400" />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{lang}</span>
      </div>
    )}
    <pre className="p-4 overflow-x-auto">
      <code className="text-[13px] font-mono text-slate-100 leading-relaxed whitespace-pre">
        {code}
      </code>
    </pre>
  </div>
)

const renderBlockquote = (text: string, key?: React.Key) => (
  <blockquote key={key} className="my-3 pl-4 py-2 border-l-4 border-indigo-400 bg-gradient-to-r from-indigo-50/60 to-transparent rounded-r-lg">
    <div className="flex gap-2.5">
      <Quote className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
      <p className="text-slate-700 italic text-[15px] leading-relaxed">{renderInline(text)}</p>
    </div>
  </blockquote>
)

const renderHeading = (level: number, text: string, key?: React.Key) => {
  const sizes = ['text-xl', 'text-lg', 'text-base', 'text-sm', 'text-sm', 'text-xs']
  const cls = cn('font-bold text-slate-900 mt-3 mb-1.5 leading-tight', sizes[level - 1])
  return <div key={key} className={cls}>{renderInline(text)}</div>
}

const renderList = (items: string[], ordered: boolean, key?: React.Key) => (
  <div key={key} className="my-2 space-y-1.5">
    {items.map((item, i) => (
      <div key={i} className="flex gap-2.5 pl-1">
        {ordered ? (
          <span className="flex-shrink-0 min-w-[20px] text-indigo-600 font-bold text-sm tabular-nums">
            {i + 1}.
          </span>
        ) : (
          <span className="flex-shrink-0 mt-2 h-1.5 w-1.5 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500" />
        )}
        <span className="text-slate-700 text-[15px] leading-relaxed flex-1">
          {renderInline(item)}
        </span>
      </div>
    ))}
  </div>
)

const renderMarkdownImage = (text: string, key?: React.Key) => {
  const match = /!\[([^\]]*)\]\(([^)]+)\)/.exec(text)
  if (!match) return null
  const [, alt, src] = match
  return (
    <figure key={key} className="my-3 flex flex-col items-center">
      <div className="relative rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-sm bg-slate-50 max-w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt || 'Image'} className="max-h-[320px] max-w-full object-contain" />
      </div>
      {alt && (
        <figcaption className="text-xs text-slate-500 italic mt-2 text-center">
          {alt}
        </figcaption>
      )}
    </figure>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN CONTENT RENDERER
// ═════════════════════════════════════════════════════════════════════════════

const renderContent = (text: string): React.ReactNode => {
  if (!text) return null

  // Extract code blocks first (``` ``` protects their content)
  const codeBlocks: Array<{ lang: string; code: string }> = []
  let processed = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push({ lang: lang || '', code: code.trimEnd() })
    return `[[CODE_${codeBlocks.length - 1}]]`
  })

  // Extract markdown tables
  const { html: tablesHtml, remaining } = extractMarkdownTables(processed)
  const tableBlocks = tablesHtml ? tablesHtml.split('\n').filter(Boolean) : []
  processed = remaining

  // Extract HTML tables
  const htmlTables: string[] = []
  processed = processed.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
    htmlTables.push(match)
    return `[[HTMLTABLE_${htmlTables.length - 1}]]`
  })

  // Extract ASCII tables (blocks of consecutive +--/|-- lines)
  const asciiTables: string[] = []
  const asciiTableRegex = /((?:^[+|].*$\n?){2,})/gm
  processed = processed.replace(asciiTableRegex, (match) => {
    if (match.includes('+--') || match.includes('--+')) {
      asciiTables.push(match)
      return `[[ASCIITABLE_${asciiTables.length - 1}]]`
    }
    return match
  })

  // Extract markdown images
  const images: string[] = []
  processed = processed.replace(/!\[[^\]]*\]\([^)]+\)/g, (match) => {
    images.push(match)
    return `[[IMG_${images.length - 1}]]`
  })

  // Extract HTML images
  const htmlImages: string[] = []
  processed = processed.replace(/<img[^>]+>/gi, (match) => {
    htmlImages.push(match)
    return `[[HTMLIMG_${htmlImages.length - 1}]]`
  })

  // Now split into blocks (paragraphs separated by blank lines)
  const blocks = processed.split(/\n\s*\n/).filter(b => b.trim())
  const rendered: React.ReactNode[] = []

  blocks.forEach((block, blockIdx) => {
    const trimmed = block.trim()

    // Placeholder for extracted elements
    const placeholderMatch = /^\[\[(CODE|HTMLTABLE|ASCIITABLE|IMG|HTMLIMG)_(\d+)\]\]$/.exec(trimmed)
    if (placeholderMatch) {
      const [, kind, idxStr] = placeholderMatch
      const idx = parseInt(idxStr, 10)
      if (kind === 'CODE') {
        const cb = codeBlocks[idx]
        rendered.push(renderCodeBlock(cb.code, cb.lang, `cb-${blockIdx}`))
      } else if (kind === 'HTMLTABLE') {
        rendered.push(
          <div key={`htmltbl-${blockIdx}`} className="my-3 overflow-x-auto rounded-xl ring-1 ring-slate-200 shadow-sm">
            <div
              className="w-full text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_th]:text-slate-700 [&_th]:uppercase [&_th]:tracking-wider [&_th]:bg-gradient-to-br [&_th]:from-slate-50 [&_th]:to-slate-100 [&_th]:border [&_th]:border-slate-200 [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-sm [&_td]:text-slate-700 [&_td]:border [&_td]:border-slate-200 [&_tr:nth-child(even)]:bg-slate-50/40"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlTables[idx]) }}
            />
          </div>
        )
      } else if (kind === 'ASCIITABLE') {
        rendered.push(
          <pre key={`ascii-${blockIdx}`} className="my-3 p-4 rounded-xl bg-slate-900 text-slate-100 text-[13px] font-mono overflow-x-auto ring-1 ring-slate-800 whitespace-pre leading-relaxed">
            {asciiTables[idx]}
          </pre>
        )
      } else if (kind === 'IMG') {
        rendered.push(renderMarkdownImage(images[idx], `img-${blockIdx}`))
      } else if (kind === 'HTMLIMG') {
        rendered.push(
          <div key={`htmlimg-${blockIdx}`} className="my-3 flex justify-center">
            <div
              className="rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-sm [&_img]:max-h-[320px] [&_img]:max-w-full [&_img]:object-contain"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlImages[idx]) }}
            />
          </div>
        )
      }
      return
    }

    // Blockquote
    if (/^>\s+/m.test(trimmed)) {
      const quoted = trimmed.split('\n').map(l => l.replace(/^>\s?/, '')).join(' ')
      rendered.push(renderBlockquote(quoted, `bq-${blockIdx}`))
      return
    }

    // Heading
    const hMatch = /^(#{1,6})\s+(.+)$/m.exec(trimmed)
    if (hMatch && trimmed === hMatch[0]) {
      rendered.push(renderHeading(hMatch[1].length, hMatch[2], `h-${blockIdx}`))
      return
    }

    // Lists
    const lines = trimmed.split('\n')
    const unorderedItems = lines.filter(l => /^\s*[-*+]\s+/.test(l))
    const orderedItems = lines.filter(l => /^\s*\d+\.\s+/.test(l))

    if (unorderedItems.length === lines.length && unorderedItems.length > 0) {
      const items = unorderedItems.map(l => l.replace(/^\s*[-*+]\s+/, ''))
      rendered.push(renderList(items, false, `ul-${blockIdx}`))
      return
    }
    if (orderedItems.length === lines.length && orderedItems.length > 0) {
      const items = orderedItems.map(l => l.replace(/^\s*\d+\.\s+/, ''))
      rendered.push(renderList(items, true, `ol-${blockIdx}`))
      return
    }

    // Mixed content block: handle inline placeholders within paragraphs
    const parts = trimmed.split(/(\[\[(?:CODE|HTMLTABLE|ASCIITABLE|IMG|HTMLIMG)_\d+\]\])/)
    const nodes: React.ReactNode[] = []
    parts.forEach((part, i) => {
      const pm = /^\[\[(CODE|HTMLTABLE|ASCIITABLE|IMG|HTMLIMG)_(\d+)\]\]$/.exec(part)
      if (pm) {
        const [, kind, idxStr] = pm
        const idx = parseInt(idxStr, 10)
        if (kind === 'CODE') nodes.push(renderCodeBlock(codeBlocks[idx].code, codeBlocks[idx].lang, `inline-cb-${blockIdx}-${i}`))
        else if (kind === 'IMG') nodes.push(renderMarkdownImage(images[idx], `inline-img-${blockIdx}-${i}`))
      } else if (part) {
        // Regular paragraph with inline formatting
        const paraLines = part.split('\n').filter(l => l.trim())
        paraLines.forEach((pl, pi) => {
          nodes.push(
            <p key={`p-${blockIdx}-${i}-${pi}`} className="text-slate-700 leading-relaxed text-[15px]">
              {renderInline(pl)}
            </p>
          )
        })
      }
    })
    rendered.push(
      <div key={`block-${blockIdx}`} className="space-y-2">
        {nodes}
      </div>
    )
  })

  return <div className="space-y-2">{rendered}</div>
}

// ═════════════════════════════════════════════════════════════════════════════
// CONTENT TYPE PILL
// ═════════════════════════════════════════════════════════════════════════════

function ContentPill({
  icon: Icon,
  label,
  gradient,
}: {
  icon: React.ElementType
  label: string
  gradient: string
}) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md ring-1 text-[10px] font-bold uppercase tracking-wider',
      gradient
    )}>
      <Icon className="h-2.5 w-2.5" />
      <span>{label}</span>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

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
  question,
  questionIndex,
  answer,
  isFlagged,
  examId,
  studentId,
  onAnswer,
  onToggleFlag,
}: QuestionCardProps) {
  const questionType = question.type || 'objective'
  const isTheory = questionType === 'theory'
  const displayNumber = questionIndex + 1

  const questionText = question.question_text || question.question || ''

  const contentTypes = {
    hasTable: hasTable(questionText),
    hasChart: detect.chart(questionText),
    hasImage: hasImage(questionText),
    hasCode: detect.codeBlock(questionText) || detect.inlineCode(questionText),
    hasMath: detect.math(questionText),
    hasList: detect.list(questionText),
  }

  // Theme
  const theme = isTheory
    ? {
        heroGradient: 'from-fuchsia-600 via-purple-600 to-indigo-600',
        accentGradient: 'from-fuchsia-500 via-purple-500 to-indigo-500',
        iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
        iconShadow: 'shadow-purple-500/30',
        label: 'Theory',
        labelLong: 'Written Response',
        Icon: FileText,
        questionBg: 'bg-gradient-to-br from-fuchsia-50/60 via-purple-50/40 to-indigo-50/30',
        questionRing: 'ring-fuchsia-200/50',
        numberBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
        numberShadow: 'shadow-fuchsia-500/30',
      }
    : {
        heroGradient: 'from-blue-600 via-indigo-600 to-violet-600',
        accentGradient: 'from-blue-500 via-indigo-500 to-violet-500',
        iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        iconShadow: 'shadow-indigo-500/30',
        label: 'MCQ',
        labelLong: 'Multiple Choice',
        Icon: Hash,
        questionBg: 'bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-violet-50/30',
        questionRing: 'ring-indigo-200/50',
        numberBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        numberShadow: 'shadow-indigo-500/30',
      }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl bg-white ring-1 ring-slate-200/80 shadow-sm overflow-hidden"
    >
      {/* Top accent */}
      <div className={cn('h-1 bg-gradient-to-r', theme.accentGradient)} />

      {/* HEADER */}
      <div className={cn(
        'relative bg-gradient-to-br px-5 py-4 overflow-hidden',
        theme.heroGradient
      )}>
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-black/10 rounded-full blur-2xl" />

        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center shadow-lg shrink-0">
              <theme.Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-bold text-white/70 uppercase tracking-[0.14em]">
                  {theme.labelLong}
                </div>
              </div>
              <div className="text-sm font-bold text-white leading-tight">
                {theme.label} Question {displayNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
              <Award className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-bold text-white tabular-nums">
                {formatPoints(question.points || 1)}
              </span>
            </div>
            <button
              onClick={onToggleFlag}
              className={cn(
                'relative p-2 rounded-xl transition-all',
                isFlagged
                  ? 'bg-amber-400 text-amber-900 shadow-md shadow-amber-400/40 ring-1 ring-amber-300'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 ring-1 ring-white/20'
              )}
              title={isFlagged ? 'Unflag' : 'Flag for review'}
            >
              <Flag className="h-4 w-4" fill={isFlagged ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Content type pills row */}
        {(contentTypes.hasTable || contentTypes.hasChart || contentTypes.hasImage ||
          contentTypes.hasCode || contentTypes.hasMath || contentTypes.hasList) && (
          <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
            {contentTypes.hasTable && (
              <ContentPill icon={TableIcon} label="Table" gradient="bg-white/15 text-white ring-white/20 backdrop-blur-sm" />
            )}
            {contentTypes.hasChart && (
              <ContentPill icon={BarChart3} label="Chart" gradient="bg-white/15 text-white ring-white/20 backdrop-blur-sm" />
            )}
            {contentTypes.hasImage && (
              <ContentPill icon={ImageIcon} label="Image" gradient="bg-white/15 text-white ring-white/20 backdrop-blur-sm" />
            )}
            {contentTypes.hasCode && (
              <ContentPill icon={Code2} label="Code" gradient="bg-white/15 text-white ring-white/20 backdrop-blur-sm" />
            )}
            {contentTypes.hasMath && (
              <ContentPill icon={Sigma} label="Math" gradient="bg-white/15 text-white ring-white/20 backdrop-blur-sm" />
            )}
            {contentTypes.hasList && (
              <ContentPill icon={ListOrdered} label="List" gradient="bg-white/15 text-white ring-white/20 backdrop-blur-sm" />
            )}
          </div>
        )}
      </div>

      {/* QUESTION BODY */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Question card */}
        <div className={cn(
          'relative rounded-2xl p-5 ring-1 overflow-hidden',
          theme.questionBg,
          theme.questionRing
        )}>
          <div className="flex gap-3 sm:gap-4">
            <div className={cn(
              'flex-shrink-0 w-9 h-9 rounded-xl text-white text-sm font-bold flex items-center justify-center shadow-md',
              theme.numberBg,
              theme.numberShadow
            )}>
              {displayNumber}
            </div>
            <div className="flex-1 min-w-0 pt-1 overflow-x-auto">
              {renderContent(questionText)}
            </div>
          </div>
        </div>

        {/* Answer area */}
        <div>
          {isTheory ? (
            <TheoryAnswer
              key={question.id}
              answer={answer}
              onChange={onAnswer}
              examId={examId}
              studentId={studentId}
            />
          ) : question.options && question.options.length > 0 ? (
            <ObjectiveAnswer
              options={question.options}
              selectedValue={answer}
              onChange={onAnswer}
            />
          ) : (
            <TextAnswer answer={answer} onChange={onAnswer} />
          )}
        </div>
      </div>
    </motion.div>
  )
}