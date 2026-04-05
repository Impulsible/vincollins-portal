'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  redirectTo?: string
}

export function LogoutButton({ 
  variant = 'outline', 
  size = 'default',
  className = '',
  redirectTo = '/portal'
}: LogoutButtonProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    try {
      // Clear any local storage items
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      // Show success message
      toast.success('Logged out successfully')
      
      // Redirect to login page
      router.push(redirectTo)
      router.refresh()
      
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout. Please try again.')
      
      // Force redirect even if error
      setTimeout(() => {
        window.location.href = redirectTo
      }, 1000)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
    >
      {isLoggingOut ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Logging out...
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </>
      )}
    </Button>
  )
}