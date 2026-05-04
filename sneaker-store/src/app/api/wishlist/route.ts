import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const items = await prisma.wishlistItem.findMany({
    where: { userId: (session.user as any).id },
    include: { product: true },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const { productId } = await request.json();
  const userId = (session.user as any).id;
  const exists = await prisma.wishlistItem.findFirst({ where: { userId, productId } });
  if (exists) {
    await prisma.wishlistItem.delete({ where: { id: exists.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId, productId } });
  }
  return new NextResponse(null, { status: 204 });
}

