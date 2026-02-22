import { NextRequest, NextResponse } from "next/server";
import path from "path";

function getDb() {
  const Database = require("better-sqlite3");
  return new Database(path.join(process.cwd(), "prisma/dev.db"));
}

// GET /api/default-services?clientId=xxx
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT d.id, d.clientId, d.serviceTypeId, d.dayOfWeek, d.startTime, d.endTime,
              s.name as serviceTypeName, s.defaultMinutes
       FROM DefaultWeeklyService d
       JOIN ServiceType s ON s.id = d.serviceTypeId
       WHERE d.clientId = ?
       ORDER BY d.dayOfWeek, d.startTime`
    )
    .all(parseInt(clientId));
  db.close();
  return NextResponse.json(rows);
}

// POST /api/default-services
// body: { clientId, serviceTypeId, dayOfWeek, startTime, endTime }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, serviceTypeId, dayOfWeek, startTime, endTime } = body;
  if (!clientId || !serviceTypeId || dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO DefaultWeeklyService (clientId, serviceTypeId, dayOfWeek, startTime, endTime)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(clientId, serviceTypeId, dayOfWeek, startTime, endTime);

  const created = db
    .prepare(
      `SELECT d.id, d.clientId, d.serviceTypeId, d.dayOfWeek, d.startTime, d.endTime,
              s.name as serviceTypeName, s.defaultMinutes
       FROM DefaultWeeklyService d
       JOIN ServiceType s ON s.id = d.serviceTypeId
       WHERE d.id = ?`
    )
    .get(result.lastInsertRowid);
  db.close();
  return NextResponse.json(created, { status: 201 });
}

// DELETE /api/default-services?id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const db = getDb();
  db.prepare("DELETE FROM DefaultWeeklyService WHERE id = ?").run(parseInt(id));
  db.close();
  return NextResponse.json({ ok: true });
}
