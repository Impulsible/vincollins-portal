// src/lib/env.ts
// Validate all required environment variables at startup
// Import this in layout.tsx or any server component that needs it

const required = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const

const optional = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
  NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ?? new Date().toISOString(),
  NEXT_PUBLIC_GOOGLE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  NEXT_PUBLIC_SUPABASE_DEBUG: process.env.NEXT_PUBLIC_SUPABASE_DEBUG === 'true',
} as const

// Validate on import — throws in dev, logs in prod
const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missing.length > 0) {
  const msg = `[env] Missing required environment variables:\n${missing.map((k) => `  • ${k}`).join('\n')}`

  if (process.env.NODE_ENV === 'development') {
    throw new Error(msg)
  } else {
    console.error(msg)
  }
}

export const env = {
  supabaseUrl: required.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: required.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: optional.SUPABASE_SERVICE_ROLE_KEY,
  appVersion: optional.NEXT_PUBLIC_APP_VERSION,
  buildTimestamp: optional.NEXT_PUBLIC_BUILD_TIMESTAMP,
  googleVerification: optional.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  isDebug: optional.NEXT_PUBLIC_SUPABASE_DEBUG,
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const