import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '@/context/orderContext';

export default function WorkerMapScreen() {
  const router = useRouter();
  const { orders, reloadOrders } = useOrders();
  const [loading, setLoading] = useState(false);

  const pendingOrders = orders.filter(
    (order) => order.statusCode === 'accepted' || order.status === 'تم القبول'
  );

  useEffect(() => {
    setLoading(true);
    reloadOrders()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openMapUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }

      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('خطأ', 'تعذّر فتح خرائط جوجل');
    }
  };

  const openSingleInMaps = (address: string) => {
    if (!address.trim()) {
      Alert.alert('لا يوجد عنوان', 'هذا الطلب لا يحتوي على عنوان صالح للعرض على الخريطة.');
      return;
    }

    const encoded = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    openMapUrl(url);
  };

  /**
   * Open ALL pending orders as a route in Google Maps (with waypoints)
   */
  const openFullRouteInMaps = () => {
    if (pendingOrders.length === 0) {
      Alert.alert('لا توجد مهام', 'لا توجد طلبات مقبولة حاليًا.');
      return;
    }

    if (pendingOrders.length === 1) {
      openSingleInMaps(pendingOrders[0].address);
      return;
    }

    // Build Google Maps URL with waypoints
    // Format: https://www.google.com/maps/dir/?api=1&origin=A&destination=Z&waypoints=B|C|D
    const addresses = pendingOrders.map((o) => encodeURIComponent(o.address));
    const origin = addresses[0];
    const destination = addresses[addresses.length - 1];
    const waypoints = addresses.slice(1, -1).join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    url += '&travelmode=driving';

    openMapUrl(url);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مسار اليوم 🗺️</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF7A1A" />
          <Text style={styles.loadingText}>جاري تحميل المهام...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Summary Banner */}
          <View style={styles.summaryBanner}>
            <Ionicons name="location" size={28} color="#FF4D4D" />
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.summaryTitle}>
                {pendingOrders.length} موقع تجميع في انتظارك
              </Text>
              <Text style={styles.summarySubtitle}>
                اضغط &quot;افتح المسار الكامل&quot; لفتح الطريق في خرائط جوجل
              </Text>
            </View>
          </View>

          {/* Open Full Route Button */}
          <TouchableOpacity
            style={[
              styles.fullRouteBtn,
              pendingOrders.length === 0 && styles.fullRouteBtnDisabled,
            ]}
            onPress={openFullRouteInMaps}
            disabled={pendingOrders.length === 0}
          >
            <Ionicons name="navigate" size={22} color="white" />
            <Text style={styles.fullRouteBtnText}>افتح المسار الكامل في خرائط جوجل</Text>
          </TouchableOpacity>

          {/* Orders List */}
          {pendingOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={60} color="#16B884" />
              <Text style={styles.emptyTitle}>أنجزت كل مهامك! 🎉</Text>
              <Text style={styles.emptySubtitle}>لا توجد طلبات مقبولة في انتظارك</Text>
            </View>
          ) : (
            <>
              <Text style={styles.listTitle}>قائمة المواقع</Text>
              {pendingOrders.map((order, index) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderRow}>
                    {/* Index Badge */}
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </View>

                    <View style={styles.orderInfo}>
                      <Text style={styles.customerName}>
                        {order.customerName || 'عميل'}
                      </Text>
                      <Text style={styles.address}>{order.address}</Text>
                      <Text style={styles.wasteType}>
                        {order.wasteTypes.join(' - ')}
                      </Text>
                    </View>
                  </View>

                  {/* Navigate to this specific address */}
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => openSingleInMaps(order.address)}
                  >
                    <Ionicons name="navigate-outline" size={16} color="#FF7A1A" />
                    <Text style={styles.navBtnText}>التنقل إلى هذا الموقع</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1D1D1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#AFAFAF',
    marginTop: 12,
    fontSize: 16,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  summaryBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#2A1D18',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A2A23',
    gap: 12,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  summarySubtitle: {
    color: '#AFAFAF',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 4,
  },
  fullRouteBtn: {
    backgroundColor: '#FF7A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 24,
  },
  fullRouteBtnDisabled: {
    opacity: 0.5,
  },
  fullRouteBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  listTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 14,
  },
  orderCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  orderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF7A1A',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  indexText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderInfo: {
    flex: 1,
  },
  customerName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 4,
  },
  address: {
    color: '#D0D0D0',
    fontSize: 15,
    textAlign: 'right',
    marginBottom: 4,
  },
  wasteType: {
    color: '#9E9E9E',
    fontSize: 13,
    textAlign: 'right',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FF7A1A',
    borderRadius: 10,
    paddingVertical: 10,
  },
  navBtnText: {
    color: '#FF7A1A',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#1D1D1D',
    borderRadius: 22,
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#AFAFAF',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
});
