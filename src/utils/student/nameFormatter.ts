export function formatFullName(
  firstName: string | null | undefined, 
  lastName: string | null | undefined, 
  middleName?: string | null | undefined,
  fallback: string = 'Student'
): string {
  if (firstName && lastName) {
    const parts = [firstName.trim()]
    if (middleName?.trim()) parts.push(middleName.trim())
    parts.push(lastName.trim())
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  }
  if (firstName) return firstName.trim()
  if (lastName) return lastName.trim()
  
  const words = fallback.split(/[\s.\-]+/).filter(w => w.length > 0)
  if (words.length >= 2) {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }
  return fallback || 'Student'
}

export function formatDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  middleName?: string | null | undefined,
  fallback: string = 'Student'
): string {
  if (firstName && lastName) {
    const parts = [lastName.trim(), firstName.trim()]
    if (middleName?.trim()) parts.push(middleName.trim())
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  }
  return formatFullName(firstName, lastName, middleName, fallback)
}

export function getBestDisplayName(
  profile: { display_name?: string | null; first_name?: string | null; last_name?: string | null; middle_name?: string | null; full_name?: string | null },
  fallback: string = 'Student'
): string {
  if (profile.display_name) return profile.display_name
  if (profile.first_name && profile.last_name) {
    return formatDisplayName(profile.first_name, profile.last_name, profile.middle_name)
  }
  return profile.full_name || formatFullName(profile.first_name, profile.last_name, profile.middle_name, fallback)
}

export function getInitials(
  firstName: string | null | undefined, 
  lastName: string | null | undefined, 
  fallback: string
): string {
  const first = firstName || ''
  const last = lastName || ''
  
  if (first && last) return (first.charAt(0) + last.charAt(0)).toUpperCase()
  if (first) return first.slice(0, 2).toUpperCase()
  if (last) return last.slice(0, 2).toUpperCase()
  
  const words = fallback.split(/[\s.\-]+/).filter(w => w.length > 0)
  if (words.length >= 2) return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return 'ST'
}