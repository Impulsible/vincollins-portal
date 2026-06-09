// src/components/student/exam/answers/TheoryAnswer.tsx
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { supabase } from '@/lib/supabase'

interface TheoryAnswerProps {
  answer: string
  onChange: (content: string) => void
  examId: string
  studentId?: string
}

export function TheoryAnswer({
  answer,
  onChange,
  examId,
  studentId,
}: TheoryAnswerProps) {
  const handleImageUpload = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const filePath = `${examId}/${studentId || 'anonymous'}/${fileName}`

    const { data, error } = await supabase.storage
      .from('exam-answers')
      .upload(filePath, file)

    if (error) {
      console.error('Image upload failed:', error)
      throw error
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('exam-answers').getPublicUrl(filePath)

    return publicUrl
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-gray-300 text-sm font-medium">
          Your Answer
        </Label>
        <Badge variant="outline" className="text-xs text-gray-400">
          You can format your answer, insert images, and create tables
        </Badge>
      </div>

      <RichTextEditor
        content={answer}
        onChange={onChange}
        placeholder="Type your answer here... Use the toolbar for formatting, images, and tables."
        minHeight="250px"
        maxHeight="500px"
        bucketName="exam-answers"
        folderPath={`${examId}/${studentId || 'anonymous'}`}
        onImageUpload={handleImageUpload}
      />

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          Auto-saved every 30 seconds
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-yellow-500" />
          Your answer will be graded by your teacher
        </span>
      </div>
    </div>
  )
}
