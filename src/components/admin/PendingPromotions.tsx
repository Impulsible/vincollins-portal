'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle, GraduationCap } from 'lucide-react'

interface PendingPromotion {
  id: string
  student_id: string
  student_name: string
  current_class: string
  next_class: string
  status: string
  created_at: string
}

export function PendingPromotions() {
  const [promotions, setPromotions] = useState<PendingPromotion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<PendingPromotion | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [showDialog, setShowDialog] = useState(false)
  const [processing, setProcessing] = useState(false)

  const loadPromotions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/promotions')
      const data = await response.json()
      setPromotions(data.promotions || [])
    } catch (error) {
      console.error('Error loading promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPromotions()
  }, [])

  const handleApprove = async () => {
    if (!selectedStudent || !selectedDepartment) return
    
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.student_id,
          department: selectedDepartment,
          action: 'approve'
        })
      })
      
      if (!response.ok) throw new Error('Failed to approve')
      
      toast.success(`${selectedStudent.student_name} promoted to SS 1 (${selectedDepartment})`)
      setShowDialog(false)
      setSelectedStudent(null)
      setSelectedDepartment('')
      loadPromotions()
    } catch (error) {
      toast.error('Failed to approve promotion')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (student: PendingPromotion) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.student_id,
          action: 'reject'
        })
      })
      
      if (!response.ok) throw new Error('Failed to reject')
      
      toast.success(`Promotion rejected for ${student.student_name}`)
      loadPromotions()
    } catch (error) {
      toast.error('Failed to reject promotion')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (promotions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No pending promotions</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Pending Promotions ({promotions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
              >
                <div>
                  <p className="font-medium">{promo.student_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {promo.current_class} → {promo.next_class}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleReject(promo)}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setSelectedStudent(promo)
                      setShowDialog(true)
                    }}
                    disabled={processing}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Selection Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Department</DialogTitle>
            <DialogDescription>
              Select the department for {selectedStudent?.student_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Arts">Arts</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={!selectedDepartment || processing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm & Promote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}