import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticate } from "@/lib/auth";

function isImportedProduct(product: any): boolean {
  const certifications = Array.isArray(product?.certifications) ? product.certifications : [];
  if (certifications.includes("live-imported") || certifications.includes("top20-import")) {
    return true;
  }

  const specs = product?.specifications;
  if (specs && typeof specs === "object" && !Array.isArray(specs)) {
    const source = String((specs as any).source || "").toLowerCase();
    if (source && source !== "local") {
      return true;
    }
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.data?.userId as string;

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create active cart
    let cart = await prisma.cart.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                currentPrice: true,
                mainImage: true,
                certifications: true,
                specifications: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      // Create new cart if doesn't exist
      cart = await prisma.cart.create({
        data: {
          userId,
          status: "ACTIVE",
          items: {
            create: [],
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  currentPrice: true,
                  mainImage: true,
                  certifications: true,
                  specifications: true,
                },
              },
            },
          },
        },
      });
    }

    const normalizedItems = cart.items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        sourceType: isImportedProduct(item.product) ? "IMPORTED" : "LOCAL",
      },
    }));

    // Calculate totals
    const subtotal = normalizedItems.reduce(
      (sum, item) => sum + (Number(item.priceSnapshot) * item.quantity),
      0
    );

    return NextResponse.json(
      {
        cartId: cart.id,
        items: normalizedItems,
        subtotal,
        itemCount: normalizedItems.length,
        totalQuantity: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticate(request);
    if (!auth.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = auth.data?.userId as string;

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity, variantId, priceSnapshot } = await request.json();

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid product or quantity" },
        { status: 400 }
      );
    }

    // Get or create active cart
    let cart = await prisma.cart.findFirst({
      where: { userId, status: "ACTIVE" },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, status: "ACTIVE" },
      });
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let effectivePrice = Number(product.currentPrice);
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          id: variantId,
          productId,
        },
      });

      if (!variant) {
        return NextResponse.json({ error: "Invalid product variant" }, { status: 400 });
      }

      effectivePrice = Number(variant.price);
    } else if (priceSnapshot !== undefined && Number.isFinite(Number(priceSnapshot))) {
      // Guest/client fallback path for non-variant items.
      effectivePrice = Number(priceSnapshot);
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, priceSnapshot: effectivePrice },
    });

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          priceSnapshot: effectivePrice,
        },
      });
    }

    return NextResponse.json(
      { message: "Item added to cart", cartId: cart.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
