import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import path from "path";

function getDb() {
  const Database = require("better-sqlite3");
  return new Database(path.join(process.cwd(), "prisma/dev.db"));
}

export async function GET() {
  const types = await prisma.serviceType.findMany({
    where: { active: true },
  });
  types.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  return NextResponse.json(types);
}

export async function POST(request: Request) {
  const body = await request.json();
  const serviceType = await prisma.serviceType.create({
    data: {
      name: body.name,
      defaultMinutes: body.defaultMinutes,
    },
  });
  return NextResponse.json(serviceType);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const serviceType = await prisma.serviceType.update({
    where: { id: body.id },
    data: {
      name: body.name,
      defaultMinutes: body.defaultMinutes,
    },
  });
  return NextResponse.json(serviceType);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") ?? "");
  if (!id) return NextResponse.json({ error: "IDが必要です" }, { status: 400 });

  const db = getDb();
  const recordCount = (db.prepare("SELECT COUNT(*) as cnt FROM Record WHERE serviceTypeId = ?").get(id) as { cnt: number }).cnt;
  const weeklyCount = (db.prepare("SELECT COUNT(*) as cnt FROM DefaultWeeklyService WHERE serviceTypeId = ?").get(id) as { cnt: number }).cnt;
  const clientCount = (db.prepare("SELECT COUNT(*) as cnt FROM Client WHERE defaultServiceId = ?").get(id) as { cnt: number }).cnt;
  db.close();

  if (recordCount > 0 || weeklyCount > 0 || clientCount > 0) {
    await prisma.serviceType.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ deleted: false, deactivated: true });
  } else {
    await prisma.serviceType.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  }
}
