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
const bcrypt = require("bcrypt");
const catalog = require("../sneaker_store_500_products.json");

const MNT_PER_USD = 3500;
const DEMO_CUSTOMER_EMAIL = "mjldoko11@gmail.com";
const DEMO_CUSTOMER_PASSWORD = "Doko0204$";
const PEXELS_PHOTO_IDS = [
  6776079,
  6776083,
  6776077,
  6776082,
  6776080,
  6776084,
  6726159,
  6726160,
  6864646,
  6726154,
  2529147,
  6748334,
  18946897,
  2529157,
  1456731,
  2529148,
  6777915,
  29699313,
  2529146,
  1161538,
  11324516,
  18375077,
  17639028,
  12730139,
  11310685,
];

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

function titleCase(s) {
  return String(s)
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

const TOKEN_HEX = {
  all: "#111827",
  beige: "#d6b892",
  black: "#111827",
  blue: "#2563eb",
  brown: "#7c4a28",
  cloud: "#e5e7eb",
  core: "#111827",
  cream: "#f5e9ca",
  green: "#16a34a",
  grey: "#64748b",
  gray: "#64748b",
  gum: "#b7791f",
  lime: "#84cc16",
  navy: "#1e3a8a",
  orange: "#f97316",
  pink: "#f9a8d4",
  purple: "#7e22ce",
  red: "#dc2626",
  rose: "#fda4af",
  salt: "#f8fafc",
  sea: "#dbeafe",
  silver: "#c0c6cc",
  triple: "#f8fafc",
  whisper: "#fce7f3",
  white: "#f8fafc",
  yellow: "#eab308",
};

function colorHex(name) {
  const tokens = String(name).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    if (TOKEN_HEX[token]) return TOKEN_HEX[token];
  }
  return hashColor(name);
}

function hashColor(value) {
  let hash = 0;
  const s = String(value);
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return hslToHex(hue, 68, 52);
}

function hslToHex(h, s, l) {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return `#${[r, g, b]
    .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
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

function imageUrlFor(index) {
  const photoId = PEXELS_PHOTO_IDS[index % PEXELS_PHOTO_IDS.length];
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=900&h=900&fit=crop`;
}

function priceMnt(product) {
  return Math.round(Number(product.priceUsd) * MNT_PER_USD);
}

function salePriceMnt(product) {
  const discount = Number(product.discountPercent || 0);
  if (discount <= 0) return null;
  return Math.round(priceMnt(product) * (100 - discount) / 100);
}

function uniqueProductSlugs(products) {
  const used = new Set();
  const bySku = new Map();

  for (const product of products) {
    const base = slugify(product.name);
    const skuPart = slugify(product.sku);
    let slug = base;
    if (used.has(slug)) slug = `${base}-${skuPart}`;

    let n = 1;
    let candidate = slug;
    while (used.has(candidate)) {
      n += 1;
      candidate = `${slug}-${n}`;
    }

    used.add(candidate);
    bySku.set(product.sku, candidate);
  }

  return bySku;
}

function validateCatalog(products) {
  if (!Array.isArray(products)) throw new Error("Catalog products must be an array.");
  if (products.length !== 500) throw new Error(`Expected 500 products, found ${products.length}.`);

  const skus = new Set();
  for (let i = 0; i < products.length; i += 1) {
    const product = products[i];
    if (!product.sku || skus.has(product.sku)) throw new Error(`Duplicate or missing SKU: ${product.sku}`);
    skus.add(product.sku);

    const image = imageUrlFor(i);
    if (!image.startsWith("https://images.pexels.com/")) throw new Error(`Invalid image URL: ${image}`);

    const price = priceMnt(product);
    const salePrice = salePriceMnt(product);
    if (!Number.isInteger(price) || price <= 0) throw new Error(`Invalid MNT price for ${product.sku}`);
    if (salePrice !== null && (!Number.isInteger(salePrice) || salePrice <= 0 || salePrice >= price)) {
      throw new Error(`Invalid sale price for ${product.sku}`);
    }
    if (!Array.isArray(product.availableSizes) || product.availableSizes.length === 0) {
      throw new Error(`Missing available sizes for ${product.sku}`);
    }
  }
}

