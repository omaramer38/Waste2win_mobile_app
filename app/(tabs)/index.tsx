import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>D</Text>
        </View>

        <View style={styles.headerText}>
          <Text style={styles.logo}>Waste2win</Text>
          <Text style={styles.subLogo}>منصة إعادة التدوير المستدامة</Text>
        </View>
      </View>

      {/* Main Card */}
      <View style={styles.heroCard}>
        <Image
          source={require('../../assets/images/home-recycle.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.textBox}>
          <Text style={styles.smallTitle}>ابدأ رحلتك مع التدوير</Text>

          <Text style={styles.title}>حوّل نفاياتك إلى مكافآت</Text>

          <Text style={styles.description}>
            Waste2win منصة تساعدك على إعادة التدوير بسهولة، وتجميع نقاط،
            واستبدالها بمكافآت مفيدة بطريقة بسيطة وسريعة
          </Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)/recycle')}
            >
              <Text style={styles.primaryButtonText}>ابدأ إعادة التدوير</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(tabs)/shop')}
            >
              <Text style={styles.secondaryButtonText}>تصفح المتجر</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>أرقامنا</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>+2M</Text>
          <Text style={styles.statText}>نقطة مكتسبة</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>+50K</Text>
          <Text style={styles.statText}>عنصر معاد تدويره</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>+10K</Text>
          <Text style={styles.statText}>مستخدم نشط</Text>
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>ليه Waste2win؟</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>سهولة الاستخدام</Text>
        <Text style={styles.infoText}>
          اختاري نوع النفايات وأرسلي الطلب بسهولة من الموبايل.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>مكافآت حقيقية</Text>
        <Text style={styles.infoText}>
          كل عملية تدوير بتساعدك تجمعي نقاط تقدري تستبدليها من المتجر.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>حماية البيئة</Text>
        <Text style={styles.infoText}>
          مساهمتك في التدوير بتقلل النفايات وبتدعم أسلوب حياة أكثر استدامة.
        </Text>
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

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
  },

  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E76F51',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  logoIcon: {
    fontSize: 22,
  },

  headerText: {
    alignItems: 'flex-end',
  },

  logo: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },

  subLogo: {
    color: '#B8B8B8',
    fontSize: 13,
    marginTop: 2,
  },

  heroCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },

  heroImage: {
    width: '100%',
    height: 230,
  },

  textBox: {
    padding: 18,
  },

  smallTitle: {
    color: '#E76F51',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
  },

  title: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'right',
    lineHeight: 40,
    marginBottom: 10,
  },

  description: {
    color: '#D0D0D0',
    fontSize: 15,
    textAlign: 'right',
    lineHeight: 25,
    marginBottom: 18,
  },

  buttonsContainer: {
    gap: 10,
  },

  primaryButton: {
    backgroundColor: '#E76F51',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E76F51',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#232323',
  },

  secondaryButtonText: {
    color: '#E76F51',
    fontSize: 16,
    fontWeight: 'bold',
  },

  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 14,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  statCard: {
    backgroundColor: '#1D1D1D',
    width: '31%',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
  },

  statNumber: {
    color: '#E76F51',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  statText: {
    color: '#CFCFCF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  infoCard: {
    backgroundColor: '#1D1D1D',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  infoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },

  infoText: {
    color: '#CFCFCF',
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 23,
  },
});