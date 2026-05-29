import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/authContext';
import { useOrders } from '@/context/orderContext';

export default function WorkerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders, reloadOrders } = useOrders();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    reloadOrders().catch(console.error);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const acceptedOrders = orders.filter(
    (order) => order.statusCode === 'accepted' || order.status === 'تم القبول'
  );
  const receivedOrders = orders.filter(
    (order) => order.statusCode === 'received' || order.status === 'تم الاستلام'
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#FF7A1A']}
          tintColor="#FF7A1A"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>مرحبًا بعودتك يا {user?.username || 'Worker'} 👋</Text>
        <Text style={styles.subtitle}>إليك ما يحدث في تجميعاتك اليوم</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>عدد الزيارات</Text>
          <Text style={styles.statNumber}>
            {acceptedOrders.length + receivedOrders.length}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>عمليات الاستلام المكتملة</Text>
          <Text style={styles.statNumber}>{receivedOrders.length}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>عمليات الاستلام المعلقة</Text>
          <Text style={styles.statNumber}>{acceptedOrders.length}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>المنطقة الحالية</Text>
          <Text style={styles.areaText}>المنصورة</Text>
        </View>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>مسار اليوم</Text>
        <TouchableOpacity onPress={() => router.push('/worker/map')}>
          <Text style={styles.mapLink}>عرض الخريطة كاملة ←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.routeCard}>
        <Ionicons name="location" size={34} color="#FF4D4D" />
        <Text style={styles.routeTitle}>
          هناك {acceptedOrders.length} مواقع استلام في منطقتك
        </Text>
        <Text style={styles.routeSubtitle}>
          {acceptedOrders[0]?.address || 'لا توجد عناوين حاليًا'}
        </Text>
      </View>

      <TouchableOpacity style={styles.planCard} onPress={() => router.push('/worker/map')}>
        <Text style={styles.planTitle}>🗺️ تخطيط المسار</Text>
        <Text style={styles.planText}>اضغط لعرض الخريطة وفتح المسار في جوجل</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => router.push('/worker/tasks')}
      >
        <Text style={styles.mainButtonTitle}>عرض مهامي</Text>
        <Text style={styles.mainButtonText}>مشاهدة جميع عمليات الاستلام</Text>
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
    paddingBottom: 30,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  subtitle: {
    color: '#AFAFAF',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1D1D1D',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    minHeight: 120,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  statLabel: {
    color: '#BDBDBD',
    fontSize: 14,
    textAlign: 'right',
  },
  statNumber: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  areaText: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  sectionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  mapLink: {
    color: '#4EA1FF',
    fontSize: 14,
  },
  routeCard: {
    backgroundColor: '#2A1D18',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A2A23',
  },
  routeTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  routeSubtitle: {
    color: '#BDBDBD',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  planTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  planText: {
    color: '#AFAFAF',
    marginTop: 6,
  },
  mainButton: {
    backgroundColor: '#FF7A1A',
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
  },
  mainButtonTitle: {
    color: 'white',
    fontSize: 23,
    fontWeight: 'bold',
  },
  mainButtonText: {
    color: 'white',
    marginTop: 6,
    fontSize: 14,
  },
});
