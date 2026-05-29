import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/cartContext';
import { useRouter } from 'expo-router';
import { useStoreOrders } from '@/context/storeOrderContext';
import { useAuth } from '@/context/authContext';

const emptyImage =
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop';

const egyptCities = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'المنصورة',
  'الشرقية',
  'الزقازيق',
  'الغربية',
  'طنطا',
  'المنوفية',
  'كفر الشيخ',
  'البحيرة',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'شمال سيناء',
  'جنوب سيناء',
  'مطروح',
];

const getImageSource = (img: any) => {
  if (!img) return { uri: emptyImage };
  if (typeof img === 'string') {
    if (img.trim() === '') return { uri: emptyImage };
    return { uri: img };
  }
  return img; // Local require source
};

export default function Cart() {
  const { cart, removeFromCart, totalPoints, checkout, points } = useCart();
  const { addStoreOrders } = useStoreOrders();
  const { user } = useAuth();
  const router = useRouter();

  const [selectedCity, setSelectedCity] = useState('');
  const [showCities, setShowCities] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  const handleRemove = (name: string) => {
    Alert.alert(
      'حذف المنتج',
      `هل تريد حذف ${name} من السلة؟`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          onPress: () => removeFromCart(name),
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (!user) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'لازم تسجل دخول الأول عشان تكمل الشراء.',
        [
          { text: 'ليس الآن', style: 'cancel' },
          { text: 'تسجيل الدخول', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    if (cart.length === 0) {
      Alert.alert('السلة فارغة', 'أضيفي منتجات أولًا');
      return;
    }

    if (!selectedCity || !phone || !address) {
      Alert.alert('بيانات ناقصة ⚠️', 'من فضلك املئي بيانات التوصيل أولاً (المدينة، رقم الهاتف، والعنوان)');
      return;
    }

    Alert.alert(
      'تأكيد الشراء',
      `إجمالي النقاط المطلوبة: ${totalPoints}\nرصيدك الحالي: ${points}`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تأكيد',
          onPress: async () => {
            const currentCart = [...cart];

            if (totalPoints > points) {
              Alert.alert('نقاط غير كافية', 'رصيدك لا يكفي لإتمام العملية');
              return;
            }

            try {
              await addStoreOrders(currentCart, selectedCity, phone, address);
              checkout();
              // Reset delivery form
              setSelectedCity('');
              setAddress('');
              Alert.alert('تم الشراء ✅', 'تقدري تتابعي الطلب من صفحة البروفايل');
            } catch (error) {
              Alert.alert('خطأ', error instanceof Error ? error.message : 'تعذر حفظ طلب المتجر');
            }
          },
        },
      ]
    );
  };

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>السلة 🧺</Text>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🛍️</Text>
          <Text style={styles.emptyTitle}>السلة فارغة</Text>
          <Text style={styles.emptySubtitle}>
            لسه ما اخترتيش أي منتجات. ادخلي المتجر واختاري المكافآت اللي تعجبك.
          </Text>

          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)/shop')}
          >
            <Text style={styles.shopButtonText}>الذهاب إلى المتجر</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>اقتراح 💡</Text>
          <Text style={styles.tipText}>
            بعد ما تجمعي نقاط من التدوير، تقدري تستبدليها بمنتجات من المتجر بسهولة.
          </Text>
        </View>
      </View>
    );
  }

  const renderDeliveryForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.formSectionTitle}>بيانات التوصيل 📍</Text>

      <Text style={styles.label}>المدينة</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setShowCities(!showCities)}
      >
        <View pointerEvents="none">
          <TextInput
            style={styles.input}
            placeholder="اختر المدينة"
            placeholderTextColor="#999"
            value={selectedCity}
            editable={false}
          />
        </View>
      </TouchableOpacity>

      {showCities && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
            {egyptCities.map((city, index) => (
              <TouchableOpacity
                key={index}
                style={styles.cityItem}
                onPress={() => {
                  setSelectedCity(city);
                  setShowCities(false);
                }}
              >
                <Text style={styles.cityText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={styles.label}>رقم التليفون</Text>
      <TextInput
        style={styles.input}
        placeholder="010xxxxxxxx"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Text style={styles.label}>العنوان بالتفصيل</Text>
      <TextInput
        style={styles.input}
        placeholder="الشارع، رقم العمارة، الشقة"
        placeholderTextColor="#999"
        value={address}
        onChangeText={setAddress}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>السلة 🧺</Text>

      <FlatList
        data={cart}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={getImageSource(item.image)} style={styles.image} />

            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.pointsText}>{item.points} نقطة</Text>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(item.name)}
            >
              <Text style={styles.removeText}>حذف</Text>
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={renderDeliveryForm()}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>إجمالي النقاط: {totalPoints}</Text>
        <Text style={styles.summaryText}>رصيدك الحالي: {points}</Text>

        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>تأكيد الشراء</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },

  title: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
    fontWeight: 'bold',
  },

  emptyCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
  },

  emptyEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },

  emptyTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  emptySubtitle: {
    color: '#BDBDBD',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },

  shopButton: {
    backgroundColor: '#E76F51',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },

  shopButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },

  tipCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },

  tipTitle: {
    color: '#E76F51',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },

  tipText: {
    color: '#CFCFCF',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },

  card: {
    backgroundColor: '#1D1D1D',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
  },

  image: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
  },

  name: {
    color: 'white',
    fontSize: 16,
    textAlign: 'right',
    fontWeight: '600',
  },

  pointsText: {
    color: '#E76F51',
    marginTop: 6,
    textAlign: 'right',
    fontWeight: 'bold',
  },

  removeBtn: {
    backgroundColor: '#B00020',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },

  removeText: {
    color: 'white',
    fontWeight: 'bold',
  },

  formContainer: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    marginBottom: 10,
  },

  formSectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 12,
  },

  label: {
    color: '#ccc',
    marginBottom: 6,
    marginTop: 12,
    textAlign: 'right',
    fontSize: 14,
  },

  input: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2c2c2c',
    padding: 12,
    borderRadius: 10,
    color: 'white',
    textAlign: 'right',
  },

  dropdown: {
    backgroundColor: '#121212',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    marginTop: 4,
    overflow: 'hidden',
  },

  cityItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },

  cityText: {
    color: 'white',
    textAlign: 'right',
  },

  summaryBox: {
    backgroundColor: '#1D1D1D',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
  },

  summaryText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'right',
  },

  checkoutBtn: {
    backgroundColor: '#E76F51',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  checkoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
