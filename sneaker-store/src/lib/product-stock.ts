/** Sum per-size stock rows for a product. */
export function totalProductStock(sizes: { stock: number }[]): number {
  return sizes.reduce((a, s) => a + s.stock, 0);
}
