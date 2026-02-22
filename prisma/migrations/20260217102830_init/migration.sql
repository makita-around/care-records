-- CreateTable
CREATE TABLE "Helper" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "defaultServiceId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_defaultServiceId_fkey" FOREIGN KEY ("defaultServiceId") REFERENCES "ServiceType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "defaultMinutes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Record" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "helperId" INTEGER NOT NULL,
    "serviceTypeId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "totalMinutes" INTEGER NOT NULL,
    "bodycare" BOOLEAN NOT NULL DEFAULT false,
    "lifeSupport" BOOLEAN NOT NULL DEFAULT false,
    "checkToilet" BOOLEAN NOT NULL DEFAULT false,
    "checkDiaper" BOOLEAN NOT NULL DEFAULT false,
    "checkMeal" BOOLEAN NOT NULL DEFAULT false,
    "checkBath" BOOLEAN NOT NULL DEFAULT false,
    "checkOral" BOOLEAN NOT NULL DEFAULT false,
    "checkMedicine" BOOLEAN NOT NULL DEFAULT false,
    "checkTransfer" BOOLEAN NOT NULL DEFAULT false,
    "checkOuting" BOOLEAN NOT NULL DEFAULT false,
    "checkDressing" BOOLEAN NOT NULL DEFAULT false,
    "checkJointCleaning" BOOLEAN NOT NULL DEFAULT false,
    "checkCleaning" BOOLEAN NOT NULL DEFAULT false,
    "checkLaundry" BOOLEAN NOT NULL DEFAULT false,
    "checkClothes" BOOLEAN NOT NULL DEFAULT false,
    "checkSheets" BOOLEAN NOT NULL DEFAULT false,
    "checkLifeOther" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL DEFAULT '',
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Record_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Record_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "Helper" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Record_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Record_clientId_date_idx" ON "Record"("clientId", "date");

-- CreateIndex
CREATE INDEX "Record_helperId_date_idx" ON "Record"("helperId", "date");
