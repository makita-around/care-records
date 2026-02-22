import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";

  // isGuest は Prisma クライアント未再生成のため生SQLで対応
  const helpers = all
    ? await prisma.$queryRaw`SELECT id, lastName, firstName, active, isGuest, createdAt FROM Helper WHERE active = 1 ORDER BY lastName ASC`
    : await prisma.$queryRaw`SELECT id, lastName, firstName, active, isGuest, createdAt FROM Helper WHERE active = 1 AND isGuest = 0 ORDER BY lastName ASC`;

  return NextResponse.json(helpers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const isGuest = body.isGuest ? 1 : 0;
  const result = await prisma.$executeRaw`
    INSERT INTO Helper (lastName, firstName, active, isGuest, createdAt)
    VALUES (${body.lastName}, ${body.firstName}, 1, ${isGuest}, datetime('now'))
  `;
  // 挿入したレコードを返す
  const helper = await prisma.$queryRaw`
    SELECT id, lastName, firstName, active, isGuest, createdAt FROM Helper
    WHERE id = last_insert_rowid()
  `;
  return NextResponse.json((helper as unknown[])[0]);
}

export async function PUT(request: Request) {
  const body = await request.json();
  await prisma.$executeRaw`
    UPDATE Helper SET lastName = ${body.lastName}, firstName = ${body.firstName}
    WHERE id = ${body.id}
  `;
  const helper = await prisma.$queryRaw`
    SELECT id, lastName, firstName, active, isGuest, createdAt FROM Helper WHERE id = ${body.id}
  `;
  return NextResponse.json((helper as unknown[])[0]);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "");
  try {
    await prisma.helper.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "この職員には記録が存在するため削除できません" },
      { status: 400 }
    );
  }
}
