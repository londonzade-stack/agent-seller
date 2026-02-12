/**
 * Sanitized error logging utility.
 *
 * Prevents accidental leaking of sensitive data (tokens, credentials, full
 * error stacks with internal paths) in production logs. Strips common
 * sensitive patterns from error messages before logging.
 */

// Patterns that may contain sensitive data
const SENSITIVE_PATTERNS = [
  // OAuth / API tokens
  /ya29\.[A-Za-z0-9_-]+/g,           // Google access tokens
  /1\/\/[A-Za-z0-9_-]+/g,            // Google refresh tokens
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/g, // JWT tokens
  /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,  // Bearer tokens in headers
  /token['":\s]*[A-Za-z0-9._~+/=-]{20,}/gi, // Generic long token values
  /access_token['":\s]*[A-Za-z0-9._~+/=-]+/gi,
  /refresh_token['":\s]*[A-Za-z0-9._~+/=-]+/gi,
  // API keys
  /AIza[A-Za-z0-9_-]{35}/g,          // Google API keys
  /sk-[A-Za-z0-9]{20,}/g,            // OpenAI-style keys
  // Passwords / secrets
  /password['":\s]*\S+/gi,
  /secret['":\s]*\S+/gi,
]

/**
 * Strip sensitive patterns from a string.
 */
function redact(input: string): string {
  let result = input
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

/**
 * Extract a safe error message from an unknown error value.
 * Returns only the error message, not the full stack trace (which can
 * contain file paths and internal details).
 */
function getSafeMessage(error: unknown): string {
  if (error instanceof Error) {
    return redact(error.message)
  }
  if (typeof error === 'string') {
    return redact(error)
  }
  // For objects, only log a type indicator, not the full contents
  // (which could contain tokens or credentials)
  return 'Non-Error object thrown'
}

/**
 * Log an error with a context label. Sensitive information is stripped
 * before the message reaches the log output.
 *
 * @param label - A short label describing where the error occurred
 * @param error - The caught error value
 */
export function sanitizeError(label: string, error: unknown): void {
  const safeMessage = getSafeMessage(error)
  // Use console.warn in production-like contexts so it's still visible
  // but clearly distinguished from raw console.error dumps
  console.warn(`[${label}] ${safeMessage}`)
}
