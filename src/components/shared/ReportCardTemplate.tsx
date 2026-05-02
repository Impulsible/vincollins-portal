// components/shared/ReportCardTemplate.tsx - FIXED TYPES
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

interface ReportCardTemplateProps {
  data: ReportCardData
}

export function ReportCardTemplate({ data }: ReportCardTemplateProps) {
  const subjects: SubjectScore[] = data.subject_scores || []
  const behaviors: RatingItem[] = data.behavior_ratings || []
  const skills: RatingItem[] = data.skill_ratings || []
  const schoolName: string = data.school_name || 'Vincollins College'

  return (
    <div className="bg-white w-full max-w-[210mm] mx-auto font-sans text-slate-900" id="report-card-print">
      <style>{`
        @media print {
          @page { size: A4; margin: 6mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media screen {
          .report-table td, .report-table th { padding: 2px 4px; font-size: 10px; }
        }
      `}</style>

      <div className="p-2 sm:p-4">
        
        {/* ═══ HEADER: STUDENT INFO ═══ */}
        <table className="w-full mb-2">
          <tbody>
            <tr>
              <td className="w-[60px] align-top">
                <div className="w-14 h-14 border rounded flex items-center justify-center text-[8px] text-slate-400">LOGO</div>
              </td>
              <td className="text-center align-top">
                <h1 className="text-sm sm:text-base font-bold uppercase">{schoolName}</h1>
                <p className="text-[10px] sm:text-xs font-semibold">
                  Progress Report for {getTermLabel(data.term)} {data.academic_year}
                </p>
              </td>
              <td className="w-[60px] align-top text-right">
                <div className="w-14 h-14 border rounded flex items-center justify-center text-[8px] text-slate-400">PHOTO</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ═══ STUDENT DETAILS ═══ */}
        <table className="w-full text-[9px] sm:text-[10px] mb-2 border-b pb-2">
          <tbody>
            <tr>
              <td><strong>Name:</strong> {data.student_name}</td>
              <td><strong>Admission No:</strong> {data.admission_number || '—'}</td>
              <td><strong>Class:</strong> {data.class}</td>
            </tr>
            <tr>
              <td><strong>DOB:</strong> {data.dob || '—'}</td>
              <td><strong>Gender:</strong> {data.gender || '—'}</td>
              <td><strong>Next Term Begins:</strong> {data.next_term_begins || '—'}</td>
            </tr>
            {data.total_days ? (
              <tr>
                <td><strong>Total Days:</strong> {data.total_days}</td>
                <td><strong>Days Present:</strong> {data.days_present || 0}</td>
                <td></td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {/* ═══ MAIN TABLE: ACADEMICS + BEHAVIOUR ═══ */}
        <table className="w-full border-collapse border border-slate-400 report-table">
          <thead>
            <tr className="bg-emerald-700 text-white">
              <th colSpan={6} className="text-center text-[10px] sm:text-xs font-semibold py-1.5 border border-slate-400">ACADEMICS</th>
              <th colSpan={2} className="text-center text-[10px] sm:text-xs font-semibold py-1.5 border border-slate-400">BEHAVIOUR & SKILLS</th>
            </tr>
            <tr className="bg-slate-100 text-[8px] sm:text-[9px]">
              <th className="border border-slate-300 px-1 py-1">Subject</th>
              <th className="border border-slate-300 px-1 py-1 text-center">CA<br/>40</th>
              <th className="border border-slate-300 px-1 py-1 text-center">EXAM<br/>60</th>
              <th className="border border-slate-300 px-1 py-1 text-center">TOTAL<br/>100</th>
              <th className="border border-slate-300 px-1 py-1 text-center">GRADE</th>
              <th className="border border-slate-300 px-1 py-1 text-center">REMARKS</th>
              <th className="border border-slate-300 px-1 py-1">Behaviour</th>
              <th className="border border-slate-300 px-1 py-1 text-center">Ratings</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s: SubjectScore, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 px-1.5 py-1 text-[9px] sm:text-[10px] font-medium">{s.subject}</td>
                <td className="border border-slate-300 px-1 py-1 text-center text-[9px] sm:text-[10px]">{s.ca}</td>
                <td className="border border-slate-300 px-1 py-1 text-center text-[9px] sm:text-[10px]">{s.exam}</td>
                <td className="border border-slate-300 px-1 py-1 text-center text-[9px] sm:text-[10px] font-semibold">{s.total}</td>
                <td className="border border-slate-300 px-1 py-1 text-center">
                  <span className="text-[9px] sm:text-[10px] font-bold">{s.grade}</span>
                </td>
                <td className="border border-slate-300 px-1.5 py-1 text-[9px] sm:text-[10px] text-emerald-700">{s.remark}</td>
                {i < behaviors.length ? (
                  <>
                    <td className="border border-slate-300 px-1.5 py-1 text-[9px] sm:text-[10px]">{behaviors[i]?.name}</td>
                    <td className="border border-slate-300 px-1 py-1 text-center text-[9px] sm:text-[10px] font-semibold">{behaviors[i]?.rating}</td>
                  </>
                ) : null}
              </tr>
            ))}
            
            {/* Skills section header */}
            {skills.length > 0 ? (
              <tr className="bg-slate-100">
                <td colSpan={6}></td>
                <td className="border border-slate-300 px-1.5 py-1 text-[9px] font-semibold">Skills</td>
                <td className="border border-slate-300 px-1 py-1 text-center text-[9px] font-semibold">Ratings</td>
              </tr>
            ) : null}
            
            {/* Skills rows - show after subjects */}
            {skills.map((skill: RatingItem, i: number) => (
              <tr key={`skill-${i}`} className="bg-white">
                <td colSpan={6}></td>
                <td className="border border-slate-300 px-1.5 py-1 text-[9px] sm:text-[10px] italic text-slate-500">{skill.name}</td>
                <td className="border border-slate-300 px-1 py-1 text-center text-[9px] sm:text-[10px] font-semibold">{skill.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ═══ SUMMARY ═══ */}
        <table className="w-full mt-2 text-[9px] sm:text-[10px]">
          <tbody>
            <tr>
              <td className="w-1/3"><strong>AVERAGE SCORE:</strong> {data.average_score?.toFixed(2)}</td>
              <td className="w-1/3"><strong>TOTAL SCORE:</strong> {data.total_score}</td>
              <td className="w-1/3 text-right"><span className="font-bold">A1 75-100</span> <span className="ml-4 font-bold">F9 0-39</span></td>
            </tr>
            <tr>
              <td><strong>GRADE:</strong> {data.grade}</td>
              <td><strong>Remarks:</strong> {data.remarks}</td>
              <td className="text-right"><span className="font-bold">B2 70-74</span></td>
            </tr>
            <tr>
              <td></td><td></td>
              <td className="text-right"><span className="font-bold">B3 65-69</span></td>
            </tr>
            <tr>
              <td></td><td></td>
              <td className="text-right"><span className="font-bold">C4 60-64</span> <span className="ml-4">5 - Very Good</span></td>
            </tr>
            <tr>
              <td colSpan={3} className="pt-2"><strong>Teacher's Comment:</strong> {data.teacher_comments}</td>
            </tr>
            <tr>
              <td></td><td></td>
              <td className="text-right"><span className="font-bold">C5 55-59</span> <span className="ml-4">4 - Good</span></td>
            </tr>
            <tr>
              <td colSpan={3}><strong>Principal's Comment:</strong> {data.principal_comments}</td>
            </tr>
            <tr>
              <td></td><td></td>
              <td className="text-right"><span className="font-bold">C6 50-54</span> <span className="ml-4">3 - Average</span></td>
            </tr>
            <tr>
              <td></td><td></td>
              <td className="text-right"><span className="font-bold">D7 45-49</span> <span className="ml-4">2 - Below Average</span></td>
            </tr>
            <tr>
              <td></td><td></td>
              <td className="text-right"><span className="font-bold">E8 40-44</span> <span className="ml-4">1 - Poor</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}