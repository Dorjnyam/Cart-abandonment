import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get("brand");
  const gender = searchParams.get("gender");
  const color = searchParams.get("color");
  const inStock = searchParams.get("inStock");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const size = searchParams.get("size");
  const sort = searchParams.get("sort") ?? "newest";
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "12");
  const where: Record<string, unknown> = { isActive: true };

  if (brand) {
    where.brand = {
      OR: [{ slug: brand }, { name: { equals: brand, mode: "insensitive" as const } }],
    };
  }
  if (gender) {
    where.genders = { some: { gender: { slug: gender } } };
  }
  if (color) {
    where.productColors = {
      some: {
        color: {
          OR: [{ slug: color }, { name: { equals: color, mode: "insensitive" as const } }],
        },
      },
    };
  }
  if (inStock === "true") {
    where.productSizes = { some: { stock: { gt: 0 } } };
  }
  if (size) {
    const eu = Number(size);
    if (Number.isFinite(eu)) {
      where.productSizes = { some: { shoeSize: { eu }, stock: { gt: 0 } } };
    }
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) (where.price as Record<string, number>).gte = Number(minPrice);
    if (maxPrice) (where.price as Record<string, number>).lte = Number(maxPrice);
  }

  const orderBy =
    sort === "price_asc"
      ? { price: "asc" as const }
      : sort === "price_desc"
        ? { price: "desc" as const }
        : sort === "best_selling"
          ? { soldCount: "desc" as const }
          : { createdAt: "desc" as const };

  const total = await prisma.product.count({ where });
  const products = await prisma.product.findMany({
    where,
    orderBy,
    skip: Math.max(0, page - 1) * limit,
    take: limit,
    include: {
      brand: true,
      productColors: { include: { color: true } },
      productSizes: true,
    },
  });

  return NextResponse.json({
    data: products,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
