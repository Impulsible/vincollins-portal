/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/reportCardGenerator.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface SubjectScore {
  name: string
  ca1: number
  ca2: number
  examObj: number
  examTheory: number
  total: number
  grade: string
  remark: string
}

interface AssessmentData {
  handwriting: number
  sports: number
  creativity: number
  technical: number
  punctuality: number
  neatness: number
  politeness: number
  cooperation: number
  leadership: number
  daysPresent: number
  daysAbsent: number
}

interface ReportCardData {
  schoolName: string
  schoolLogo?: string
  studentName: string
  studentPhoto?: string
  class: string
  admissionNo: string
  term: string
  academicYear: string
  gender: string
  date: string
  subjects: SubjectScore[]
  totalScore: number
  averageScore: number
  position: number
  totalStudents: number
  classHighest: number
  classAverage: number
  assessment: AssessmentData
  teacherComment: string
  principalComment: string
  classTeacher: string
  principalName: string
}

// Star rating helper
const getStars = (rating: number): string => {
  const fullStar = '★'
  const emptyStar = '☆'
  return fullStar.repeat(rating) + emptyStar.repeat(5 - rating)
}

// Load image from URL
async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })
}

export async function generateReportCardPDF(data: ReportCardData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  // =============================================
  // HEADER SECTION
  // =============================================
  
  // School Logo (if available)
  if (data.schoolLogo) {
    try {
      const logoImg = await loadImage(data.schoolLogo)
      doc.addImage(logoImg, 'PNG', margin, 10, 22, 22)
    } catch (error) {
      // Fallback - draw a circle
      doc.setFillColor(41, 128, 185)
      doc.circle(margin + 11, 21, 11, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('VC', margin + 11, 24, { align: 'center' })
    }
  }

  // School Name
  doc.setTextColor(26, 53, 92)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(data.schoolName, pageWidth / 2, 20, { align: 'center' })

  // School Address
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Ikeja, Lagos, Nigeria • Tel: +234 800 123 4567', pageWidth / 2, 28, { align: 'center' })
  doc.text('Email: info@vincollins.edu.ng • Website: www.vincollins.edu.ng', pageWidth / 2, 34, { align: 'center' })

  // Report Card Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(41, 128, 185)
  doc.text('TERMINAL REPORT CARD', pageWidth / 2, 44, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text(`${data.term} - ${data.academicYear} Academic Session`, pageWidth / 2, 51, { align: 'center' })

  // Divider line
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, 55, pageWidth - margin, 55)

  // =============================================
  // STUDENT INFO SECTION
  // =============================================
  
  let currentY = 62

  // Student Photo (Passport size)
  if (data.studentPhoto) {
    try {
      const photoImg = await loadImage(data.studentPhoto)
      doc.addImage(photoImg, 'JPEG', pageWidth - margin - 30, currentY, 30, 35)
    } catch (error) {
      // Fallback
      doc.setFillColor(230, 230, 230)
      doc.rect(pageWidth - margin - 30, currentY, 30, 35, 'F')
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(8)
      doc.text('Photo', pageWidth - margin - 15, currentY + 18, { align: 'center' })
    }
  }

  // Student Details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60, 60, 60)
  
  const details = [
    { label: 'Name:', value: data.studentName },
    { label: 'Class:', value: data.class },
    { label: 'Admission No:', value: data.admissionNo },
    { label: 'Gender:', value: data.gender },
    { label: 'Date:', value: data.date },
  ]

  details.forEach((detail, index) => {
    doc.setFont('helvetica', 'bold')
    doc.text(detail.label, margin, currentY + (index * 7))
    doc.setFont('helvetica', 'normal')
    doc.text(detail.value, margin + 30, currentY + (index * 7))
  })

  currentY = 105

  // =============================================
  // ACADEMIC PERFORMANCE TABLE
  // =============================================
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(41, 128, 185)
  doc.text('ACADEMIC PERFORMANCE', margin, currentY)
  
  currentY += 5

  // Table Headers
  const tableHeaders = [
    'Subject',
    'CA1\n(20)',
    'CA2\n(20)',
    'Exam\nObj',
    'Exam\nTheory',
    'Total\n(100)',
    'Grade',
    'Remark'
  ]

  const tableBody = data.subjects.map(s => [
    s.name,
    s.ca1.toString(),
    s.ca2.toString(),
    s.examObj.toString(),
    s.examTheory.toString(),
    s.total.toString(),
    s.grade,
    s.remark,
  ])

  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [60, 60, 60],
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      7: { halign: 'left' },
    },
    margin: { left: margin, right: margin },
  })

  currentY = (doc as any).lastAutoTable.finalY + 8

  // =============================================
  // SUMMARY STATISTICS
  // =============================================
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60, 60, 60)
  
  const summaryData = [
    { label: 'Total Score:', value: `${data.totalScore}` },
    { label: 'Average Score:', value: `${data.averageScore}%` },
    { label: 'Position:', value: `${data.position} out of ${data.totalStudents}` },
  ]

  summaryData.forEach((item, index) => {
    doc.setFont('helvetica', 'bold')
    doc.text(item.label, margin + (index * 55), currentY)
    doc.setFont('helvetica', 'normal')
    doc.text(item.value, margin + 35 + (index * 55), currentY)
  })

  currentY += 8

  const extraStats = [
    { label: 'Class Highest:', value: `${data.classHighest}%` },
    { label: 'Class Average:', value: `${data.classAverage}%` },
  ]

  extraStats.forEach((item, index) => {
    doc.setFont('helvetica', 'bold')
    doc.text(item.label, margin + (index * 55), currentY)
    doc.setFont('helvetica', 'normal')
    doc.text(item.value, margin + 35 + (index * 55), currentY)
  })

  currentY += 12

  // Divider
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 8

  // =============================================
  // PSYCHOMOTOR & BEHAVIORAL ASSESSMENT
  // =============================================
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(41, 128, 185)
  doc.text('PSYCHOMOTOR & BEHAVIORAL ASSESSMENT', margin, currentY)
  currentY += 8

  const assessment = data.assessment
  
  const assessmentItems = [
    { label: 'Handwriting', value: assessment.handwriting },
    { label: 'Sports Participation', value: assessment.sports },
    { label: 'Creative Arts', value: assessment.creativity },
    { label: 'Technical Skills', value: assessment.technical },
    { label: 'Punctuality', value: assessment.punctuality },
    { label: 'Neatness', value: assessment.neatness },
    { label: 'Politeness', value: assessment.politeness },
    { label: 'Cooperation', value: assessment.cooperation },
    { label: 'Leadership', value: assessment.leadership },
  ]

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)

  let colX = margin
  let rowY = currentY

  assessmentItems.forEach((item, index) => {
    if (index > 0 && index % 3 === 0) {
      colX = margin
      rowY += 8
    }
    
    doc.setFont('helvetica', 'bold')
    doc.text(`${item.label}:`, colX, rowY)
    doc.setFont('helvetica', 'normal')
    doc.text(getStars(item.value), colX + 45, rowY)
    
    colX += 60
  })

  currentY = rowY + 12

  // Attendance
  doc.setFont('helvetica', 'bold')
  doc.text('Attendance:', margin, currentY)
  doc.setFont('helvetica', 'normal')
  doc.text(`${assessment.daysPresent} days present, ${assessment.daysAbsent} days absent`, margin + 30, currentY)

  currentY += 12

  // Divider
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 8

  // =============================================
  // COMMENTS SECTION
  // =============================================
  
  // Teacher's Comment
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(41, 128, 185)
  doc.text("Teacher's Comment:", margin, currentY)
  currentY += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  
  const teacherLines = doc.splitTextToSize(data.teacherComment, pageWidth - (margin * 2))
  doc.text(teacherLines, margin, currentY)
  currentY += (teacherLines.length * 5) + 6

  // Principal's Comment
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(41, 128, 185)
  doc.text("Principal's Comment:", margin, currentY)
  currentY += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  
  const principalLines = doc.splitTextToSize(data.principalComment, pageWidth - (margin * 2))
  doc.text(principalLines, margin, currentY)
  currentY += (principalLines.length * 5) + 10

  // =============================================
  // SIGNATURES
  // =============================================
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  
  doc.text(`Class Teacher: ${data.classTeacher}`, margin, currentY)
  doc.text(`Principal: ${data.principalName}`, pageWidth / 2 + 10, currentY)
  
  currentY += 12
  
  doc.text('Signature: _________________', margin, currentY)
  doc.text('Signature: _________________', pageWidth / 2 + 10, currentY)
  
  currentY += 10
  
  doc.text(`Date: ${data.date}`, margin, currentY)
  doc.text('School Stamp: [OFFICIAL STAMP]', pageWidth / 2 + 10, currentY)

  // =============================================
  // FOOTER
  // =============================================
  
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('This is an official report card from Vincollins College', pageWidth / 2, pageHeight - 10, { align: 'center' })

  return doc.output('blob')
}