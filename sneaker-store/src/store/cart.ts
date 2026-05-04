import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  size: number;
  color: string;
  qty: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQty: (id: string, size: number, color: string, qty: number) => void;
  removeItem: (id: string, size: number, color: string) => void;
  clearCart: () => void;
  total: () => number;
}

declare global {
  interface Window {
    CartTracker?: {
      addToCart: (item: CartItem) => void;
      removeFromCart: (productId: string, reason?: string) => void;
      viewCart: (items: CartItem[], totalValue: number) => void;
      startCheckout: (items: CartItem[], totalValue: number) => void;
      abandonCheckout: (step: string, items: CartItem[]) => void;
      completePurchase: (
        orderId: string,
        items: CartItem[],
        totalValue: number,
        paymentMethod: string
      ) => void;
    };
  }
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const exists = state.items.find(
            (i) => i.id === item.id && i.size === item.size && i.color === item.color
          );
          if (typeof window !== "undefined" && window.CartTracker) {
            window.CartTracker.addToCart(item);
          }
          if (exists) {
            return {
              items: state.items.map((i) =>
                i.id === item.id && i.size === item.size && i.color === item.color
                  ? { ...i, qty: i.qty + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, qty: 1 }] };
        }),
      updateQty: (id, size, color, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id && i.size === size && i.color === color
              ? { ...i, qty: Math.max(1, qty) }
              : i
          ),
        })),
      removeItem: (id, size, color) =>
        set((state) => {
          if (typeof window !== "undefined" && window.CartTracker) {
            window.CartTracker.removeFromCart(id, "user");
          }
          return {
            items: state.items.filter(
              (i) => !(i.id === id && i.size === size && i.color === color)
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    { name: "sneaker_cart" }
  )
);

