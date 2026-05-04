import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductFormClient, { type ProductEditPayload } from "@/components/admin/ProductFormClient";

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: true,
      categories: true,
      genders: true,
      productColors: true,
      productSizes: { include: { shoeSize: true } },
    },
  });
  if (!product) notFound();

  const initial: ProductEditPayload = {
    id: product.id,
    name: product.name,
    brandId: product.brandId,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    price: product.price,
    salePrice: product.salePrice,
    images: product.images,
    releaseDate: product.releaseDate ? product.releaseDate.toISOString() : null,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    categoryIds: product.categories.map((c) => c.categoryId),
    genderIds: product.genders.map((g) => g.genderId),
    colorIds: product.productColors.map((c) => c.colorId),
    sizeStocks: product.productSizes.map((ps) => ({
      shoeSizeId: ps.shoeSizeId,
      stock: ps.stock,
    })),
  };

  return <ProductFormClient mode="edit" initial={initial} />;
}
