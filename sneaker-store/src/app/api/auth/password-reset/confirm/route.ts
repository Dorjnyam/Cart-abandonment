import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");
  if (!token || !password) {
    return new NextResponse("Token and password are required", { status: 400 });
  }

  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!row || row.expiresAt < new Date()) {
    return new NextResponse("Invalid or expired token", { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: row.userId },
    data: { password: hashed },
  });
  await prisma.passwordResetToken.delete({ where: { id: row.id } });
  return NextResponse.json({ ok: true });
}

