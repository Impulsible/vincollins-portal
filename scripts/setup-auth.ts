import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvittkvxtasayycmzgha.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aXR0a3Z4dGFzYXl5Y216Z2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA3Mjk3NiwiZXhwIjoyMDkwNjQ4OTc2fQ.Tuh_Bee7lYbwWh7kr__ydjf0C8xD4Ds9jI5_p147pTM'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupAuth() {
  const email = 'vincollinscollege@gmail.com'
  const vinId = 'VIN-ADM-2244'
  const password = vinId

  console.log('🔧 Setting up authentication...\n')

  try {
    // 1. Check if user exists and delete if needed
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === email)

    if (existingUser) {
      console.log('⚠️ User exists, deleting...')
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
      console.log('✅ User deleted')
    }

    // 2. Create new auth user
    console.log('📝 Creating new auth user...')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) throw createError
    console.log('✅ Auth user created with ID:', newUser.user.id)

    // 3. Create user record
    console.log('📝 Creating user record...')
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: newUser.user.id,
        vin_id: vinId,
        email: email,
        role: 'admin',
      })

    if (userError) throw userError
    console.log('✅ User record created')

    // 4. Create profile
    console.log('📝 Creating profile...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        auth_id: newUser.user.id,
        full_name: 'System Administrator',
        department: 'Administration',
      })

    if (profileError) throw profileError
    console.log('✅ Profile created')

    console.log('\n========================================')
    console.log('✅ SETUP COMPLETE!')
    console.log('========================================')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log('========================================')
    console.log('Now login at: http://localhost:3000/portal')
    console.log('========================================\n')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

setupAuth()