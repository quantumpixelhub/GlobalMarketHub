// src/lib/auth.ts

import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import bcryptjs from 'bcryptjs';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars'
);

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
