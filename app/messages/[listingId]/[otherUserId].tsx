import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../src/lib/colors';
import { api } from '../../../src/lib/api';
import { useAppState } from '../../../src/context/AppContext';
import type { Message } from 'aroge-sdk';

const QUICK_REPLIES = [
  'Is this still available?',
  'Can you lower the price?',
  'When can we meet?',
];

const POLL_MS = 4000;

export default function ConversationScreen() {
  const { listingId, otherUserId, name, listingTitle } = useLocalSearchParams<{
    listingId: string; otherUserId: string; name?: string; listingTitle?: string;
  }>();
  const router = useRouter();
  const { user } = useAppState();
  const myId = user?.sub;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!listingId || !otherUserId) return;
    if (!silent) setLoading(true);
    const res = await api.get<Message[]>(`/messages/${listingId}/${otherUserId}`);
    if (res.success) setMessages(res.data);
    setLoading(false);
  }, [listingId, otherUserId]);

  useFocusEffect(useCallback(() => {
    load();
    pollRef.current = setInterval(() => load(true), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]));

  async function send(body: string) {
    if (!body.trim() || !listingId || !otherUserId) return;
    setSending(true);
    const res = await api.post<Message>(`/messages/${listingId}/${otherUserId}`, { body: body.trim() });
    setSending(false);
    if (res.success) {
      setMessages((prev) => [...prev, res.data]);
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  async function sendPhoto() {
    if (!listingId || !otherUserId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setSending(true);
    const res = await api.uploadFile<Message>(
      `/messages/${listingId}/${otherUserId}/media`,
      result.assets[0].uri,
      'photo'
    );
    setSending(false);
    if (res.success) {
      setMessages((prev) => [...prev, res.data]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ fontSize: 20, color: colors.onBrand }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>{name || 'Chat'}</Text>
          {!!listingTitle && <Text style={styles.headerListing} numberOfLines={1}>{listingTitle}</Text>}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, gap: 6 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.empty}>Say hello to start the conversation.</Text>}
          renderItem={({ item }) => {
            const mine = item.senderId === myId;
            return (
              <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, item.mediaKey && styles.bubbleMedia]}>
                  {item.mediaKey ? (
                    <Image
                      source={{ uri: `https://res.cloudinary.com/demo/image/upload/${item.mediaKey}` }}
                      style={styles.bubbleImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.body}</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <FlatList
          horizontal
          data={QUICK_REPLIES}
          keyExtractor={(q) => q}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, gap: 8, paddingBottom: 6 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.quickReply} onPress={() => send(item)} disabled={sending}>
              <Text style={styles.quickReplyText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.photoBtn} onPress={sendPhoto} disabled={sending}>
            <Text style={{ fontSize: 20 }}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
            disabled={!text.trim() || sending}
            onPress={() => send(text)}
          >
            {sending ? <ActivityIndicator size="small" color={colors.onAction} /> : <Text style={styles.sendBtnText}>Send</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: { padding: 4 },
  headerName: { fontSize: 16, fontWeight: '700', color: colors.onBrand },
  headerListing: { fontSize: 12, color: 'rgba(243,239,231,0.7)', marginTop: 1 },
  empty: {
    textAlign: 'center', color: colors.textMuted, marginTop: 40,
    fontSize: 14, paddingHorizontal: 32, lineHeight: 20,
  },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleMine: { backgroundColor: colors.brand },
  bubbleMedia: { padding: 4, overflow: 'hidden' },
  bubbleImage: { width: 200, height: 200, borderRadius: 10 },
  bubbleTextTheirs: { color: colors.textPrimary, fontSize: 14 },
  bubbleTextMine: { color: colors.onBrand, fontSize: 14 },
  quickReply: {
    backgroundColor: colors.brandTint, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  quickReplyText: { fontSize: 12, color: colors.brand, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingBottom: 10, paddingTop: 4,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    color: colors.textPrimary, backgroundColor: colors.canvas, maxHeight: 100,
  },
  photoBtn: { paddingHorizontal: 4, paddingVertical: 8 },
  sendBtn: {
    backgroundColor: colors.action, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  sendBtnText: { color: colors.onAction, fontWeight: '700', fontSize: 13 },
});
