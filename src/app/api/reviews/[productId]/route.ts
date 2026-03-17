import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

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
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.data?.userId;
    const { rating, title, content, images } = await request.json();

    if (!rating || !title || !content) {
      return NextResponse.json(
        { error: "Rating, title, and content are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

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

    // Create review
    const review = await prisma.review.create({
      data: {
        productId: params.productId,
        userId,
        rating: Number(rating),
        title,
        content,
        images: images || [],
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
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
