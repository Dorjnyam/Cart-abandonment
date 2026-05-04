import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

type Ctx = { params: Promise<{ id: string }> };

const sizeStockSchema = z.object({
  shoeSizeId: z.string().min(1),
  stock: z.coerce.number().int().min(0),
});

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  categoryIds: z.array(z.string()).optional(),
  genderIds: z.array(z.string()).optional(),
  colorIds: z.array(z.string()).optional(),
  sizeStocks: z.array(sizeStockSchema).optional(),
  images: z.array(z.string()).optional(),
  description: z.string().optional(),
  price: z.coerce.number().int().positive().optional(),
  salePrice: z.coerce.number().int().positive().nullable().optional(),
  sku: z.string().optional(),
  slug: z.string().optional(),
  releaseDate: z.union([z.string(), z.null()]).optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const body = parsed.data;

  let nextSlug: string | undefined;
  if (body.slug !== undefined && body.slug.trim()) {
    let s = slugify(body.slug.trim());
    const base = s;
    let n = 0;
    while (await prisma.product.findFirst({ where: { slug: s, NOT: { id } } })) {
      n += 1;
      s = `${base}-${n}`;
    }
    nextSlug = s;
  }

  let nextSku: string | undefined;
  if (body.sku !== undefined && body.sku.trim()) {
    const s = body.sku.trim();
    const taken = await prisma.product.findFirst({ where: { sku: s, NOT: { id } } });
    if (taken) return NextResponse.json({ error: "SKU already in use" }, { status: 400 });
    nextSku = s;
  }

  const releaseDate =
    body.releaseDate === undefined
      ? undefined
      : body.releaseDate != null && String(body.releaseDate).length > 0
        ? new Date(String(body.releaseDate))
        : null;

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.brandId !== undefined) data.brandId = body.brandId;
  if (body.description !== undefined) data.description = body.description.trim();
  if (body.price !== undefined) data.price = body.price;
  if (body.salePrice !== undefined) data.salePrice = body.salePrice;
  if (body.images !== undefined) data.images = body.images;
  if (body.isNew !== undefined) data.isNew = body.isNew;
  if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (nextSlug !== undefined) data.slug = nextSlug;
  if (nextSku !== undefined) data.sku = nextSku;
  if (releaseDate !== undefined) data.releaseDate = releaseDate;

  if (body.categoryIds) {
    data.categories = {
      deleteMany: {},
      create: body.categoryIds.map((categoryId) => ({ categoryId })),
    };
  }
  if (body.genderIds) {
    data.genders = {
      deleteMany: {},
      create: body.genderIds.map((genderId) => ({ genderId })),
    };
  }
  if (body.colorIds) {
    data.productColors = {
      deleteMany: {},
      create: body.colorIds.map((colorId) => ({ colorId })),
    };
  }
  if (body.sizeStocks) {
    data.productSizes = {
      deleteMany: {},
      create: body.sizeStocks.map((row) => ({
        shoeSizeId: row.shoeSizeId,
        stock: row.stock,
      })),
    };
  }

  const product = await prisma.product.update({
    where: { id },
    data: data as any,
    include: {
      brand: true,
      categories: { include: { category: true } },
      genders: { include: { gender: true } },
      productColors: { include: { color: true } },
      productSizes: { include: { shoeSize: true } },
    },
  });

  return NextResponse.json({ data: product });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true, removed: true });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "P2003" || code === "P2014") {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({
        ok: true,
        deactivated: true,
        message: "Product is on past orders; hidden from the store instead.",
      });
    }
    throw e;
  }
}
