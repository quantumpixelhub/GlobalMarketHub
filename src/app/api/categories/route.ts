import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORY_TAXONOMY, CATEGORY_TAXONOMY_SLUG_SET } from "@/lib/categoryTaxonomy";

export async function GET(_request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        slug: { in: Array.from(CATEGORY_TAXONOMY_SLUG_SET) },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        icon: true,
        parentId: true,
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            icon: true,
            parentId: true,
          },
        },
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    const bySlug = new Map(categories.map((category) => [category.slug, category]));

    const taxonomyOrderedParents = CATEGORY_TAXONOMY.map((parent) => bySlug.get(parent.slug))
      .filter((value): value is NonNullable<typeof value> => Boolean(value));

    const orderedTree = taxonomyOrderedParents.map((parentRow) => {
      const taxonomyParent = CATEGORY_TAXONOMY.find((entry) => entry.slug === parentRow.slug);

      const taxonomyChildren = (taxonomyParent?.children || [])
        .map((child) => bySlug.get(child.slug))
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
        .filter((child) => child.parentId === parentRow.id);

      return {
        ...parentRow,
        children: taxonomyChildren,
      };
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

    const finalFlat = orderedFlat;

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
