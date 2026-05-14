import { createClient } from '@supabase/supabase-js'

// Hardcoded temporarily - replace with env vars once Node version is fixed
const supabaseUrl = 'https://mvittkvxtasayycmzgha.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aXR0a3Z4dGFzYXl5Y216Z2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzI5NzYsImV4cCI6MjA5MDY0ODk3Nn0.FYPLMLno13XhGyo9mFkOqNUWp2AXsfCzDB3DYEn-ABw'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
  },
  global: {
    headers: { 
      'x-application-name': 'vincollins-college' 
    },
  },
})