/**
 * Field-level encryption/decryption utilities for PII
 * Uses AES-256 encryption from crypto-js
 */

import CryptoJS from 'crypto-js';

/**
 * Get encryption key from environment
 * Falls back to a development key (Vercel builds will complete, but encryption will fail at runtime without the key)
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY || process.env.DATABASE_ENCRYPTION_KEY;

  if (!key) {
    // Log warning in production - ENCRYPTION_KEY should be set for security
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '⚠️ WARNING: ENCRYPTION_KEY environment variable is not set. Database encryption is disabled. ' +
        'Set ENCRYPTION_KEY in your environment variables for production deployment.'
      );
    }
    // Use a consistent development key for fallback
    return 'eNcRyPtIoN_DeV_kEy_pLeAsE_sEt_eNcRyPtIoN_kEy_eNv_vAr';
  }

  return key;
}

/**
 * Validate that encryption key is secure (minimum 32 characters)
 */
function validateEncryptionKey(key: string): boolean {
  return key.length >= 32;
}

/**
 * Encrypt a string value using AES-256
 * @param plaintext - The value to encrypt
 * @returns Encrypted string (base64 encoded)
 */
export function encryptField(plaintext: string | null | undefined): string {
  // Handle null/undefined values
  if (plaintext === null || plaintext === undefined) {
    return '';
  }

  // Convert to string if not already
  const textToEncrypt = String(plaintext);

  if (!textToEncrypt) {
    return '';
  }

  try {
    const key = getEncryptionKey();

    if (!validateEncryptionKey(key)) {
      console.warn(
        'Encryption key is less than 32 characters. Consider using a stronger key.'
      );
    }

    // Use AES encryption with the key
    const encrypted = CryptoJS.AES.encrypt(textToEncrypt, key).toString();

    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt field: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt an encrypted string value
 * @param ciphertext - The encrypted value (base64 encoded)
 * @returns Decrypted string or empty string if decryption fails
 */
export function decryptField(ciphertext: string | null | undefined): string {
  // Handle null/undefined/empty values
  if (!ciphertext) {
    return '';
  }

  try {
    const key = getEncryptionKey();

    // Decrypt using AES
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key).toString(
      CryptoJS.enc.Utf8
    );

    // Validate that decryption was successful
    if (!decrypted) {
      console.warn('Decryption returned empty string. Possible corruption or wrong key.');
      return '';
    }

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // In production, log this as a security event
    if (process.env.NODE_ENV === 'production') {
      console.error(
        'SECURITY: Failed to decrypt field. This may indicate data corruption or wrong encryption key.'
      );
    }
    return '';
  }
}

/**
 * Encrypt an object with selective field encryption
 * @param obj - Object to encrypt
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @returns Object with specified fields encrypted
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: string[]
): T {
  if (!obj) {
    return obj;
  }

  const encrypted: any = { ...obj };

  for (const field of fieldsToEncrypt) {
    if (field in encrypted && encrypted[field]) {
      encrypted[field] = encryptField(String(encrypted[field]));
    }
  }

  return encrypted as T;
}

/**
 * Decrypt an object with selective field decryption
 * @param obj - Object with encrypted fields
 * @param fieldsToDecrypt - Array of field names to decrypt
 * @returns Object with specified fields decrypted
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: string[]
): T {
  if (!obj) {
    return obj;
  }

  const decrypted: any = { ...obj };

  for (const field of fieldsToDecrypt) {
    if (field in decrypted && decrypted[field]) {
      decrypted[field] = decryptField(String(decrypted[field]));
    }
  }

  return decrypted as T;
}

/**
 * Encrypt a JSON object for storage
 * @param obj - Object to encrypt
 * @returns Encrypted JSON string
 */
export function encryptJSON(obj: any): string {
  try {
    const json = JSON.stringify(obj);
    return encryptField(json);
  } catch (error) {
    console.error('Failed to encrypt JSON:', error);
    throw new Error(`Failed to encrypt JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a JSON object from storage
 * @param encrypted - Encrypted JSON string
 * @returns Decrypted object
 */
export function decryptJSON(encrypted: string | null | undefined): any {
  try {
    if (!encrypted) {
      return null;
    }

    const decrypted = decryptField(encrypted);
    if (!decrypted) {
      return null;
    }

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to decrypt JSON:', error);
    return null;
  }
}

/**
 * Check if a value is encrypted (heuristic)
 * @param value - Value to check
 * @returns True if value appears to be encrypted
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  // Encrypted values from crypto-js are base64 strings with specific format
  // They typically start with U2F and contain the encrypted data
  try {
    // If it's a valid base64 string with sufficient length, it's likely encrypted
    return value.length > 20 && /^[A-Za-z0-9+/=]+$/.test(value);
  } catch {
    return false;
  }
}

/**
 * Validate encryption setup
 * Call this on application startup to ensure encryption is properly configured
 */
export function validateEncryptionSetup(): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  try {
    const key = getEncryptionKey();

    if (!validateEncryptionKey(key)) {
      warnings.push(
        'Encryption key is less than 32 characters. Use a stronger key in production.'
      );
    }

    if (process.env.NODE_ENV !== 'production' && key.includes('DeV_kEy')) {
      warnings.push(
        'Using development encryption key. Set ENCRYPTION_KEY environment variable for production.'
      );
    }

    // Test encryption/decryption
    const testData = 'test_encryption_validation';
    const encrypted = encryptField(testData);
    const decrypted = decryptField(encrypted);

    if (decrypted !== testData) {
      return {
        isValid: false,
        warnings: ['Encryption/decryption validation failed. Check your ENCRYPTION_KEY.'],
      };
    }

    return {
      isValid: true,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      warnings: [
        `Encryption validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ],
    };
  }
}

/**
 * Database field encryption configuration
 * Defines which fields in each table should be encrypted
 */
export const ENCRYPTED_FIELDS = {
  User: ['email', 'phone', 'firstName', 'lastName'],
  UserAddress: ['address', 'division', 'district', 'upazila', 'postCode', 'firstName', 'lastName', 'phone', 'email'],
  PaymentTransaction: ['customerDetails'], // Will be stored as encrypted JSON
  ChatMessage: ['content'], // Encrypt message content
  Review: ['title', 'content'], // Already sanitized in API
};

/**
 * Get fields to encrypt for a given model
 */
export function getEncryptedFields(model: string): string[] {
  return (ENCRYPTED_FIELDS as Record<string, string[]>)[model] || [];
}
