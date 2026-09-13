import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors } from '../src/lib/colors';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../src/constants';
import { api } from '../src/lib/api';
import { useAppState } from '../src/context/AppContext';
import type { Notification } from '@arogenpm/sdk';
import { ScreenHeader, EmptyState } from '../src/components/ui';

const PAGE_SIZE = 30;

export default function NotificationsScreen() {
  const { refreshUnread } = useAppState();

  const [items, setItems] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (p: number, replace: boolean) => {
    const res = await api.get<{ items: Notification[]; total: number }>(
      `/notifications?page=${p}&limit=${PAGE_SIZE}`
    );
    if (res.success) {
      setItems((prev) => replace ? res.data.items : [...prev, ...res.data.items]);
      setTotal(res.data.total);
      setPage(p);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPage(1, true).finally(() => setLoading(false));
  }, [fetchPage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(1, true);
    await refreshUnread();
    setRefreshing(false);
  }, [fetchPage, refreshUnread]);

  const loadMore = useCallback(async () => {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    await fetchPage(page + 1, false);
    setLoadingMore(false);
  }, [loadingMore, items.length, total, page, fetchPage]);

  const markRead = useCallback(async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`, {});
    if (res.success) {
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      await refreshUnread();
    }
  }, [refreshUnread]);

  const markAllRead = useCallback(async () => {
    const res = await api.patch('/notifications/read-all', {});
    if (res.success) {
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      await refreshUnread();
    }
  }, [refreshUnread]);

  const hasUnread = items.some((n) => !n.readAt);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        bordered
        rightActions={hasUnread ? (
          <TouchableOpacity onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : undefined}
      />

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.brand} style={{ margin: 16 }} /> : null}
        ListEmptyComponent={
          <EmptyState
            icon={<Bell size={28} color={Colors.text.muted} strokeWidth={1.5} />}
            title="No notifications yet"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.readAt && styles.unread]}
            onPress={() => !item.readAt && markRead(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.row}>
              {!item.readAt && <View style={styles.dot} />}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.cardTime}>
                  {new Date(item.createdAt).toLocaleDateString('en-ET', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  markAll: { fontSize: FontSize.sm, color: colors.brand, fontWeight: FontWeight.semibold },
  list: { padding: Spacing[3] },
  card: {
    backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  unread: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand, marginTop: 4, marginRight: 10 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  cardBody: { fontSize: 13, color: colors.textBody, lineHeight: 18 },
  cardTime: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
});
