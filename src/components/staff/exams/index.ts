// src/components/staff/exams/index.ts - FIXED VERSION

// ✅ Import default then re-export as named
import ExamViewer from './ExamViewer'

// Export the default import as a named export
export { ExamViewer }

// Export other components
export { ExamList } from './ExamList'
export { ExamStats } from './ExamStats'
export { ExamFilters } from './ExamFilters'
export { ExamTable } from './ExamTable'
// ExamEditor removed - use EditExamPage instead
export { DeleteExamDialog } from './DeleteExamDialog'
export { GrantAttemptDialog } from './GrantAttemptDialog'