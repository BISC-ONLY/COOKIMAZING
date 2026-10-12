import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useGetStoreCatalog } from '@workspace/api-client-react';
import type { Product, Topping } from '@workspace/api-client-react';

export type CartProductType = 'cookie' | 'shake';

export interface CartCookieSelection {
  cookieId: string;
  cookieName: string;
  toppings: Topping[];
}

export interface CartLine {
  lineId: string;
  productId: string;
  productType: CartProductType;
  name: string;
  description: string;
  image: string;
  quantity: number;
  toppings: Topping[];
  cookieSelectionCount?: number;
  cookieSelections?: CartCookieSelection[];
  unitPrice: number;
}

interface CartContextValue {
  items: CartLine[];
  itemCount: number;
  total: number;
  addItem: (product: Product, productType: CartProductType, toppings: Topping[], cookieSelections?: CartCookieSelection[]) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = 'COOKIMAZING-cart-v1';
const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]') as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.lineId === 'string' && typeof item.productId === 'string' && Number.isFinite(item.unitPrice));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(loadCart);
  const catalogQuery = useGetStoreCatalog();

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const catalog = catalogQuery.data;
    if (!catalog) return;

    setItems((current) => {
      let hasChanges = false;
      const updated = current.map((item) => {
        const products = item.productType === 'cookie' ? catalog.cookies : catalog.shakes;
        const toppingOptions = item.productType === 'cookie' ? catalog.cookieToppings : catalog.drinkToppings;
        const product = products.find((option) => option.id === item.productId);
        if (!product) return item;

        const updatedToppings = item.toppings.map((selected) => toppingOptions.find((option) => option.id === selected.id));
        if (updatedToppings.some((topping) => !topping)) return item;
        const toppings = updatedToppings as Topping[];
        const refreshedCookieSelections = item.cookieSelections?.map((selection) => {
          const cookie = catalog.cookies.find((option) => option.id === selection.cookieId);
          const selectionToppings = selection.toppings.map((selected) => catalog.cookieToppings.find((option) => option.id === selected.id));
          if (!cookie || selectionToppings.some((topping) => !topping)) return undefined;
          return {
            cookieId: cookie.id,
            cookieName: cookie.name,
            toppings: selectionToppings as Topping[],
          };
        });
        if (refreshedCookieSelections?.some((selection) => !selection)) return item;
        const cookieSelections = refreshedCookieSelections as CartCookieSelection[] | undefined;
        const selectionToppingTotal = cookieSelections?.reduce(
          (sum, selection) => sum + selection.toppings.reduce((toppingSum, topping) => toppingSum + topping.price, 0),
          0,
        ) ?? 0;
        const unitPrice = product.price + toppings.reduce((sum, topping) => sum + topping.price, 0) + selectionToppingTotal;
        const changed = item.name !== product.name
          || item.description !== product.description
          || item.image !== product.image
          || item.cookieSelectionCount !== product.cookieSelectionCount
          || item.unitPrice !== unitPrice
          || JSON.stringify(item.cookieSelections ?? []) !== JSON.stringify(cookieSelections ?? [])
          || item.toppings.some((topping, index) => topping.name !== toppings[index].name || topping.price !== toppings[index].price);

        if (!changed) return item;
        hasChanges = true;
        return {
          ...item,
          name: product.name,
          description: product.description,
          image: product.image,
          toppings,
          cookieSelectionCount: product.cookieSelectionCount,
          cookieSelections,
          unitPrice,
        };
      });

      return hasChanges ? updated : current;
    });
  }, [catalogQuery.data]);

  const addItem = (product: Product, productType: CartProductType, toppings: Topping[], cookieSelections?: CartCookieSelection[]) => {
    const sortedToppings = [...toppings].sort((a, b) => a.id.localeCompare(b.id));
    const normalizedCookieSelections = cookieSelections?.map((selection) => ({
      ...selection,
      toppings: [...selection.toppings].sort((a, b) => a.id.localeCompare(b.id)),
    }));
    const cookieSelectionKey = normalizedCookieSelections
      ?.map((selection) => `${selection.cookieId}[${selection.toppings.map((topping) => topping.id).join('.')}]`)
      .join('|') ?? '';
    const lineId = `${productType}-${product.id}-${sortedToppings.map((topping) => topping.id).join('.') || 'plain'}${cookieSelectionKey ? `-${cookieSelectionKey}` : ''}`;
    const selectionToppingTotal = normalizedCookieSelections?.reduce(
      (sum, selection) => sum + selection.toppings.reduce((toppingSum, topping) => toppingSum + topping.price, 0),
      0,
    ) ?? 0;
    const unitPrice = product.price + sortedToppings.reduce((sum, topping) => sum + topping.price, 0) + selectionToppingTotal;
    setItems((current) => {
      const existing = current.find((item) => item.lineId === lineId);
      if (existing) {
        return current.map((item) => item.lineId === lineId ? { ...item, quantity: Math.min(30, item.quantity + 1) } : item);
      }
      return [...current, {
        lineId,
        productId: product.id,
        productType,
        name: product.name,
        description: product.description,
        image: product.image,
        quantity: 1,
        toppings: sortedToppings,
        cookieSelectionCount: product.cookieSelectionCount,
        cookieSelections: normalizedCookieSelections,
        unitPrice,
      }];
    });
  };

  const setQuantity = (lineId: string, quantity: number) => {
    if (quantity < 1) {
      setItems((current) => current.filter((item) => item.lineId !== lineId));
      return;
    }
    setItems((current) => current.map((item) => item.lineId === lineId ? { ...item, quantity: Math.min(30, quantity) } : item));
  };

  const removeItem = (lineId: string) => setItems((current) => current.filter((item) => item.lineId !== lineId));
  const clearCart = () => setItems([]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);

  return <CartContext.Provider value={{ items, itemCount, total, addItem, setQuantity, removeItem, clearCart }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

export function formatPrice(value: number) {
  return `EGP ${Number(value).toFixed(2)}`;
}