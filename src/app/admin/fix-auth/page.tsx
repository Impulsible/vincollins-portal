// app/admin/fix-auth/page.tsx (Temporary fix page)
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function FixAuthPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const fixMissingAuthUsers = async () => {
    setLoading(true)
    setResults([])

    // Students with missing auth users
    const studentsToFix = [
      {
        id: '5c1f046e-1900-4bff-bdc6-dcf7fbc95e5a',
        email: 'ani.asher@vincollins.edu.ng',
        password: 'VIN-STD-2025-4512',
        name: 'Ani Asher John'
      },
      {
        id: '291e7b30-8bda-4e6e-818a-feac9a5aeb39',
        email: 'emmanuella.soga@vincollins.edu.ng',
        password: 'VIN-STD-2024-1274',
        name: 'Emmanuella Soga'
      }
    ]

    for (const student of studentsToFix) {
      try {
        const response = await fetch('/api/admin/users/create-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student)
        })

        const result = await response.json()
        
        if (response.ok) {
          setResults(prev => [...prev, `✅ ${student.name} - Auth user created`])
          toast.success(`Fixed: ${student.name}`)
        } else {
          setResults(prev => [...prev, `❌ ${student.name} - ${result.error}`])
          toast.error(`Failed: ${student.name}`)
        }
      } catch (error: any) {
        setResults(prev => [...prev, `❌ ${student.name} - ${error.message}`])
      }
    }

    setLoading(false)
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Fix Missing Auth Users</h1>
      
      <div className="bg-yellow-50 p-4 rounded-lg mb-4">
        <p className="text-sm font-medium text-yellow-800">Students missing auth users:</p>
        <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
          <li>Ani Asher John - VIN-STD-2025-4512</li>
          <li>Emmanuella Soga - VIN-STD-2024-1274</li>
        </ul>
      </div>

      <Button onClick={fixMissingAuthUsers} disabled={loading} className="w-full">
        {loading ? 'Fixing...' : 'Fix Missing Auth Users'}
      </Button>

      {results.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="font-medium mb-2">Results:</p>
          {results.map((r, i) => (
            <p key={i} className="text-sm">{r}</p>
          ))}
        </div>
      )}
    </div>
  )
}