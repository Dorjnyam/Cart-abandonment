import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "checkout-anon";
  const rate = checkRateLimit(`checkout:${ip}`, 20, 60_000);
  if (!rate.ok) return new NextResponse("Too many requests", { status: 429 });
  const body = await request.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return new NextResponse("Invalid order payload", { status: 400 });
  const { items, couponCode, paymentMethod, deliveryAddress, deliveryOption } = parsed.data;
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const sessionDbUser = sessionUserId
    ? await prisma.user.findUnique({ where: { id: sessionUserId }, select: { id: true, email: true } })
    : null;

  if (!Array.isArray(items) || items.length === 0) {
    return new NextResponse("No items", { status: 400 });
  }

  const productIds = items.map((i: { id: string }) => i.id);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  type Line = { item: (typeof items)[number]; p: (typeof products)[number]; productSizeId: string };
  const lines: Line[] = [];

  let subtotal = 0;
  for (const item of items) {
    const p = byId.get(item.id);
    if (!p) return new NextResponse("Product no longer exists", { status: 409 });

    const ps = await prisma.productSize.findFirst({
      where: { productId: item.id, shoeSize: { eu: item.size } },
    });
    if (!ps) return new NextResponse(`Size not available for: ${p.name}`, { status: 409 });
    if (ps.stock < item.qty) {
      return new NextResponse(`Out of stock: ${p.name} (EU ${item.size})`, { status: 409 });
    }
    lines.push({ item, p, productSizeId: ps.id });
    subtotal += (p.salePrice ?? p.price) * item.qty;
  }

  let discountAmount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: String(couponCode).toUpperCase(), active: true },
    });
    if (coupon && subtotal >= coupon.minSubtotal) {
      if (coupon.type === "percent") {
        discountAmount = Math.round((subtotal * coupon.value) / 100);
      } else {
        discountAmount = coupon.value;
      }
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }
  }

  const deliveryFee = deliveryOption === "express" ? 10000 : 5000;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const timeline = [{ status: "pending", at: now.toISOString(), note: "Order placed" }];

  const order = await prisma.$transaction(async (tx) => {
    for (const { item, p, productSizeId } of lines) {
      await tx.productSize.update({
        where: { id: productSizeId },
        data: { stock: { decrement: item.qty } },
      });
      await tx.product.update({
        where: { id: p.id },
        data: { soldCount: { increment: item.qty } },
      });
    }

    return tx.order.create({
      data: {
        orderNumber,
        subtotalPrice: subtotal,
        discountAmount,
        couponCode: couponCode ? String(couponCode).toUpperCase() : null,
        totalPrice: total,
        deliveryFee,
        paymentMethod,
        paymentStatus: "pending",
        status: "pending",
        deliveryAddress,
        timeline,
        userId: sessionDbUser?.id,
        guestEmail: sessionDbUser?.email ?? null,
        items: {
          create: lines.map(({ item, p }) => ({
            productId: item.id,
            size: item.size,
            color: item.color,
            quantity: item.qty,
            price: p.salePrice ?? p.price,
          })),
        },
      },
    });
  });

  return NextResponse.json({
    orderId: order.id,
    orderNumber,
    subtotal,
    discountAmount,
    deliveryFee,
    total,
  });
}
