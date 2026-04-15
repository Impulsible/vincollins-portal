/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvittkvxtasayycmzgha.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aXR0a3Z4dGFzYXl5Y216Z2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA3Mjk3NiwiZXhwIjoyMDkwNjQ4OTc2fQ.Tuh_Bee7lYbwWh7kr__ydjf0C8xD4Ds9jI5_p147pTM'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

function generateEmail(fullName: string, role: string): string {
  const nameParts = fullName.trim().split(' ')
  let email = ''
  
  if (nameParts.length === 1) {
    email = nameParts[0].toLowerCase().replace(/\s/g, '')
  } else {
    const firstName = nameParts[0]
    const lastName = nameParts[nameParts.length - 1]
    const firstInitial = firstName.charAt(0).toLowerCase()
    const surname = lastName.toLowerCase()
    email = `${firstInitial}${surname}@vincollins.edu.ng`
  }
  
  email = email.replace(/[^a-zA-Z0-9@.]/g, '')
  return email
}

async function createAdmin() {
  const fullName = 'System Administrator'
  const email = 'vincollinscollege@gmail.com' // Admin uses custom email
  const role = 'admin'
  
  // Generate random VIN
  const vinNumber = Math.floor(1000 + Math.random() * 9000).toString()
  const vinId = `VIN-ADM-${vinNumber}`
  const password = vinId

  console.log('\n========================================')
  console.log('🔐 Creating Admin Account')
  console.log('========================================\n')
  console.log(`👤 Name: ${fullName}`)
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 VIN ID (Password): ${vinId}`)
  console.log(`👔 Role: ${role.toUpperCase()}`)
  console.log('========================================\n')

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === email)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      console.log('⚠️  User already exists, updating password...')
      await supabaseAdmin.auth.admin.updateUserById(userId, { password })
      console.log('✅ Password updated')
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (authError) throw authError
      userId = authData.user.id
      console.log('✅ Auth user created')
    }

    // Check if user record exists
    const { data: existingRecord } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (!existingRecord) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          auth_id: userId,
          vin_id: vinId,
          email: email,
          role: role,
          password_reset_required: false,
        })

      if (userError) throw userError
      console.log('✅ User record created')
    } else {
      await supabaseAdmin
        .from('users')
        .update({ vin_id: vinId, role: role })
        .eq('email', email)
      console.log('✅ User record updated')
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('auth_id', userId)
      .single()

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          auth_id: userId,
          full_name: fullName,
          department: 'Administration',
        })

      if (profileError) throw profileError
      console.log('✅ Profile created')
    }

    console.log('\n========================================')
    console.log('✅ ADMIN ACCOUNT READY!')
    console.log('========================================')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${vinId}`)
    console.log('========================================')
    console.log('🔗 Login URL: http://localhost:3000/portal')
    console.log('========================================\n')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createAdmin()