// components/shared/ReportCardTemplate.tsx
'use client'

import { cn } from '@/lib/utils'

interface SubjectScore {
  subject: string
  ca: number
  exam: number
  total: number
  grade: string
  remark: string
}

interface RatingItem {
  name: string
  rating: number
}

interface ReportCardData {
  student_name: string
  admission_number?: string
  class: string
  dob?: string
  gender?: string
  term: string
  academic_year: string
  next_term_begins?: string
  total_days?: number
  days_present?: number
  
  subject_scores: SubjectScore[]
  average_score: number
  total_score: number
  grade: string
  remarks: string
  
  behavior_ratings: RatingItem[]
  skill_ratings: RatingItem[]
  
  teacher_comments: string
  principal_comments: string
  
  school_name?: string
  school_logo?: string
  student_photo?: string
}

const getTermLabel = (term: string): string => {
  const t: Record<string, string> = { first: 'First Term', second: 'Second Term', third: 'Third Term' }
  return t[term] || term
}

// ============================================
// WAEC GRADING SYSTEM
// ============================================
const getGradeStyle = (grade: string): string => {
  switch (grade) {
    case 'A1': return 'bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'B2':
    case 'B3': return 'bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'C4':
    case 'C5':
    case 'C6': return 'bg-cyan-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'D7':
    case 'E8': return 'bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    case 'F9': return 'bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
    default: return 'bg-gray-500 text-white font-bold px-2 py-0.5 rounded text-[10px] inline-block print:text-[9px]'
  }
}

const getOverallGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return 'text-emerald-700 font-bold'
    case 'B': return 'text-blue-700 font-bold'
    case 'C': return 'text-cyan-700 font-bold'
    case 'P': return 'text-amber-700 font-bold'
    case 'F': return 'text-red-700 font-bold'
    default: return 'text-gray-700'
  }
}

interface ReportCardTemplateProps {
  data: ReportCardData
}

