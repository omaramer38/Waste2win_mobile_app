import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useCart } from '@/context/cartContext';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'expo-router';

type ProductItem = {
  id?: number;
  name: string;
  points: number;
  image?: any;
  local?: boolean;
};

const fallbackProducts: ProductItem[] = [
  {
    name: 'كارت شحن',
    points: 100,
    image:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'كوب',
    points: 70,
    image:
      'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'تيشيرت',
    points: 200,
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'شنطة',
    points: 150,
    image:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'سماعات',
    points: 300,
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'باور بنك',
    points: 400,
    image:
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'زجاجة مياه',
    points: 80,
    image:
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'كتاب',
    points: 60,
    image:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'كاب',
    points: 90,
    image:
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'نوت بوك',
    points: 50,
    image:
      'https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'USB',
    points: 230,
    image: require('../../assets/images/usb.png'),
    local: true,
  },
  {
    name: 'ماوس',
    points: 300,
    image:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'كيبورد',
    points: 500,
    image:
      'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'جاكيت',
    points: 300,
    image:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
  {
    name: 'حذاء رياضي',
    points: 400,
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop',
    local: false,
  },
];

export default function Shop() {
  const { addToCart, points } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState(fallbackProducts);

  useEffect(() => {
    api<
      {
        id: number;
        title: string;
        points: number;
        image?: string;
        statusCode: string;
      }[]
    >('/products', { auth: false })
      .then((items) => {
        setProducts(
          items
            .filter((item) => item.statusCode === 'available')
            .map((item) => ({
              id: item.id,
              name: item.title,
              points: item.points,
              image: item.image || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop',
              local: false,
            }))
        );
      })
      .catch(() => undefined);
  }, []);

  const handleExchange = (item: {
    id?: number;
    name: string;
    points: number;
    image?: any;
    local?: boolean;
  }) => {
    if (!user) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'لازم تسجل دخول الأول عشان تبدل المنتجات.',
        [
          { text: 'ليس الآن', style: 'cancel' },
          { text: 'تسجيل الدخول', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    Alert.alert(
      'تأكيد الاستبدال',
      `هل أنتِ متأكدة من إضافة ${item.name} للسلة؟`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تأكيد',
          onPress: () => {
            addToCart(item);
            Alert.alert('تمت الإضافة للسلة 🧺');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>المتجر 🛒</Text>

      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
        <Text style={styles.balancePoints}>{user ? points : 0} نقطة</Text>
      </View>

      <View style={styles.grid}>
        {products.map((item, index) => (
          <View key={index} style={styles.card}>
            <Image
              source={item.local ? item.image : { uri: item.image }}
              style={styles.image}
              resizeMode="cover"
            />

            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.points}>{item.points} نقطة</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleExchange(item)}
            >
              <Text style={styles.buttonText}>استبدال</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },

  content: {
    padding: 16,
    paddingTop: 30,
    paddingBottom: 30,
  },

  title: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 18,
    marginTop: 20,
    fontWeight: 'bold',
  },

  balanceBox: {
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 20,
    alignItems: 'center',
  },

  balanceLabel: {
    color: '#ccc',
    fontSize: 15,
    marginBottom: 6,
  },

  balancePoints: {
    color: '#E76F51',
    fontSize: 24,
    fontWeight: 'bold',
  },

  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    backgroundColor: '#1D1D1D',
    width: '48%',
    borderRadius: 18,
    padding: 10,
    marginBottom: 15,
  },

  image: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    marginBottom: 10,
  },

  name: {
    color: 'white',
    fontSize: 16,
    textAlign: 'right',
    fontWeight: '600',
  },

  points: {
    color: '#E76F51',
    marginVertical: 6,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
  },

  button: {
    backgroundColor: '#E76F51',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
