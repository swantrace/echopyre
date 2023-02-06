-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "shopify-app-starter";

-- CreateTable
CREATE TABLE "shopify-app-starter"."sessions" (
    "id" VARCHAR(255) NOT NULL,
    "shop" VARCHAR(255) NOT NULL,
    "state" VARCHAR(255) NOT NULL,
    "isOnline" BOOLEAN NOT NULL,
    "scope" VARCHAR(255),
    "expires" INTEGER NOT NULL,
    "onlineAccessInfo" VARCHAR(255),
    "accessToken" VARCHAR(255),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
