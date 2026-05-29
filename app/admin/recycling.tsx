import { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders, OrderStatus } from '@/context/orderContext';
import { api } from '@/services/api';

type FilterType = 'all' | OrderStatus;

export default function AdminRecyclingScreen() {
  const { orders, updateOrderStatus } = useOrders();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [workers, setWorkers] = useState<any[]>([]);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadWorkers = async () => {
    try {
      const data = await api<any[]>('/users/workers');
      setWorkers(data);
    } catch (err) {
      console.error('Failed to load workers', err);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleAssignWorker = async (workerId: number) => {
    if (selectedOrderId) {
      try {
        await updateOrderStatus(selectedOrderId, 'تم القبول', workerId);
        setShowWorkerModal(false);
        setSelectedOrderId(null);
        Alert.alert('تم التحديث ✅', 'تم قبول الطلب وتعيين العامل بنجاح');
      } catch (err: any) {
        Alert.alert('خطأ', err.message || 'تعذر تعيين العامل');
      }
    }
  };

  const counts = useMemo(() => {
    return {
      pending: orders.filter((order) => order.status === 'قيد المراجعة').length,
      approved: orders.filter((order) => order.status === 'تم القبول').length,
      rejected: orders.filter((order) => order.status === 'مرفوض').length,
      received: orders.filter((order) => order.status === 'تم الاستلام').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter = filter === 'all' || order.status === filter;
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        searchText.length === 0 ||
        order.city.toLowerCase().includes(searchText) ||
        order.address.toLowerCase().includes(searchText) ||
        order.phone.includes(searchText) ||
        order.wasteTypes.join(' ').toLowerCase().includes(searchText);

      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  const getBadgeStyle = (status: OrderStatus) => {
    if (status === 'قيد المراجعة') return styles.pendingBadge;
    if (status === 'تم القبول') return styles.approvedBadge;
    if (status === 'مرفوض') return styles.rejectedBadge;
    return styles.receivedBadge;
  };

  const handleUpdateStatus = (id: string, status: OrderStatus) => {
    if (status === 'تم القبول') {
      setSelectedOrderId(id);
      setShowWorkerModal(true);
    } else {
      Alert.alert('تحديث حالة الطلب', `هل تريد تغيير الحالة إلى "${status}"؟`, [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: () => updateOrderStatus(id, status),
        },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>طلبات إعادة التدوير</Text>
          <Text style={styles.subtitle}>راجع الطلبات وحدث حالتها</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="leaf" size={26} color="white" />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCard} onPress={() => setFilter('قيد المراجعة')}>
          <Text style={styles.statNumber}>{counts.pending}</Text>
          <Text style={styles.statLabel}>قيد المراجعة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => setFilter('تم القبول')}>
          <Text style={styles.statNumber}>{counts.approved}</Text>
          <Text style={styles.statLabel}>تم القبول</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => setFilter('مرفوض')}>
          <Text style={styles.statNumber}>{counts.rejected}</Text>
          <Text style={styles.statLabel}>مرفوض</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => setFilter('تم الاستلام')}>
          <Text style={styles.statNumber}>{counts.received}</Text>
          <Text style={styles.statLabel}>تم الاستلام</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="ابحث بالمدينة أو العنوان أو رقم الهاتف"
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            الكل
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'قيد المراجعة' && styles.activeFilter]}
          onPress={() => setFilter('قيد المراجعة')}
        >
          <Text style={[styles.filterText, filter === 'قيد المراجعة' && styles.activeFilterText]}>
            مراجعة
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'تم القبول' && styles.activeFilter]}
          onPress={() => setFilter('تم القبول')}
        >
          <Text style={[styles.filterText, filter === 'تم القبول' && styles.activeFilterText]}>
            مقبول
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, filter === 'تم الاستلام' && styles.activeFilter]}
          onPress={() => setFilter('تم الاستلام')}
        >
          <Text style={[styles.filterText, filter === 'تم الاستلام' && styles.activeFilterText]}>
            مستلم
          </Text>
        </TouchableOpacity>
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="file-tray-outline" size={34} color="#777" />
          <Text style={styles.emptyText}>لا توجد طلبات مطابقة حاليًا</Text>
        </View>
      ) : (
        filteredOrders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.name}>{order.isStoreOrder ? 'طلب تبديل' : 'طلب تدوير'} #{order.id.slice(-4)}</Text>
              <Text style={[styles.statusBadge, getBadgeStyle(order.status)]}>
                {order.status}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.info}>
                <Text style={styles.bold}>{order.isStoreOrder ? 'منتج التبديل: ' : 'الأنواع: '}</Text>
                {order.wasteTypes.join(' - ')}
              </Text>

              {!order.isStoreOrder && order.wasteItems && order.wasteItems.length > 0 && (
                <View style={styles.itemsBox}>
                  {order.wasteItems.map((item, index) => (
                    <Text key={`${item.name}-${index}`} style={styles.itemLine}>
                      {item.name}: {item.quantity} kg = {item.points} pts
                    </Text>
                  ))}
                  <Text style={styles.itemTotal}>Total: {order.totalPoints || 0} pts</Text>
                </View>
              )}

              <Text style={styles.info}>
                <Text style={styles.bold}>المدينة: </Text>
                {order.city}
              </Text>

              <Text style={styles.info}>
                <Text style={styles.bold}>العنوان: </Text>
                {order.address}
              </Text>

              <Text style={styles.info}>
                <Text style={styles.bold}>رقم الهاتف: </Text>
                {order.phone}
              </Text>

              <Text style={styles.info}>
                <Text style={styles.bold}>التاريخ: </Text>
                {order.createdAt}
              </Text>

              {order.workerName && (
                <Text style={styles.info}>
                  <Text style={styles.bold}>العامل المسؤول: </Text>
                  {order.workerName}
                </Text>
              )}
            </View>

            {order.images?.length > 0 && (
              <>
                <Text style={styles.imagesTitle}>صور المرفقات</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {order.images.map((uri, index) => (
                    <Image
                      key={`${uri}-${index}`}
                      source={{ uri }}
                      style={styles.previewImage}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.pendingBtn]}
                onPress={() => handleUpdateStatus(order.id, 'قيد المراجعة')}
              >
                <Text style={styles.actionText}>مراجعة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleUpdateStatus(order.id, 'تم القبول')}
              >
                <Text style={styles.actionText}>قبول</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleUpdateStatus(order.id, 'مرفوض')}
              >
                <Text style={styles.actionText}>رفض</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.receiveBtn]}
                onPress={() => handleUpdateStatus(order.id, 'تم الاستلام')}
              >
                <Text style={styles.actionText}>استلام</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Modal
        visible={showWorkerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تعيين عامل للطلب</Text>
            <Text style={styles.modalSubtitle}>اختر العامل المسؤول عن جمع هذا الطلب:</Text>
            
            <ScrollView style={styles.workersList} contentContainerStyle={styles.workersListContent}>
              {workers.length === 0 ? (
                <Text style={styles.noWorkersText}>لا يوجد عمال متاحين حالياً</Text>
              ) : (
                workers.map((worker) => (
                  <TouchableOpacity
                    key={worker.id}
                    style={styles.workerItem}
                    onPress={() => handleAssignWorker(worker.id)}
                  >
                    <View style={styles.workerInfo}>
                      <Text style={styles.workerName}>{worker.name}</Text>
                      <Text style={styles.workerArea}>المنطقة: {worker.area || 'غير محدد'}</Text>
                    </View>
                    <Ionicons name="chevron-back" size={18} color="#999" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => {
                setShowWorkerModal(false);
                setSelectedOrderId(null);
              }}
            >
              <Text style={styles.closeModalBtnText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const baseCard = {
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
  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E76F51',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    color: 'white',
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  subtitle: {
    color: '#BDBDBD',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    ...baseCard,
    width: '48%',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    color: '#E76F51',
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statLabel: {
    color: '#D0D0D0',
    fontSize: 13,
  },
  searchInput: {
    ...baseCard,
    color: 'white',
    padding: 14,
    borderRadius: 14,
    textAlign: 'right',
    marginBottom: 14,
  },
  filtersRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterBtn: {
    width: '23%',
    backgroundColor: '#1D1D1D',
    paddingVertical: 11,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  activeFilter: {
    backgroundColor: '#E76F51',
    borderColor: '#E76F51',
  },
  filterText: {
    color: '#CFCFCF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: 'white',
  },
  emptyCard: {
    ...baseCard,
    padding: 22,
    borderRadius: 18,
    alignItems: 'center',
  },
  emptyText: {
    color: '#BDBDBD',
    textAlign: 'center',
    marginTop: 10,
  },
  card: {
    ...baseCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  rowBetween: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  name: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
  },
  approvedBadge: {
    backgroundColor: '#2E7D32',
  },
  rejectedBadge: {
    backgroundColor: '#B00020',
  },
  receivedBadge: {
    backgroundColor: '#1976D2',
  },
  infoBox: {
    backgroundColor: '#151515',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  info: {
    color: '#D0D0D0',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 22,
  },
  itemsBox: {
    backgroundColor: '#101010',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  itemLine: {
    color: '#D0D0D0',
    textAlign: 'right',
    marginBottom: 4,
  },
  itemTotal: {
    color: '#E76F51',
    textAlign: 'right',
    fontWeight: 'bold',
    marginTop: 4,
  },
  bold: {
    color: 'white',
    fontWeight: 'bold',
  },
  imagesTitle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 10,
    marginBottom: 8,
  },
  previewImage: {
    width: 95,
    height: 95,
    borderRadius: 12,
    marginLeft: 8,
  },
  actionsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionBtn: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingBtn: {
    backgroundColor: '#FF9800',
  },
  approveBtn: {
    backgroundColor: '#2E7D32',
  },
  rejectBtn: {
    backgroundColor: '#B00020',
  },
  receiveBtn: {
    backgroundColor: '#1976D2',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1D1D1D',
    borderRadius: 24,
    width: '100%',
    maxHeight: '80%',
    padding: 22,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#BDBDBD',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  workersList: {
    marginBottom: 16,
  },
  workersListContent: {
    gap: 10,
  },
  noWorkersText: {
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
  workerItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  workerInfo: {
    alignItems: 'flex-end',
  },
  workerName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workerArea: {
    color: '#9E9E9E',
    fontSize: 13,
    marginTop: 4,
  },
  closeModalBtn: {
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
