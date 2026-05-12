/** Product-ийн size бүрийн stock мөрүүдийг нийлбэрлэнэ. */
export function totalProductStock(sizes: { stock: number }[]): number {
  return sizes.reduce((a, s) => a + s.stock, 0);
}
