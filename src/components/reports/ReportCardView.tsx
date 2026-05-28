// components/reports/ReportCardView.tsx - SHARED COMPONENT
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Printer, Download, Eye, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { cn } from '@/lib/utils'

// ============================================
// WAEC GRADING SYSTEM
// ============================================
const getWAECGrade = (score: number): string => {
  if (score >= 75) return 'A1'
  if (score >= 70) return 'B2'
  if (score >= 65) return 'B3'
  if (score >= 60) return 'C4'
  if (score >= 55) return 'C5'
  if (score >= 50) return 'C6'
  if (score >= 45) return 'D7'
  if (score >= 40) return 'E8'
  return 'F9'
}

const getGradeColor = (grade: string): string => {
  if (grade === 'A1') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (grade === 'B2' || grade === 'B3') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (grade === 'C4' || grade === 'C5' || grade === 'C6') return 'bg-cyan-100 text-cyan-700 border-cyan-200'
  if (grade === 'D7' || grade === 'E8') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (grade === 'F9') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-slate-100 text-slate-600'
}

const getGradeRemark = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A1': 'Excellent', 'B2': 'Very Good', 'B3': 'Good',
    'C4': 'Credit', 'C5': 'Credit', 'C6': 'Credit',
    'D7': 'Pass', 'E8': 'Pass', 'F9': 'Fail'
  }
  return remarks[grade] || ''
}

interface ReportCardViewProps {
  reportCard: any
  schoolSettings: any
  onBack?: () => void
  showActions?: boolean
  role?: 'admin' | 'staff' | 'student'
}

