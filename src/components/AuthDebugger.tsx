// src/components/AuthDebugger.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function AuthDebugger() {
  const { user, loading, error } = useUser()
  const [session, setSession] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
    }
    
    checkSession()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!showDebug) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 text-xs opacity-50 hover:opacity-100"
        onClick={() => setShowDebug(true)}
      >
        Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto z-50">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold">Auth Debugger</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>×</Button>
        </div>
        
        <div className="space-y-2 text-xs">
          <div>
            <p className="font-medium">Session Status:</p>
            <Badge className={session ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
              {session ? 'Active' : 'No Session'}
            </Badge>
          </div>
          
          <div>
            <p className="font-medium">Loading:</p>
            <Badge>{loading ? 'Loading...' : 'Loaded'}</Badge>
          </div>
          
          {error && (
            <div>
              <p className="font-medium text-red-600">Error:</p>
              <p className="text-red-500">{error}</p>
            </div>
          )}
          
          <div>
            <p className="font-medium">User:</p>
            <pre className="bg-slate-100 p-1 rounded text-[10px] overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div>
            <p className="font-medium">Session:</p>
            <pre className="bg-slate-100 p-1 rounded text-[10px] overflow-x-auto">
              {JSON.stringify({
                expires_at: session?.expires_at,
                expires_in: session?.expires_in,
                user_email: session?.user?.email,
              }, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}