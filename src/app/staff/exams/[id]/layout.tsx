// app/staff/exams/[id]/layout.tsx
// ✅ This file is REQUIRED — it tells Next.js that [id] is a real
// route segment. Without it, Next.js falls back to the parent page.tsx
// and your sub-routes get intercepted.

export default function ExamDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}