function normalizeProduct(product, slug, index) {
  return {
    sku: product.sku,
    name: product.name,
    slug,
    brand: product.brand,
    category: product.category,
    gender: String(product.gender).toLowerCase(),
    color: product.color,
    sizes: [...new Set(product.availableSizes)].sort((a, b) => a - b),
    stock: Number(product.stock || 0),
    description: product.description || `${product.brand} ${product.model} in ${product.color}.`,
    price: priceMnt(product),
    salePrice: salePriceMnt(product),
    images: [imageUrlFor(index)],
    material: product.material ? titleCase(product.material) : null,
    fit: product.category === "Running" || product.category === "Training" ? "Athletic" : "Regular",
    weightGrams: product.category === "Kids" ? 260 : product.category === "Trail" ? 420 : 360,
    care: "Wipe with a soft cloth and air dry.",
    country: "MN",
    soldCount: Math.max(0, Math.round(Number(product.reviewCount || 0) * Number(product.rating || 0) / 10)),
    isNew: Array.isArray(product.tags) && product.tags.includes("New Arrival"),
    isFeatured: Number(product.rating || 0) >= 4.7 || Number(product.reviewCount || 0) >= 700,
    isActive: product.isActive !== false,
    rating: Number(product.rating || 5),
  };
}

async function clearSeededData() {
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
}

async function main() {
  const sourceProducts = catalog.products;
  validateCatalog(sourceProducts);

  const slugBySku = uniqueProductSlugs(sourceProducts);
  const products = sourceProducts.map((product, index) => normalizeProduct(product, slugBySku.get(product.sku), index));

  await clearSeededData();

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

  const brandIdByName = new Map();
  for (const name of [...new Set(products.map((p) => p.brand))]) {
    const b = await prisma.brand.create({
      data: { name, slug: slugify(name) },
    });
    brandIdByName.set(name, b.id);
  }

  const categoryIdBySlug = new Map();
  for (const category of [...new Set(products.map((p) => p.category))]) {
    const slug = slugify(category);
    const c = await prisma.category.create({
      data: { name: category, slug },
    });
    categoryIdBySlug.set(slug, c.id);
  }

  const colorIdBySlug = new Map();
  for (const color of [...new Set(products.map((p) => p.color))]) {
    const slug = slugify(color);
    const col = await prisma.color.create({
      data: {
        name: color,
        slug,
        hex: colorHex(color),
      },
    });
    colorIdBySlug.set(slug, col.id);
  }

  const shoeSizeIdByEu = new Map(
    (await prisma.shoeSize.findMany()).map((s) => [s.eu, s.id])
  );
  const genderIdBySlug = new Map(
    (await prisma.gender.findMany()).map((g) => [g.slug, g.id])
  );

  const createdProducts = [];
  for (const product of products) {
    const brandId = brandIdByName.get(product.brand);
    const categoryId = categoryIdBySlug.get(slugify(product.category));
    const genderId = genderIdBySlug.get(product.gender);
    const colorId = colorIdBySlug.get(slugify(product.color));
    if (!brandId) throw new Error(`Unknown brand: ${product.brand}`);
    if (!categoryId) throw new Error(`Unknown category: ${product.category}`);
    if (!genderId) throw new Error(`Unknown gender: ${product.gender}`);
    if (!colorId) throw new Error(`Unknown color: ${product.color}`);

    const stocks = distributeStock(product.stock, product.sizes.length);

    const created = await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice,
        images: product.images,
        material: product.material,
        fit: product.fit,
        weightGrams: product.weightGrams,
        care: product.care,
        country: product.country,
        soldCount: product.soldCount,
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        brandId,
        categories: {
          create: [{ categoryId }],
        },
        genders: {
          create: [{ genderId }],
        },
        productColors: {
          create: [{ colorId }],
        },
        productSizes: {
          create: product.sizes.map((eu, idx) => ({
            shoeSizeId: shoeSizeIdByEu.get(eu),
            stock: stocks[idx] ?? 0,
          })),
        },
      },
    });

    createdProducts.push({ id: created.id, rating: product.rating });
  }

  for (const product of createdProducts.slice(0, 5)) {
    await prisma.review.createMany({
      data: [
        {
          productId: product.id,
          rating: Math.max(1, Math.min(5, Math.round(product.rating))),
          title: "Verified fit",
          comment: "Comfortable pair with accurate sizing.",
        },
        {
          productId: product.id,
          rating: 4,
          title: "Good value",
          comment: "Solid quality for the price.",
        },
      ],
    });
  }

  const demoPassword = await bcrypt.hash(DEMO_CUSTOMER_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: DEMO_CUSTOMER_EMAIL },
    create: {
      name: "Diplomiin Demo Customer",
      email: DEMO_CUSTOMER_EMAIL,
      password: demoPassword,
      role: "customer",
      emailVerifiedAt: new Date(),
    },
    update: {
      name: "Diplomiin Demo Customer",
      password: demoPassword,
      role: "customer",
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Seeded ${createdProducts.length} products at ${MNT_PER_USD} MNT/USD.`);
  console.log(`Seeded demo customer ${DEMO_CUSTOMER_EMAIL}.`);
  console.log(`Assigned ${PEXELS_PHOTO_IDS.length} remote Pexels sneaker images across the catalog.`);
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
