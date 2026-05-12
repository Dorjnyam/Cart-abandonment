/**
 * One-time idempotent backfill: legacy Product fields -> Brand, junctions, ProductSize.
 * Run after `prisma db push` with transitional schema: `node prisma/backfill-catalog.cjs`
 */
const path = require("path");
const root = path.join(__dirname, "..");
try {
  require(path.join(root, "node_modules", "dotenv")).config({ path: path.join(root, ".env.local") });
} catch {}
try {
  require(path.join(root, "node_modules", "dotenv")).config({ path: path.join(root, ".env") });
} catch {}

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function slugify(s) {
  const base = String(s)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "item";
}

const COLOR_HEX = {
  white: "#f5f5f5",
  black: "#1a1a1a",
  grey: "#6b7280",
  gray: "#6b7280",
  red: "#dc2626",
  blue: "#2563eb",
  navy: "#1e3a5f",
  green: "#16a34a",
  yellow: "#eab308",
};

function colorHex(name) {
  const k = String(name).toLowerCase().trim();
  return COLOR_HEX[k] ?? "#888888";
}

function distributeStock(total, n) {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  let rem = total % n;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    out.push(base + (rem > 0 ? 1 : 0));
    if (rem > 0) rem -= 1;
  }
  return out;
}

async function main() {
  const genderSeeds = [
    { name: "Men", slug: "men" },
    { name: "Women", slug: "women" },
    { name: "Kids", slug: "kids" },
    { name: "Unisex", slug: "unisex" },
  ];
  for (const g of genderSeeds) {
    await prisma.gender.upsert({
      where: { slug: g.slug },
      create: g,
      update: {},
    });
  }

  const products = await prisma.product.findMany();
  const allEu = new Set();
  for (const p of products) {
    for (const s of p.sizes) allEu.add(s);
  }
  const sortedEu = [...allEu].sort((a, b) => a - b);
  let order = 0;
  for (const eu of sortedEu) {
    await prisma.shoeSize.upsert({
      where: { eu },
      create: { eu, usLabel: `EU ${eu}`, sortOrder: order++ },
      update: {},
    });
  }

  const shoeSizeIdByEu = new Map(
    (await prisma.shoeSize.findMany()).map((s) => [s.eu, s.id])
  );
  const genderIdBySlug = new Map(
    (await prisma.gender.findMany()).map((g) => [g.slug, g.id])
  );

  const brandNameToId = new Map();
  for (const p of products) {
    if (!brandNameToId.has(p.brand)) {
      const slug = slugify(p.brand);
      const b = await prisma.brand.upsert({
        where: { slug },
        create: { name: p.brand, slug },
        update: {},
      });
      brandNameToId.set(p.brand, b.id);
    }
  }

  for (const p of products) {
    const bid = brandNameToId.get(p.brand);
    if (bid && !p.brandId) {
      await prisma.product.update({
        where: { id: p.id },
        data: { brandId: bid },
      });
    }
  }

  for (const p of products) {
    const catSlug = slugify(p.category);
    let cat = await prisma.category.findUnique({ where: { slug: catSlug } });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name: p.category.charAt(0).toUpperCase() + p.category.slice(1),
          slug: catSlug,
        },
      });
    }
    const hasCat = await prisma.productCategory.findFirst({
      where: { productId: p.id, categoryId: cat.id },
    });
    if (!hasCat) {
      await prisma.productCategory.create({
        data: { productId: p.id, categoryId: cat.id },
      });
    }

    const gSlug = String(p.gender).toLowerCase();
    const gid = genderIdBySlug.get(gSlug);
    if (gid) {
      const hasG = await prisma.productGender.findFirst({
        where: { productId: p.id, genderId: gid },
      });
      if (!hasG) {
        await prisma.productGender.create({
          data: { productId: p.id, genderId: gid },
        });
      }
    }

    for (const cname of p.colors) {
      const slug = slugify(cname);
      const col = await prisma.color.upsert({
        where: { slug },
        create: {
          name: cname.charAt(0).toUpperCase() + cname.slice(1),
          slug,
          hex: colorHex(cname),
        },
        update: {},
      });
      const hasC = await prisma.productColor.findFirst({
        where: { productId: p.id, colorId: col.id },
      });
      if (!hasC) {
        await prisma.productColor.create({
          data: { productId: p.id, colorId: col.id },
        });
      }
    }

    const existingPs = await prisma.productSize.count({
      where: { productId: p.id },
    });
    if (existingPs === 0 && p.sizes.length > 0) {
      const stocks = distributeStock(p.stock, p.sizes.length);
      for (let i = 0; i < p.sizes.length; i += 1) {
        const eu = p.sizes[i];
        const sid = shoeSizeIdByEu.get(eu);
        if (!sid) continue;
        await prisma.productSize.create({
          data: {
            productId: p.id,
            shoeSizeId: sid,
            stock: stocks[i] ?? 0,
          },
        });
      }
    }
  }

  console.log("Backfill complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
