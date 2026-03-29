import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createToken, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";
import { rateLimiters } from "@/middleware/rateLimit";

const isMaxClientError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /MaxClientsInSessionMode|max clients reached/i.test(message);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function findUserByEmailWithRetry(email: string) {
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    if (!isMaxClientError(error)) throw error;

    // Retry once after releasing stale connections when the DB pool is saturated.
    await prisma.$disconnect().catch(() => undefined);
    await wait(300);
    return prisma.user.findUnique({ where: { email } });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 attempts per 15 minutes)
    const rateLimitResponse = await rateLimiters.login(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await findUserByEmailWithRetry(validatedData.email);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive || user.isBanned) {
      return NextResponse.json(
        { error: "Account is inactive or banned" },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(validatedData.password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create access token
    const token = await createToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      24 * 60 * 60
    );

    // Return user data and token
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
        },
        token,
        expiresIn: "24h",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    if (isMaxClientError(error)) {
      return NextResponse.json(
        { error: "Server is busy. Please try again in a few seconds." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
