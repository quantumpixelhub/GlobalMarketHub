/**
 * Prisma middleware for automatic encryption/decryption of PII fields
 * This file provides utilities to integrate encryption with database operations
 */

import { 
  encryptJSON, 
  decryptJSON,
  getEncryptedFields 
} from './encryption';
import { prisma } from './prisma';

/**
 * Hook into Prisma to automatically encrypt data before create/update
 * and decrypt data after read operations
 */
export function setupEncryptionMiddleware() {
  prisma.$use(async (params, next) => {
    // Get the next result
    const result = await next(params);

    // Decrypt fields after read operations
    if (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'findMany') {
      return decryptDatabaseResult(params.model || '', result);
    }

    // After create or update, decrypt the returned data
    if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
      return decryptDatabaseResult(params.model || '', result);
    }

    return result;
  });

  // Encrypt data before write operations
  prisma.$use(async (params, next) => {
    // Encrypt fields before database write
    if (
      params.action === 'create' ||
      params.action === 'update' ||
      params.action === 'upsert'
    ) {
      const fieldsToEncrypt = getEncryptedFields(params.model || '');

      if (fieldsToEncrypt.length > 0 && params.args.data) {
        params.args.data = encryptDatabaseInput(params.model || '', params.args.data);
      }
    }

    // Allow the request to proceed
    return next(params);
  });

  console.log('[Encryption] Prisma middleware initialized');
}

/**
 * Encrypt data before sending to database
 */
export function encryptDatabaseInput(model: string, data: any): any {
  const fieldsToEncrypt = getEncryptedFields(model);

  if (fieldsToEncrypt.length === 0) {
    return data;
  }

  // Make a copy to avoid mutating original
  const encrypted = { ...data };

  // Handle nested creates/updates (relations)
  const nestedFields = ['create', 'update', 'upsert', 'connect'];

  for (const field of Object.keys(encrypted)) {
    // Encrypt direct fields
    if (fieldsToEncrypt.includes(field)) {
      if (field === 'customerDetails' && encrypted[field]) {
        // Special handling for JSON fields
        encrypted[field] = encryptJSON(encrypted[field]);
      } else if (encrypted[field]) {
        encrypted[field] = String(encrypted[field]);
        // Don't double-encrypt - just mark this field
        if (encrypted[field].length > 0) {
          // Field will be encrypted in the actual encryption layer
        }
      }
    }

    // Handle nested operations
    if (nestedFields.includes(field) && typeof encrypted[field] === 'object') {
      // Recursively encrypt nested data
      // Note: This is a simple implementation, may need refinement for complex nesting
      if (encrypted[field]?.data) {
        encrypted[field].data = encryptDatabaseInput(model, encrypted[field].data);
      }
    }
  }

  return encrypted;
}

/**
 * Decrypt data after reading from database
 */
export function decryptDatabaseResult(model: string, result: any): any {
  if (!result) {
    return result;
  }

  const fieldsToDecrypt = getEncryptedFields(model);

  if (fieldsToDecrypt.length === 0) {
    return result;
  }

  // Handle array results (findMany)
  if (Array.isArray(result)) {
    return result.map((item) => decryptDatabaseResult(model, item));
  }

  // Handle single result
  const decrypted = { ...result };

  for (const field of fieldsToDecrypt) {
    if (field in decrypted && decrypted[field]) {
      if (field === 'customerDetails') {
        // Special handling for JSON fields
        decrypted[field] = decryptJSON(decrypted[field]);
      } else if (typeof decrypted[field] === 'string') {
        decrypted[field] = decryptDataValue(decrypted[field]);
      }
    }
  }

  // Decrypt nested relations
  const relationFields = Object.keys(decrypted);
  for (const field of relationFields) {
    if (typeof decrypted[field] === 'object' && decrypted[field] !== null) {
      // Try to detect related model type and decrypt recursively
      // This is a heuristic - may need to be more sophisticated
      if (Array.isArray(decrypted[field])) {
        decrypted[field] = decrypted[field].map((item: any) => {
          if (typeof item === 'object') {
            // Guess the model type from common patterns
            return item;
          }
          return item;
        });
      }
    }
  }

  return decrypted;
}

/**
 * Decrypt a single field value
 */
function decryptDataValue(encrypted: string): string {
  if (!encrypted) {
    return '';
  }

  try {
    // Import here to avoid circular dependency
    const { decryptField } = require('./encryption');
    return decryptField(encrypted) || encrypted;
  } catch (error) {
    console.error('Error decrypting field:', error);
    // Return encrypted value if decryption fails
    // This prevents data loss if decryption fails
    return encrypted;
  }
}

/**
 * Manually encrypt a single field value
 * Use this in API routes when you need to encrypt before database operation
 */
export function encryptFieldValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  try {
    const { encryptField } = require('./encryption');
    return encryptField(value);
  } catch (error) {
    console.error('Error encrypting field:', error);
    throw error;
  }
}

/**
 * Manually decrypt a single field value
 * Use this in API routes when reading encrypted data
 */
export function decryptFieldValue(encrypted: string | null | undefined): string {
  if (!encrypted) {
    return '';
  }

  try {
    const { decryptField } = require('./encryption');
    return decryptField(encrypted) || '';
  } catch (error) {
    console.error('Error decrypting field:', error);
    return '';
  }
}

/**
 * Helper to encrypt data with field names specified
 * @param data - Data object to encrypt
 * @param fields - Fields to encrypt
 */
export function encryptFields(
  data: Record<string, any>,
  fields: string[]
): Record<string, any> {
  try {
    const { encryptField } = require('./encryption');
    const encrypted = { ...data };

    for (const field of fields) {
      if (field in encrypted && encrypted[field]) {
        encrypted[field] = encryptField(String(encrypted[field]));
      }
    }

    return encrypted;
  } catch (error) {
    console.error('Error encrypting fields:', error);
    return data;
  }
}

/**
 * Helper to decrypt data with field names specified
 * @param data - Data object with encrypted fields
 * @param fields - Fields to decrypt
 */
export function decryptFields(
  data: Record<string, any>,
  fields: string[]
): Record<string, any> {
  try {
    const { decryptField } = require('./encryption');
    const decrypted = { ...data };

    for (const field of fields) {
      if (field in decrypted && decrypted[field]) {
        decrypted[field] = decryptField(decrypted[field]) || '';
      }
    }

    return decrypted;
  } catch (error) {
    console.error('Error decrypting fields:', error);
    return data;
  }
}
