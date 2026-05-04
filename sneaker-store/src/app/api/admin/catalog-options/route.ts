import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [brands, categories, genders, colors, shoeSizes] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.gender.findMany({ orderBy: { name: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
    prisma.shoeSize.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return NextResponse.json({
    brands,
    categories,
    genders,
    colors,
    shoeSizes,
  });
}
