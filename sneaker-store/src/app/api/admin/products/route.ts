import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const sizeStockSchema = z.object({
  shoeSizeId: z.string().min(1),
  stock: z.coerce.number().int().min(0),
});

const createSchema = z.object({
  name: z.string().min(1),
  brandId: z.string().min(1),
  categoryIds: z.array(z.string()).min(1),
  genderIds: z.array(z.string()).min(1),
  colorIds: z.array(z.string()).min(1),
  sizeStocks: z.array(sizeStockSchema).min(1),
  images: z.array(z.string()).optional().default([]),
  description: z.string().optional().default(""),
  price: z.coerce.number().int().positive(),
  salePrice: z.coerce.number().int().positive().nullable().optional(),
  sku: z.string().optional(),
  slug: z.string().optional(),
  releaseDate: z.union([z.string(), z.null()]).optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const body = parsed.data;
  let slug = body.slug?.trim() || slugify(body.name);
  const baseSlug = slug;
  let n = 0;
  while (await prisma.product.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  let sku = body.sku?.trim() || `SKU-${Date.now()}`;
  let skuN = 0;
  while (await prisma.product.findUnique({ where: { sku } })) {
    skuN += 1;
    sku = `SKU-${Date.now()}-${skuN}`;
  }

  const images =
    body.images && body.images.length > 0
      ? body.images
      : [`https://picsum.photos/seed/${encodeURIComponent(slug)}/800/800`];

  const releaseDate =
    body.releaseDate != null && String(body.releaseDate).length > 0
      ? new Date(String(body.releaseDate))
      : null;

  const product = await prisma.product.create({
    data: {
      name: body.name.trim(),
      brandId: body.brandId,
      slug,
      sku,
      description: body.description.trim(),
      price: body.price,
      salePrice: body.salePrice ?? null,
      images,
      releaseDate,
      isNew: body.isNew ?? true,
      isFeatured: body.isFeatured ?? false,
      isActive: body.isActive ?? true,
      categories: {
        create: body.categoryIds.map((categoryId) => ({ categoryId })),
      },
      genders: {
        create: body.genderIds.map((genderId) => ({ genderId })),
      },
      productColors: {
        create: body.colorIds.map((colorId) => ({ colorId })),
      },
      productSizes: {
        create: body.sizeStocks.map((row) => ({
          shoeSizeId: row.shoeSizeId,
          stock: row.stock,
        })),
      },
    },
    include: {
      brand: true,
      categories: { include: { category: true } },
      genders: { include: { gender: true } },
      productColors: { include: { color: true } },
      productSizes: { include: { shoeSize: true } },
    },
  });

  return NextResponse.json({ data: product }, { status: 201 });
}
