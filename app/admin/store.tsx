import { useEffect, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/services/api';

type ProductItem = {
  id: string;
  name: string;
  points: string;
  stock: string;
  category: string;
  image: string;
  status: 'متاح' | 'غير متاح';
};

type ApiProduct = {
  id: number;
  title: string;
  points: number;
  quantity: number;
  category: string;
  image?: string;
  statusCode: string;
};

const emptyImage =
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop';

export default function AdminStoreScreen() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('صلاحية مرفوضة', 'يجب تفعيل صلاحية الكاميرا');
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
      setImage(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('صلاحية مرفوضة', 'يجب تفعيل صلاحية المعرض');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImage(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const loadProducts = async () => {
    const rows = await api<ApiProduct[]>('/products');
    setProducts(
      rows.map((item) => ({
        id: String(item.id),
        name: item.title,
        points: String(item.points),
        stock: String(item.quantity),
        category: item.category,
        image: item.image || emptyImage,
        status: item.statusCode === 'available' ? 'متاح' : 'غير متاح',
      }))
    );
  };

  useEffect(() => {
    loadProducts().catch((error) => Alert.alert('خطأ', error.message));
  }, []);

  const filteredProducts = useMemo(() => {
    const text = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(text) ||
        product.category.toLowerCase().includes(text) ||
        product.status.toLowerCase().includes(text)
    );
  }, [products, search]);

  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const availableProducts = products.filter((product) => product.status === 'متاح').length;
  const outOfStockProducts = products.length - availableProducts;

  const resetForm = () => {
    setName('');
    setPoints('');
    setStock('');
    setCategory('');
    setImage('');
    setEditingId(null);
    setShowForm(false);
  };

  const isValidNumber = (value: string) =>
    value.trim() !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0;

  const handleSave = async () => {
    if (!name.trim() || !points.trim() || !stock.trim() || !category.trim()) {
      Alert.alert('بيانات ناقصة', 'من فضلك املأ بيانات المنتج');
      return;
    }

    if (!isValidNumber(points) || !isValidNumber(stock)) {
      Alert.alert('قيمة غير صحيحة', 'النقاط والمخزون لازم يكونوا أرقام صحيحة');
      return;
    }

    const payload = {
      name: name.trim(),
      points: Number(points),
      stock: Number(stock),
      category: category.trim(),
      image: image.trim() || emptyImage,
    };

    try {
      if (editingId) {
        await api(`/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        Alert.alert('تم التعديل ✅', 'تم تعديل المنتج وحفظه في الداتا بيز');
      } else {
        await api('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        Alert.alert('تمت الإضافة ✅', 'تم إضافة المنتج وحفظه في الداتا بيز');
      }

      resetForm();
      await loadProducts();
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'تعذر حفظ المنتج');
    }
  };

  const handleEdit = (product: ProductItem) => {
    setName(product.name);
    setPoints(product.points);
    setStock(product.stock);
    setCategory(product.category);
    setImage(product.image);
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('حذف المنتج', 'هل أنت متأكد من حذف هذا المنتج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/products/${id}`, { method: 'DELETE' });
            await loadProducts();
          } catch (error) {
            Alert.alert('خطأ', error instanceof Error ? error.message : 'تعذر حذف المنتج');
          }
        },
      },
    ]);
  };

  const toggleStatus = async (product: ProductItem) => {
    const nextStock = product.status === 'متاح' ? '0' : product.stock === '0' ? '1' : product.stock;
    try {
      await api(`/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: product.name,
          points: Number(product.points),
          stock: Number(nextStock),
          category: product.category,
          image: product.image,
        }),
      });
      await loadProducts();
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'تعذر تحديث المنتج');
    }
  };

  const handleAddButton = () => {
    if (showForm && !editingId) {
      setShowForm(false);
      return;
    }
    resetForm();
    setShowForm(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>إدارة المتجر</Text>
          <Text style={styles.subtitle}>إضافة وتعديل المنتجات من الداتا بيز</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="cart" size={26} color="white" />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="cube" size={24} color="#E76F51" />
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>إجمالي المنتجات</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="layers" size={24} color="#E76F51" />
          <Text style={styles.statNumber}>{totalStock}</Text>
          <Text style={styles.statLabel}>إجمالي المخزون</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#16B884" />
          <Text style={styles.statNumber}>{availableProducts}</Text>
          <Text style={styles.statLabel}>متاح</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="alert-circle" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{outOfStockProducts}</Text>
          <Text style={styles.statLabel}>غير متاح</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={handleAddButton}>
        <Ionicons name={showForm ? 'close' : 'add-circle'} size={21} color="white" />
        <Text style={styles.addBtnText}>{showForm ? 'إغلاق النموذج' : 'إضافة منتج جديد'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId ? 'تعديل المنتج' : 'بيانات المنتج الجديد'}</Text>
          <TextInput style={styles.input} placeholder="اسم المنتج" placeholderTextColor="#777" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="النقاط" placeholderTextColor="#777" value={points} onChangeText={setPoints} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="المخزون" placeholderTextColor="#777" value={stock} onChangeText={setStock} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="الفئة" placeholderTextColor="#777" value={category} onChangeText={setCategory} />
          
          <View style={styles.imageButtonsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickFromCamera}>
              <Text style={styles.secondaryButtonText}>تصوير بالكاميرا</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
              <Text style={styles.secondaryButtonText}>اختيار من المعرض</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={[styles.input, styles.imageInput]} placeholder="أو مسار الصورة https://..." placeholderTextColor="#777" value={image} onChangeText={setImage} autoCapitalize="none" />
          {!!image.trim() && <Image source={{ uri: image }} style={styles.previewImage} />}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="save-outline" size={20} color="white" />
            <Text style={styles.saveBtnText}>{editingId ? 'حفظ التعديل' : 'إضافة المنتج'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="ابحث باسم المنتج أو الفئة"
        placeholderTextColor="#777"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.productsGrid}>
        {filteredProducts.map((product) => (
          <View key={product.id} style={styles.card}>
            <Image source={{ uri: product.image }} style={styles.image} />
            <View style={styles.cardHeader}>
              <Text style={[styles.statusBadge, product.status === 'متاح' ? styles.availableBadge : styles.unavailableBadge]}>
                {product.status}
              </Text>
              <Text style={styles.name}>{product.name}</Text>
            </View>
            <Text style={styles.info}>النقاط: {product.points}</Text>
            <Text style={styles.info}>المخزون: {product.stock}</Text>
            <Text style={styles.info}>الفئة: {product.category}</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.smallBtn, styles.editBtn]} onPress={() => handleEdit(product)}>
                <Text style={styles.smallBtnText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.statusBtn]} onPress={() => toggleStatus(product)}>
                <Text style={styles.smallBtnText}>{product.status === 'متاح' ? 'إيقاف' : 'تفعيل'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn]} onPress={() => handleDelete(product.id)}>
                <Text style={styles.smallBtnText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
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
  addBtn: { backgroundColor: '#E76F51', paddingVertical: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 14 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  formCard: { backgroundColor: '#1D1D1D', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2C2C2C' },
  formTitle: { color: 'white', fontSize: 19, fontWeight: 'bold', textAlign: 'right', marginBottom: 14 },
  input: { backgroundColor: '#121212', borderWidth: 1, borderColor: '#2C2C2C', color: 'white', padding: 14, borderRadius: 14, marginBottom: 12, textAlign: 'right' },
  imageInput: { textAlign: 'left' },
  previewImage: { width: '100%', height: 150, borderRadius: 14, marginBottom: 12, backgroundColor: '#121212' },
  saveBtn: { backgroundColor: '#E76F51', paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8, marginTop: 4 },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  searchInput: { backgroundColor: '#1D1D1D', color: 'white', padding: 14, borderRadius: 14, marginBottom: 16, textAlign: 'right', borderWidth: 1, borderColor: '#2C2C2C' },
  productsGrid: { gap: 14 },
  card: { backgroundColor: '#1D1D1D', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#2C2C2C' },
  image: { width: '100%', height: 160, borderRadius: 16, marginBottom: 12, backgroundColor: '#121212' },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  name: { color: 'white', fontSize: 18, textAlign: 'right', fontWeight: 'bold', flex: 1 },
  statusBadge: { color: 'white', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, overflow: 'hidden', fontSize: 12, fontWeight: 'bold', marginRight: 8 },
  availableBadge: { backgroundColor: '#16B884' },
  unavailableBadge: { backgroundColor: '#B00020' },
  info: { color: '#D0D0D0', fontSize: 14, textAlign: 'right', marginBottom: 7 },
  actionsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 12 },
  smallBtn: { width: '31%', paddingVertical: 11, borderRadius: 11, alignItems: 'center' },
  editBtn: { backgroundColor: '#1976D2' },
  statusBtn: { backgroundColor: '#FF9800' },
  deleteBtn: { backgroundColor: '#B00020' },
  smallBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  imageButtonsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#E76F51',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#E76F51',
    fontWeight: 'bold',
  },
});
