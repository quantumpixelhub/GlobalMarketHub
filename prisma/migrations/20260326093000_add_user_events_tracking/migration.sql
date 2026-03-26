-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PRODUCT_VIEW', 'PRODUCT_CLICK', 'ADD_TO_CART', 'PURCHASE');

-- CreateTable
CREATE TABLE "UserEvent" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "productId" TEXT,
    "categoryId" TEXT,
    "cartId" TEXT,
    "orderId" TEXT,
    "quantity" INTEGER,
    "unitPrice" DECIMAL(12,2),
    "totalValue" DECIMAL(12,2),
    "query" TEXT,
    "source" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserEvent_eventType_createdAt_idx" ON "UserEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "UserEvent_userId_createdAt_idx" ON "UserEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserEvent_sessionId_createdAt_idx" ON "UserEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "UserEvent_productId_createdAt_idx" ON "UserEvent"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "UserEvent_orderId_createdAt_idx" ON "UserEvent"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
