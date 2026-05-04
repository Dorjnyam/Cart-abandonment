import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const status = String(body.status ?? "pending");
  const paymentStatus = body.paymentStatus ? String(body.paymentStatus) : undefined;
  const note = body.note ? String(body.note) : "Status updated";

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return new NextResponse("Order not found", { status: 404 });

  const timeline = Array.isArray(order.timeline)
    ? [...(order.timeline as any[])]
    : [];
  timeline.push({ status, paymentStatus: paymentStatus ?? order.paymentStatus, at: new Date().toISOString(), note });

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(paymentStatus ? { paymentStatus } : {}),
      timeline,
    },
  });

  return NextResponse.json(updated);
}

