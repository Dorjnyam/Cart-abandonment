import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { resource, id } = await ctx.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (resource) {
      case "brands": {
        const b = z
          .object({ name: z.string().min(1).optional(), slug: z.string().optional() })
          .parse(json);
        const data: { name?: string; slug?: string } = {};
        if (b.name !== undefined) data.name = b.name.trim();
        if (b.slug !== undefined) data.slug = slugify(b.slug.trim());
        const row = await prisma.brand.update({ where: { id }, data });
        return NextResponse.json({ data: row });
      }
      case "categories": {
        const b = z
          .object({ name: z.string().min(1).optional(), slug: z.string().optional() })
          .parse(json);
        const data: { name?: string; slug?: string } = {};
        if (b.name !== undefined) data.name = b.name.trim();
        if (b.slug !== undefined) data.slug = slugify(b.slug.trim());
        const row = await prisma.category.update({ where: { id }, data });
        return NextResponse.json({ data: row });
      }
      case "genders": {
        const b = z
          .object({ name: z.string().min(1).optional(), slug: z.string().optional() })
          .parse(json);
        const data: { name?: string; slug?: string } = {};
        if (b.name !== undefined) data.name = b.name.trim();
        if (b.slug !== undefined) data.slug = slugify(b.slug.trim());
        const row = await prisma.gender.update({ where: { id }, data });
        return NextResponse.json({ data: row });
      }
      case "colors": {
        const b = z
          .object({
            name: z.string().min(1).optional(),
            hex: z.string().optional(),
            slug: z.string().optional(),
          })
          .parse(json);
        const data: { name?: string; hex?: string; slug?: string } = {};
        if (b.name !== undefined) data.name = b.name.trim();
        if (b.hex !== undefined) data.hex = b.hex;
        if (b.slug !== undefined) data.slug = slugify(b.slug.trim());
        const row = await prisma.color.update({ where: { id }, data });
        return NextResponse.json({ data: row });
      }
      case "shoe-sizes": {
        const b = z
          .object({
            eu: z.coerce.number().int().positive().optional(),
            usLabel: z.string().optional(),
            sortOrder: z.coerce.number().int().optional(),
          })
          .parse(json);
        const data: { eu?: number; usLabel?: string | null; sortOrder?: number } = {};
        if (b.eu !== undefined) data.eu = b.eu;
        if (b.usLabel !== undefined) data.usLabel = b.usLabel.trim() || null;
        if (b.sortOrder !== undefined) data.sortOrder = b.sortOrder;
        const row = await prisma.shoeSize.update({ where: { id }, data });
        return NextResponse.json({ data: row });
      }
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
    }
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (code === "P2002") return NextResponse.json({ error: "Duplicate value" }, { status: 409 });
    throw e;
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const admin = await requireAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { resource, id } = await ctx.params;

  try {
    switch (resource) {
      case "brands":
        await prisma.brand.delete({ where: { id } });
        break;
      case "categories":
        await prisma.category.delete({ where: { id } });
        break;
      case "genders":
        await prisma.gender.delete({ where: { id } });
        break;
      case "colors":
        await prisma.color.delete({ where: { id } });
        break;
      case "shoe-sizes":
        await prisma.shoeSize.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete: still referenced by products" },
        { status: 409 }
      );
    }
    throw e;
  }
}