export function ReportCardView({ 
  reportCard, 
  schoolSettings, 
  onBack, 
  showActions = true,
  role = 'admin'
}: ReportCardViewProps) {
  const [loading, setLoading] = useState(false)

  const handlePrint = () => window.print()
  
  const handleDownloadPDF = async () => {
    if (!reportCard) return
    setLoading(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      
      // Header
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text(schoolSettings.school_name || 'VINCOLLINS COLLEGE', 105, 20, { align: 'center' })
      doc.setFontSize(9)
      doc.text(schoolSettings.school_address || '', 105, 28, { align: 'center' })
      doc.text(`Tel: ${schoolSettings.school_phone || ''}`, 105, 34, { align: 'center' })
      doc.text(`Email: ${schoolSettings.school_email || ''}`, 105, 40, { align: 'center' })
      
      doc.setFontSize(12)
      doc.text(`${reportCard.term?.toUpperCase()} TERM REPORT CARD`, 105, 50, { align: 'center' })
      
      // Student Info
      doc.setFontSize(10)
      doc.text(`Name: ${reportCard.student_name}`, 20, 65)
      doc.text(`Class: ${reportCard.class}`, 20, 72)
      doc.text(`Session: ${reportCard.academic_year}`, 20, 79)
      doc.text(`Admission No: ${reportCard.student_admission_number || '—'}`, 20, 86)
      
      // Subjects Table
      const tableData = reportCard.subjects_data?.map((subject: any) => [
        subject.name,
        subject.ca?.toString() || '-',
        subject.exam?.toString() || '-',
        subject.total?.toString() || '-',
        subject.grade || '-',
        subject.remark || '-'
      ]) || []
      
      autoTable(doc, {
        startY: 95,
        head: [['Subject', 'CA', 'Exam', 'Total', 'Grade', 'Remark']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 2 },
      })
      
      const finalY = (doc as any).lastAutoTable.finalY + 10
      
      // Summary
      doc.text(`Total Score: ${reportCard.total_score || 0}`, 20, finalY)
      doc.text(`Average Score: ${reportCard.average_score || 0}%`, 20, finalY + 7)
      doc.text(`Grade: ${reportCard.grade || '—'}`, 20, finalY + 14)
      
      // Comments
      doc.text("Teacher's Comment:", 20, finalY + 25)
      doc.setFontSize(9)
      const teacherComment = doc.splitTextToSize(reportCard.teacher_comments || 'No comment', 170)
      doc.text(teacherComment, 20, finalY + 32)
      
      doc.text("Principal's Comment:", 20, finalY + 45)
      const principalComment = doc.splitTextToSize(reportCard.principal_comments || 'No comment', 170)
      doc.text(principalComment, 20, finalY + 52)
      
      doc.save(`Report_Card_${reportCard.student_name}_${reportCard.term}.pdf`)
      toast.success('PDF downloaded!')
    } catch (error) {
      console.error('PDF error:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  const displaySubjects = reportCard?.subjects_data || []
  const termDisplay = reportCard?.term || 'Third Term'

  return (
    <div className="bg-white w-[210mm] min-h-[297mm] mx-auto text-[11px] text-black border border-gray-300 p-3 print:p-0 print:border-none">
      
      {/* Toolbar - Only show for admin/staff with actions */}
      {showActions && (
        <div className="no-print flex justify-end gap-2 mb-3 print:hidden">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={loading}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={loading}>
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      )}

      {/* HEADER */}
      <div className="border-b border-gray-300 pb-2 print:pb-1">
        <div className="flex items-start justify-between">
          {/* LOGO */}
          <div className="w-16 print:w-12">
            {schoolSettings?.logo_url && (
              <img src={schoolSettings.logo_url} alt="logo" className="w-14 h-14 object-contain print:w-10 print:h-10" />
            )}
          </div>

          {/* SCHOOL INFO */}
          <div className="flex-1 text-center">
            <h1 className="text-[18px] font-bold uppercase text-blue-900 print:text-[14px]">
              {schoolSettings?.school_name || 'VINCOLLINS COLLEGE'}
            </h1>
            <p className="text-[10px] print:text-[8px]">{schoolSettings?.school_address || ''}</p>
            <p className="text-[10px] print:text-[8px]">Tel: {schoolSettings?.school_phone || ''}</p>
            <p className="text-[10px] print:text-[8px]">Email: {schoolSettings?.school_email || ''}</p>
            <p className="text-[9px] italic text-amber-600 mt-1 print:text-[7px]">"{schoolSettings?.school_motto || 'Geared Towards Excellence'}"</p>
            <h2 className="font-bold mt-2 text-[14px] print:text-[11px]">
              {termDisplay} Student's Performance Report
            </h2>
          </div>

          {/* PHOTO */}
          <div className="w-20 h-24 border border-gray-300 print:w-16 print:h-20">
            {reportCard?.student_photo_url ? (
              <img src={reportCard.student_photo_url} alt="student" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-xs">Photo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STUDENT INFO */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] mt-2 mb-3 print:mt-1 print:mb-2 print:text-[9px]">
        <div className="flex"><span className="font-bold w-32">Name:</span><span>{reportCard?.student_name}</span></div>
        <div className="flex"><span className="font-bold w-32">Admission No:</span><span>{reportCard?.student_admission_number || '—'}</span></div>
        <div className="flex"><span className="font-bold w-32">Class:</span><span>{reportCard?.class}</span></div>
        <div className="flex"><span className="font-bold w-32">Term:</span><span>{termDisplay}</span></div>
        <div className="flex"><span className="font-bold w-32">Session:</span><span>{reportCard?.academic_year}</span></div>
        <div className="flex"><span className="font-bold w-32">Next Term:</span><span>{reportCard?.next_term_begins || 'To be announced'}</span></div>
      </div>

      {/* MAIN CONTENT - 2 Columns */}
      <div className="grid grid-cols-[70%_30%] gap-3">

        {/* LEFT COLUMN - ACADEMIC RESULTS */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-2 border-l-4 border-emerald-500 pl-2">ACADEMIC PERFORMANCE</h3>
          
          <table className="w-full border-collapse border border-gray-300 text-[10px] print:text-[8px]">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="border px-2 py-1 text-left">Subjects</th>
                <th className="border px-2 py-1 text-center w-16">CA</th>
                <th className="border px-2 py-1 text-center w-16">Exam</th>
                <th className="border px-2 py-1 text-center w-16">Total</th>
                <th className="border px-2 py-1 text-center w-14">Grade</th>
                <th className="border px-2 py-1 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {displaySubjects.map((subject: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                  <td className="border px-2 py-1">{subject.name}</td>
                  <td className="border text-center font-mono">{subject.ca || '-'}</td>
                  <td className="border text-center font-mono">{subject.exam || '-'}</td>
                  <td className="border text-center font-bold font-mono">{subject.total || '-'}</td>
                  <td className="border text-center">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", getGradeColor(subject.grade))}>
                      {subject.grade || '-'}
                    </span>
                  </td>
                  <td className="border px-2 py-1">{subject.remark || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td colSpan={3} className="border px-2 py-1 text-right">SUMMARY:</td>
                <td className="border text-center">{reportCard?.total_score || 0}</td>
                <td className="border text-center">{reportCard?.average_score || 0}%</td>
                <td className="border text-center">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", getGradeColor(reportCard?.grade || '—'))}>
                    {reportCard?.grade || '—'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* COMMENTS */}
          <div className="mt-3 border border-gray-300">
            <div className="bg-blue-600 text-white px-2 py-1 text-[10px] font-bold">CLASS TEACHER'S REMARK</div>
            <div className="p-2 text-[10px] italic leading-relaxed">{reportCard?.teacher_comments || 'No comment available.'}</div>
          </div>

          <div className="mt-2 border border-gray-300">
            <div className="bg-blue-600 text-white px-2 py-1 text-[10px] font-bold">PRINCIPAL'S REMARK</div>
            <div className="p-2 text-[10px] italic leading-relaxed">{reportCard?.principal_comments || 'No comment available.'}</div>
          </div>

          {/* GRADE SCALE */}
          <div className="mt-3">
            <div className="bg-blue-600 text-white text-[10px] px-2 py-1 font-bold">Grade Scale (WAEC)</div>
            <div className="border border-gray-300 p-2">
              <div className="grid grid-cols-3 gap-1 text-[9px]">
                <div><span className={getGradeColor('A1')}>A1</span> 75-100</div>
                <div><span className={getGradeColor('B2')}>B2</span> 70-74</div>
                <div><span className={getGradeColor('B3')}>B3</span> 65-69</div>
                <div><span className={getGradeColor('C4')}>C4</span> 60-64</div>
                <div><span className={getGradeColor('C5')}>C5</span> 55-59</div>
                <div><span className={getGradeColor('C6')}>C6</span> 50-54</div>
                <div><span className={getGradeColor('D7')}>D7</span> 45-49</div>
                <div><span className={getGradeColor('E8')}>E8</span> 40-44</div>
                <div><span className={getGradeColor('F9')}>F9</span> 0-39</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - PSYCHOMOTOR & SKILLS */}
        <div>
          {/* Performance Summary */}
          <div className="border border-gray-300 mb-2">
            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">Performance Summary</div>
            <div className="p-2 space-y-1">
              <div className="flex justify-between"><span>Total Score</span><span className="font-bold">{reportCard?.total_score || 0}</span></div>
              <div className="flex justify-between"><span>Average</span><span className="font-bold">{reportCard?.average_score || 0}%</span></div>
              <div className="flex justify-between"><span>Grade</span><span className="font-bold">{reportCard?.grade || '—'}</span></div>
              {reportCard?.position && (
                <div className="flex justify-between"><span>Position</span><span className="font-bold">{reportCard.position}/{reportCard.total_students}</span></div>
              )}
            </div>
          </div>

          {/* Affective Domain */}
          <div className="border border-gray-300 mb-2">
            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">Affective Domain</div>
            <div className="p-2">
              <table className="w-full border-collapse border border-gray-300 text-[10px]">
                <tbody>
                  {[
                    { name: 'Honesty', rating: 4 },
                    { name: 'Neatness', rating: 4 },
                    { name: 'Obedience', rating: 4 },
                    { name: 'Orderliness', rating: 3 },
                    { name: 'Diligence', rating: 4 },
                    { name: 'Punctuality', rating: 4 },
                    { name: 'Leadership', rating: 3 },
                    { name: 'Politeness', rating: 4 },
                  ].map((item) => (
                    <tr key={item.name}>
                      <td className="border px-1 py-1">{item.name}</td>
                      <td className="border text-center w-12 font-bold">{item.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Psychomotor Skills */}
          <div className="border border-gray-300 mb-2">
            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">Psychomotor Skills</div>
            <div className="p-2">
              <table className="w-full border-collapse border border-gray-300 text-[10px]">
                <tbody>
                  {[
                    { name: 'Handwriting', rating: 4 },
                    { name: 'Verbal Fluency', rating: 4 },
                    { name: 'Sports', rating: 3 },
                    { name: 'Handling Tools', rating: 3 },
                    { name: 'Club Activities', rating: 4 },
                  ].map((item) => (
                    <tr key={item.name}>
                      <td className="border px-1 py-1">{item.name}</td>
                      <td className="border text-center w-12 font-bold">{item.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rating Key */}
          <div className="border border-gray-300">
            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase">Key To Ratings</div>
            <div className="p-2 space-y-1 text-[9px]">
              <div>5 - Excellent</div>
              <div>4 - Very Good</div>
              <div>3 - Good</div>
              <div>2 - Fair</div>
              <div>1 - Poor</div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-gray-300 mt-4 pt-2 text-center text-[9px] text-gray-500 print:mt-2 print:pt-1 print:text-[7px]">
        Powered by Vincollins Portal | {schoolSettings?.school_motto || 'Geared Towards Excellence'}
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 0.5cm; }
          .bg-blue-600 { background-color: #1e40af !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .border { border-color: #000 !important; }
        }
      `}</style>
    </div>
  )
}