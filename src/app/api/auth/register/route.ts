// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken } from '@/lib/auth';
import { registerSchema } from '@/lib/schemas';
import { rateLimiters } from '@/middleware/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 attempts per 15 minutes)
    const rateLimitResponse = await rateLimiters.auth(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = registerSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validatedData.email }, { phone: validatedData.phone }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        phone: validatedData.phone,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
      },
    });

    // Generate token
    const token = await createToken(
      { userId: user.id, email: user.email },
      24 * 60 * 60 // 24 hours
    );

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
