import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileCheck, Download, CheckCircle2, CheckCircle, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportCardTabProps {
  reportCardStatus: any
  handleTabChange: (tab: string) => void
  router: any
}

export function ReportCardTab({ reportCardStatus, handleTabChange, router }: ReportCardTabProps) {
  const getReportCardStatusBadge = (status: string | null) => {
    if (!status) return null
    switch (status) {
      case 'published': return <Badge className="bg-green-100 text-green-700 shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" />Published</Badge>
      case 'approved': return <Badge className="bg-blue-100 text-blue-700 shrink-0"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 shrink-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'rejected': return <Badge className="bg-red-100 text-red-700 shrink-0"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default: return null
    }
  }

  return (
    <motion.div 
      key="report-card" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className="w-full overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Report Card</h1>
        <Button variant="outline" size="sm" onClick={() => handleTabChange('overview')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
      </div>
      
      {reportCardStatus ? (
        <Card className={cn(
          "border-0 shadow-lg overflow-hidden",
          reportCardStatus.status === 'published' 
            ? "bg-gradient-to-br from-green-50 to-emerald-50"
            : reportCardStatus.status === 'approved'
            ? "bg-gradient-to-br from-blue-50 to-indigo-50"
            : reportCardStatus.status === 'pending'
            ? "bg-gradient-to-br from-yellow-50 to-amber-50"
            : "bg-gradient-to-br from-red-50 to-rose-50"
        )}>
          <CardContent className="p-6">
            <div className="text-center">
              <div className={cn(
                "h-20 w-20 rounded-full mx-auto flex items-center justify-center mb-4",
                reportCardStatus.status === 'published' ? "bg-green-100" :
                reportCardStatus.status === 'approved' ? "bg-blue-100" :
                reportCardStatus.status === 'pending' ? "bg-yellow-100" : "bg-red-100"
              )}>
                <FileCheck className={cn(
                  "h-10 w-10",
                  reportCardStatus.status === 'published' ? "text-green-600" :
                  reportCardStatus.status === 'approved' ? "text-blue-600" :
                  reportCardStatus.status === 'pending' ? "text-yellow-600" : "text-red-600"
                )} />
              </div>
              
              <h2 className="text-xl font-bold mb-2 break-words">
                {reportCardStatus.term} {reportCardStatus.academic_year}
              </h2>
              
              <div className="mb-4">
                {getReportCardStatusBadge(reportCardStatus.status)}
              </div>
              
              {reportCardStatus.average_score && (
                <div className="mb-4">
                  <p className="text-3xl font-bold">{reportCardStatus.average_score}%</p>
                  <p className="text-sm text-slate-500">Average Score</p>
                  {reportCardStatus.grade && (
                    <Badge className="mt-2 text-lg px-4 py-1" variant="outline">
                      Grade: {reportCardStatus.grade}
                    </Badge>
                  )}
                </div>
              )}
              
              <p className="text-slate-600 mb-6 text-sm sm:text-base break-words">
                {reportCardStatus.status === 'published' 
                  ? 'Your report card is ready! Click below to view and download.'
                  : reportCardStatus.status === 'approved'
                  ? 'Your report card has been approved and will be published soon. Check back later!'
                  : reportCardStatus.status === 'pending'
                  ? 'Your report card is currently being reviewed by the admin. Please check back later.'
                  : 'Your report card was rejected. Please contact your class teacher for more information.'}
              </p>
              
              {reportCardStatus.status === 'published' && (
                <Button 
                  size="lg" 
                  className="bg-emerald-600"
                  onClick={() => router.push('/student/report-card')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View & Download Report Card
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardContent className="text-center py-16">
            <FileCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Report Card Available
            </h3>
            <p className="text-muted-foreground text-sm">
              Your report card for the current term has not been submitted yet.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}