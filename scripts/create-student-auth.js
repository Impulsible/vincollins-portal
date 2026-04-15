import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const supabaseUrl = 'https://mvittkvxtasayycmzgha.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aXR0a3Z4dGFzYXl5Y216Z2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA3Mjk3NiwiZXhwIjoyMDkwNjQ4OTc2fQ.Tuh_Bee7lYbwWh7kr__ydjf0C8xD4Ds9jI5_p147pTM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// All 19 JSS 1 students with their correct VIN IDs from your database
const students = [
  { email: 'ajibade.valerie@vincollins.edu.ng', password: 'VIN-STD-2025-8482', fullName: 'Ajibade Valerie' },
  { email: 'ajose.abdulroheem@vincollins.edu.ng', password: 'VIN-STD-2025-4518', fullName: 'Ajose Abdulroheem' },
  { email: 'ani.asher@vincollins.edu.ng', password: 'VIN-STD-2025-2460', fullName: 'Ani Asher' },
  { email: 'animasaun.alesha@vincollins.edu.ng', password: 'VIN-STD-2025-1438', fullName: 'Animasaun Alesha' },
  { email: 'anuoluwapo.fakorede@vincollins.edu.ng', password: 'VIN-STD-2025-2652', fullName: 'Anuoluwapo Fakorede' },
  { email: 'arowoshola.sofia@vincollins.edu.ng', password: 'VIN-STD-2025-6839', fullName: 'Arowoshola Sofia' },
  { email: 'banji.oluwanifemi@vincollins.edu.ng', password: 'VIN-STD-2025-5712', fullName: 'Banji Oluwanifemi' },
  { email: 'enebechi.chifumnanya@vincollins.edu.ng', password: 'VIN-STD-2025-4030', fullName: 'Enebechi Chifumnanya' },
  { email: 'lateef.faizan@vincollins.edu.ng', password: 'VIN-STD-2025-5012', fullName: 'Lateef Faizan' },
  { email: 'mbachu.vera@vincollins.edu.ng', password: 'VIN-STD-2025-7306', fullName: 'Mbachu Vera' },
  { email: 'muheez.abiodun@vincollins.edu.ng', password: 'VIN-STD-2025-3377', fullName: 'Muheez Abiodun' },
  { email: 'nnamdi.sophie@vincollins.edu.ng', password: 'VIN-STD-2025-3363', fullName: 'Nnamdi Sophie' },
  { email: 'olaiya.eniaranimi@vincollins.edu.ng', password: 'VIN-STD-2025-1848', fullName: 'Olaiya Eniaranimi' },
  { email: 'osunmo.olamide@vincollins.edu.ng', password: 'VIN-STD-2025-5561', fullName: 'Osunmo Olamide' },
  { email: 'oteniara.memunat@vincollins.edu.ng', password: 'VIN-STD-2025-4683', fullName: 'Oteniara Memunat' },
  { email: 'samsondeen.hameerah@vincollins.edu.ng', password: 'VIN-STD-2025-8704', fullName: 'Samsondeen Hameerah' },
  { email: 'sulaimon.fareedah@vincollins.edu.ng', password: 'VIN-STD-2025-4941', fullName: 'Sulaimon Fareedah' },
  { email: 'unuas.destiny@vincollins.edu.ng', password: 'VIN-STD-2025-9908', fullName: 'Unuas Destiny' },
  { email: 'yusuf.laila@vincollins.edu.ng', password: 'VIN-STD-2025-6659', fullName: 'Yusuf Laila' }
]

async function createAuthUsers() {
  console.log('🚀 Starting auth user creation...\n')
  
  let successCount = 0
  let failCount = 0
  let existingCount = 0

  for (const student of students) {
    try {
      // Check if user already exists in auth
      const { data: existingUser, error: checkError } = await supabase.auth.admin.getUserByEmail(student.email)
      
      if (checkError && checkError.message.includes('User not found')) {
        // Create new auth user
        const { data, error } = await supabase.auth.admin.createUser({
          email: student.email,
          password: student.password,
          email_confirm: true,
          user_metadata: {
            full_name: student.fullName,
            role: 'student'
          }
        })
        
        if (error) {
          console.error(`❌ Failed: ${student.email} - ${error.message}`)
          failCount++
        } else {
          console.log(`✅ Created: ${student.email} (${student.fullName})`)
          
          // Update the users table with correct auth_id
          const { error: updateError } = await supabase
            .from('users')
            .update({ auth_id: data.user.id })
            .eq('email', student.email)
            
          if (updateError) {
            console.warn(`⚠️ Could not update users table for ${student.email}`)
          } else {
            console.log(`   📝 Updated users table for ${student.email}`)
          }
          
          successCount++
        }
      } else if (existingUser?.user) {
        console.log(`⏭️ Already exists: ${student.email}`)
        existingCount++
      } else {
        console.error(`❌ Error checking ${student.email}:`, checkError?.message)
        failCount++
      }
    } catch (err) {
      console.error(`❌ Error processing ${student.email}:`, err.message)
      failCount++
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Created: ${successCount}`)
  console.log(`   ⏭️ Already existed: ${existingCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log('\n✅ Auth user creation completed!')
}

createAuthUsers()