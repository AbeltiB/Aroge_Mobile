import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { colors } from '../../../src/lib/colors';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../../src/constants';
import { api } from '../../../src/lib/api';
import type { MessageThread } from '@arogenpm/sdk';
import { Avatar, EmptyState, SkeletonRow } from '../../../src/components/ui';

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
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => `${item.listingId}-${item.otherUserId}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title="No messages yet"
              subtitle="Make an offer to start chatting!"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.thread}
              activeOpacity={0.85}
              onPress={() => router.push({
                pathname: '/messages/[listingId]/[otherUserId]',
                params: {
                  listingId: item.listingId,
                  otherUserId: item.otherUserId,
                  name: (item as any).otherUser?.name ?? '',
                  listingTitle: (item as any).listing?.title ?? '',
                },
              })}
            >
              <Avatar name={(item as any).otherUser?.name} size={46} />
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
  root: { flex: 1, backgroundColor: colors.canvas },
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: FontFamily.serif,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: colors.onBrand,
  },
  list: { padding: Spacing[3], gap: 8 },
  thread: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  threadLeft: { flex: 1 },
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
