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
    const orderedTree = CATEGORY_TAXONOMY.flatMap((parent) => {
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

    const orderedFlat = orderedTree.flatMap((parent) => [
      {
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        description: parent.description,
        image: parent.image,
        parentId: parent.parentId,
      },
      ...parent.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        image: child.image,
        parentId: child.parentId,
      })),
    ]);

    const usedIds = new Set(orderedFlat.map((category) => category.id));
    const remaining = categories
      .filter((category) => !usedIds.has(category.id))
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentId: category.parentId,
      }));

    const finalFlat = [...orderedFlat, ...remaining];

    return NextResponse.json(
      {
        categories: finalFlat,
        tree: orderedTree,
        count: finalFlat.length,
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
