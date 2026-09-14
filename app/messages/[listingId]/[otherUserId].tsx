import { useCallback, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Send, MessageCircle } from 'lucide-react-native';
import { Colors, FontFamily, BorderRadius, Spacing } from '../../../src/constants';
import { api } from '../../../src/lib/api';
import { useAppState } from '../../../src/context/AppContext';
import type { Message } from '@arogenpm/sdk';
import { ScreenHeader, RemoteImage, EmptyState, IconButton } from '../../../src/components/ui';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top', 'bottom']}>
      <ScreenHeader title={name || 'Chat'} subtitle={listingTitle} tone="surface" bordered />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.green.primary} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, gap: 6 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title="Say hello"
              subtitle="Start the conversation with a quick reply below"
            />
          }
          renderItem={({ item }) => {
            const mine = item.senderId === myId;
            return (
              <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, item.mediaKey && styles.bubbleMedia]}>
                  {item.mediaKey ? (
                    <RemoteImage photoKey={item.mediaKey} preset="small" style={styles.bubbleImage} rounded={BorderRadius.md} />
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
          <IconButton tone="tint" size="md" onPress={sendPhoto} disabled={sending} silent>
            <Camera size={19} color={Colors.green.primary} />
          </IconButton>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor={Colors.text.muted}
            multiline
          />
          <IconButton
            tone="floating"
            size="md"
            style={(!text.trim() || sending) ? styles.sendDisabled : styles.sendActive}
            disabled={!text.trim() || sending}
            onPress={() => send(text)}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={17} color="#fff" />}
          </IconButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleTheirs: { backgroundColor: Colors.cream.surface, borderWidth: 1, borderColor: Colors.line },
  bubbleMine: { backgroundColor: Colors.green.primary },
  bubbleMedia: { padding: 4, overflow: 'hidden' },
  bubbleImage: { width: 200, height: 200 },
  bubbleTextTheirs: { fontFamily: FontFamily.interRegular, color: Colors.ink, fontSize: 14 },
  bubbleTextMine: { fontFamily: FontFamily.interRegular, color: Colors.text.onGreen, fontSize: 14 },
  quickReply: {
    backgroundColor: Colors.green.tint, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  quickReplyText: { fontFamily: FontFamily.interMedium, fontSize: 12, color: Colors.green.primary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    paddingHorizontal: 12, paddingBottom: 10, paddingTop: 4,
    backgroundColor: Colors.cream.surface, borderTopWidth: 1, borderTopColor: Colors.line,
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.line, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: FontFamily.interRegular,
    color: Colors.ink, backgroundColor: Colors.cream.background, maxHeight: 100,
  },
  sendActive: { backgroundColor: Colors.terracotta.primary },
  sendDisabled: { backgroundColor: Colors.terracotta.primary, opacity: 0.5 },
});
