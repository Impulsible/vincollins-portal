"use client";

import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";

type Align = "left" | "center" | "right";
type Block =
  | { type: "text"; text: string }
  | { type: "table"; header: string[]; rows: string[][]; align: Align[] };

const SEP = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  return s
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, "|").trim());
}

export function hasTable(text: string) {
  return parseBlocks(text).some((b) => b.type === "table");
}

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let buf: string[] = [];

  const flush = () => {
    if (buf.length) blocks.push({ type: "text", text: buf.join("\n") });
    buf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];

    if (
      line.includes("|") &&
      next !== undefined &&
      SEP.test(next) &&
      next.includes("-")
    ) {
      flush();
      const header = splitRow(line);
      const align = splitRow(next).map((c) =>
        c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "left"
      ) as Align[];

      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i++;
      }
      i--;
      blocks.push({ type: "table", header, rows, align });
    } else {
      buf.push(line);
    }
  }
  flush();
  return blocks;
}

const Cell = ({ text }: { text: string }) => (
  <>
    {text.split(/<br\s*\/?>/i).map((part, i) => (
      <Fragment key={i}>
        {i > 0 && <br />}
        {part}
      </Fragment>
    ))}
  </>
);

export function QuestionContent({ text, className }: { text: string; className?: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <div className={cn("space-y-2", className)}>
      {blocks.map((b, i) =>
        b.type === "text" ? (
          b.text.trim() ? (
            <p key={i} className="whitespace-pre-wrap leading-relaxed">
              {b.text.trim()}
            </p>
          ) : null
        ) : (
          <div
            key={i}
            className="overflow-x-auto rounded-md border border-slate-300 dark:border-slate-700"
          >
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  {b.header.map((h, c) => (
                    <th
                      key={c}
                      style={{ textAlign: b.align[c] || "left" }}
                      className="border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 font-semibold align-top"
                    >
                      <Cell text={h} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri} className="even:bg-slate-50 dark:even:bg-slate-900/50">
                    {b.header.map((_, c) => (
                      <td
                        key={c}
                        style={{ textAlign: b.align[c] || "left" }}
                        className="border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 align-top"
                      >
                        <Cell text={r[c] ?? ""} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}