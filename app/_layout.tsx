import { Stack } from 'expo-router';
import { CartProvider } from '@/context/cartContext';
import { OrderProvider } from '@/context/orderContext';
import { StoreOrderProvider } from '@/context/storeOrderContext';
import { AuthProvider } from '@/context/authContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <StoreOrderProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="admin" />
              <Stack.Screen name="worker" />
              <Stack.Screen name="modal" />
            </Stack>
          </StoreOrderProvider>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}