import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const reason = String(body.reason ?? "");

  const req = await prisma.refundRequest.create({
    data: {
      orderId: id,
      userId: (session.user as any).id,
      reason,
      status: "requested",
    },
  });
  return NextResponse.json(req, { status: 201 });
}

