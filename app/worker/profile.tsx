import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { useOrders } from '@/context/orderContext';

export default function WorkerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { orders } = useOrders();

  const receivedOrders = orders.filter((order) => order.status === 'تم الاستلام');

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
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
      <View style={styles.profileCard}>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>تعديل الملف</Text>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <View style={styles.avatar} />

          <View>
            <Text style={styles.name}>{user?.username || 'worker'}</Text>
            <Text style={styles.workerId}>معرف الجامع: 3</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>نشط</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4.2</Text>
          <Text style={styles.statLabel}>التقييم</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{receivedOrders.length}</Text>
          <Text style={styles.statLabel}>هذا الشهر</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{receivedOrders.length}</Text>
          <Text style={styles.statLabel}>إجمالي التجميعات</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>المعلومات الشخصية</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>الاسم بالكامل</Text>
          <Text style={styles.infoValue}>{user?.username || 'worker'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>البريد الإلكتروني</Text>
          <Text style={styles.infoValue}>{user?.email || 'worker@gmail.com'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>رقم الهاتف</Text>
          <Text style={styles.infoValue}>0129923353</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>المنطقة المخصصة</Text>
          <Text style={styles.infoValue}>المنصورة</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.optionButton}>
        <Text style={styles.optionButtonText}>تعديل المعلومات</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionButton}>
        <Text style={styles.optionButtonText}>تغيير كلمة المرور</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 18,
    paddingTop: 60,
    paddingBottom: 35,
  },
  profileCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  editButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF7A1A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#3A2A23',
  },
  name: {
    color: 'white',
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  workerId: {
    color: '#BDBDBD',
    fontSize: 15,
    marginTop: 6,
    textAlign: 'right',
  },
  activeBadge: {
    backgroundColor: '#FF7A1A',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  activeBadgeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    backgroundColor: '#1D1D1D',
    width: '31%',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  statNumber: {
    color: '#FF7A1A',
    fontSize: 27,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#BDBDBD',
    marginTop: 8,
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  infoTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 22,
  },
  infoItem: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  infoLabel: {
    color: '#AFAFAF',
    fontSize: 15,
    marginBottom: 8,
  },
  infoValue: {
    color: 'white',
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#2B2B2B',
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  optionButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#F04444',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
});