export function ReportCardTemplate({ data }: ReportCardTemplateProps) {
  const subjects: SubjectScore[] = data.subject_scores || []
  const behaviors: RatingItem[] = data.behavior_ratings || []
  const skills: RatingItem[] = data.skill_ratings || []
  const schoolName: string = data.school_name || 'Vincollins College'
  const formattedAvg = data.average_score?.toFixed(2) || '0.00'

  const bestSubject = subjects.length > 0
    ? subjects.reduce((a, b) => a.total > b.total ? a : b)
    : null

  const worstSubject = subjects.length > 0
    ? subjects.reduce((a, b) => a.total < b.total ? a : b)
    : null

  const showAreaForImprovement = worstSubject && worstSubject.total < 50

  return (
    <div className="bg-white w-full max-w-[210mm] mx-auto text-black border-2 border-blue-900 print:border-2 print:border-blue-900 print:max-w-full print:mx-0 p-4 print:p-3" id="report-card-print">
      
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; background: white !important; margin: 0 !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          table { border-collapse: collapse !important; width: 100% !important; min-width: 0 !important; max-width: 100% !important; table-layout: auto !important; }
          th, td { border-color: #000 !important; word-break: break-word !important; }
          .overflow-x-auto { overflow: visible !important; }
          [class*="overflow"] { overflow: visible !important; }
          img { max-width: 100% !important; }
        }
        @media screen {
          .report-table td, .report-table th { font-size: 10px; }
        }
      `}</style>

      <div className="p-0">
        
        {/* ═══ HEADER ═══ */}
        <div className="border-b-2 border-blue-900 pb-3 mb-3 print:pb-2 print:mb-2">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3">
            <div className="w-16 print:w-14 hidden sm:block">
              {data.school_logo ? (
                <img src={data.school_logo} alt="logo" className="w-14 h-14 object-contain print:w-12 print:h-12" />
              ) : (
                <div className="w-14 h-14 border-2 border-blue-900 rounded flex items-center justify-center text-[8px] text-slate-400">LOGO</div>
              )}
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-[18px] font-bold uppercase text-blue-900 print:text-[15px] tracking-wide">
                {schoolName}
              </h1>
              <p className="text-[10px] print:text-[9px] text-gray-800">Tel: +234 912 1155 554 | Email: vincollinscollege@gmail.com</p>
              <p className="text-[9px] italic text-amber-700 mt-1 print:text-[8px] font-medium">"Geared Towards Excellence"</p>
              <h2 className="font-bold mt-2 text-[14px] print:text-[12px] text-blue-900">
                {getTermLabel(data.term)} Student's Performance Report
              </h2>
              <p className="text-[10px] mt-1 font-semibold print:text-[9px] text-gray-800">Academic Session: {data.academic_year}</p>
            </div>
            <div className="w-16 h-20 sm:w-20 sm:h-24 border-2 border-blue-900 rounded overflow-hidden print:w-16 print:h-20">
              {data.student_photo ? (
                <img src={data.student_photo} alt="student" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[8px] sm:text-xs">Photo</div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ STUDENT INFO ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] mb-4 print:mb-3 print:text-[10px]">
          <div className="flex flex-wrap">
            <span className="font-bold w-28 sm:w-32 text-gray-800">Name:</span>
            <span className="break-words text-black">{data.student_name}</span>
          </div>
          <div className="flex flex-wrap">
            <span className="font-bold w-28 sm:w-32 text-gray-800">Admission No:</span>
            <span className="text-black">{data.admission_number || '—'}</span>
          </div>
          <div className="flex flex-wrap">
            <span className="font-bold w-28 sm:w-32 text-gray-800">Class:</span>
            <span className="text-black">{data.class}</span>
          </div>
          <div className="flex flex-wrap">
            <span className="font-bold w-28 sm:w-32 text-gray-800">Term:</span>
            <span className="text-black">{getTermLabel(data.term)}</span>
          </div>
          <div className="flex flex-wrap">
            <span className="font-bold w-28 sm:w-32 text-gray-800">Session:</span>
            <span className="text-black">{data.academic_year}</span>
          </div>
          <div className="flex flex-wrap">
            <span className="font-bold w-28 sm:w-32 text-gray-800">Next Term:</span>
            <span className="break-words text-black">{data.next_term_begins || 'To be announced'}</span>
          </div>
          {data.total_days ? (
            <>
              <div className="flex flex-wrap">
                <span className="font-bold w-28 sm:w-32 text-gray-800">Total Days:</span>
                <span className="text-black">{data.total_days}</span>
              </div>
              <div className="flex flex-wrap">
                <span className="font-bold w-28 sm:w-32 text-gray-800">Days Present:</span>
                <span className="text-black">{data.days_present || 0}</span>
              </div>
            </>
          ) : null}
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4 print:grid-cols-[70%_30%] print:gap-3">
          {/* LEFT COLUMN */}
          <div className="min-w-0">
            <div className="print:overflow-visible">
              <table className="w-full border-collapse border-2 border-blue-900 text-[10px] print:text-[9px] print:w-full">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="border border-blue-500 px-2 py-2 text-left print:text-[9px] print:py-1.5 print:px-1.5">Subjects</th>
                    <th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">CA</th>
                    <th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">Exam</th>
                    <th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">Total</th>
                    <th className="border border-blue-500 px-2 py-2 text-center w-10 print:text-[9px] print:py-1.5 print:px-1">Grade</th>
                    <th className="border border-blue-500 px-2 py-2 text-left print:text-[9px] print:py-1.5 print:px-1.5">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-500">No scores available</td>
                    </tr>
                  ) : (
                    subjects.map((subject, index) => (
                      <tr key={`${subject.subject}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-400 px-2 py-1.5 break-words print:text-[9px] print:py-1 print:px-1.5 text-black font-medium">{subject.subject}</td>
                        <td className="border border-gray-400 text-center print:text-[9px] print:py-1 print:px-1 text-black">{subject.ca}</td>
                        <td className="border border-gray-400 text-center print:text-[9px] print:py-1 print:px-1 text-black">{subject.exam}</td>
                        <td className="border border-gray-400 text-center font-bold print:text-[9px] print:py-1 print:px-1 text-black">{subject.total}</td>
                        <td className="border border-gray-400 text-center print:py-1">
                          <span className={getGradeStyle(subject.grade)}>{subject.grade}</span>
                        </td>
                        <td className="border border-gray-400 px-2 py-1.5 print:text-[9px] print:py-1 print:px-1.5 text-black">{subject.remark}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-blue-50 font-bold">
                  <tr>
                    <td colSpan={3} className="border border-gray-400 px-2 py-2 text-right print:text-[10px] print:py-1.5 text-black">TOTAL / AVERAGE:</td>
                    <td className="border border-gray-400 text-center print:text-[10px] print:py-1.5 text-black">{data.total_score}</td>
                    <td className="border border-gray-400 text-center print:py-1.5">
                      <span className={getOverallGradeColor(data.grade)}>{data.grade}</span>
                    </td>
                    <td className="border border-gray-400 text-center print:text-[10px] print:py-1.5 text-black">{formattedAvg}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* REMARKS */}
            <div className="mt-4 space-y-2 print:mt-3">
              <div className="border-l-4 border-purple-600 bg-purple-50 p-3 text-[10px] print:text-[9px] print:p-2 rounded-r">
                <div className="font-bold text-purple-800 mb-1 flex items-center gap-1">
                  <span>✨</span> CLASS TEACHER'S REMARK
                </div>
                <p className="italic text-gray-800 leading-relaxed">{data.teacher_comments || 'No comment available.'}</p>
              </div>
              <div className="border-l-4 border-blue-600 bg-blue-50 p-3 text-[10px] print:text-[9px] print:p-2 rounded-r">
                <div className="font-bold text-blue-800 mb-1">PRINCIPAL'S REMARK</div>
                <p className="italic text-gray-800 leading-relaxed">{data.principal_comments || 'No comment available.'}</p>
              </div>
            </div>

            {/* GRADE SCALE */}
            <div className="mt-3 print:mt-2">
              <div className="bg-blue-700 text-white text-[10px] px-3 py-1.5 font-bold rounded-t print:text-[9px]">Grade Scale</div>
              <div className="border-2 border-t-0 border-blue-900 p-2 rounded-b">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[9px] print:text-[8px]">
                  <div className="flex items-center gap-1"><span className={getGradeStyle('A1')}>A1</span> <span className="text-gray-800">75-100</span></div>
                  <div className="flex items-center gap-1"><span className={getGradeStyle('B2')}>B2</span> <span className="text-gray-800">70-74</span></div>
                  <div className="flex items-center gap-1"><span className={getGradeStyle('B3')}>B3</span> <span className="text-gray-800">65-69</span></div>
                  <div className="flex items-center gap-1"><span className={getGradeStyle('C4')}>C4</span> <span className="text-gray-800">60-64</span></div>
                  <div className="flex items-center gap-1"><span className={getGradeStyle('C5')}>C5</span> <span className="text-gray-800">55-59</span></div>
                  <div className="flex items-center gap-1"><span className={getGradeStyle('C6')}>C6</span> <span className="text-gray-800">50-54</span></div>
                  <div className="flex items-center gap-1"><span className={getGradeStyle('D7')}>D7</span> <span className="text-gray-800">45-49</span></div>
                  <div className="flex items-center gap-1"><span className={getGradeStyle('E8')}>E8</span> <span className="text-gray-800">40-44</span></div>
                  <div className="flex items-center gap-1"><span className={getGradeStyle('F9')}>F9</span> <span className="text-gray-800">0-39</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-3 print:space-y-2">
            <div className="border-2 border-blue-900">
              <div className="bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 uppercase print:text-[9px] print:py-1">Performance Summary</div>
              <div className="p-3 text-[10px] space-y-1.5 print:text-[9px] print:p-2 print:space-y-1">
                <div className="flex justify-between flex-wrap">
                  <span className="text-gray-800">Total Score:</span>
                  <span className="font-bold text-black">{data.total_score}</span>
                </div>
                <div className="flex justify-between flex-wrap">
                  <span className="text-gray-800">Average:</span>
                  <span className="font-bold text-black">{formattedAvg}%</span>
                </div>
                <div className="flex justify-between flex-wrap">
                  <span className="text-gray-800">Grade:</span>
                  <span className={getOverallGradeColor(data.grade)}>{data.grade}</span>
                </div>
                <div className="flex justify-between flex-wrap">
                  <span className="text-gray-800">Subjects:</span>
                  <span className="font-bold text-black">{subjects.length}</span>
                </div>
                {bestSubject && (
                  <div className="flex justify-between text-emerald-700 pt-1 border-t border-gray-300 flex-wrap">
                    <span>Best:</span>
                    <span className="font-bold text-right break-words max-w-[140px]">{bestSubject.subject} ({bestSubject.total})</span>
                  </div>
                )}
                {showAreaForImprovement && (
                  <div className="flex justify-between text-red-600 flex-wrap">
                    <span>Improve:</span>
                    <span className="font-bold text-right break-words max-w-[140px]">{worstSubject.subject}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-2 border-blue-900">
              <div className="bg-blue-700 text-white text-[9px] font-bold px-3 py-1.5 uppercase print:text-[8px] print:py-1">Affective Domain</div>
              <div className="p-2 text-[9px] space-y-1 print:text-[8px] print:space-y-0.5">
                {behaviors.map((item) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="text-gray-800">{item.name}</span>
                    <span className="font-bold text-blue-700">{item.rating}</span>
                  </div>
                ))}
                {behaviors.length === 0 && (
                  <div className="text-gray-400 italic">No ratings available</div>
                )}
              </div>
            </div>

            <div className="border-2 border-blue-900">
              <div className="bg-blue-700 text-white text-[9px] font-bold px-3 py-1.5 uppercase print:text-[8px] print:py-1">Psychomotor Skills</div>
              <div className="p-2 text-[9px] space-y-1 print:text-[8px] print:space-y-0.5">
                {skills.map((item) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="text-gray-800">{item.name}</span>
                    <span className="font-bold text-green-700">{item.rating}</span>
                  </div>
                ))}
                {skills.length === 0 && (
                  <div className="text-gray-400 italic">No ratings available</div>
                )}
              </div>
            </div>

            <div className="border-2 border-blue-900">
              <div className="bg-blue-700 text-white text-[9px] font-bold px-3 py-1.5 uppercase print:text-[8px] print:py-1">Rating Key</div>
              <div className="p-2 text-[8px] space-y-0.5 print:text-[7px] print:space-y-0">
                <div className="text-gray-800">5 - Excellent</div>
                <div className="text-gray-800">4 - Very Good</div>
                <div className="text-gray-800">3 - Good</div>
                <div className="text-gray-800">2 - Fair</div>
                <div className="text-gray-800">1 - Poor</div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t-2 border-blue-900 mt-4 pt-2 text-center text-[9px] text-gray-600 print:mt-3 print:pt-2 print:text-[8px]">
          Powered by Vincollins Portal | Geared Towards Excellence
        </div>
      </div>
    </div>
  )
}