import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/schemas";
import { rateLimiters } from "@/middleware/rateLimit";
import { sanitizeProfile } from "@/lib/sanitize";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.data?.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        role: true,
        language: true,
        currency: true,
        isActive: true,
        createdAt: true,
        addresses: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiters.api(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.data?.userId as string;
    const body = await request.json();

    // Validate input with schema
    const validatedData = updateProfileSchema.parse(body);

    // Sanitize profile data to prevent XSS
    const { firstName: sanitizedFirstName, lastName: sanitizedLastName } = sanitizeProfile({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      bio: body.bio,
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        phone: validatedData.phone,
        // Handle optional fields if provided
        ...(body.language && { language: body.language }),
        ...(body.currency && { currency: body.currency }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        role: true,
        language: true,
        currency: true,
      },
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user,
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

    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.data?.userId as string;
    const {
      label,
      firstName,
      lastName,
      phone,
      email,
      division,
      district,
      upazila,
      address,
      postCode,
      isDefault,
    } = await request.json();

    if (!firstName || !lastName || !phone || !email || !division || !district || !upazila || !address) {
      return NextResponse.json(
        { error: "Missing required address fields" },
        { status: 400 }
      );
    }

    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const created = await prisma.userAddress.create({
      data: {
        userId,
        label: label || "Home",
        firstName,
        lastName,
        phone,
        email,
        division,
        district,
        upazila,
        address,
        postCode: postCode || null,
        isDefault: Boolean(isDefault),
      },
    });

    return NextResponse.json({ message: "Address created", address: created }, { status: 201 });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
