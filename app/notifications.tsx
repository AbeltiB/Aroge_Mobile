import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Bell, Wallet, MessageSquare, Heart, Package, AlertTriangle } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../src/constants';
import { api } from '../src/lib/api';
import { useAppState } from '../src/context/AppContext';
import type { Notification } from '@arogenpm/sdk';
import { ScreenHeader, EmptyState } from '../src/components/ui';

const PAGE_SIZE = 30;

type NotifCategory = 'money' | 'offer' | 'social' | 'logistics' | 'alert';

const CATEGORY_BY_TYPE: Record<string, NotifCategory> = {
  ORDER_PLACED: 'money', PAYMENT_SUCCESS: 'money', PAYMENT_FAILED: 'alert',
  ESCROW_HELD: 'money', ESCROW_RELEASED: 'money', AUTO_RELEASED: 'money',
  ESCROW_REFUNDED: 'money', ORDER_COMPLETED: 'money',
  OFFER_RECEIVED: 'offer', OFFER_ACCEPTED: 'offer', OFFER_REJECTED: 'offer', OFFER_COUNTERED: 'offer',
  NEW_MESSAGE: 'social', BADGE_GRANTED: 'social',
  DELIVERY_APPROVED: 'logistics', DELIVERY_REJECTED: 'logistics',
  DISPUTE_OPENED: 'alert', ADMIN_DECISION: 'alert', PAYMENT_PROOF_REJECTED: 'alert',
};

const CATEGORY_META: Record<NotifCategory, { Icon: any; bg: string; fg: string }> = {
  money: { Icon: Wallet, bg: 'rgba(31,122,90,0.12)', fg: Colors.green.primary },
  offer: { Icon: MessageSquare, bg: 'rgba(200,155,60,0.15)', fg: Colors.gold.dark },
  social: { Icon: Heart, bg: 'rgba(184,92,42,0.12)', fg: Colors.terracotta.primary },
  logistics: { Icon: Package, bg: Colors.cream.subtle, fg: Colors.inkSoft },
  alert: { Icon: AlertTriangle, bg: 'rgba(168,58,58,0.12)', fg: Colors.error },
};

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
        <ActivityIndicator size="large" color={Colors.green.primary} />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.green.primary} style={{ margin: 16 }} /> : null}
        ListEmptyComponent={
          <EmptyState
            icon={<Bell size={28} color={Colors.text.muted} strokeWidth={1.5} />}
            title="No notifications yet"
          />
        }
        renderItem={({ item }) => {
          const category = CATEGORY_BY_TYPE[item.type] ?? 'logistics';
          const meta = CATEGORY_META[category];
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => !item.readAt && markRead(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                <meta.Icon size={17} color={meta.fg} strokeWidth={2} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  <Text style={styles.cardTitleBold}>{item.title}</Text>{'  '}{item.body}
                </Text>
                <Text style={styles.cardTime}>
                  {new Date(item.createdAt).toLocaleDateString('en-ET', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
              {!item.readAt && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cream.background },
  markAll: { fontFamily: FontFamily.interSemibold, fontSize: FontSize.sm, color: Colors.green.primary },
  list: { paddingHorizontal: Spacing[4] },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontFamily: FontFamily.interRegular, fontSize: 12.5, color: Colors.ink, lineHeight: 18 },
  cardTitleBold: { fontFamily: FontFamily.interBold },
  cardTime: { fontFamily: FontFamily.interRegular, fontSize: 10.5, color: Colors.inkSoft, marginTop: 3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.terracotta.primary, marginTop: 6 },
});
