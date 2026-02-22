import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const clients = await prisma.$queryRaw`
    SELECT c.id, c.lastName, c.firstName, c.gender, c.defaultServiceId,
           c.signatureMode, c.active, c.createdAt,
           s.id as sId, s.name as sName, s.defaultMinutes as sMinutes
    FROM Client c
    LEFT JOIN ServiceType s ON c.defaultServiceId = s.id
    WHERE c.active = 1
    ORDER BY c.lastName ASC
  `;

  // defaultService を整形
  const result = (clients as Record<string, unknown>[]).map((c) => ({
    id: c.id,
    lastName: c.lastName,
    firstName: c.firstName,
    gender: c.gender,
    defaultServiceId: c.defaultServiceId,
    signatureMode: c.signatureMode ?? "stamp",
    active: c.active,
    createdAt: c.createdAt,
    defaultService: c.sId ? { id: c.sId, name: c.sName, defaultMinutes: c.sMinutes } : null,
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const signatureMode = body.signatureMode ?? "stamp";
  const defaultServiceId = body.defaultServiceId ?? null;

  await prisma.$executeRaw`
    INSERT INTO Client (lastName, firstName, gender, defaultServiceId, signatureMode, active, createdAt)
    VALUES (${body.lastName}, ${body.firstName}, ${body.gender}, ${defaultServiceId}, ${signatureMode}, 1, datetime('now'))
  `;
  const rows = await prisma.$queryRaw`
    SELECT id, lastName, firstName, gender, defaultServiceId, signatureMode, active, createdAt
    FROM Client WHERE id = last_insert_rowid()
  `;
  return NextResponse.json((rows as unknown[])[0]);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const signatureMode = body.signatureMode ?? "stamp";
  const defaultServiceId = body.defaultServiceId ?? null;

  await prisma.$executeRaw`
    UPDATE Client
    SET lastName = ${body.lastName}, firstName = ${body.firstName},
        gender = ${body.gender}, defaultServiceId = ${defaultServiceId},
        signatureMode = ${signatureMode}
    WHERE id = ${body.id}
  `;

  const clients = await prisma.$queryRaw`
    SELECT c.id, c.lastName, c.firstName, c.gender, c.defaultServiceId,
           c.signatureMode, c.active, c.createdAt,
           s.id as sId, s.name as sName, s.defaultMinutes as sMinutes
    FROM Client c
    LEFT JOIN ServiceType s ON c.defaultServiceId = s.id
    WHERE c.id = ${body.id}
  `;
  const c = (clients as Record<string, unknown>[])[0];
  return NextResponse.json({
    id: c.id, lastName: c.lastName, firstName: c.firstName,
    gender: c.gender, defaultServiceId: c.defaultServiceId,
    signatureMode: c.signatureMode,
    active: c.active, createdAt: c.createdAt,
    defaultService: c.sId ? { id: c.sId, name: c.sName, defaultMinutes: c.sMinutes } : null,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "");
  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "この利用者には記録が存在するため削除できません" },
      { status: 400 }
    );
  }
}
