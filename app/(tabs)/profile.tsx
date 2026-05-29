import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/context/cartContext';
import { useOrders } from '@/context/orderContext';
import { useStoreOrders } from '@/context/storeOrderContext';
import { useAuth } from '@/context/authContext';

const emptyImage =
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop';

const getImageSource = (img: any) => {
  if (!img) return { uri: emptyImage };
  if (typeof img === 'string') {
    if (img.trim() === '') return { uri: emptyImage };
    return { uri: img };
  }
  return img;
};

export default function Profile() {
  const router = useRouter();
  const { points, totalOrdersCount } = useCart();
  const { orders, deleteOrder } = useOrders();
  const { storeOrders, deleteStoreOrder } = useStoreOrders();
  const { user, logout } = useAuth();

  const recycleOrdersCount = orders.length;
  const storeOrdersCount = storeOrders.length;
  const bonusEarned = Math.floor(totalOrdersCount / 10) * 10;
  const canCancelRecycleOrder = (order: (typeof orders)[number]) =>
    String(order.status) === 'قيد المراجعة' && !order.workerId;
  const canCancelStoreOrder = (order: (typeof storeOrders)[number]) =>
    order.canCancel !== false && (!order.deliveryStatus || order.deliveryStatus === 'pending') && !order.workerId;

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنتِ متأكدة من تسجيل الخروج؟', [
      {
        text: 'إلغاء',
        style: 'cancel',
      },
      {
        text: 'تأكيد',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleDeleteRecycleOrder = (id: string) => {
    Alert.alert('إلغاء طلب التدوير', 'هل أنتِ متأكدة من إلغاء طلب التدوير؟', [
      {
        text: 'رجوع',
        style: 'cancel',
      },
      {
        text: 'تأكيد الإلغاء',
        style: 'destructive',
        onPress: () => {
          deleteOrder(id);
        },
      },
    ]);
  };

  const handleDeleteStoreOrder = (id: string) => {
    Alert.alert('إلغاء طلب المتجر', 'هل أنتِ متأكدة من إلغاء طلب المتجر؟', [
      {
        text: 'رجوع',
        style: 'cancel',
      },
      {
        text: 'تأكيد الإلغاء',
        style: 'destructive',
        onPress: () => {
          deleteStoreOrder(id);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={{ uri: 'https://i.imgur.com/6VBx3io.png' }}
        style={styles.avatar}
      />

      <Text style={styles.name}>{user?.username || 'Guest'}</Text>
      <Text style={styles.email}>{user?.email || 'No email'}</Text>

      <View style={styles.pointsBox}>
        <Text style={styles.pointsLabel}>رصيدك الحالي</Text>
        <Text style={styles.pointsText}>{points} نقطة</Text>
      </View>

      <View style={styles.statsWrapper}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{recycleOrdersCount}</Text>
          <Text style={styles.statLabel}>طلبات تدوير حالية</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{storeOrdersCount}</Text>
          <Text style={styles.statLabel}>طلبات متجر حالية</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalOrdersCount}</Text>
          <Text style={styles.statLabel}>إجمالي الطلبات</Text>
        </View>
      </View>

      <View style={styles.bonusCard}>
        <Text style={styles.bonusTitle}>نظام البونص 🎁</Text>
        <Text style={styles.bonusText}>كل 10 طلبات = 10 نقاط بونص</Text>
        <Text style={styles.bonusPoints}>البونص المكتسب: {bonusEarned} نقطة</Text>
      </View>

      <Text style={styles.sectionTitle}>متابعة طلبات التدوير</Text>

      {orders.length === 0 ? (
        <View style={styles.emptyOrdersBox}>
          <Text style={styles.emptyOrdersText}>لا يوجد طلبات تدوير حاليًا</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <Text style={styles.orderTitle}>طلب تدوير</Text>

            <Text style={styles.orderText}>
              <Text style={styles.bold}>الأنواع: </Text>
              {order.wasteTypes.join(' - ')}
            </Text>

            {order.wasteItems && order.wasteItems.length > 0 && (
              <View style={styles.orderDetailsBox}>
                {order.wasteItems.map((item, index) => (
                  <Text key={`${item.name}-${index}`} style={styles.orderDetailText}>
                    {item.name}: {item.quantity} kg = {item.points} pts
                  </Text>
                ))}
              </View>
            )}

            <Text style={styles.orderText}>
              <Text style={styles.bold}>Total points: </Text>
              {order.totalPoints || 0}
            </Text>

            <Text style={styles.orderText}>
              <Text style={styles.bold}>المدينة: </Text>
              {order.city}
            </Text>

            <Text style={styles.orderText}>
              <Text style={styles.bold}>العنوان: </Text>
              {order.address}
            </Text>

            <Text style={styles.orderText}>
              <Text style={styles.bold}>رقم التليفون: </Text>
              {order.phone}
            </Text>

            <Text style={styles.orderText}>
              <Text style={styles.bold}>الحالة: </Text>
              <Text style={styles.status}>{order.status}</Text>
            </Text>

            {order.images?.length > 0 && (
              <>
                <Text style={styles.imagesTitle}>صور المنتجات</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imagesRow}
                >
                  {order.images.map((uri, index) => (
                    <Image
                      key={`${uri}-${index}`}
                      source={{ uri }}
                      style={styles.recycleImage}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.orderDate}>{order.createdAt}</Text>

            {canCancelRecycleOrder(order) && (
              <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleDeleteRecycleOrder(order.id)}
            >
              <Text style={styles.cancelBtnText}>إلغاء الطلب</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>طلبات المتجر</Text>

      {storeOrders.length === 0 ? (
        <View style={styles.emptyOrdersBox}>
          <Text style={styles.emptyOrdersText}>لا يوجد طلبات متجر حاليًا</Text>
        </View>
      ) : (
        storeOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <Text style={styles.orderTitle}>طلب متجر</Text>

            <Image source={getImageSource(order.image)} style={styles.storeImage} />

            <Text style={styles.orderText}>
              <Text style={styles.bold}>المنتج: </Text>
              {order.name}
            </Text>

            <Text style={styles.orderText}>
              <Text style={styles.bold}>النقاط: </Text>
              {order.points}
            </Text>

            <Text style={styles.orderText}>
              <Text style={styles.bold}>الحالة: </Text>
              <Text style={styles.status}>{order.status}</Text>
            </Text>

            <Text style={styles.orderDate}>{order.createdAt}</Text>

            {canCancelStoreOrder(order) && (
              <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleDeleteStoreOrder(order.id)}
            >
              <Text style={styles.cancelBtnText}>إلغاء الطلب</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>تسجيل خروج</Text>
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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#E76F51',
  },
  name: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  email: {
    color: '#aaa',
    marginBottom: 25,
  },
  pointsBox: {
    backgroundColor: '#1D1D1D',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  pointsLabel: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 8,
  },
  pointsText: {
    color: '#E76F51',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statsWrapper: {
    width: '100%',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    backgroundColor: '#1D1D1D',
    width: '31%',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statNumber: {
    color: '#E76F51',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
  bonusCard: {
    backgroundColor: '#1D1D1D',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 22,
  },
  bonusTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  bonusText: {
    color: '#ccc',
    textAlign: 'right',
    marginBottom: 8,
  },
  bonusPoints: {
    color: '#E76F51',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    marginBottom: 14,
    marginTop: 8,
  },
  emptyOrdersBox: {
    backgroundColor: '#1D1D1D',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  emptyOrdersText: {
    color: '#aaa',
    textAlign: 'right',
  },
  orderCard: {
    backgroundColor: '#1D1D1D',
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  orderTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  orderText: {
    color: '#ddd',
    textAlign: 'right',
    marginBottom: 6,
    lineHeight: 22,
  },
  orderDetailsBox: {
    backgroundColor: '#151515',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  orderDetailText: {
    color: '#DDD',
    textAlign: 'right',
    marginBottom: 4,
  },
  bold: {
    color: 'white',
    fontWeight: 'bold',
  },
  status: {
    color: '#E76F51',
    fontWeight: 'bold',
  },
  imagesTitle: {
    color: 'white',
    textAlign: 'right',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
  },
  imagesRow: {
    paddingBottom: 8,
  },
  recycleImage: {
    width: 95,
    height: 95,
    borderRadius: 12,
    marginLeft: 8,
  },
  orderDate: {
    color: '#888',
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
    marginBottom: 12,
  },
  storeImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
  },
  cancelBtn: {
    backgroundColor: '#B00020',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#E76F51',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 12,
    marginTop: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
