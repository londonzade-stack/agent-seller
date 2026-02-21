// Client-safe admin utilities (no server-only imports)
export const ADMIN_EMAILS = ['londonzade@gmail.com']

export function isAdminEmail(email: string | undefined | null): boolean {
  return ADMIN_EMAILS.includes(email || '')
}
