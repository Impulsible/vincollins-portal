// lib/get-display-name.ts
// Single source of truth for all name extraction across the app

interface NameSource {
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  full_name?: string | null
}

/**
 * Extract first name with priority:
 *   1. `first_name` column (if non-empty)  ← always prefer this
 *   2. First word of `display_name`
 *   3. First word of `full_name`
 *   4. Fallback "User"
 * Always returns nicely-capitalized text.
 */
export function getFirstName(profile?: NameSource | null): string {
  if (!profile) return 'User'

  const capitalize = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

  // 1. Explicit first_name column (preferred)
  if (profile.first_name?.trim()) {
    return capitalize(profile.first_name.trim())
  }

  // 2. First word of display_name
  if (profile.display_name?.trim()) {
    const first = profile.display_name.trim().split(/\s+/)[0]
    if (first) return capitalize(first)
  }

  // 3. First word of full_name
  if (profile.full_name?.trim()) {
    const first = profile.full_name.trim().split(/\s+/)[0]
    if (first) return capitalize(first)
  }

  return 'User'
}

/**
 * Full display name with priority:
 *   1. `display_name`
 *   2. `first_name + last_name`
 *   3. `full_name`
 *   4. Fallback
 */
export function getDisplayName(
  profile?: NameSource | null,
  fallback = 'User'
): string {
  if (!profile) return fallback

  if (profile.display_name?.trim()) return profile.display_name.trim()

  if (profile.first_name?.trim() && profile.last_name?.trim()) {
    return `${profile.first_name.trim()} ${profile.last_name.trim()}`
  }

  if (profile.full_name?.trim()) return profile.full_name.trim()

  return fallback
}