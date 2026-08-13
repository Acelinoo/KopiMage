'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, SelectedModifierOption } from '@/types/menu';

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  selectedModifiers: SelectedModifierOption[];
  unitPrice: number;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, selectedModifiers: SelectedModifierOption[], quantity?: number, notes?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  estimatedSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeTableId: string | null;
  setActiveTableId: (tableId: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Utility helper to safely parse display price strings like "22K", "28K (250ml)", "20K / 22K"
export const parseDisplayPrice = (priceStr: string): number => {
  if (!priceStr) return 22000;
  const match = priceStr.match(/(\d+)/);
  if (!match) return 22000;
  const num = parseInt(match[1], 10);
  return num < 1000 ? num * 1000 : num;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart & table context from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('kopimage_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCartItems(parsed);
      }
      
      // Parse ?table=XX from URL query string
      const urlParams = new URLSearchParams(window.location.search);
      const tableParam = urlParams.get('table');
      if (tableParam) {
        setActiveTableId(tableParam);
        localStorage.setItem('kopimage_table_id', tableParam);
      } else {
        const savedTable = localStorage.getItem('kopimage_table_id');
        if (savedTable) setActiveTableId(savedTable);
      }
    } catch (err) {
      console.error('Failed to load cart from storage', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync activeTableId when window location search changes
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tableParam = urlParams.get('table');
      if (tableParam) {
        setActiveTableId(tableParam);
        localStorage.setItem('kopimage_table_id', tableParam);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Save cart to localStorage only after initial load
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('kopimage_cart', JSON.stringify(cartItems));
    } catch (err) {
      console.error('Failed to save cart to storage', err);
    }
  }, [cartItems, isLoaded]);

  const addToCart = (
    item: MenuItem,
    selectedModifiers: SelectedModifierOption[],
    quantity = 1,
    notes = ''
  ) => {
    const basePriceNum = parseDisplayPrice(item.price);
    const modifierSum = selectedModifiers.reduce((sum, mod) => sum + mod.priceDelta, 0);
    const unitPrice = basePriceNum + modifierSum;

    // Unique ID based on item ID and modifier choices
    const modKey = selectedModifiers.map((m) => `${m.modifierId}:${m.optionId}`).sort().join('|');
    const cartItemId = `${item.id}_${modKey}`;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          notes: notes || updated[existingIndex].notes,
        };
        return updated;
      }
      return [
        ...prev,
        {
          cartItemId,
          menuItem: item,
          selectedModifiers,
          unitPrice,
          quantity,
          notes,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((ci) => (ci.cartItemId === cartItemId ? { ...ci, quantity } : ci))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('kopimage_cart');
    } catch (err) {}
  };

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedSubtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        estimatedSubtotal,
        isCartOpen,
        setIsCartOpen,
        activeTableId,
        setActiveTableId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
