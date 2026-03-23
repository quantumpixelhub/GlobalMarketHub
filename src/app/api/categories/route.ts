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

    const allParents = categories.filter((category) => !category.parentId);
    const allChildren = categories.filter((category) => Boolean(category.parentId));
    const bySlug = new Map(categories.map((category) => [category.slug, category]));
    const taxonomyParentSlugs = new Set(CATEGORY_TAXONOMY.map((parent) => parent.slug));

    const taxonomyOrderedParents = CATEGORY_TAXONOMY.map((parent) => bySlug.get(parent.slug))
      .filter((value): value is NonNullable<typeof value> => Boolean(value));

    const remainingParents = allParents
      .filter((parent) => !taxonomyParentSlugs.has(parent.slug))
      .sort((a, b) => a.name.localeCompare(b.name));

    const parentOrder = [...taxonomyOrderedParents, ...remainingParents];

    const orderedTree = parentOrder.map((parentRow) => {
      const taxonomyParent = CATEGORY_TAXONOMY.find((entry) => entry.slug === parentRow.slug);
      const taxonomyChildSlugs = new Set((taxonomyParent?.children || []).map((child) => child.slug));

      const taxonomyChildren = (taxonomyParent?.children || [])
        .map((child) => bySlug.get(child.slug))
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
        .filter((child) => child.parentId === parentRow.id);

      const remainingChildren = allChildren
        .filter((child) => child.parentId === parentRow.id && !taxonomyChildSlugs.has(child.slug))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...parentRow,
        children: [...taxonomyChildren, ...remainingChildren],
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
