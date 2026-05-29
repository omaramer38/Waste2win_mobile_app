import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { useOrders } from '@/context/orderContext';
import { useStoreOrders } from '@/context/storeOrderContext';
import { api } from '@/services/api';

type AdminUser = {
  role: 'admin' | 'worker' | 'user';
};

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { orders } = useOrders();
  const { storeOrders } = useStoreOrders();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    api<AdminUser[]>('/users')
      .then(setAdminUsers)
      .catch(() => setAdminUsers([]));
  }, []);

  const totalUsers = adminUsers.filter((acc) => acc.role === 'user').length;
  const totalWorkers = adminUsers.filter((acc) => acc.role === 'worker').length;
  const totalAdmins = adminUsers.filter((acc) => acc.role === 'admin').length;

  const pendingRecycleOrders = orders.filter(
    (order) => order.status === 'قيد المراجعة'
  ).length;

  const acceptedRecycleOrders = orders.filter(
    (order) => order.status === 'تم القبول'
  ).length;

  const receivedRecycleOrders = orders.filter(
    (order) => order.status === 'تم الاستلام'
  ).length;

  const pendingStoreOrders = storeOrders.filter(
    (order) => order.status === 'preparing' || order.status === 'قيد التجهيز'
  ).length;

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تأكيد',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.welcome}>مرحبًا {user?.username || 'Admin'} 👋</Text>
          <Text style={styles.subtitle}>لوحة تحكم Waste2win</Text>
        </View>

        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={28} color="white" />
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="analytics" size={30} color="white" />
        </View>

        <View style={styles.heroTextBox}>
          <Text style={styles.heroTitle}>إدارة المنصة</Text>
          <Text style={styles.heroText}>
            تابع الطلبات، المستخدمين، المندوبين، وحالة المتجر من مكان واحد.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>إحصائيات سريعة</Text>

      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/admin/users' as any)}
        >
          <Ionicons name="people" size={24} color="#E76F51" />
          <Text style={styles.statNumber}>{totalUsers}</Text>
          <Text style={styles.statLabel}>المستخدمون</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/admin/workers' as any)}
        >
          <Ionicons name="person-add" size={24} color="#E76F51" />
          <Text style={styles.statNumber}>{totalWorkers}</Text>
          <Text style={styles.statLabel}>المندوبون</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/admin/recycling' as any)}
        >
          <Ionicons name="leaf" size={24} color="#E76F51" />
          <Text style={styles.statNumber}>{pendingRecycleOrders}</Text>
          <Text style={styles.statLabel}>طلبات قيد المراجعة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => router.push('/admin/store' as any)}
        >
          <Ionicons name="cart" size={24} color="#E76F51" />
          <Text style={styles.statNumber}>{pendingStoreOrders}</Text>
          <Text style={styles.statLabel}>طلبات متجر قيد التجهيز</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>حالة طلبات التدوير</Text>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusValue}>{pendingRecycleOrders}</Text>
          <Text style={styles.statusLabel}>قيد المراجعة</Text>
        </View>

        <View style={styles.line} />

        <View style={styles.statusRow}>
          <Text style={styles.statusValue}>{acceptedRecycleOrders}</Text>
          <Text style={styles.statusLabel}>تم القبول</Text>
        </View>

        <View style={styles.line} />

        <View style={styles.statusRow}>
          <Text style={styles.statusValue}>{receivedRecycleOrders}</Text>
          <Text style={styles.statusLabel}>تم الاستلام</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>الأقسام</Text>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/admin/users' as any)}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="people" size={24} color="#E76F51" />
          </View>
          <View style={styles.actionTextBox}>
            <Text style={styles.actionTitle}>المستخدمون</Text>
            <Text style={styles.actionText}>عرض وإدارة حسابات المستخدمين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#777" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/admin/workers' as any)}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="briefcase" size={24} color="#E76F51" />
          </View>
          <View style={styles.actionTextBox}>
            <Text style={styles.actionTitle}>المندوبون</Text>
            <Text style={styles.actionText}>إضافة وتعديل ومتابعة حالة المندوبين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#777" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/admin/recycling' as any)}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="leaf" size={24} color="#E76F51" />
          </View>
          <View style={styles.actionTextBox}>
            <Text style={styles.actionTitle}>طلبات التدوير</Text>
            <Text style={styles.actionText}>مراجعة الطلبات وتحديث حالتها</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#777" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/admin/store' as any)}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="cart" size={24} color="#E76F51" />
          </View>
          <View style={styles.actionTextBox}>
            <Text style={styles.actionTitle}>المتجر</Text>
            <Text style={styles.actionText}>إدارة المنتجات وطلبات الاستبدال</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#777" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/admin/settings' as any)}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="settings" size={24} color="#E76F51" />
          </View>
          <View style={styles.actionTextBox}>
            <Text style={styles.actionTitle}>الإعدادات</Text>
            <Text style={styles.actionText}>تعديل بيانات وإعدادات المنصة</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#777" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>ملخص النظام</Text>
        <Text style={styles.summaryText}>عدد الأدمن الحاليين: {totalAdmins}</Text>
        <Text style={styles.summaryText}>إجمالي طلبات التدوير: {orders.length}</Text>
        <Text style={styles.summaryText}>إجمالي طلبات المتجر: {storeOrders.length}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.logoutText}>تسجيل خروج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const sharedCard = {
  backgroundColor: '#1D1D1D',
  borderWidth: 1,
  borderColor: '#2C2C2C',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 16,
    paddingTop: 55,
    paddingBottom: 35,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    alignItems: 'flex-end',
    flex: 1,
  },
  welcome: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  subtitle: {
    color: '#BDBDBD',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'right',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E76F51',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroCard: {
    ...sharedCard,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#E76F51',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  heroTextBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  heroTitle: {
    color: 'white',
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  heroText: {
    color: '#CFCFCF',
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'right',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  statCard: {
    ...sharedCard,
    width: '48%',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 128,
    justifyContent: 'center',
  },
  statNumber: {
    color: '#E76F51',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 6,
  },
  statLabel: {
    color: '#D0D0D0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  statusCard: {
    ...sharedCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 22,
  },
  statusRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusValue: {
    color: '#E76F51',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statusLabel: {
    color: '#D0D0D0',
    fontSize: 15,
  },
  line: {
    height: 1,
    backgroundColor: '#2C2C2C',
  },
  actionsGrid: {
    gap: 12,
    marginBottom: 22,
  },
  actionCard: {
    ...sharedCard,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#2A1D18',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionTextBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  actionTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'right',
  },
  actionText: {
    color: '#CFCFCF',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  summaryCard: {
    ...sharedCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 12,
  },
  summaryText: {
    color: '#D0D0D0',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 8,
  },
  logoutBtn: {
    backgroundColor: '#E76F51',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
