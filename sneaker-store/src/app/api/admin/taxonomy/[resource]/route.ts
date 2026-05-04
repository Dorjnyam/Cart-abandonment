import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

type Ctx = { params: Promise<{ resource: string }> };

async function uniqueBrandSlug(base: string) {
  let s = base;
  let n = 0;
  while (await prisma.brand.findUnique({ where: { slug: s } })) {
    n += 1;
    s = `${base}-${n}`;
  }
  return s;
}

async function uniqueCategorySlug(base: string) {
  let s = base;
  let n = 0;
  while (await prisma.category.findUnique({ where: { slug: s } })) {
    n += 1;
    s = `${base}-${n}`;
  }
  return s;
}

async function uniqueGenderSlug(base: string) {
  let s = base;
  let n = 0;
  while (await prisma.gender.findUnique({ where: { slug: s } })) {
    n += 1;
    s = `${base}-${n}`;
  }
  return s;
}

async function uniqueColorSlug(base: string) {
  let s = base;
  let n = 0;
  while (await prisma.color.findUnique({ where: { slug: s } })) {
    n += 1;
    s = `${base}-${n}`;
  }
  return s;
}

export async function POST(request: Request, ctx: Ctx) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { resource } = await ctx.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (resource) {
      case "brands": {
        const b = z.object({ name: z.string().min(1), slug: z.string().optional() }).parse(json);
        const name = b.name.trim();
        const base = b.slug?.trim() ? slugify(b.slug) : slugify(name);
        const slug = await uniqueBrandSlug(base);
        const row = await prisma.brand.create({ data: { name, slug } });
        return NextResponse.json({ data: row }, { status: 201 });
      }
      case "categories": {
        const b = z.object({ name: z.string().min(1), slug: z.string().optional() }).parse(json);
        const name = b.name.trim();
        const base = b.slug?.trim() ? slugify(b.slug) : slugify(name);
        const slug = await uniqueCategorySlug(base);
        const row = await prisma.category.create({ data: { name, slug } });
        return NextResponse.json({ data: row }, { status: 201 });
      }
      case "genders": {
        const b = z.object({ name: z.string().min(1), slug: z.string().optional() }).parse(json);
        const name = b.name.trim();
        const base = b.slug?.trim() ? slugify(b.slug) : slugify(name);
        const slug = await uniqueGenderSlug(base);
        const row = await prisma.gender.create({ data: { name, slug } });
        return NextResponse.json({ data: row }, { status: 201 });
      }
      case "colors": {
        const b = z
          .object({
            name: z.string().min(1),
            hex: z.string().optional().default("#888888"),
            slug: z.string().optional(),
          })
          .parse(json);
        const name = b.name.trim();
        const base = b.slug?.trim() ? slugify(b.slug) : slugify(name);
        const slug = await uniqueColorSlug(base);
        const row = await prisma.color.create({
          data: { name, slug, hex: b.hex || "#888888" },
        });
        return NextResponse.json({ data: row }, { status: 201 });
      }
      case "shoe-sizes": {
        const b = z
          .object({
            eu: z.coerce.number().int().positive(),
            usLabel: z.string().optional(),
            sortOrder: z.coerce.number().int().optional(),
          })
          .parse(json);
        const row = await prisma.shoeSize.create({
          data: {
            eu: b.eu,
            usLabel: b.usLabel?.trim() || `EU ${b.eu}`,
            sortOrder: b.sortOrder ?? 0,
          },
        });
        return NextResponse.json({ data: row }, { status: 201 });
      }
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
    }
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "P2002") {
      return NextResponse.json({ error: "Duplicate value" }, { status: 409 });
    }
    throw e;
  }
}
