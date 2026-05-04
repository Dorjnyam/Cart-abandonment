import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) return new NextResponse("Forbidden", { status: 403 });

  const [orders, products, users] = await Promise.all([
    prisma.order.findMany(),
    prisma.product.count(),
    prisma.user.count(),
  ]);
  const sales = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const aov = orders.length ? Math.round(sales / orders.length) : 0;
  return NextResponse.json({ orders: orders.length, products, users, sales, aov });
}

