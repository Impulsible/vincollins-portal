// components/admin/inquiries/AdminInquiriesTab.tsx - WITH DARK MODE
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { ArrowRight, MessageSquare, User, Mail } from 'lucide-react'

interface AdminInquiriesTabProps {
  inquiries: any[]
  onNavigate: (tab: string) => void
}

export function AdminInquiriesTab({ inquiries, onNavigate }: AdminInquiriesTabProps) {
  return (
    <motion.div 
      key="inquiries" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6 transition-colors duration-300"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Inquiries Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
            Manage admission and contact inquiries
          </p>
        </div>
        <Button 
          onClick={() => onNavigate('overview')} 
          variant="outline"
          className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowRight className="h-4 w-4 mr-1" /> Dashboard
        </Button>
      </div>
      
      <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4">
            {inquiries.map((inquiry) => (
              <div 
                key={inquiry.id} 
                className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {inquiry.name || 'Anonymous'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Mail className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{inquiry.email}</p>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-2">
                      {inquiry.message?.slice(0, 100)}...
                    </p>
                    <Badge className="mt-2 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-0">
                      {inquiry.status || 'Pending'}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
            {inquiries.length === 0 && (
              <div className="text-center py-12">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">No inquiries found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}