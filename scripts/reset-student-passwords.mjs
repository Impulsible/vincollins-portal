import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvittkvxtasayycmzgha.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12aXR0a3Z4dGFzYXl5Y216Z2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA3Mjk3NiwiZXhwIjoyMDkwNjQ4OTc2fQ.Tuh_Bee7lYbwWh7kr__ydjf0C8xD4Ds9jI5_p147pTM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

async function resetPasswords() {
  console.log('🔐 Starting password reset for all students...\n')
  
  let successCount = 0
  let failCount = 0

  for (const student of students) {
    try {
      // Get user by email first
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.error(`Error listing users:`, listError)
        continue
      }
      
      const user = users?.users?.find(u => u.email === student.email)
      
      if (!user) {
        console.error(`❌ User not found: ${student.email}`)
        failCount++
        continue
      }
      
      // Reset password using admin API
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: student.password }
      )
      
      if (resetError) {
        console.error(`❌ Failed to reset password for ${student.email}:`, resetError.message)
        failCount++
      } else {
        console.log(`✅ Password reset for: ${student.email} (${student.fullName})`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ Error processing ${student.email}:`, err.message)
      failCount++
    }
    
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log('\n✅ Password reset completed!')
  console.log('\n📝 Students can now login with:')
  console.log('   Email: their email address')
  console.log('   Password: their VIN ID (e.g., VIN-STD-2025-8482)')
}

resetPasswords()