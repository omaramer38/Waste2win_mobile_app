import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './authContext';

type Item = {
  id?: number;
  name: string;
  points: number;
  image?: any;
};

type CartContextType = {
  cart: Item[];
  points: number;
  totalOrdersCount: number;
  addToCart: (item: Item) => void;
  removeFromCart: (name: string) => void;
  clearCart: () => void;
  totalPoints: number;
  checkout: () => boolean;
  addRecycleBonusIfNeeded: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<Item[]>([]);
  const [points, setPoints] = useState(500);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const { user, refreshUserPoints } = useAuth();

  useEffect(() => {
    if (user) {
      setPoints(user.points);
    } else {
      setPoints(0);
    }
  }, [user?.id, user?.points]);

  const addToCart = (item: Item) => {
    setCart((prev) => [...prev, item]);
  };

  const removeFromCart = (name: string) => {
    setCart((prev) =>
      prev.filter(
        (item, index) =>
          !(item.name === name && index === prev.findIndex((p) => p.name === name))
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalPoints = cart.reduce((sum, item) => sum + item.points, 0);

  const checkout = () => {
    if (totalPoints > points) {
      return false;
    }

    const orderCountAfterCheckout = totalOrdersCount + cart.length;
    const oldBonusBlocks = Math.floor(totalOrdersCount / 10);
    const newBonusBlocks = Math.floor(orderCountAfterCheckout / 10);
    const bonusToAdd = (newBonusBlocks - oldBonusBlocks) * 10;

    setPoints((prev) => {
      const nextPoints = prev - totalPoints + bonusToAdd;
      refreshUserPoints(nextPoints);
      return nextPoints;
    });
    setTotalOrdersCount(orderCountAfterCheckout);
    setCart([]);

    return true;
  };

  const addRecycleBonusIfNeeded = () => {
    const orderCountAfterAdd = totalOrdersCount + 1;
    const oldBonusBlocks = Math.floor(totalOrdersCount / 10);
    const newBonusBlocks = Math.floor(orderCountAfterAdd / 10);
    const bonusToAdd = (newBonusBlocks - oldBonusBlocks) * 10;

    setTotalOrdersCount(orderCountAfterAdd);

    if (bonusToAdd > 0) {
      setPoints((prev) => prev + bonusToAdd);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        points,
        totalOrdersCount,
        addToCart,
        removeFromCart,
        clearCart,
        totalPoints,
        checkout,
        addRecycleBonusIfNeeded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
};
