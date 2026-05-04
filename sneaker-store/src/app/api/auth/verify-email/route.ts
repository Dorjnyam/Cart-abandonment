import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const token = String(body.token ?? "");
  if (!token) return new NextResponse("Missing token", { status: 400 });

  const row = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!row || row.expiresAt < new Date()) {
    return new NextResponse("Invalid or expired token", { status: 400 });
  }

  await prisma.user.update({
    where: { id: row.userId },
    data: { emailVerifiedAt: new Date() },
  });
  await prisma.emailVerificationToken.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}

