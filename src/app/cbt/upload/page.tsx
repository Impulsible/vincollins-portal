// app/cbt/upload/page.tsx or add to your existing CBT page
import { ExamUpload } from '@/components/cbt/exam-upload'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' // Your database client

export default function UploadExamPage() {
  const handleSaveExam = async (examData: any) => {
    // Save to your database
    const { data, error } = await supabase
      .from('exams')
      .insert({
        title: examData.title,
        subject: examData.subject,
        class: examData.class,
        duration: examData.duration,
        instructions: examData.instructions,
        status: 'draft',
        total_questions: examData.questions.length,
      })
      .select()
      .single()

    if (error) throw error

    // Save questions
    const questions = examData.questions.map((q: any, idx: number) => ({
      exam_id: data.id,
      question_text: q.text,
      type: q.type,
      options: q.options || null,
      correct_answer: q.answer || null,
      points: q.points,
      order: idx,
    }))

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questions)

    if (questionsError) throw questionsError

    return data
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Upload Exam</h1>
      <ExamUpload onSave={handleSaveExam} />
    </div>
  )
}