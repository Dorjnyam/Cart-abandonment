export type ProductSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "best_selling"
  | "highest_rated";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export interface ProductFilters {
  brand?: string;
  gender?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  size?: number;
  color?: string;
  page?: number;
  limit?: number;
  sort?: ProductSort;
}

