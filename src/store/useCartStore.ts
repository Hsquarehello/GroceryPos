import { create } from "zustand";
import { CartItem, Product } from "../types";

export function getDefaultSaleQuantity(product: Product) {
  if (product.selling_unit === "viss") {
    return 0.1;
  }
  if (product.selling_unit === "kg") return 0.1;
  if (product.selling_unit === "g") return 100;
  if (product.selling_unit === "tcl") return 1;
  return 1;
}

export function getSaleQuantityStep(product: Product) {
  if (product.selling_unit === "viss") {
    return 0.1;
  }
  if (product.selling_unit === "kg") return 0.1;
  if (product.selling_unit === "g") return 50;
  if (product.selling_unit === "tcl") return 1;
  return 1;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  decreaseItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      const quantityStep = getSaleQuantityStep(product);
      if (existing) {
        if (existing.quantity + quantityStep > product.stock_qty) return state;
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantityStep }
              : item,
          ),
        };
      }
      const defaultQuantity = getDefaultSaleQuantity(product);
      if (product.stock_qty < defaultQuantity) return state;
      return {
        items: [...state.items, { ...product, quantity: defaultQuantity }],
      };
    }),
  decreaseItem: (productId) =>
    set((state) => {
      const item = state.items.find((entry) => entry.id === productId);
      const quantityStep = item ? getSaleQuantityStep(item) : 1;
      if (!item || item.quantity <= quantityStep)
        return { items: state.items.filter((entry) => entry.id !== productId) };
      return {
        items: state.items.map((entry) =>
          entry.id === productId
            ? {
                ...entry,
                quantity: Number(
                  Math.max(
                    0,
                    entry.quantity - getSaleQuantityStep(entry),
                  ).toFixed(3),
                ),
              }
            : entry,
        ),
      };
    }),
  setQuantity: (productId, quantity) =>
    set((state) =>
      quantity <= 0
        ? { items: state.items.filter((entry) => entry.id !== productId) }
        : {
            items: state.items.map((entry) =>
              entry.id === productId
                ? {
                    ...entry,
                    quantity: Math.min(quantity, entry.stock_qty),
                  }
                : entry,
            ),
          },
    ),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    })),
  clear: () => set({ items: [] }),
}));
