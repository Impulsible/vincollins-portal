// app/api/admin/users/update/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function handleUpdate(req: NextRequest) {
  console.log('📦 API called: Update User')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    const { id, password, reset_password, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // ── PASSWORD RESET ──────────────────────────────────────────
    if (reset_password || password) {
      const newPassword = password || updateData.vin_id
      if (!newPassword) {
        return NextResponse.json({ error: 'New password is required' }, { status: 400 })
      }

      const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: newPassword
      })

      if (pwErr) {
        console.error('❌ Password reset failed:', pwErr.message)
        return NextResponse.json({ error: pwErr.message }, { status: 500 })
      }

      // Mark password as changed in profile
      await supabaseAdmin
        .from('profiles')
        .update({ password_changed: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      console.log('✅ Password reset for user:', id)
      return NextResponse.json({ success: true, message: 'Password reset successfully' })
    }

    // ── PROFILE UPDATE ──────────────────────────────────────────
    const ALLOWED = [
      'full_name', 'display_name', 'first_name', 'middle_name', 'last_name',
      'email', 'role', 'class', 'department', 'phone', 'address', 'gender',
      'date_of_birth', 'admission_number', 'admission_year', 'join_year',
      'next_term_begins', 'is_active', 'password_changed',
    ] as const

    const patch: Record<string, any> = {}
    for (const k of ALLOWED) {
      if (k in updateData) patch[k] = updateData[k]
    }
    patch.updated_at = new Date().toISOString()

    if (Object.keys(patch).length === 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Sync auth.users metadata
    const meta: Record<string, any> = {}
    if (updateData.full_name) meta.full_name = updateData.full_name
    if (updateData.display_name) meta.display_name = updateData.display_name
    if (updateData.first_name) meta.first_name = updateData.first_name
    if (updateData.middle_name) meta.middle_name = updateData.middle_name
    if (updateData.last_name) meta.last_name = updateData.last_name
    if (updateData.role) meta.role = updateData.role
    if ('is_active' in updateData) meta.is_active = updateData.is_active

    const authPatch: any = {}
    if (updateData.email) authPatch.email = updateData.email
    if (Object.keys(meta).length) authPatch.user_metadata = meta

    // Lock auth sessions if marked inactive
    if ('is_active' in updateData) {
      authPatch.ban_duration = updateData.is_active === false ? 'infinite' : 'none'
    }

    if (Object.keys(authPatch).length > 0) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(id, authPatch)
      if (authErr) {
        console.warn('⚠️ auth.updateUserById sync warning:', authErr.message)
      }
    }

    // Save to public.profiles
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Database update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ User updated:', id)
    return NextResponse.json({ success: true, user: data })
  } catch (error: any) {
    console.error('❌ API FATAL ERROR:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// Support both PUT and POST methods
export async function PUT(req: NextRequest) { return handleUpdate(req) }
export async function POST(req: NextRequest) { return handleUpdate(req) }