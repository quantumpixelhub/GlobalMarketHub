import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const sellers = await prisma.seller.findMany({
      where: { isActive: true, isVerified: true },
      select: {
        id: true,
        storeName: true,
        description: true,
        logo: true,
        location: true,
        rating: true,
        reviewCount: true,
      },
      orderBy: { rating: "desc" },
      take: 20,
    });

    return NextResponse.json(
      {
        sellers,
        count: sellers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get sellers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
