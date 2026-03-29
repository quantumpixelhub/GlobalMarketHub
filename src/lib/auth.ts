// src/lib/auth.ts

import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import bcryptjs from 'bcryptjs';

// Validate JWT_SECRET is set
function getJWTSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is required. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  return new TextEncoder().encode(jwtSecret);
}

const secret = getJWTSecret();

export async function createToken(payload: any, expiresIn: number = 3600) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload;
  } catch (error) {
    return null;
  }
}

export async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return {
      success: false,
      data: null,
    };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return {
      success: false,
      data: null,
    };
  }

  return {
    success: true,
    data: payload,
  };
}

export function generateRandomCode(length: number = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Validate all required security environment variables
 * Call this on app startup
 */
export function validateSecurityConfig() {
  const requiredEnvVars = ['JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(key => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please set them in your .env.local file before starting the application.'
    );
  }
}
