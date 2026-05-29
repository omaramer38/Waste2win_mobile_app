import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';

export default function AdminSettingsScreen() {
  const [siteName, setSiteName] = useState('Waste2win');
  const [tagline, setTagline] = useState('حوّل نفاياتك إلى مكافآت');
  const [supportEmail, setSupportEmail] = useState('support@waste2win.com');
  const [supportPhone, setSupportPhone] = useState('01000000000');

  const [plasticPoints, setPlasticPoints] = useState('50');
  const [paperPoints, setPaperPoints] = useState('60');
  const [metalPoints, setMetalPoints] = useState('150');
  const [electronicPoints, setElectronicPoints] = useState('200');
  const [batteryPoints, setBatteryPoints] = useState('80');

  useEffect(() => {
    api<{
      settings: Record<string, string>;
      wastes: { name: string; points: number }[];
    }>('/settings')
      .then((data) => {
        setSiteName(data.settings.site_name || 'Waste2win');
        setTagline(data.settings.tagline || 'حوّل نفاياتك إلى مكافآت');
        setSupportEmail(data.settings.support_email || 'support@waste2win.com');
        setSupportPhone(data.settings.support_phone || '01000000000');

        const pointFor = (name: string, fallback: string) =>
          String(data.wastes.find((waste) => waste.name === name)?.points ?? fallback);

        setPlasticPoints(pointFor('بلاستيك', '50'));
        setPaperPoints(pointFor('ورق', '60'));
        setMetalPoints(pointFor('معدن', '150'));
        setElectronicPoints(pointFor('الكتروني', '200'));
        setBatteryPoints(pointFor('بطاريات', '80'));
      })
      .catch(() => undefined);
  }, []);

  const isValidEmail = (email: string) => {
    return email.includes('@') && email.includes('.');
  };

  const isPositiveNumber = (value: string) => {
    return value.trim() !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0;
  };

  const handleSaveGeneral = async () => {
    if (!siteName.trim() || !tagline.trim() || !supportEmail.trim() || !supportPhone.trim()) {
      Alert.alert('بيانات ناقصة', 'من فضلك املي كل الإعدادات العامة');
      return;
    }

    if (!isValidEmail(supportEmail)) {
      Alert.alert('إيميل غير صحيح', 'من فضلك اكتبي بريد دعم صحيح');
      return;
    }

    if (supportPhone.length < 8) {
      Alert.alert('رقم غير صحيح', 'من فضلك اكتبي رقم دعم صحيح');
      return;
    }

    try {
      await api('/settings/general', {
        method: 'PUT',
        body: JSON.stringify({
          site_name: siteName.trim(),
          tagline: tagline.trim(),
          support_email: supportEmail.trim(),
          support_phone: supportPhone.trim(),
        }),
      });
      Alert.alert('تم الحفظ ✅', 'تم حفظ الإعدادات العامة في الداتا بيز');
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'تعذر حفظ الإعدادات');
    }
  };

  const handleSavePoints = async () => {
    const pointsValues = [
      plasticPoints,
      paperPoints,
      metalPoints,
      electronicPoints,
      batteryPoints,
    ];

    const hasInvalidValue = pointsValues.some((value) => !isPositiveNumber(value));

    if (hasInvalidValue) {
      Alert.alert('قيمة غير صحيحة', 'كل نقاط التدوير لازم تكون أرقام صحيحة أو أكبر من صفر');
      return;
    }

    try {
      await api('/settings/waste-points', {
        method: 'PUT',
        body: JSON.stringify({
          بلاستيك: Number(plasticPoints),
          ورق: Number(paperPoints),
          معدن: Number(metalPoints),
          الكتروني: Number(electronicPoints),
          بطاريات: Number(batteryPoints),
        }),
      });
      Alert.alert('تم الحفظ ✅', 'تم حفظ إعدادات النقاط في الداتا بيز');
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'تعذر حفظ النقاط');
    }
  };

  const resetPoints = () => {
    Alert.alert('إعادة ضبط النقاط', 'هل تريدين رجوع نقاط التدوير للقيم الافتراضية؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تأكيد',
        onPress: () => {
          setPlasticPoints('50');
          setPaperPoints('60');
          setMetalPoints('150');
          setElectronicPoints('200');
          setBatteryPoints('80');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>إعدادات المنصة</Text>
          <Text style={styles.subtitle}>عدلي البيانات الأساسية ونقاط التدوير</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="settings" size={26} color="white" />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle" size={24} color="#E76F51" />
          <Text style={styles.cardTitle}>الإعدادات العامة</Text>
        </View>

        <Text style={styles.label}>اسم المنصة</Text>
        <TextInput
          style={styles.input}
          placeholder="اسم المنصة"
          placeholderTextColor="#777"
          value={siteName}
          onChangeText={setSiteName}
        />

        <Text style={styles.label}>الجملة التعريفية</Text>
        <TextInput
          style={[styles.input, styles.largeInput]}
          placeholder="الجملة التعريفية"
          placeholderTextColor="#777"
          value={tagline}
          onChangeText={setTagline}
          multiline
        />

        <Text style={styles.label}>بريد الدعم</Text>
        <TextInput
          style={styles.input}
          placeholder="support@example.com"
          placeholderTextColor="#777"
          value={supportEmail}
          onChangeText={setSupportEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>رقم الدعم</Text>
        <TextInput
          style={styles.input}
          placeholder="010xxxxxxxx"
          placeholderTextColor="#777"
          value={supportPhone}
          onChangeText={setSupportPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGeneral}>
          <Ionicons name="save-outline" size={20} color="white" />
          <Text style={styles.saveBtnText}>حفظ الإعدادات العامة</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="star" size={24} color="#E76F51" />
          <Text style={styles.cardTitle}>نقاط التدوير</Text>
        </View>

        <View style={styles.pointsGrid}>
          <View style={styles.pointBox}>
            <Text style={styles.label}>بلاستيك</Text>
            <TextInput
              style={styles.pointsInput}
              value={plasticPoints}
              onChangeText={setPlasticPoints}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.pointBox}>
            <Text style={styles.label}>ورق</Text>
            <TextInput
              style={styles.pointsInput}
              value={paperPoints}
              onChangeText={setPaperPoints}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.pointBox}>
            <Text style={styles.label}>معدن</Text>
            <TextInput
              style={styles.pointsInput}
              value={metalPoints}
              onChangeText={setMetalPoints}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.pointBox}>
            <Text style={styles.label}>إلكتروني</Text>
            <TextInput
              style={styles.pointsInput}
              value={electronicPoints}
              onChangeText={setElectronicPoints}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.pointBoxFull}>
            <Text style={styles.label}>بطاريات</Text>
            <TextInput
              style={styles.pointsInput}
              value={batteryPoints}
              onChangeText={setBatteryPoints}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSavePoints}>
          <Ionicons name="checkmark-circle-outline" size={20} color="white" />
          <Text style={styles.saveBtnText}>حفظ إعدادات النقاط</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={resetPoints}>
          <Text style={styles.resetBtnText}>إعادة ضبط النقاط</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>ملاحظة مهمة</Text>
        <Text style={styles.noteText}>
          الإعدادات هنا محفوظة داخل الصفحة فقط حاليًا. لو عايزة نخليها تأثر فعلًا على نقاط
          طلب التدوير في التطبيق، نعمل لها SettingsContext ونربطها بصفحة Recycle.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 16, paddingTop: 55, paddingBottom: 35 },
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
  title: { color: 'white', fontSize: 27, fontWeight: 'bold', textAlign: 'right' },
  subtitle: { color: '#BDBDBD', fontSize: 14, textAlign: 'right', marginTop: 6 },
  card: {
    backgroundColor: '#1D1D1D',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: { color: 'white', fontSize: 19, fontWeight: 'bold', textAlign: 'right' },
  label: { color: '#CFCFCF', fontSize: 13, textAlign: 'right', marginBottom: 8 },
  input: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    color: 'white',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    textAlign: 'right',
  },
  largeInput: { minHeight: 76, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: '#E76F51',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 6,
  },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  pointsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pointBox: { width: '48%', marginBottom: 12 },
  pointBoxFull: { width: '100%', marginBottom: 12 },
  pointsInput: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#2C2C2C',
    color: 'white',
    padding: 14,
    borderRadius: 14,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetBtn: {
    borderWidth: 1,
    borderColor: '#E76F51',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  resetBtnText: { color: '#E76F51', fontWeight: 'bold' },
  noteCard: {
    backgroundColor: '#2A1D18',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3A2A23',
  },
  noteTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 8,
  },
  noteText: {
    color: '#CFCFCF',
    lineHeight: 23,
    textAlign: 'right',
    fontSize: 13,
  },
});
