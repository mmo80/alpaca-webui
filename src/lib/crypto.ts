import { env } from '@/env';
import * as crypto from 'crypto';

// Constants
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ITERATIONS = 10000; // Higher is more secure but slower
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits

const MASTER_KEY = env.CRYPTO_SECRET_KEY ?? 'development-only-key-do-not-use';

/**
 * Derives an encryption key using PBKDF2
 * @param salt - The salt to use for key derivation
 * @returns Object containing the derived key and salt
 */
const deriveKey = (salt?: Buffer): { key: Buffer; salt: Buffer } => {
  // Generate a random salt if not provided
  const useSalt = salt ?? crypto.randomBytes(SALT_LENGTH);

  // Derive a key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(MASTER_KEY, useSalt, ITERATIONS, KEY_LENGTH, 'sha256');

  return { key: derivedKey, salt: useSalt };
};

/**
 * Encrypts a string using AES-GCM (authenticated encryption).
 * @param text - The plaintext to encrypt.
 * @returns Base64-encoded encrypted string with salt, IV and authentication tag.
 */
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(12); // 12-byte IV for GCM

  const { key, salt } = deriveKey();

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag(); // Authentication tag

  return `${salt.toString('base64')}:${iv.toString('base64')}:${encrypted}:${tag.toString('base64')}`;
};

/**
 * Decrypts a string using AES-GCM.
 * @param encryptedData - Base64-encoded encrypted string with salt, IV and tag.
 * @returns Decrypted plaintext.
 */
export const decrypt = (encryptedData: string): string => {
  // Check for empty string and throw a more specific error
  if (encryptedData === '') {
    throw new Error('Invalid encrypted data format: data is empty');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format: missing colon (":") separator');
  }

  const [saltBase64, ivBase64, encryptedText, tagBase64] = parts;

  if (!ivBase64 || !encryptedText || !tagBase64 || !saltBase64) {
    throw new Error('Invalid encrypted data format: missing IV, encrypted text, tag or salt');
  }

  const salt = Buffer.from(saltBase64, 'base64');
  const iv = Buffer.from(ivBase64, 'base64');
  const tag = Buffer.from(tagBase64, 'base64');

  const { key } = deriveKey(salt);

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  try {
    decrypted += decipher.final('utf8');
  } catch {
    throw new Error('Decryption failed: invalid authentication tag (data may be tampered)');
  }

  return decrypted;
};
