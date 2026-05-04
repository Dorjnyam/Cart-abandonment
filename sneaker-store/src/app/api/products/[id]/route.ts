import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { isActive: true, OR: [{ id }, { slug: id }] },
    include: {
      brand: true,
      productSizes: { include: { shoeSize: true } },
      productColors: { include: { color: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 6,
      },
    },
  });
  if (!product) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(product);
}

