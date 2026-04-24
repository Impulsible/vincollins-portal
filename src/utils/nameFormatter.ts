// utils/nameFormatter.ts
export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
  middleName?: string | null,
  fallbackName?: string
): string {
  if (firstName && lastName) {
    const parts: string[] = [firstName]
    if (middleName) parts.push(middleName)
    parts.push(lastName)
    return parts.filter(Boolean).join(' ')
  }
  
  if (fallbackName) {
    return fallbackName
  }
  
  if (firstName) {
    return firstName
  }
  
  if (lastName) {
    return lastName
  }
  
  return 'Student'
}

export function formatDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  middleName?: string | null
): string {
  if (firstName && lastName) {
    const parts: string[] = []
    if (lastName) parts.push(lastName)
    if (firstName) parts.push(firstName)
    if (middleName) parts.push(middleName)
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  }
  
  if (firstName) {
    return firstName
  }
  
  if (lastName) {
    return lastName
  }
  
  return 'Student'
}