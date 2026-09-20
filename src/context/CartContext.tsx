import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Listing, Category } from '@arogenpm/sdk';
import { api } from '../lib/api';
import { useAppState } from './AppContext';

export interface CartItem {
  id: string;
  listingId: string;
  createdAt: string;
  listing: Listing & {
    category?: Category;
    photos?: { cloudinaryKey: string; isPrimary?: boolean }[];
    seller?: { id: string; name: string; avatarUrl?: string | null; verified?: boolean; isTrusted?: boolean };
  };
}

interface CartContextValue {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (listingId: string) => Promise<boolean>;
  removeFromCart: (listingId: string) => Promise<void>;
  isInCart: (listingId: string) => boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppState();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) { setCartItems([]); return; }
    setLoading(true);
    const res = await api.get<CartItem[]>('/cart');
    if (res.success) setCartItems(res.data);
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (listingId: string) => {
    const res = await api.post('/cart', { listingId });
    if (res.success) await refreshCart();
    return res.success;
  }, [refreshCart]);

  const removeFromCart = useCallback(async (listingId: string) => {
    // Optimistic — the cart screen shouldn't wait on a round-trip to feel
    // like removal worked, and refreshCart() reconciles right after.
    setCartItems((prev) => prev.filter((i) => i.listingId !== listingId));
    await api.delete(`/cart/${listingId}`);
    await refreshCart();
  }, [refreshCart]);

  const isInCart = useCallback(
    (listingId: string) => cartItems.some((i) => i.listingId === listingId),
    [cartItems]
  );

  const value: CartContextValue = {
    cartItems,
    cartCount: cartItems.length,
    loading,
    refreshCart,
    addToCart,
    removeFromCart,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
