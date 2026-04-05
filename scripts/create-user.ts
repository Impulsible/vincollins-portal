/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const supabaseUrl = 'https://mvittkvxtasayycmzgha.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aXR0a3Z4dGFzYXl5Y216Z2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA3Mjk3NiwiZXhwIjoyMDkwNjQ4OTc2fQ.Tuh_Bee7lYbwWh7kr__ydjf0C8xD4Ds9jI5_p147pTM'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

function generateEmail(fullName: string): string {
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

async function createUser() {
  console.log('\n========================================')
  console.log('👥 Create New User')
  console.log('========================================\n')
  
  const fullName = await question('Enter full name: ')
  if (!fullName) {
    console.log('❌ Name is required')
    rl.close()
    return
  }
  
  const role = await question('Enter role (student/staff): ')
  if (role !== 'student' && role !== 'staff') {
    console.log('❌ Role must be "student" or "staff"')
    rl.close()
    return
  }
  
  const email = generateEmail(fullName)
  const vinNumber = Math.floor(1000 + Math.random() * 9000).toString()
  const vinId = `VIN-${role === 'student' ? 'STD' : 'STF'}-${vinNumber}`
  const password = vinId // Password is the VIN ID
  
  let classLevel = ''
  let department = ''
  
  if (role === 'student') {
    classLevel = await question('Enter class (e.g., SS2): ')
  } else {
    department = await question('Enter department (e.g., Mathematics): ')
  }
  
  console.log('\n========================================')
  console.log('📝 User Details')
  console.log('========================================')
  console.log(`👤 Name: ${fullName}`)
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 VIN ID (Password): ${vinId}`)
  console.log(`👔 Role: ${role.toUpperCase()}`)
  if (role === 'student') console.log(`📚 Class: ${classLevel}`)
  if (role === 'staff') console.log(`🏢 Department: ${department}`)
  console.log('========================================\n')
  
  const confirm = await question('Create this user? (y/n): ')
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled')
    rl.close()
    return
  }
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    
    if (authError) throw authError
    
    // Create user record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_id: authData.user.id,
        vin_id: vinId,
        email: email,
        role: role,
        password_reset_required: false,
      })
    
    if (userError) throw userError
    
    // Create profile
    const profileData: any = {
      auth_id: authData.user.id,
      full_name: fullName,
    }
    
    if (role === 'student') {
      profileData.class = classLevel
    } else if (role === 'staff') {
      profileData.department = department
    }
    
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
    
    if (profileError) throw profileError
    
    console.log('\n✅ USER CREATED SUCCESSFULLY!')
    console.log('========================================')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${vinId}`)
    console.log('========================================\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    rl.close()
  }
}

createUser()