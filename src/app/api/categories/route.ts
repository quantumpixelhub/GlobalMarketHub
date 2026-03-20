import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORY_TAXONOMY } from "@/lib/categoryTaxonomy";

export async function GET(_request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parentId: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            parentId: true,
          },
        },
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    const bySlug = new Map(categories.map((category) => [category.slug, category]));
    const ordered = CATEGORY_TAXONOMY.flatMap((parent) => {
      const parentRow = bySlug.get(parent.slug);
      if (!parentRow) return [];

      const children = parent.children
        .map((child) => bySlug.get(child.slug))
        .filter((value): value is NonNullable<typeof value> => Boolean(value));

      return [
        {
          ...parentRow,
          children,
        },
      ];
    });

    return NextResponse.json(
      {
        categories: ordered,
        count: ordered.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
