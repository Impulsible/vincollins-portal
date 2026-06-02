// app/api/version/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    version: '2.0.0',
    deployedAt: new Date().toISOString()
  })
}