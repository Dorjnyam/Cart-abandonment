import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "register-anon";
  const rate = checkRateLimit(`register:${ip}`, 10, 60_000);
  if (!rate.ok) return new NextResponse("Too many requests", { status: 429 });
  const parsed = registerSchema.safeParse(await request.json());
  if (!parsed.success) return new NextResponse("Invalid payload", { status: 400 });
  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return new NextResponse("Email already exists", { status: 409 });
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, password: hashed } });
  return new NextResponse(null, { status: 201 });
}

