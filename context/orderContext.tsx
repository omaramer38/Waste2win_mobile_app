import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from './authContext';

export type OrderStatus =
  | 'قيد المراجعة'
  | 'تم القبول'
  | 'مرفوض'
  | 'تم الاستلام';

export type OrderItem = {
  id: string;
  wasteTypes: string[];
  wasteItems?: {
    name: string;
    quantity: number;
    points: number;
  }[];
  city: string;
  phone: string;
  address: string;
  images: string[];
  statusCode?: string;
  status: OrderStatus;
  createdAt: string;
  totalPoints?: number;
  workerId?: number;
  workerName?: string;
  isStoreOrder?: boolean;
  storeProductTitle?: string;
  customerName?: string;
};

type ApiOrder = Omit<OrderItem, 'status'> & {
  status: string;
  statusCode: string;
  workerId?: number;
  workerName?: string;
};

type OrderContextType = {
  orders: OrderItem[];
  addOrder: (order: Omit<OrderItem, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    workerId?: number,
    wasteItems?: { name: string; quantity: number }[]
  ) => Promise<void>;
  reloadOrders: () => Promise<void>;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const statusFromApi = (status: string): OrderStatus => {
  if (status === 'accepted') return 'تم القبول';
  if (status === 'rejected') return 'مرفوض';
  if (status === 'received') return 'تم الاستلام';
  return 'قيد المراجعة';
};

const statusToApi = (status: OrderStatus) => {
  const value = String(status);
  if (value === 'طھظ… ط§ظ„ظ‚ط¨ظˆظ„' || value === 'تم القبول') return 'accepted';
  if (value === 'ظ…ط±ظپظˆط¶' || value === 'مرفوض') return 'rejected';
  if (value === 'طھظ… ط§ظ„ط§ط³طھظ„ط§ظ…' || value === 'تم الاستلام') return 'received';
  return 'pending';
};

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const { user } = useAuth();

  const reloadOrders = async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    const result = await api<ApiOrder[]>('/recycle-orders');
    setOrders(
      result.map((order) => ({
        ...order,
        status: statusFromApi(order.statusCode || order.status),
      }))
    );
  };

  useEffect(() => {
    reloadOrders().catch(() => setOrders([]));
  }, [user?.id, user?.role]);

  const addOrder = async (order: Omit<OrderItem, 'id' | 'status' | 'createdAt'>) => {
    await api('/recycle-orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
    await reloadOrders();
  };

  const deleteOrder = async (id: string) => {
    await api(`/recycle-orders/${id}`, { method: 'DELETE' });
    await reloadOrders();
  };

  const updateOrderStatus = async (
    id: string,
    status: OrderStatus,
    workerId?: number,
    wasteItems?: { name: string; quantity: number }[]
  ) => {
    await api(`/recycle-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: statusToApi(status), workerId, wasteItems }),
    });
    await reloadOrders();
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, deleteOrder, updateOrderStatus, reloadOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error('useOrders must be used inside OrderProvider');
  }

  return context;
};
