const path = require("path");
const root = path.join(__dirname, "..");
try {
  require(path.join(root, "node_modules", "dotenv")).config({ path: path.join(root, ".env.local") });
} catch (_) {}
try {
  require(path.join(root, "node_modules", "dotenv")).config({ path: path.join(root, ".env") });
} catch (_) {}

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const products = require("../src/data/products.json");

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
  await prisma.couponRedemption.deleteMany();
  await prisma.cancellationRequest.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.review.deleteMany();
  await prisma.stockAlert.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.address.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.gender.deleteMany();
  await prisma.color.deleteMany();
  await prisma.shoeSize.deleteMany();

  const genderRows = [
    { name: "Men", slug: "men" },
    { name: "Women", slug: "women" },
    { name: "Kids", slug: "kids" },
    { name: "Unisex", slug: "unisex" },
  ];
  for (const g of genderRows) {
    await prisma.gender.create({ data: g });
  }

  const allEu = new Set();
  for (const p of products) {
    for (const s of p.sizes) allEu.add(s);
  }
  const sortedEu = [...allEu].sort((a, b) => a - b);
  for (let i = 0; i < sortedEu.length; i += 1) {
    const eu = sortedEu[i];
    await prisma.shoeSize.create({
      data: { eu, usLabel: `EU ${eu}`, sortOrder: i },
    });
  }

  const brandNames = [...new Set(products.map((p) => p.brand))];
  const brandIdByName = new Map();
  for (const name of brandNames) {
    const b = await prisma.brand.create({
      data: { name, slug: slugify(name) },
    });
    brandIdByName.set(name, b.id);
  }

  const categoryIdBySlug = new Map();
  for (const cat of [...new Set(products.map((p) => p.category))]) {
    const c = await prisma.category.create({
      data: { name: cat.charAt(0).toUpperCase() + cat.slice(1), slug: slugify(cat) },
    });
    categoryIdBySlug.set(cat, c.id);
  }

  const colorIdByKey = new Map();
  for (const raw of new Set(products.flatMap((p) => p.colors))) {
    const slug = slugify(raw);
    const col = await prisma.color.create({
      data: {
        name: raw.charAt(0).toUpperCase() + raw.slice(1),
        slug,
        hex: colorHex(raw),
      },
    });
    colorIdByKey.set(raw.toLowerCase(), col.id);
  }

  const shoeSizeIdByEu = new Map(
    (await prisma.shoeSize.findMany()).map((s) => [s.eu, s.id])
  );
  const genderIdBySlug = new Map(
    (await prisma.gender.findMany()).map((g) => [g.slug, g.id])
  );

  for (const product of products) {
    const sku = `SKU-${product.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}`;
    const brandId = brandIdByName.get(product.brand);
    const categoryId = categoryIdBySlug.get(product.category);
    const genderId = genderIdBySlug.get(String(product.gender).toLowerCase());
    if (!genderId) throw new Error(`Unknown gender: ${product.gender}`);

    const stocks = distributeStock(product.stock, product.sizes.length);

    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        sku,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice,
        images: product.images,
        material: "Synthetic + mesh",
        fit: "Regular",
        weightGrams: 380,
        care: "Wipe with soft cloth",
        country: "VN",
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        isActive: true,
        brandId,
        categories: {
          create: [{ categoryId }],
        },
        genders: {
          create: [{ genderId }],
        },
        productColors: {
          create: product.colors.map((c) => ({
            colorId: colorIdByKey.get(String(c).toLowerCase()),
          })),
        },
        productSizes: {
          create: product.sizes.map((eu, idx) => ({
            shoeSizeId: shoeSizeIdByEu.get(eu),
            stock: stocks[idx] ?? 0,
          })),
        },
      },
    });
  }

  const seeded = await prisma.product.findMany({ take: 5 });
  for (const p of seeded) {
    await prisma.review.createMany({
      data: [
        {
          productId: p.id,
          rating: 5,
          title: "Excellent",
          comment: "Comfortable and stylish.",
        },
        {
          productId: p.id,
          rating: 4,
          title: "Good value",
          comment: "Great quality for the price.",
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
