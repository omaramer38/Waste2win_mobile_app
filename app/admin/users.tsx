import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';

type LocalUser = {
  id: string;
  username: string;
  email: string;
  phone: string;
  city: string;
  points: number;
  ordersCount: number;
  status: 'نشط' | 'محظور';
  joinedAt: string;
};

type ApiUser = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  city: string | null;
  points: number;
  role: string;
  status: string;
  joinedAt: string;
};

export default function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<LocalUser[]>([]);

  const loadUsers = async () => {
    const rows = await api<ApiUser[]>('/users');
    setUsers(
      rows
        .filter((user) => user.role === 'user')
        .map((user) => ({
          id: String(user.id),
          username: user.username,
          email: user.email,
          phone: user.phone || '',
          city: user.city || '',
          points: Number(user.points || 0),
          ordersCount: 0,
          status: user.status === 'blocked' ? 'محظور' : 'نشط',
          joinedAt: new Date(user.joinedAt).toLocaleDateString('ar-EG'),
        }))
    );
  };

  useEffect(() => {
    loadUsers().catch((error) => Alert.alert('خطأ', error.message));
  }, []);

  const filteredUsers = useMemo(() => {
    const text = search.trim().toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(text) ||
        user.email.toLowerCase().includes(text) ||
        user.phone.includes(text) ||
        user.city.toLowerCase().includes(text)
    );
  }, [users, search]);

  const activeUsers = users.filter((user) => user.status === 'نشط').length;
  const blockedUsers = users.filter((user) => user.status === 'محظور').length;
  const totalPoints = users.reduce((sum, user) => sum + user.points, 0);
  const totalOrders = users.reduce((sum, user) => sum + user.ordersCount, 0);

  const toggleUserStatus = async (id: string, currentStatus: 'نشط' | 'محظور') => {
    await api(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: currentStatus === 'نشط' ? 'blocked' : 'active' }),
    });
    await loadUsers();
  };

  const handleToggle = (id: string, currentStatus: 'نشط' | 'محظور') => {
    Alert.alert(
      currentStatus === 'نشط' ? 'حظر المستخدم' : 'إلغاء الحظر',
      currentStatus === 'نشط'
        ? 'هل تريد حظر هذا المستخدم؟'
        : 'هل تريد تفعيل هذا المستخدم؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              await toggleUserStatus(id, currentStatus);
            } catch (error) {
              Alert.alert('خطأ', error instanceof Error ? error.message : 'تعذر تحديث المستخدم');
            }
          },
        },
      ]
    );
  };

  const handleViewUser = (user: LocalUser) => {
    Alert.alert(
      'بيانات المستخدم',
      `الاسم: ${user.username}\nالإيميل: ${user.email}\nالهاتف: ${user.phone}\nالمدينة: ${user.city}\nالنقاط: ${user.points}\nالحالة: ${user.status}`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>إدارة المستخدمين</Text>
          <Text style={styles.subtitle}>متابعة حالة المستخدمين وحساباتهم</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="people" size={26} color="white" />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people-circle" size={24} color="#E76F51" />
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>إجمالي المستخدمين</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#16B884" />
          <Text style={styles.statNumber}>{activeUsers}</Text>
          <Text style={styles.statLabel}>نشط</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="ban" size={24} color="#B00020" />
          <Text style={styles.statNumber}>{blockedUsers}</Text>
          <Text style={styles.statLabel}>محظور</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{totalPoints}</Text>
          <Text style={styles.statLabel}>إجمالي النقاط</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>ملخص سريع</Text>
        <Text style={styles.summaryText}>إجمالي الطلبات: {totalOrders}</Text>
        <Text style={styles.summaryText}>المستخدمون النشطون: {activeUsers}</Text>
        <Text style={styles.summaryText}>المستخدمون المحظورون: {blockedUsers}</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="ابحث باسم أو إيميل أو رقم أو مدينة"
        placeholderTextColor="#777"
        value={search}
        onChangeText={setSearch}
      />

      {filteredUsers.map((user) => (
        <View key={user.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{user.username}</Text>
            <Text style={[styles.statusBadge, user.status === 'نشط' ? styles.activeBadge : styles.blockedBadge]}>
              {user.status}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.info}>الإيميل: {user.email}</Text>
            <Text style={styles.info}>رقم الهاتف: {user.phone || '-'}</Text>
            <Text style={styles.info}>المدينة: {user.city || '-'}</Text>
            <Text style={styles.info}>النقاط: {user.points}</Text>
            <Text style={styles.info}>تاريخ التسجيل: {user.joinedAt}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.smallBtn, styles.detailsBtn]} onPress={() => handleViewUser(user)}>
              <Text style={styles.smallBtnText}>تفاصيل</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, user.status === 'نشط' ? styles.blockBtn : styles.activateBtn]}
              onPress={() => handleToggle(user.id, user.status)}
            >
              <Text style={styles.smallBtnText}>{user.status === 'نشط' ? 'حظر' : 'تفعيل'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16, paddingTop: 55, paddingBottom: 35 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E76F51', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { color: 'white', fontSize: 27, fontWeight: 'bold', textAlign: 'right' },
  subtitle: { color: '#BDBDBD', fontSize: 14, textAlign: 'right', marginTop: 6 },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { backgroundColor: '#1D1D1D', width: '48%', borderRadius: 18, paddingVertical: 18, paddingHorizontal: 8, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2C' },
  statNumber: { color: '#E76F51', fontSize: 25, fontWeight: 'bold', marginTop: 8, marginBottom: 5 },
  statLabel: { color: '#D0D0D0', fontSize: 13, textAlign: 'center' },
  summaryCard: { backgroundColor: '#1D1D1D', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2C2C2C' },
  summaryTitle: { color: 'white', fontSize: 17, fontWeight: 'bold', textAlign: 'right', marginBottom: 10 },
  summaryText: { color: '#D0D0D0', fontSize: 14, textAlign: 'right', marginBottom: 7 },
  searchInput: { backgroundColor: '#1D1D1D', color: 'white', padding: 14, borderRadius: 14, marginBottom: 16, textAlign: 'right', borderWidth: 1, borderColor: '#2C2C2C' },
  card: { backgroundColor: '#1D1D1D', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2C2C2C' },
  rowBetween: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  name: { color: 'white', fontSize: 19, fontWeight: 'bold' },
  statusBadge: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 14, color: 'white', fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  activeBadge: { backgroundColor: '#16B884' },
  blockedBadge: { backgroundColor: '#B00020' },
  infoBox: { backgroundColor: '#151515', borderRadius: 14, padding: 12, marginBottom: 12 },
  info: { color: '#D0D0D0', fontSize: 14, textAlign: 'right', marginBottom: 8, lineHeight: 22 },
  actionsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 4 },
  smallBtn: { width: '48%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  detailsBtn: { backgroundColor: '#1976D2' },
  blockBtn: { backgroundColor: '#B00020' },
  activateBtn: { backgroundColor: '#16B884' },
  smallBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
});
