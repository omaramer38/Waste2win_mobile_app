import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/authContext';

export default function AdminLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === 'worker') {
    return <Redirect href={'/worker' as any} />;
  }

  if (user.role !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}