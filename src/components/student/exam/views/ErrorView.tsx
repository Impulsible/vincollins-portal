// src/components/student/exam/views/ErrorView.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, Home } from 'lucide-react'

interface ErrorViewProps {
  message: string
  onBack: () => void
}

export function ErrorView({ message, onBack }: ErrorViewProps) {
  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      <Card className="max-w-md shadow-lg border-0 bg-[#1a1f2e] text-white">
        <div className="bg-[#c41e3a] p-4 rounded-t-lg">
          <h2 className="text-white font-bold">Error</h2>
        </div>
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-300 mb-4">{message}</p>
          <Button
            onClick={onBack}
            className="bg-[#c41e3a] hover:bg-[#a01830] text-white"
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
