import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set')
  }
  // Key must be 32 bytes (256 bits) for AES-256
  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a string encrypted by encrypt().
 * Expects format: iv:authTag:ciphertext (all hex-encoded).
 * Returns null if decryption fails (e.g. plain text token that was never encrypted).
 */
export function decrypt(encryptedText: string): string | null {
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      // Not in encrypted format — likely a legacy plain text token
      return null
    }

    const key = getEncryptionKey()
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const ciphertext = parts[2]

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      return null
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch {
    // Decryption failed — could be plain text or corrupted
    return null
  }
}

/**
 * Decrypt a token, falling back to the raw value if it's not encrypted.
 * This supports the migration period where old tokens are plain text
 * and new tokens are encrypted.
 */
export function decryptToken(storedValue: string): string {
  const decrypted = decrypt(storedValue)
  if (decrypted !== null) {
    return decrypted
  }
  // Fallback: treat as plain text (legacy token)
  return storedValue
}
