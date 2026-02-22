import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, 'prisma/dev.db'));

db.pragma('foreign_keys = OFF');

// Drop leftover empty table from previous failed attempt
try { db.exec('DROP TABLE IF EXISTS new_Helper'); } catch(e) {}
try { db.exec('DROP TABLE IF EXISTS new_Client'); } catch(e) {}

// ========== Create Helper with new schema ==========
db.exec(`
  CREATE TABLE "Helper" (
    "id"        INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastName"  TEXT NOT NULL DEFAULT '',
    "firstName" TEXT NOT NULL DEFAULT '',
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('Created Helper table');

const insertHelper = db.prepare(
  'INSERT INTO Helper (id, lastName, firstName, active, createdAt) VALUES (?, ?, ?, ?, ?)'
);
const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
insertHelper.run(1, '牧田', '直也', 1, now);
insertHelper.run(2, '島内', '智美', 1, now);
insertHelper.run(3, '高木', '純子', 1, now);
insertHelper.run(4, '鈴木', '里美', 1, now);
insertHelper.run(5, '山田', '直也', 1, now);
console.log('Inserted 5 helpers');

// ========== Create Client with new schema ==========
db.exec(`
  CREATE TABLE "Client" (
    "id"              INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastName"        TEXT NOT NULL DEFAULT '',
    "firstName"       TEXT NOT NULL DEFAULT '',
    "gender"          TEXT NOT NULL,
    "defaultServiceId" INTEGER,
    "active"          BOOLEAN NOT NULL DEFAULT true,
    "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_defaultServiceId_fkey"
      FOREIGN KEY ("defaultServiceId") REFERENCES "ServiceType" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE
  )
`);
console.log('Created Client table');

const insertClient = db.prepare(
  'INSERT INTO Client (id, lastName, firstName, gender, defaultServiceId, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
insertClient.run(1, '浅井', '安久',  '男', null, 1, now);
insertClient.run(2, '矢口', '純子',  '女', null, 1, now);
insertClient.run(3, '東',   '富士男', '男', null, 1, now);
console.log('Inserted 3 clients');

// Recreate indexes
db.exec('CREATE INDEX "Record_clientId_date_idx" ON "Record"("clientId", "date")');
db.exec('CREATE INDEX "Record_helperId_date_idx" ON "Record"("helperId", "date")');

db.pragma('foreign_keys = ON');

// Record in _prisma_migrations
const migrationName = '20260218_split_name';
const existing = db.prepare(
  'SELECT id FROM "_prisma_migrations" WHERE migration_name = ?'
).get(migrationName);
if (!existing) {
  db.prepare(`
    INSERT INTO "_prisma_migrations"
      (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
    VALUES
      (lower(hex(randomblob(16))), 'manual', datetime('now'), ?, NULL, NULL, datetime('now'), 1)
  `).run(migrationName);
  console.log('Recorded in _prisma_migrations');
}

// Verify
console.log('\n=== Helpers ===');
for (const h of db.prepare('SELECT * FROM Helper').all()) {
  console.log(`  ${h.id}: ${h.lastName} ${h.firstName}`);
}
console.log('=== Clients ===');
for (const c of db.prepare('SELECT * FROM Client').all()) {
  console.log(`  ${c.id}: ${c.lastName} ${c.firstName} (${c.gender})`);
}
console.log('=== Records ===');
console.log('  Count:', db.prepare('SELECT COUNT(*) as n FROM Record').get().n);

db.close();
console.log('\nMigration complete!');
