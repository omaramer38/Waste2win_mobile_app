import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/context/authContext';
import { api } from '@/services/api';

type Message = {
  id: number;
  role: 'bot' | 'user';
  text: string;
};

export default function ChatbotScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'bot',
      text: 'أهلاً، اسألني عن نقاطك، إعادة التدوير، أو أنسب منتج تقدر تستبدله.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { id: Date.now(), role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await api<{ reply: string; intent: string }>('/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', text: result.reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: error instanceof Error ? error.message : 'حصل خطأ، جرّب تاني بعد لحظة.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="chatbubble-ellipses" size={54} color="#E76F51" />
        <Text style={styles.centerTitle}>الشات بوت محتاج تسجيل دخول</Text>
        <Text style={styles.centerText}>سجل دخولك عشان يقدر يعرف رصيد نقاطك ويرشحلك منتجات مناسبة.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.botIcon}>
          <Ionicons name="chatbubble-ellipses" size={26} color="white" />
        </View>
        <View>
          <Text style={styles.title}>مساعد Waste2win</Text>
          <Text style={styles.subtitle}>نقاط، تدوير، وترشيحات منتجات</Text>
        </View>
      </View>

      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.role === 'user' ? styles.userText : styles.botText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
            <ActivityIndicator color="#E76F51" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="اكتب سؤالك..."
          placeholderTextColor="#777"
          multiline
          textAlign="right"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    padding: 24,
  },
  centerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  centerText: {
    color: '#BDBDBD',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  botIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E76F51',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  subtitle: {
    color: '#AFAFAF',
    fontSize: 13,
    marginTop: 3,
    textAlign: 'right',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 10,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#E76F51',
  },
  loadingBubble: {
    minWidth: 54,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'right',
  },
  botText: {
    color: '#F4F4F4',
  },
  userText: {
    color: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#2B2B2B',
    backgroundColor: '#151515',
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    borderRadius: 14,
    backgroundColor: '#222',
    color: 'white',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E76F51',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
