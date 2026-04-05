/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ResultCard } from '@/components/cbt/result-card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ResultPage() {
  const params = useParams()
  const resultId = params?.id as string
  const [result, setResult] = useState<{
    exam_title: string
    score: number
    total: number
    percentage: number
    grade: string
    time_spent: number
    correct_answers: number
    wrong_answers: number
    submitted_at: string
    rank?: number
    percentile?: number
    feedback?: string
    recommendations?: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        // Replace with actual API call
        // const response = await fetch(`/api/results/${resultId}`)
        // const data = await response.json()
        
        // Mock data
        const mockResult = {
          exam_title: 'Mathematics Examination',
          score: 85,
          total: 100,
          percentage: 85,
          grade: 'A',
          time_spent: 3200,
          correct_answers: 42,
          wrong_answers: 8,
          submitted_at: new Date().toISOString(),
          rank: 5,
          percentile: 92,
          recommendations: [
            'Great work! Consider taking advanced courses',
            'Share your success with peers',
          ],
        }
        
        setResult(mockResult)
      } catch (error) {
        toast.error('Failed to load result')
      } finally {
        setLoading(false)
      }
    }

    if (resultId) {
      fetchResult()
    }
  }, [resultId])

  const handleDownloadCertificate = () => {
    toast.success('Certificate download started')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-500">Loading result...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Result Not Found</h1>
          <p className="text-gray-600">The result you're looking for doesn't exist.</p>
          <Link href="/cbt" className="mt-4 inline-block">
            <Button>Back to Exams</Button>
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/cbt">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Exams
            </Button>
          </Link>
        </div>
        
        <ResultCard 
          result={result} 
          onDownload={handleDownloadCertificate}
        />
      </main>
      
      <Footer />
    </div>
  )
}