import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvittkvxtasayycmzgha.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aXR0a3Z4dGFzYXl5Y216Z2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA3Mjk3NiwiZXhwIjoyMDkwNjQ4OTc2fQ.Tuh_Bee7lYbwWh7kr__ydjf0C8xD4Ds9jI5_p147pTM'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateAdminPassword() {
  const email = 'vincollinscollege@gmail.com'
  const newPassword = 'VIN-ADM-7823'
  
  try {
    // Find the user
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.users.find(u => u.email === email)
    
    if (!user) {
      console.log('❌ User not found in auth')
      return
    }
    
    console.log(`✅ Found user: ${user.email}`)
    console.log(`🆔 User ID: ${user.id}`)
    
    // Update password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    })
    
    if (error) throw error
    
    console.log('\n========================================')
    console.log('✅ PASSWORD UPDATED SUCCESSFULLY!')
    console.log('========================================')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${newPassword}`)
    console.log('========================================\n')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

updateAdminPassword()