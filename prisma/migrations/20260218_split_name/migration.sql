-- Migration: split name into lastName + firstName for Helper and Client

PRAGMA foreign_keys=OFF;

-- ========== Helper ==========
CREATE TABLE "new_Helper" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastName"  TEXT NOT NULL DEFAULT '',
    "firstName" TEXT NOT NULL DEFAULT '',
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copy: put full name into lastName temporarily
INSERT INTO "new_Helper" ("id", "lastName", "firstName", "active", "createdAt")
SELECT "id", "name", '', "active", "createdAt" FROM "Helper";

DROP TABLE "Helper";
ALTER TABLE "new_Helper" RENAME TO "Helper";

-- Fix existing data
UPDATE "Helper" SET "lastName" = '牧田', "firstName" = '直也' WHERE "id" = 1;
UPDATE "Helper" SET "lastName" = '島内', "firstName" = '智美' WHERE "id" = 2;
UPDATE "Helper" SET "lastName" = '高木', "firstName" = '純子' WHERE "id" = 3;
UPDATE "Helper" SET "lastName" = '鈴木', "firstName" = '里美' WHERE "id" = 4;
UPDATE "Helper" SET "lastName" = '山田', "firstName" = '直也' WHERE "id" = 5;

-- ========== Client ==========
CREATE TABLE "new_Client" (
    "id"             INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastName"       TEXT NOT NULL DEFAULT '',
    "firstName"      TEXT NOT NULL DEFAULT '',
    "gender"         TEXT NOT NULL,
    "defaultServiceId" INTEGER,
    "active"         BOOLEAN NOT NULL DEFAULT true,
    "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_defaultServiceId_fkey"
        FOREIGN KEY ("defaultServiceId") REFERENCES "ServiceType" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copy: put full name into lastName temporarily
INSERT INTO "new_Client" ("id", "lastName", "firstName", "gender", "defaultServiceId", "active", "createdAt")
SELECT "id", "name", '', "gender", "defaultServiceId", "active", "createdAt" FROM "Client";

DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";

-- Fix existing data
UPDATE "Client" SET "lastName" = '浅井', "firstName" = '安久'  WHERE "id" = 1;
UPDATE "Client" SET "lastName" = '矢口', "firstName" = '純子'  WHERE "id" = 2;
UPDATE "Client" SET "lastName" = '東',   "firstName" = '富士男' WHERE "id" = 3;

PRAGMA foreign_keys=ON;
