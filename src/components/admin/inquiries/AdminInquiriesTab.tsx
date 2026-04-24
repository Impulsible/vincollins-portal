// components/admin/inquiries/AdminInquiriesTab.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { ArrowRight, MessageSquare } from 'lucide-react'

interface AdminInquiriesTabProps {
  inquiries: any[]
  onNavigate: (tab: string) => void
}

export function AdminInquiriesTab({ inquiries, onNavigate }: AdminInquiriesTabProps) {
  return (
    <motion.div key="inquiries" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Inquiries Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
            Manage admission and contact inquiries
          </p>
        </div>
        <Button onClick={() => onNavigate('overview')} variant="outline">
          <ArrowRight className="h-4 w-4 mr-1" /> Dashboard
        </Button>
      </div>
      
      <Card className="border-0 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="border rounded-lg p-4 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{inquiry.name || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">{inquiry.email}</p>
                    <p className="text-xs text-slate-400 mt-1">{inquiry.message?.slice(0, 100)}...</p>
                    <Badge className="mt-2 bg-amber-100 text-amber-700">{inquiry.status || 'Pending'}</Badge>
                  </div>
                  <Button size="sm" variant="outline">Review</Button>
                </div>
              </div>
            ))}
            {inquiries.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-muted-foreground">No inquiries found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}