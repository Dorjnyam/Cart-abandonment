import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) return new NextResponse("Forbidden", { status: 403 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!admin) return new NextResponse("Forbidden", { status: 403 });
  const body = await request.json();
  const coupon = await prisma.coupon.create({
    data: {
      code: String(body.code).toUpperCase(),
      type: String(body.type ?? "percent"),
      value: Number(body.value ?? 10),
      minSubtotal: Number(body.minSubtotal ?? 0),
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      active: true,
    },
  });
  return NextResponse.json(coupon, { status: 201 });
}

