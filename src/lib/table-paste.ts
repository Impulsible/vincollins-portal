// src/lib/table-paste.ts
// Converts clipboard content (HTML, TSV, space-aligned, or ASCII) into Markdown tables.

const SKIP = new Set([
  "STYLE", "SCRIPT", "META", "LINK", "TITLE", "HEAD",
  "XML", "O:P", "NOSCRIPT", "IFRAME", "OBJECT", "EMBED",
]);

const BLOCK = new Set([
  "P", "DIV", "UL", "OL", "H1", "H2", "H3", "H4", "H5", "H6",
  "SECTION", "ARTICLE", "BLOCKQUOTE", "PRE", "TR", "TABLE",
]);

const clean = (s: string) => s.replace(/\u00a0/g, " ");

function normalizeInline(s: string): string {
  return s
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function walk(node: Node, inCell: boolean): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return clean(node.textContent || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tag = el.tagName.toUpperCase();
  if (SKIP.has(tag)) return "";

  if (tag === "TABLE") {
    if (inCell) {
      return " " + normalizeInline(el.textContent || "") + " ";
    }
    const md = tableToMarkdown(el as HTMLTableElement);
    return md ? `\n\n${md}\n\n` : "";
  }

  if (tag === "BR") return "\n";

  const inner = Array.from(el.childNodes)
    .map((c) => walk(c, inCell))
    .join("");

  if (tag === "STRONG" || tag === "B") {
    const t = normalizeInline(inner);
    return t ? `**${t}**` : "";
  }
  if (tag === "EM" || tag === "I") {
    const t = normalizeInline(inner);
    return t ? `*${t}*` : "";
  }
  if (tag === "CODE") {
    const t = inner.replace(/\n/g, " ").trim();
    return t ? `\`${t}\`` : "";
  }
  if (tag === "A") {
    const href = el.getAttribute("href") || "";
    const t = normalizeInline(inner);
    return href && t ? `[${t}](${href})` : t;
  }
  if (tag === "LI") {
    const t = normalizeInline(inner);
    return t ? `\n- ${t}\n` : "";
  }
  if (tag === "SUP") {
    const t = normalizeInline(inner);
    return t ? `^${t}` : "";
  }
  if (tag === "SUB") {
    const t = normalizeInline(inner);
    return t ? `_${t}` : "";
  }
  if (BLOCK.has(tag)) {
    return `\n${inner}\n`;
  }
  return inner;
}

function cellToText(cell: Element): string {
  const raw = Array.from(cell.childNodes)
    .map((c) => walk(c, true))
    .join("");

  const lines = normalizeInline(raw)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.join("<br>").replace(/\|/g, "\\|");
}

function tableToMarkdown(table: HTMLTableElement): string {
  const grid: string[][] = [];

  Array.from(table.rows).forEach((tr, r) => {
    if (!grid[r]) grid[r] = [];
    let c = 0;
    Array.from(tr.cells).forEach((cell) => {
      while (grid[r][c] !== undefined) c++;
      const rs = Math.min(Math.max(1, cell.rowSpan || 1), 50);
      const cs = Math.min(Math.max(1, cell.colSpan || 1), 50);
      const text = cellToText(cell);
      for (let i = 0; i < rs; i++) {
        if (!grid[r + i]) grid[r + i] = [];
        for (let j = 0; j < cs; j++) {
          grid[r + i][c + j] = i === 0 && j === 0 ? text : "";
        }
      }
      c += cs;
    });
  });

  const cols = Math.max(0, ...grid.map((r) => r.length));
  const rows = grid.map((r) =>
    Array.from({ length: cols }, (_, i) => r[i] ?? "")
  );

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (!nonEmpty.length || !cols) return "";

  const line = (r: string[]) => `| ${r.map((c) => c || " ").join(" | ")} |`;
  const sep = `| ${Array.from({ length: cols }, () => "---").join(" | ")} |`;
  return [line(nonEmpty[0]), sep, ...nonEmpty.slice(1).map(line)].join("\n");
}

function tsvToMarkdown(text: string): string | null {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim() !== "");
  if (lines.length < 2) return null;
  const tabbed = lines.filter((l) => l.includes("\t"));
  if (tabbed.length < 2) return null;

  const rows = lines.map((l) =>
    l.split("\t").map((c) => c.trim().replace(/\|/g, "\\|"))
  );
  const cols = Math.max(...rows.map((r) => r.length));
  if (cols < 2) return null;

  const norm = rows.map((r) =>
    Array.from({ length: cols }, (_, i) => r[i] ?? "")
  );
  const line = (r: string[]) => `| ${r.map((c) => c || " ").join(" | ")} |`;
  return [
    line(norm[0]),
    `| ${Array.from({ length: cols }, () => "---").join(" | ")} |`,
    ...norm.slice(1).map(line),
  ].join("\n");
}

/** Converts space-aligned or plain-text tabular content into markdown */
function plainTextToMarkdown(text: string): string | null {
  const cleanText = text.replace(/\r/g, "").trim();
  if (!cleanText) return null;

  const lines = cleanText.split("\n");
  if (lines.length < 2) return null;

  const convertedLines: string[] = [];
  let tableBuffer: string[][] = [];

  const flushTable = () => {
    if (tableBuffer.length >= 2) {
      const maxCols = Math.max(...tableBuffer.map((r) => r.length));
      if (maxCols >= 2) {
        const norm = tableBuffer.map((r) => {
          const row = [...r];
          while (row.length < maxCols) row.push(" ");
          return row;
        });
        const header = `| ${norm[0].join(" | ")} |`;
        const sep = `| ${Array.from({ length: maxCols }, () => "---").join(" | ")} |`;
        const body = norm.slice(1).map((r) => `| ${r.join(" | ")} |`).join("\n");
        convertedLines.push(`${header}\n${sep}\n${body}`);
        tableBuffer = [];
        return;
      }
    }
    tableBuffer.forEach((row) => convertedLines.push(row.join(" ")));
    tableBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushTable();
      convertedLines.push("");
      continue;
    }

    // Split on 2 or more spaces or tabs
    const parts = trimmed.split(/\s{2,}|\t/).map((p) => p.trim()).filter(Boolean);

    if (parts.length >= 2) {
      tableBuffer.push(parts);
    } else {
      flushTable();
      convertedLines.push(trimmed);
    }
  }

  flushTable();
  const result = convertedLines.join("\n").trim();
  return result.includes("| --- |") ? result : null;
}

/** Main paste handler */
export function clipboardToMarkdown(data: DataTransfer): string | null {
  const html = data.getData("text/html");
  if (html && /<table[\s>]/i.test(html)) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("style,script,meta,link").forEach((n) => n.remove());
    const out = walk(doc.body, false)
      .split("\n")
      .map((l) => l.replace(/[ \t]+$/g, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (out) return out;
  }

  const plain = data.getData("text/plain");
  const tsv = tsvToMarkdown(plain);
  if (tsv) return tsv;

  return plainTextToMarkdown(plain);
}