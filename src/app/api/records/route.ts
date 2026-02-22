import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// raw SQLの結果を整形するヘルパー
function formatRecord(r: Record<string, unknown>) {
  return {
    id: r.id,
    clientId: r.clientId,
    helperId: r.helperId,
    serviceTypeId: r.serviceTypeId,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    totalMinutes: r.totalMinutes,
    bodycare: Boolean(r.bodycare),
    lifeSupport: Boolean(r.lifeSupport),
    checkToilet: Boolean(r.checkToilet),
    checkDiaper: Boolean(r.checkDiaper),
    checkMeal: Boolean(r.checkMeal),
    checkBath: Boolean(r.checkBath),
    checkOral: Boolean(r.checkOral),
    checkMedicine: Boolean(r.checkMedicine),
    checkTransfer: Boolean(r.checkTransfer),
    checkOuting: Boolean(r.checkOuting),
    checkDressing: Boolean(r.checkDressing),
    checkJointCleaning: Boolean(r.checkJointCleaning),
    checkCleaning: Boolean(r.checkCleaning),
    checkLaundry: Boolean(r.checkLaundry),
    checkClothes: Boolean(r.checkClothes),
    checkSheets: Boolean(r.checkSheets),
    checkBathPrep: Boolean(r.checkBathPrep),
    checkLifeOther: Boolean(r.checkLifeOther),
    note: r.note,
    confirmed: Boolean(r.confirmed),
    signatureData: r.signatureData,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    client: {
      id: r.cId,
      lastName: r.cLastName,
      firstName: r.cFirstName,
      gender: r.cGender,
    },
    helper: {
      id: r.hId,
      lastName: r.hLastName,
      firstName: r.hFirstName,
    },
    serviceType: {
      id: r.stId,
      name: r.stName,
      defaultMinutes: r.stMinutes,
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const date = searchParams.get("date");
  const helperId = searchParams.get("helperId");

  let query = `
    SELECT r.*,
      c.id as cId, c.lastName as cLastName, c.firstName as cFirstName, c.gender as cGender,
      h.id as hId, h.lastName as hLastName, h.firstName as hFirstName,
      s.id as stId, s.name as stName, s.defaultMinutes as stMinutes
    FROM Record r
    JOIN Client c ON r.clientId = c.id
    JOIN Helper h ON r.helperId = h.id
    JOIN ServiceType s ON r.serviceTypeId = s.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (clientId) { query += ` AND r.clientId = ?`; params.push(parseInt(clientId)); }
  if (date)     { query += ` AND r.date = ?`;     params.push(date); }
  if (helperId) { query += ` AND r.helperId = ?`; params.push(parseInt(helperId)); }
  query += ` ORDER BY r.date DESC, r.startTime ASC`;

  // better-sqlite3 で直接実行（Prismaのraw SQLはパラメータが複雑なため）
  const Database = require("better-sqlite3");
  const path = require("path");
  const db = new Database(path.join(process.cwd(), "prisma/dev.db"));
  const rows = db.prepare(query).all(...params);
  db.close();

  return NextResponse.json(rows.map(formatRecord));
}

export async function POST(request: Request) {
  const b = await request.json();
  const Database = require("better-sqlite3");
  const path = require("path");
  const db = new Database(path.join(process.cwd(), "prisma/dev.db"));

  const stmt = db.prepare(`
    INSERT INTO Record (
      clientId, helperId, serviceTypeId, date, startTime, endTime, totalMinutes,
      bodycare, lifeSupport,
      checkToilet, checkDiaper, checkMeal, checkBath, checkOral, checkMedicine,
      checkTransfer, checkOuting, checkDressing, checkJointCleaning,
      checkCleaning, checkLaundry, checkClothes, checkSheets, checkBathPrep, checkLifeOther,
      note, confirmed, signatureData, createdAt, updatedAt
    ) VALUES (
      ?,?,?,?,?,?,?,
      ?,?,
      ?,?,?,?,?,?,
      ?,?,?,?,
      ?,?,?,?,?,?,
      ?,?,?,datetime('now'),datetime('now')
    )
  `);

  const info = stmt.run(
    b.clientId, b.helperId, b.serviceTypeId, b.date, b.startTime, b.endTime, b.totalMinutes,
    b.bodycare ? 1 : 0, b.lifeSupport ? 1 : 0,
    b.checkToilet ? 1 : 0, b.checkDiaper ? 1 : 0, b.checkMeal ? 1 : 0,
    b.checkBath ? 1 : 0, b.checkOral ? 1 : 0, b.checkMedicine ? 1 : 0,
    b.checkTransfer ? 1 : 0, b.checkOuting ? 1 : 0, b.checkDressing ? 1 : 0,
    b.checkJointCleaning ? 1 : 0,
    b.checkCleaning ? 1 : 0, b.checkLaundry ? 1 : 0, b.checkClothes ? 1 : 0,
    b.checkSheets ? 1 : 0, b.checkBathPrep ? 1 : 0, b.checkLifeOther ? 1 : 0,
    b.note || "", b.confirmed ? 1 : 0, b.signatureData || ""
  );

  const row = db.prepare(`
    SELECT r.*,
      c.id as cId, c.lastName as cLastName, c.firstName as cFirstName, c.gender as cGender,
      h.id as hId, h.lastName as hLastName, h.firstName as hFirstName,
      s.id as stId, s.name as stName, s.defaultMinutes as stMinutes
    FROM Record r
    JOIN Client c ON r.clientId = c.id
    JOIN Helper h ON r.helperId = h.id
    JOIN ServiceType s ON r.serviceTypeId = s.id
    WHERE r.id = ?
  `).get(info.lastInsertRowid);
  db.close();

  return NextResponse.json(formatRecord(row));
}

export async function PUT(request: Request) {
  const b = await request.json();
  const Database = require("better-sqlite3");
  const path = require("path");
  const db = new Database(path.join(process.cwd(), "prisma/dev.db"));

  db.prepare(`
    UPDATE Record SET
      date=?, helperId=?, serviceTypeId=?, startTime=?, endTime=?, totalMinutes=?,
      bodycare=?, lifeSupport=?,
      checkToilet=?, checkDiaper=?, checkMeal=?, checkBath=?, checkOral=?, checkMedicine=?,
      checkTransfer=?, checkOuting=?, checkDressing=?, checkJointCleaning=?,
      checkCleaning=?, checkLaundry=?, checkClothes=?, checkSheets=?, checkBathPrep=?, checkLifeOther=?,
      note=?, confirmed=?, signatureData=?, updatedAt=datetime('now')
    WHERE id=?
  `).run(
    b.date, b.helperId, b.serviceTypeId, b.startTime, b.endTime, b.totalMinutes,
    b.bodycare ? 1 : 0, b.lifeSupport ? 1 : 0,
    b.checkToilet ? 1 : 0, b.checkDiaper ? 1 : 0, b.checkMeal ? 1 : 0,
    b.checkBath ? 1 : 0, b.checkOral ? 1 : 0, b.checkMedicine ? 1 : 0,
    b.checkTransfer ? 1 : 0, b.checkOuting ? 1 : 0, b.checkDressing ? 1 : 0,
    b.checkJointCleaning ? 1 : 0,
    b.checkCleaning ? 1 : 0, b.checkLaundry ? 1 : 0, b.checkClothes ? 1 : 0,
    b.checkSheets ? 1 : 0, b.checkBathPrep ? 1 : 0, b.checkLifeOther ? 1 : 0,
    b.note ?? "", b.confirmed ? 1 : 0, b.signatureData ?? "",
    b.id
  );

  const row = db.prepare(`
    SELECT r.*,
      c.id as cId, c.lastName as cLastName, c.firstName as cFirstName, c.gender as cGender,
      h.id as hId, h.lastName as hLastName, h.firstName as hFirstName,
      s.id as stId, s.name as stName, s.defaultMinutes as stMinutes
    FROM Record r
    JOIN Client c ON r.clientId = c.id
    JOIN Helper h ON r.helperId = h.id
    JOIN ServiceType s ON r.serviceTypeId = s.id
    WHERE r.id = ?
  `).get(b.id);
  db.close();

  return NextResponse.json(formatRecord(row));
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "");
  await prisma.record.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
