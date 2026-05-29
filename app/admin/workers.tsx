import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';

type WorkerItem = {
  id: string;
  name: string;
  phone: string;
  area: string;
  salary: string;
  status: 'نشط' | 'إجازة' | 'محظور';
};

type ApiWorker = {
  id: number;
  name: string;
  phone: string;
  area: string | null;
  salary: number;
  status: string;
};

const statusFromApi = (status: string): WorkerItem['status'] => {
  if (status === 'leave') return 'إجازة';
  if (status === 'blocked') return 'محظور';
  return 'نشط';
};

const statusToApi = (status: WorkerItem['status']) => {
  if (status === 'إجازة') return 'leave';
  if (status === 'محظور') return 'blocked';
  return 'active';
};

export default function AdminWorkersScreen() {
  const [search, setSearch] = useState('');
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [salary, setSalary] = useState('');

  const loadWorkers = async () => {
    const rows = await api<ApiWorker[]>('/users/workers');
    setWorkers(
      rows.map((worker) => ({
        id: String(worker.id),
        name: worker.name,
        phone: worker.phone || '',
        area: worker.area || '',
        salary: String(worker.salary || 0),
        status: statusFromApi(worker.status),
      }))
    );
  };

  useEffect(() => {
    loadWorkers().catch((error) => Alert.alert('خطأ', error.message));
  }, []);

  const filteredWorkers = useMemo(() => {
    const text = search.trim();
    return workers.filter(
      (worker) =>
        worker.name.includes(text) ||
        worker.phone.includes(text) ||
        worker.area.includes(text)
    );
  }, [workers, search]);

  const activeWorkers = workers.filter((worker) => worker.status === 'نشط').length;
  const inactiveWorkers = workers.filter((worker) => worker.status !== 'نشط').length;
  const totalSalary = workers.reduce((sum, worker) => sum + Number(worker.salary || 0), 0);

  const resetForm = () => {
    setName('');
    setPhone('');
    setArea('');
    setSalary('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !area.trim() || !salary.trim()) {
      Alert.alert('خطأ', 'من فضلك املأ بيانات المندوب');
      return;
    }

    if (Number.isNaN(Number(salary)) || Number(salary) <= 0) {
      Alert.alert('خطأ', 'الراتب لازم يكون رقم صحيح');
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      area: area.trim(),
      salary: Number(salary),
      status: 'active',
    };

    try {
      if (editingId) {
        const oldWorker = workers.find((worker) => worker.id === editingId);
        await api(`/users/workers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...payload,
            status: statusToApi(oldWorker?.status || 'نشط'),
          }),
        });
        Alert.alert('تم التعديل ✅', 'تم تعديل بيانات المندوب في الداتا بيز');
      } else {
        await api('/users/workers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        Alert.alert('تمت الإضافة ✅', 'تم إضافة المندوب في الداتا بيز');
      }

      resetForm();
      await loadWorkers();
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'تعذر حفظ المندوب');
    }
  };

  const handleEdit = (worker: WorkerItem) => {
    setName(worker.name);
    setPhone(worker.phone);
    setArea(worker.area);
    setSalary(worker.salary);
    setEditingId(worker.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('حذف المندوب', 'هل أنت متأكد من حذف هذا المندوب؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/users/workers/${id}`, { method: 'DELETE' });
            await loadWorkers();
          } catch (error) {
            Alert.alert('خطأ', error instanceof Error ? error.message : 'تعذر حذف المندوب');
          }
        },
      },
    ]);
  };

  const toggleStatus = async (worker: WorkerItem) => {
    const nextStatus = worker.status === 'نشط' ? 'إجازة' : 'نشط';
    try {
      await api(`/users/workers/${worker.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: worker.name,
          phone: worker.phone,
          area: worker.area,
          salary: Number(worker.salary),
          status: statusToApi(nextStatus),
        }),
      });
      await loadWorkers();
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'تعذر تحديث الحالة');
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
          <Text style={styles.title}>إدارة المندوبين</Text>
          <Text style={styles.subtitle}>إضافة وتعديل ومتابعة حالة المندوبين</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="briefcase" size={26} color="white" />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#E76F51" />
          <Text style={styles.statNumber}>{workers.length}</Text>
          <Text style={styles.statLabel}>الإجمالي</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#16B884" />
          <Text style={styles.statNumber}>{activeWorkers}</Text>
          <Text style={styles.statLabel}>نشط</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{inactiveWorkers}</Text>
          <Text style={styles.statLabel}>غير نشط</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={24} color="#1976D2" />
          <Text style={styles.statNumber}>{totalSalary}</Text>
          <Text style={styles.statLabel}>إجمالي الرواتب</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={handleAddButton}>
        <Ionicons name={showForm ? 'close' : 'person-add'} size={21} color="white" />
        <Text style={styles.addBtnText}>{showForm ? 'إغلاق النموذج' : 'إضافة مندوب جديد'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId ? 'تعديل بيانات المندوب' : 'بيانات المندوب'}</Text>
          <TextInput style={styles.input} placeholder="اسم المندوب" placeholderTextColor="#777" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="رقم الهاتف" placeholderTextColor="#777" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="المنطقة" placeholderTextColor="#777" value={area} onChangeText={setArea} />
          <TextInput style={styles.input} placeholder="الراتب" placeholderTextColor="#777" value={salary} onChangeText={setSalary} keyboardType="numeric" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{editingId ? 'حفظ التعديل' : 'إضافة المندوب'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="ابحث بالاسم أو الرقم أو المنطقة"
        placeholderTextColor="#777"
        value={search}
        onChangeText={setSearch}
      />

      {filteredWorkers.map((worker) => (
        <View key={worker.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{worker.name}</Text>
            <Text style={[styles.statusBadge, worker.status === 'نشط' ? styles.activeBadge : styles.leaveBadge]}>
              {worker.status}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.info}>رقم الهاتف: {worker.phone}</Text>
            <Text style={styles.info}>المنطقة: {worker.area}</Text>
            <Text style={styles.info}>الراتب: {worker.salary} جنيه</Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.smallBtn, styles.editBtn]} onPress={() => handleEdit(worker)}>
              <Text style={styles.smallBtnText}>تعديل</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallBtn, styles.statusBtn]} onPress={() => toggleStatus(worker)}>
              <Text style={styles.smallBtnText}>{worker.status === 'نشط' ? 'إجازة' : 'تفعيل'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn]} onPress={() => handleDelete(worker.id)}>
              <Text style={styles.smallBtnText}>حذف</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
  statCard: { backgroundColor: '#1D1D1D', width: '48%', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2C' },
  statNumber: { color: '#E76F51', fontSize: 25, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: '#D0D0D0', fontSize: 13, marginTop: 5 },
  addBtn: { backgroundColor: '#E76F51', paddingVertical: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8, marginBottom: 14 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  formCard: { backgroundColor: '#1D1D1D', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2C2C2C' },
  formTitle: { color: 'white', fontSize: 19, fontWeight: 'bold', textAlign: 'right' },
  input: { backgroundColor: '#121212', borderWidth: 1, borderColor: '#2C2C2C', color: 'white', padding: 14, borderRadius: 14, marginTop: 12, textAlign: 'right' },
  saveBtn: { backgroundColor: '#E76F51', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 14 },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  searchInput: { backgroundColor: '#1D1D1D', color: 'white', padding: 14, borderRadius: 14, marginBottom: 16, textAlign: 'right', borderWidth: 1, borderColor: '#2C2C2C' },
  card: { backgroundColor: '#1D1D1D', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2C2C2C' },
  rowBetween: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  name: { color: 'white', fontSize: 19, fontWeight: 'bold' },
  statusBadge: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 14, color: 'white', fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  activeBadge: { backgroundColor: '#16B884' },
  leaveBadge: { backgroundColor: '#FF9800' },
  infoBox: { backgroundColor: '#151515', borderRadius: 14, padding: 12 },
  info: { color: '#D0D0D0', fontSize: 14, textAlign: 'right', marginBottom: 8 },
  actionsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 14 },
  smallBtn: { width: '31%', paddingVertical: 11, borderRadius: 11, alignItems: 'center' },
  editBtn: { backgroundColor: '#1976D2' },
  statusBtn: { backgroundColor: '#FF9800' },
  deleteBtn: { backgroundColor: '#B00020' },
  smallBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
});
