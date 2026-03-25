-- CreateTable
CREATE TABLE "AdminPermission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "canUseAdminPanel" BOOLEAN NOT NULL DEFAULT false,
  "manageDashboard" BOOLEAN NOT NULL DEFAULT false,
  "manageProducts" BOOLEAN NOT NULL DEFAULT false,
  "manageOrders" BOOLEAN NOT NULL DEFAULT false,
  "manageCategories" BOOLEAN NOT NULL DEFAULT false,
  "manageCampaigns" BOOLEAN NOT NULL DEFAULT false,
  "manageCoupons" BOOLEAN NOT NULL DEFAULT false,
  "manageUsers" BOOLEAN NOT NULL DEFAULT false,
  "manageReviews" BOOLEAN NOT NULL DEFAULT false,
  "manageMedia" BOOLEAN NOT NULL DEFAULT false,
  "manageNotifications" BOOLEAN NOT NULL DEFAULT false,
  "managePayments" BOOLEAN NOT NULL DEFAULT false,
  "manageSettings" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_userId_key" ON "AdminPermission"("userId");

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
