-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "buyIn" INTEGER,
    "stack" INTEGER NOT NULL DEFAULT 10000,
    "config" TEXT,
    "currentLevelIndex" INTEGER NOT NULL DEFAULT 0,
    "levelStartedAt" DATETIME,
    "timerPausedAt" DATETIME,
    "timerSeconds" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tournament" ("buyIn", "config", "createdAt", "date", "id", "name", "stack", "status", "type", "updatedAt") SELECT "buyIn", "config", "createdAt", "date", "id", "name", "stack", "status", "type", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
