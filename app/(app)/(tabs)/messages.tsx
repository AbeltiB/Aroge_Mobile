import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../../src/lib/colors';
import { api } from '../../../src/lib/api';
import type { MessageThread } from 'aroge-sdk';

export default function MessagesScreen() {
  const router = useRouter();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<MessageThread[]>('/messages').then((res) => {
      if (res.success) setThreads(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => `${item.listingId}-${item.otherUserId}`}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No messages yet. Make an offer to start chatting!</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.thread}
              onPress={() => router.push({
                pathname: '/messages/[listingId]/[otherUserId]' as any,
                params: {
                  listingId: item.listingId,
                  otherUserId: item.otherUserId,
                  name: (item as any).otherUser?.name ?? '',
                  listingTitle: (item as any).listing?.title ?? '',
                },
              })}
            >
              <View style={styles.threadLeft}>
                <Text style={styles.otherUserName} numberOfLines={1}>
                  {(item as any).otherUser?.name ?? 'User'}
                </Text>
                <Text style={styles.listingTitle} numberOfLines={1}>
                  {(item as any).listing?.title ?? 'Listing'}
                </Text>
                <Text style={styles.lastMsg} numberOfLines={1}>
                  {item.lastMessage.body}
                </Text>
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.onBrand,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
    fontSize: 14,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  thread: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadLeft: { flex: 1, marginRight: 8 },
  otherUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listingTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.brand,
    marginTop: 1,
    marginBottom: 2,
  },
  lastMsg: {
    fontSize: 12,
    color: colors.textBody,
  },
  badge: {
    backgroundColor: colors.action,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.onAction,
    fontSize: 11,
    fontWeight: '700',
  },
});
