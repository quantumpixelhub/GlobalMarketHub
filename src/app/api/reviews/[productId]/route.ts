import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { createReviewSchema } from "@/lib/schemas";
import { rateLimiters } from "@/middleware/rateLimit";
import { sanitizeReview, sanitizeUrls } from "@/lib/sanitize";

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Get product reviews
    const reviews = await prisma.review.findMany({
      where: {
        productId: params.productId,
        isApproved: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const total = await prisma.review.count({
      where: {
        productId: params.productId,
        isApproved: true,
      },
    });

    return NextResponse.json(
      {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    // Apply rate limiting for user submissions
    const rateLimitResponse = await rateLimiters.api(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (auth as any)?.userId;
    const body = await request.json();

    // Validate input with schema
    const validatedData = createReviewSchema.parse({
      ...body,
      productId: params.productId,
    });

    const { rating, title, content, images } = validatedData;

    // Sanitize review content to prevent XSS
    const { title: sanitizedTitle, content: sanitizedContent } = sanitizeReview({
      title,
      content,
    });

    // Sanitize image URLs
    const sanitizedImages = images ? sanitizeUrls(images) : [];

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: params.productId,
        userId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    // Create review with sanitized content
    const review = await prisma.review.create({
      data: {
        productId: params.productId,
        userId,
        rating: Number(rating),
        title: sanitizedTitle,
        content: sanitizedContent,
        images: sanitizedImages,
        isVerifiedPurchase: true, // TODO: Check if user purchased product
        isApproved: true, // Auto-approve for MVP
      },
    });

    return NextResponse.json(
      {
        message: "Review created successfully",
        review,
      },
      { status: 201 }
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

    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
