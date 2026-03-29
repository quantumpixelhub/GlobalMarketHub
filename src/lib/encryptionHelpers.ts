/**
 * User profile serialization/deserialization with encryption
 * Handles encryption of sensitive fields for API responses
 */

import { 
  encryptField, 
  decryptField,
  encryptJSON, 
  decryptJSON 
} from './encryption';

/**
 * Fields that should be encrypted when stored in database
 * Email and phone are NOT encrypted since they're used for authentication
 * Additional security is provided by HTTPS and access controls
 */
export const USER_FIELDS_TO_ENCRYPT = ['firstName', 'lastName', 'profileImage'];

export const ADDRESS_FIELDS_TO_ENCRYPT = [
  'firstName',
  'lastName',
  'phone',
  'address',
  'division',
  'district',
  'upazila',
  'postCode',
];

/**
 * Encrypt user data before storage
 * @param userData - User data from API
 * @returns Data with selected fields encrypted
 */
export function encryptUserForStorage(userData: any): any {
  if (!userData) return userData;

  const toEncrypt = { ...userData };

  // Encrypt PII fields
  for (const field of USER_FIELDS_TO_ENCRYPT) {
    if (field in toEncrypt && toEncrypt[field]) {
      toEncrypt[field] = encryptValue(String(toEncrypt[field]));
    }
  }

  return toEncrypt;
}

/**
 * Decrypt user data after retrieval from storage
 * @param userData - User data from database
 * @returns Data with selected fields decrypted
 */
export function decryptUserFromStorage(userData: any): any {
  if (!userData) return userData;

  const decrypted = { ...userData };

  // Decrypt PII fields
  for (const field of USER_FIELDS_TO_ENCRYPT) {
    if (field in decrypted && decrypted[field]) {
      decrypted[field] = decryptValue(String(decrypted[field])) || userData[field] || '';
    }
  }

  return decrypted;
}

/**
 * Encrypt address for storage
 * @param address - Address data from API
 * @returns Address with selected fields encrypted
 */
export function encryptAddressForStorage(address: any): any {
  if (!address) return address;

  const encrypted = { ...address };

  for (const field of ADDRESS_FIELDS_TO_ENCRYPT) {
    if (field in encrypted && encrypted[field]) {
      encrypted[field] = encryptValue(String(encrypted[field]));
    }
  }

  return encrypted;
}

/**
 * Decrypt address after retrieval from storage
 * @param address - Address data from database
 * @returns Address with selected fields decrypted
 */
export function decryptAddressFromStorage(address: any): any {
  if (!address) return address;

  const decrypted = { ...address };

  for (const field of ADDRESS_FIELDS_TO_ENCRYPT) {
    if (field in decrypted && decrypted[field]) {
      decrypted[field] = decryptValue(String(decrypted[field])) || address[field] || '';
    }
  }

  return decrypted;
}

/**
 * Encrypt array of addresses
 */
export function encryptAddressListForStorage(addresses: any[]): any[] {
  if (!Array.isArray(addresses)) return addresses;

  return addresses.map((addr) => encryptAddressForStorage(addr));
}

/**
 * Decrypt array of addresses
 */
export function decryptAddressListFromStorage(addresses: any[]): any[] {
  if (!Array.isArray(addresses)) return addresses;

  return addresses.map((addr) => decryptAddressFromStorage(addr));
}

/**
 * Encrypt payment details JSON
 */
export function encryptPaymentDetailsForStorage(details: any): string {
  if (!details) return '';

  try {
    return encryptJSON(details);
  } catch (error) {
    console.error('Error encrypting payment details:', error);
    return '';
  }
}

/**
 * Decrypt payment details JSON
 */
export function decryptPaymentDetailsFromStorage(encrypted: string | null): any {
  if (!encrypted) return null;

  try {
    return decryptJSON(encrypted);
  } catch (error) {
    console.error('Error decrypting payment details:', error);
    return null;
  }
}

/**
 * Internal helper - encrypt a single value
 */
function encryptValue(value: string): string {
  try {
    return encryptField(value) || value;
  } catch (error) {
    console.error('Error encrypting value:', error);
    return value;
  }
}

/**
 * Internal helper - decrypt a single value
 */
function decryptValue(encrypted: string): string {
  try {
    const decrypted = decryptField(encrypted);
    return decrypted || '';
  } catch (error) {
    console.error('Error decrypting value:', error);
    return '';
  }
}

/**
 * Check if a field is encrypted by attempting to decrypt it
 */
export function isFieldEncrypted(value: string): boolean {
  if (!value || value.length < 10) {
    return false;
  }

  try {
    const { isEncrypted } = require('./encryption') as typeof import('./encryption');
    return isEncrypted(value);
  } catch {
    return false;
  }
}

/**
 * Safe encryption of data that may already be encrypted
 * Checks if data is encrypted before encrypting
 */
export function safeEncryptValue(value: string | null | undefined): string {
  if (!value) return '';

  if (isFieldEncrypted(value)) {
    // Already encrypted, return as-is
    return value;
  }

  return encryptValue(value);
}

/**
 * Safe decryption of data that may not be encrypted
 * Checks if data is encrypted before decrypting
 */
export function safeDecryptValue(value: string | null | undefined): string {
  if (!value) return '';

  if (!isFieldEncrypted(value)) {
    // Not encrypted, return as-is
    return value;
  }

  return decryptValue(value);
}
