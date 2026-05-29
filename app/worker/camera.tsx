import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useOrders } from '@/context/orderContext';

const wasteTypes = ['بلاستيك', 'ورق', 'معدن', 'بطاريات', 'الكتروني'];

export default function WorkerCameraScreen() {
  const { orders, updateOrderStatus } = useOrders();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [showTypes, setShowTypes] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [resultText, setResultText] = useState('نتيجة التصنيف ستظهر هنا');

  const acceptedOrders = orders.filter((order) => order.status === 'تم القبول');

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('صلاحية مرفوضة', 'لازم تفعلي صلاحية الكاميرا');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setResultText('تم التقاط الصورة بنجاح');
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('صلاحية مرفوضة', 'لازم تفعلي صلاحية المعرض');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setResultText('تم رفع الصورة بنجاح');
    }
  };

  const handleSubmit = () => {
    if (!imageUri || !selectedType || !quantity) {
      Alert.alert('بيانات ناقصة', 'من فضلك ارفعي صورة واختاري النوع واكتبي الكمية');
      return;
    }

    if (acceptedOrders.length > 0) {
      updateOrderStatus(acceptedOrders[0].id, 'تم الاستلام', undefined, [
        {
          name: selectedType,
          quantity: Number(quantity.replace(',', '.')),
        },
      ]);
    }

    Alert.alert('تم إرسال الطلب ✅', 'تم إنهاء العملية بنجاح');

    setImageUri(null);
    setSelectedType('');
    setQuantity('');
    setResultText('نتيجة التصنيف ستظهر هنا');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.cameraBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <Text style={styles.cameraText}>
            جاهز لالتقاط صورة النفايات{'\n'}ضع العنصر داخل الإطار
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
        <Text style={styles.captureButtonText}>التقط صورة الآن</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={pickImage}>
        <Text style={styles.uploadText}>رفع صورة من الجهاز</Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>
        قم بتوجيه الكاميرا نحو العنصر القابل لإعادة التدوير أو رفع صورة
      </Text>

      <View style={styles.resultBox}>
        <Text style={styles.resultText}>{resultText}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>إنهاء العملية</Text>

        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => setShowTypes(!showTypes)}
        >
          <Text style={selectedType ? styles.selectText : styles.placeholderText}>
            {selectedType || 'اختر النوع'}
          </Text>
          <Text style={styles.arrow}>⌄</Text>
        </TouchableOpacity>

        {showTypes && (
          <View style={styles.dropdown}>
            {wasteTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedType(type);
                  setShowTypes(false);
                }}
              >
                <Text style={styles.dropdownText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="ادخل الكمية"
          placeholderTextColor="#777"
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>إرسال الطلب</Text>
        </TouchableOpacity>
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
    padding: 18,
    paddingTop: 55,
    paddingBottom: 30,
  },
  cameraBox: {
    backgroundColor: '#111827',
    height: 360,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    overflow: 'hidden',
  },
  cameraText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 34,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  captureButton: {
    backgroundColor: '#FF7A1A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  captureButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uploadText: {
    color: '#D0D0D0',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 14,
  },
  helperText: {
    color: '#AFAFAF',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 18,
  },
  resultBox: {
    backgroundColor: '#172033',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
  },
  resultText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  formTitle: {
    color: 'white',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectInput: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: 'white',
    fontSize: 16,
  },
  placeholderText: {
    color: '#777',
    fontSize: 16,
  },
  arrow: {
    color: '#999',
    fontSize: 22,
  },
  dropdown: {
    backgroundColor: '#121212',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  dropdownText: {
    color: 'white',
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    padding: 15,
    color: 'white',
    textAlign: 'right',
    marginBottom: 18,
  },
  submitButton: {
    backgroundColor: '#16B884',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
