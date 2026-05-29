import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useOrders } from '@/context/orderContext';
import { useCart } from '@/context/cartContext';
import { api } from '@/services/api';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'expo-router';

type WasteType = {
  id?: number;
  name: string;
  points?: number;
};

const fallbackWasteTypes: WasteType[] = [
  { name: 'الكتروني' },
  { name: 'بطاريات' },
  { name: 'بلاستيك' },
  { name: 'معدن' },
  { name: 'ورق' },
];

const fallbackPointsForWaste = (name: string) => {
  const index = fallbackWasteTypes.findIndex((item) => item.name === name);
  return [200, 80, 50, 150, 60][index] || 0;
};

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

export default function Recycle() {
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>(fallbackWasteTypes);
  const [selectedWaste, setSelectedWaste] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [selectedCity, setSelectedCity] = useState('');
  const [showCities, setShowCities] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const { addOrder } = useOrders();
  const { addRecycleBonusIfNeeded, totalOrdersCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    api<{ wastes: WasteType[] }>('/bootstrap', { auth: false })
      .then((data) => {
        if (Array.isArray(data.wastes) && data.wastes.length > 0) {
          setWasteTypes(data.wastes);
        }
      })
      .catch(() => undefined);
  }, []);

  const selectedWasteItems = useMemo(
    () =>
      selectedWaste.map((name) => {
        const waste = wasteTypes.find((item) => item.name === name);
        const pointsPerKg = Number(waste?.points || fallbackPointsForWaste(name));
        const quantity = Number(quantities[name] || 0);
        const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
        return {
          name,
          quantity: safeQuantity,
          points: Math.round(safeQuantity * pointsPerKg),
          pointsPerKg,
        };
      }),
    [quantities, selectedWaste, wasteTypes]
  );

  const totalRecyclePoints = selectedWasteItems.reduce((sum, item) => sum + item.points, 0);

  const toggleWaste = (name: string) => {
    if (selectedWaste.includes(name)) {
      setSelectedWaste(selectedWaste.filter((item) => item !== name));
      setQuantities((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } else {
      setSelectedWaste([...selectedWaste, name]);
      setQuantities((prev) => ({ ...prev, [name]: prev[name] || '1' }));
    }
  };

  const resetForm = () => {
    setSelectedWaste([]);
    setQuantities({});
    setSelectedCity('');
    setPhone('');
    setAddress('');
    setImages([]);
    setShowCities(false);
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('صلاحية مرفوضة', 'لازم تفعلي صلاحية الكاميرا أولًا');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImages((prev) => [...prev, `data:image/jpeg;base64,${asset.base64}`]);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('صلاحية مرفوضة', 'لازم تفعلي صلاحية المعرض أولًا');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets
        .filter((asset) => asset.base64)
        .map((asset) => `data:image/jpeg;base64,${asset.base64}`);
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((item) => item !== uri));
  };

  const handleSubmit = () => {
    const hasInvalidQuantity = selectedWasteItems.some((item) => item.quantity <= 0);
    if (!user) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'لازم تسجل دخول الأول عشان تعمل طلب تدوير.',
        [
          { text: 'ليس الآن', style: 'cancel' },
          { text: 'تسجيل الدخول', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    if (selectedWaste.length === 0 || !selectedCity || !phone || !address) {
      Alert.alert('خطأ', 'من فضلك املى كل البيانات');
      return;
    }

    if (hasInvalidQuantity) {
      Alert.alert('Invalid quantity', 'Enter the weight in kilograms for each selected type');
      return;
    }

    Alert.alert('تأكيد الطلب', 'هل أنتِ متأكدة من إرسال طلب التدوير؟', [
      {
        text: 'إلغاء',
        style: 'cancel',
      },
      {
        text: 'تأكيد',
        onPress: async () => {
          const beforeCount = totalOrdersCount;

          await addOrder({
            wasteTypes: selectedWaste,
            wasteItems: selectedWasteItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              points: item.points,
            })),
            city: selectedCity,
            phone,
            address,
            images,
          });

          addRecycleBonusIfNeeded();
          resetForm();

          const afterCount = beforeCount + 1;

          if (afterCount % 10 === 0) {
            Alert.alert(
              'تم إرسال الطلب ✅',
              'تقدري تتابعيه من صفحة البروفايل\nومبروك 🎉 حصلتي على 10 نقاط بونص'
            );
          } else {
            Alert.alert('تم إرسال الطلب ✅', 'تقدري تتابعيه من صفحة البروفايل');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>طلب تدوير ♻️</Text>

      <Text style={styles.label}>نوع النفايات</Text>
      <View style={styles.grid}>
        {wasteTypes.map((item) => (
          <TouchableOpacity
            key={item.id || item.name}
            style={[
              styles.card,
              selectedWaste.includes(item.name) && styles.selectedCard,
            ]}
            onPress={() => toggleWaste(item.name)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.cardPoints}>{Number(item.points || fallbackPointsForWaste(item.name))} / kg</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedWasteItems.length > 0 && (
        <View style={styles.quantityBox}>
          <Text style={styles.quantityTitle}>Selected weights</Text>
          {selectedWasteItems.map((item) => (
            <View key={`quantity-${item.name}`} style={styles.quantityRow}>
              <View style={styles.quantityMeta}>
                <Text style={styles.quantityName}>{item.name}</Text>
                <Text style={styles.quantityPoints}>
                  {item.pointsPerKg} pts/kg = {item.points} pts
                </Text>
              </View>
              <TextInput
                style={styles.quantityInput}
                keyboardType="decimal-pad"
                value={quantities[item.name] || ''}
                onChangeText={(value) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [item.name]: value.replace(',', '.'),
                  }))
                }
                placeholder="kg"
                placeholderTextColor="#888"
              />
            </View>
          ))}
          <Text style={styles.totalPointsText}>Total: {totalRecyclePoints} pts</Text>
        </View>
      )}

      <Text style={styles.label}>صور المنتجات</Text>

      <View style={styles.imageButtonsRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickFromCamera}>
          <Text style={styles.secondaryButtonText}>تصوير بالكاميرا</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
          <Text style={styles.secondaryButtonText}>اختيار من المعرض</Text>
        </TouchableOpacity>
      </View>

      {images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imagesRow}
        >
          {images.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.previewCard}>
              <Image source={{ uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => removeImage(uri)}
              >
                <Text style={styles.removeImageText}>حذف</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <Text style={styles.label}>المدينة</Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setShowCities(!showCities)}
      >
        <View pointerEvents="none">
          <TextInput
            style={styles.input}
            placeholder="المدينة"
            placeholderTextColor="#999"
            value={selectedCity}
            editable={false}
          />
        </View>
      </TouchableOpacity>

      {showCities && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
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

      <Text style={styles.label}>العنوان</Text>
      <TextInput
        style={styles.input}
        placeholder="العنوان بالتفصيل"
        placeholderTextColor="#999"
        value={address}
        onChangeText={setAddress}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>إرسال الطلب</Text>
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
    padding: 16,
    paddingTop: 28,
    paddingBottom: 30,
  },
  title: {
    color: 'white',
    fontSize: 24,
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  label: {
    color: '#ccc',
    marginBottom: 8,
    marginTop: 15,
    textAlign: 'right',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#1D1D1D',
    width: '47%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#E76F51',
  },
  name: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  cardPoints: {
    color: '#E76F51',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  quantityBox: {
    backgroundColor: '#1D1D1D',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  quantityTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  quantityMeta: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quantityName: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  quantityPoints: {
    color: '#AAA',
    marginTop: 4,
    fontSize: 12,
    textAlign: 'right',
  },
  quantityInput: {
    width: 92,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    color: 'white',
    padding: 12,
    textAlign: 'center',
  },
  totalPointsText: {
    color: '#E76F51',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1D1D1D',
    padding: 14,
    borderRadius: 12,
    color: 'white',
    textAlign: 'right',
  },
  dropdown: {
    backgroundColor: '#1D1D1D',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  cityItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2c',
  },
  cityText: {
    color: 'white',
    textAlign: 'right',
  },
  imageButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#E76F51',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#E76F51',
    fontWeight: 'bold',
  },
  imagesRow: {
    paddingVertical: 8,
    gap: 10,
  },
  previewCard: {
    width: 120,
    marginLeft: 10,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 6,
  },
  removeImageBtn: {
    backgroundColor: '#B00020',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#E76F51',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
