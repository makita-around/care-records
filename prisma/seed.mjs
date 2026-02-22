import Database from "better-sqlite3";

const db = new Database("prisma/dev.db");

const serviceTypes = [
  ["身体01", 14],
  ["身1生1", 40],
  ["生活2", 29],
  ["身体2", 40],
  ["生活3", 50],
  ["新身2生1", 50],
  ["訪問独自サービス11", 40],
  ["訪問独自サービス12", 40],
  ["訪問独自サービス13", 40],
];

const stmt = db.prepare(
  "INSERT OR IGNORE INTO ServiceType (name, defaultMinutes, active, createdAt) VALUES (?, ?, 1, datetime('now'))"
);

for (const [name, minutes] of serviceTypes) {
  stmt.run(name, minutes);
}

console.log("サービス種別を登録しました");
db.close();
