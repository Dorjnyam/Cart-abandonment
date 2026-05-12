/** Observer T1 (tk_full_) delegated click tracking-д зориулсан HTML data-ca-* props үүсгэнэ. */

export type CommerceAttrsInput = {
  ca: string;
  id?: string;
  price?: number;
  cat?: string;
  value?: number;
  size?: string;
  qty?: number;
  availability?: string;
  step?: string;
  payment?: string;
  shipping?: string;
  orderTotal?: number;
  discount?: string;
  sale?: boolean;
  variant?: string;
  stock?: string;
  cartCount?: number;
};

/** JSX intrinsic дээр spread хийх plain object буцаана (жишээ нь button). */
export function commerceAttrs(p: CommerceAttrsInput): Record<string, string | number> {
  const out: Record<string, string | number> = { "data-ca": p.ca };
  if (p.id != null && p.id !== "") out["data-ca-id"] = p.id;
  if (p.price != null && Number.isFinite(p.price)) out["data-ca-price"] = p.price;
  if (p.cat != null && p.cat !== "") out["data-ca-cat"] = p.cat;
  if (p.value != null && Number.isFinite(p.value)) out["data-ca-value"] = p.value;
  if (p.size != null && p.size !== "") out["data-ca-size"] = p.size;
  if (p.qty != null && Number.isFinite(p.qty)) out["data-ca-qty"] = p.qty;
  if (p.availability != null && p.availability !== "") out["data-ca-availability"] = p.availability;
  if (p.step != null && p.step !== "") out["data-ca-step"] = p.step;
  if (p.payment != null && p.payment !== "") out["data-ca-payment"] = p.payment;
  if (p.shipping != null && p.shipping !== "") out["data-ca-shipping"] = p.shipping;
  if (p.orderTotal != null && Number.isFinite(p.orderTotal)) out["data-ca-order-total"] = p.orderTotal;
  if (p.discount != null && p.discount !== "") out["data-ca-discount"] = p.discount;
  if (p.sale === true) out["data-ca-sale"] = "1";
  if (p.variant != null && p.variant !== "") out["data-ca-variant"] = p.variant;
  if (p.stock != null && p.stock !== "") out["data-ca-stock"] = p.stock;
  if (p.cartCount != null && Number.isFinite(p.cartCount)) out["data-ca-cart-count"] = p.cartCount;
  return out;
}
