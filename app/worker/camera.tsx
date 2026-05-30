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
import { useLocalSearchParams } from 'expo-router';
import { useOrders } from '@/context/orderContext';
import { api } from '@/services/api';

const materialInputs = [
  { key: 'plastic', label: 'بلاستيك' },
  { key: 'glass', label: 'زجاج' },
  { key: 'metal', label: 'معدن' },
  { key: 'paper', label: 'ورق' },
];

type DetectionResponse = {
  detections: {
    class: string;
    material: string;
    confidence: number;
    weight_g: number;
    bbox: number[];
  }[];
  total_weight_g: number;
  total_weight_kg: number;
  items_count: number;
  material_counts: Record<string, number>;
  annotated_image?: string;
};

export default function WorkerCameraScreen() {
  const { orders, updateOrderStatus } = useOrders();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [resultText, setResultText] = useState('نتيجة التصنيف ستظهر هنا');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const acceptedOrders = orders.filter((order) => order.status === 'تم القبول');
  const targetOrder = orders.find((order) => order.id === orderId) || acceptedOrders[0];

  const analyzeImage = async (base64Image: string, uri: string) => {
    setImageUri(uri);
    setIsAnalyzing(true);
    setResultText('جاري تحليل الصورة بالموديل...');

    try {
      const data = await api<DetectionResponse>('/waste-detection/detect', {
        method: 'POST',
        body: JSON.stringify({ image: base64Image }),
      });

      const nextWeights: Record<string, string> = {};
      for (const material of materialInputs) {
        const total = data.detections
          .filter((item) => item.material === material.key)
          .reduce((sum, item) => sum + Number(item.weight_g || 0), 0);

        if (total > 0) {
          nextWeights[material.key] = String(Number(total.toFixed(1)));
        }
      }

      setWeights(nextWeights);
      if (data.annotated_image) {
        setImageUri(data.annotated_image);
      }
      setResultText(
        `تم اكتشاف ${data.items_count} عنصر - الإجمالي ${data.total_weight_g} جم (${data.total_weight_kg} كجم)`
      );
    } catch (error) {
      console.error(error);
      setResultText('تعذر تحليل الصورة، يمكن إدخال النتائج يدويًا');
      Alert.alert('خطأ في التحليل', 'لم يتم تشغيل الموديل بنجاح. يمكنك إدخال الأوزان يدويًا.');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        await analyzeImage(`data:image/jpeg;base64,${asset.base64}`, asset.uri);
      }
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
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        await analyzeImage(`data:image/jpeg;base64,${asset.base64}`, asset.uri);
      }
    }
  };

  const handleSubmit = async () => {
    const wasteItems = materialInputs
      .map((item) => ({
        name: item.label,
        quantity: Number((weights[item.key] || '').replace(',', '.')),
      }))
      .filter((item) => Number.isFinite(item.quantity) && item.quantity > 0);

    if (!imageUri || wasteItems.length === 0) {
      Alert.alert('بيانات ناقصة', 'من فضلك التقط صورة أو أدخل وزن مادة واحدة على الأقل');
      return;
    }

    if (!targetOrder) {
      Alert.alert('لا يوجد طلب', 'افتح الكاميرا من طلب مقبول عشان يتم التسليم عليه');
      return;
    }

    await updateOrderStatus(targetOrder.id, 'تم الاستلام', undefined, wasteItems);

    Alert.alert('تم إرسال الطلب ✅', 'تم إنهاء العملية بنجاح');

    setImageUri(null);
    setWeights({});
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
        <Text style={styles.captureButtonText}>
          {isAnalyzing ? 'جاري التحليل...' : 'التقط صورة الآن'}
        </Text>
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

        {materialInputs.map((item) => (
          <View key={item.key} style={styles.weightRow}>
            <Text style={styles.weightLabel}>{item.label}</Text>
            <TextInput
              style={styles.input}
              placeholder="0 جم"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={weights[item.key] || ''}
              onChangeText={(value) =>
                setWeights((current) => ({ ...current, [item.key]: value }))
              }
            />
          </View>
        ))}

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
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    padding: 15,
    color: 'white',
    textAlign: 'right',
  },
  weightRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  weightLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    width: 74,
    textAlign: 'right',
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
