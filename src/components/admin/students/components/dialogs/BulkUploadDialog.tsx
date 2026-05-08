// components/admin/students/components/dialogs/BulkUploadDialog.tsx

'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  Check,
  XCircle,
} from 'lucide-react'
import { BulkUploadResult } from '../../types'
import { parseCSV, downloadCSVTemplate } from '../../utils'

interface BulkUploadDialogProps {
  onBulkUpload: (file: File) => Promise<BulkUploadResult | null>
  isSubmitting: boolean
}

export function BulkUploadDialog({
  onBulkUpload,
  isSubmitting,
}: BulkUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [results, setResults] = useState<BulkUploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setResults(null)

    const reader = new FileReader()
    reader.onload = event => {
      try {
        const text = event.target?.result as string
        const data = parseCSV(text)
        setPreview(data.slice(0, 5))
      } catch (error: any) {
        setFile(null)
        setPreview([])
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return
    const result = await onBulkUpload(file)
    if (result) setResults(result)
  }

  const handleClose = () => {
    setOpen(false)
    setFile(null)
    setPreview([])
    setResults(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Upload Students
          </DialogTitle>
          <DialogDescription>
            Upload multiple students at once using a CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1: Download Template */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Step 1: Download Template
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Download the CSV template with the correct format.
            </p>
            <Button variant="outline" onClick={downloadCSVTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>

          {/* Step 2: Upload */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
            <h4 className="font-medium mb-2">Step 2: Upload CSV File</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Required: <strong>first_name, last_name, class</strong>
              <br />
              Optional: middle_name, department, admission_year, gender,
              date_of_birth, next_term_begins, phone, address
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Preview */}
          {preview.length > 0 && !results && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <h4 className="font-medium mb-2">Preview (First 5 rows)</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First</TableHead>
                      <TableHead>Last</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Year</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.first_name}</TableCell>
                        <TableCell>{row.last_name}</TableCell>
                        <TableCell>{row.class}</TableCell>
                        <TableCell className="capitalize">
                          {row.gender || 'male'}
                        </TableCell>
                        <TableCell>
                          {row.admission_year || new Date().getFullYear()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <h4 className="font-medium mb-2">Upload Results</h4>
              <div className="flex gap-4 mb-4">
                <Badge className="bg-green-100 text-green-700">
                  <Check className="mr-1 h-3 w-3" />
                  {results.success} Success
                </Badge>
                {results.failed > 0 && (
                  <Badge className="bg-red-100 text-red-700">
                    <XCircle className="mr-1 h-3 w-3" />
                    {results.failed} Failed
                  </Badge>
                )}
              </div>

              {results.students.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-green-600 mb-2">
                    Created Students:
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.students.map((s, i) => (
                      <div
                        key={i}
                        className="text-xs bg-green-50 p-2 rounded"
                      >
                        {s.full_name} - {s.email} (Adm: {s.admission_number})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">
                    Errors:
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.errors.map((err, i) => (
                      <div key={i} className="text-xs bg-red-50 p-2 rounded">
                        <strong>Line {err.line}:</strong> {err.student} -{' '}
                        {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Gender, DOB, and Next Term Begins only
              appear in Portal and Report Cards. They are NOT visible in CBT
              exams.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Students
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}