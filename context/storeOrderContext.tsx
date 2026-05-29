import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from './authContext';
import { useOrders } from './orderContext';

type StoreOrderItem = {
  id: string;
  name: string;
  points: number;
  image?: any;
  status: string;
  deliveryStatus?: string;
  workerId?: number;
  canCancel?: boolean;
  createdAt: string;
};

type StoreOrderContextType = {
  storeOrders: StoreOrderItem[];
  addStoreOrders: (
    items: { id?: number; name: string; points: number; image?: any }[],
    city?: string,
    phone?: string,
    address?: string
  ) => Promise<void>;
  deleteStoreOrder: (id: string) => Promise<void>;
  reloadStoreOrders: () => Promise<void>;
};

const StoreOrderContext = createContext<StoreOrderContextType | undefined>(undefined);

export const StoreOrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [storeOrders, setStoreOrders] = useState<StoreOrderItem[]>([]);
  const { user } = useAuth();
  const { reloadOrders } = useOrders();

  const reloadStoreOrders = async () => {
    if (!user) {
      setStoreOrders([]);
      return;
    }

    const result = await api<StoreOrderItem[]>('/store-orders');
    setStoreOrders(result);
  };

  useEffect(() => {
    reloadStoreOrders().catch(() => setStoreOrders([]));
  }, [user?.id, user?.role]);

  const addStoreOrders = async (
    items: { id?: number; name: string; points: number; image?: any }[],
    city?: string,
    phone?: string,
    address?: string
  ) => {
    const safeItems = items.map((item) => ({
      ...item,
      image: typeof item.image === 'string' ? item.image : undefined,
    }));

    await api('/store-orders', {
      method: 'POST',
      body: JSON.stringify({ items: safeItems, city, phone, address }),
    });
    await reloadStoreOrders();
    await reloadOrders();
  };

  const deleteStoreOrder = async (id: string) => {
    await api(`/store-orders/${id}`, { method: 'DELETE' });
    await reloadStoreOrders();
  };

  return (
    <StoreOrderContext.Provider value={{ storeOrders, addStoreOrders, deleteStoreOrder, reloadStoreOrders }}>
      {children}
    </StoreOrderContext.Provider>
  );
};

export const useStoreOrders = () => {
  const context = useContext(StoreOrderContext);
  if (!context) {
    throw new Error('useStoreOrders must be used inside StoreOrderProvider');
  }
  return context;
};
