import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const router = useRouter();
  const { login, signup } = useAuth();

  const goByRole = (role?: 'user' | 'admin' | 'worker') => {
    if (role === 'admin') {
      router.replace('/admin');
    } else if (role === 'worker') {
      router.replace('/worker' as any);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('خطأ', 'من فضلك اكتبي الإيميل والباسورد');
      return;
    }

    const result = await login(loginEmail, loginPassword);

    if (!result.success) {
      Alert.alert('خطأ', result.message);
      return;
    }

    Alert.alert('نجاح ✅', result.message);
    goByRole(result.role);
  };

  const handleSignup = async () => {
    if (!signupUsername || !signupEmail || !signupPassword) {
      Alert.alert('خطأ', 'من فضلك املي كل بيانات إنشاء الحساب');
      return;
    }

    const result = await signup(signupUsername, signupEmail, signupPassword);

    if (!result.success) {
      Alert.alert('خطأ', result.message);
      return;
    }

    Alert.alert('نجاح ✅', result.message);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Waste2win ♻️</Text>
          <Text style={styles.subtitle}>أعد التدوير. اربح. استبدل.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.authButton, isLogin && styles.activeButton]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={styles.activeText}>تسجيل الدخول</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authButton, !isLogin && styles.activeButton]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={styles.activeText}>إنشاء حساب</Text>
            </TouchableOpacity>
          </View>

          {isLogin ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor="#aaa"
                value={loginEmail}
                onChangeText={setLoginEmail}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="password"
                placeholderTextColor="#aaa"
                secureTextEntry
                value={loginPassword}
                onChangeText={setLoginPassword}
              />

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>دخول</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="username"
                placeholderTextColor="#aaa"
                value={signupUsername}
                onChangeText={setSignupUsername}
              />

              <TextInput
                style={styles.input}
                placeholder="email"
                placeholderTextColor="#aaa"
                value={signupEmail}
                onChangeText={setSignupEmail}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="password"
                placeholderTextColor="#aaa"
                secureTextEntry
                value={signupPassword}
                onChangeText={setSignupPassword}
              />

              <TouchableOpacity style={styles.button} onPress={handleSignup}>
                <Text style={styles.buttonText}>تسجيل</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.guestButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.guestButtonText}>Continue as guest</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  title: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'white',
    marginTop: 10,
  },
  card: {
    backgroundColor: 'rgba(29,29,29,0.92)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  buttonsRow: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 25,
    marginBottom: 20,
  },
  authButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#E76F51',
    borderRadius: 25,
  },
  activeText: {
    color: 'white',
    fontWeight: '600',
  },
  form: {
    gap: 15,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#E76F51',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guestButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#E76F51',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
