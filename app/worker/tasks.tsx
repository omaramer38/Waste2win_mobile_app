import { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOrders } from '@/context/orderContext';

type FilterType = 'all' | 'pending' | 'completed';

export default function WorkerTasksScreen() {
  const router = useRouter();
  const { orders, updateOrderStatus, reloadOrders } = useOrders();
  const [filter, setFilter] = useState<FilterType>('all');
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

  const workerOrders = orders.filter(
    (order) =>
      order.statusCode === 'accepted' ||
      order.statusCode === 'received' ||
      order.status === 'تم القبول' ||
      order.status === 'تم الاستلام'
  );

  const filteredOrders = useMemo(() => {
    if (filter === 'pending') {
      return workerOrders.filter(
        (order) => order.statusCode === 'accepted' || order.status === 'تم القبول'
      );
    }

    if (filter === 'completed') {
      return workerOrders.filter(
        (order) => order.statusCode === 'received' || order.status === 'تم الاستلام'
      );
    }

    return workerOrders;
  }, [workerOrders, filter]);

  const completedCount = workerOrders.filter(
    (order) => order.statusCode === 'received' || order.status === 'تم الاستلام'
  ).length;

  const pendingCount = workerOrders.filter(
    (order) => order.statusCode === 'accepted' || order.status === 'تم القبول'
  ).length;

  const handleComplete = (id: string) => {
    Alert.alert('إنهاء المهمة', 'هل تم استلام الطلب من العميل؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تأكيد',
        onPress: () => updateOrderStatus(id, 'تم الاستلام'),
      },
    ]);
  };

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
      <Text style={styles.title}>مهامي</Text>
      <Text style={styles.subtitle}>جميع العمليات: {workerOrders.length}</Text>

      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            كل المهام
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'pending' && styles.activeFilter]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}
          >
            المعلقة
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'completed' && styles.activeFilter]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'completed' && styles.activeFilterText,
            ]}
          >
            المكتملة
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>معلقة</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>مكتملة</Text>
        </View>
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>لا توجد مهام حاليًا</Text>
        </View>
      ) : (
        filteredOrders.map((order) => {
          const isCompleted = order.statusCode === 'received' || order.status === 'تم الاستلام';

          return (
            <View key={order.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View
                  style={[
                    styles.badge,
                    isCompleted ? styles.completedBadge : styles.pendingBadge,
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {isCompleted ? 'مكتملة' : 'معلقة'}
                  </Text>
                </View>

                <Text style={styles.clientName}>{order.customerName || 'عميل'}</Text>
              </View>

              <Text style={styles.address}>{order.address}</Text>
              <Text style={styles.typeText}>
                {order.isStoreOrder ? 'طلب متجر 🛒' : 'إعادة تدوير ♻️'}
              </Text>
              <Text style={styles.typeText}>{order.wasteTypes.join(' - ')}</Text>

              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() =>
                  router.push({
                    pathname: '/worker/camera',
                    params: { orderId: order.id },
                  })
                }
              >
                <Text style={styles.cameraButtonText}>فتح الكاميرا</Text>
              </TouchableOpacity>

              {!isCompleted && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleComplete(order.id)}
                >
                  <Text style={styles.completeButtonText}>تأكيد الاستلام</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}
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
  title: {
    color: 'white',
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#AFAFAF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  filtersRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  filterBtn: {
    width: '31%',
    backgroundColor: '#1D1D1D',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  activeFilter: {
    backgroundColor: '#FF7A1A',
    borderColor: '#FF7A1A',
  },
  filterText: {
    color: '#D0D0D0',
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: 'white',
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryNumber: {
    color: '#FF7A1A',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#BDBDBD',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#1D1D1D',
    padding: 20,
    borderRadius: 18,
  },
  emptyText: {
    color: '#BDBDBD',
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  taskHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientName: {
    color: 'white',
    fontSize: 23,
    fontWeight: 'bold',
  },
  badge: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  pendingBadge: {
    backgroundColor: '#F04444',
  },
  completedBadge: {
    backgroundColor: '#16B884',
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  address: {
    color: '#D0D0D0',
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 6,
  },
  typeText: {
    color: '#9E9E9E',
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 6,
  },
  cameraButton: {
    backgroundColor: '#FF7A1A',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#16B884',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
