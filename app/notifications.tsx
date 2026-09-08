import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { api } from '../src/lib/api';
import { useAppState } from '../src/context/AppContext';
import type { Notification } from '@arogenpm/sdk';

const PAGE_SIZE = 30;

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator size="large" color="#1f7a5a" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1f7a5a" />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#1f7a5a" style={{ margin: 16 }} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
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
  container: { flex: 1, backgroundColor: '#f3efe7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3efe7' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: 'rgba(31,122,90,0.12)',
  },
  backBtn: { marginRight: 12 },
  backText: { fontSize: 22, color: '#1f7a5a' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1a3028' },
  markAll: { fontSize: 13, color: '#1f7a5a', fontWeight: '600' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 10, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(31,122,90,0.12)',
  },
  unread: { borderColor: '#1f7a5a', backgroundColor: '#e6f0eb' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1f7a5a', marginTop: 4, marginRight: 10 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1a3028', marginBottom: 2 },
  cardBody: { fontSize: 13, color: '#444444', lineHeight: 18 },
  cardTime: { fontSize: 11, color: 'rgba(31,122,90,0.45)', marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: 'rgba(31,122,90,0.45)' },
});
