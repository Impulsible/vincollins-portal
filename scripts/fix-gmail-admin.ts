import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvittkvxtasayycmzgha.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aXR0a3Z4dGFzYXl5Y216Z2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA3Mjk3NiwiZXhwIjoyMDkwNjQ4OTc2fQ.Tuh_Bee7lYbwWh7kr__ydjf0C8xD4Ds9jI5_p147pTM'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixAdmin() {
  const email = 'vincollinscollege@gmail.com'
  const vinId = 'VIN-ADM-2244'

  console.log('🔧 Fixing admin password...\n')

  try {
    // Find the user in auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = users?.find(u => u.email === email)

    if (!authUser) {
      console.log(`❌ User ${email} not found in auth`)
      return
    }

    console.log(`✅ Found user: ${authUser.email} (ID: ${authUser.id})`)

    // Update password to match VIN ID
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: vinId }
    )

    if (updateError) {
      console.error('❌ Failed to update password:', updateError)
    } else {
      console.log('✅ Password updated successfully!')
    }

    // Update password_reset_required to false
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ password_reset_required: false })
      .eq('email', email)

    if (userError) {
      console.error('❌ Failed to update user record:', userError)
    } else {
      console.log('✅ User record updated')
    }

    console.log('\n========================================')
    console.log('✅ ADMIN READY!')
    console.log('========================================')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${vinId}`)
    console.log('========================================')
    console.log('Login at: http://localhost:3000/portal')
    console.log('========================================\n')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixAdmin()