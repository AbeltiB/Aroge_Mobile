import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/colors';
import { api } from '../lib/api';
import { formatETB } from 'aroge-sdk';
import type { Listing, Order, Bundle } from 'aroge-sdk';
import { useAppState } from '../context/AppContext';

interface SellerStats {
  listings: { active: number; draft: number; sold: number; reserved: number; total: number }
  orders: { pending: number; inEscrow: number; completed: number; totalEarnings: number }
  pendingOffers: number
  recentOrders: (Order & { listing?: any; buyer?: any })[]
  activeListings: (Listing & { photos?: any[] })[]
  bundles: Bundle[]
}

function StatBox({ label, value, sub, accent = colors.brand, onPress }: { label: string; value: string | number; sub?: string; accent?: string; onPress?: () => void }) {
  const content = (
    <View style={[statStyles.box, { borderTopColor: accent }]}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
      {sub && <Text style={statStyles.sub}>{sub}</Text>}
    </View>
  );
  if (!onPress) return content;
  return <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1 }}>{content}</TouchableOpacity>;
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12,
    padding: 12, borderTopWidth: 3, minWidth: 80,
  },
  value: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  label: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  sub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { sellerProfile, unreadCount } = useAppState();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Holiday mode state
  const [holidayMode, setHolidayMode] = useState(false);
  const [holidayCount, setHolidayCount] = useState(0);
  const [holidayToggling, setHolidayToggling] = useState(false);

  const loadHolidayMode = useCallback(async () => {
    const res = await api.get<{ holidayMode: boolean; holidayModeCount: number }>('/users/me/holiday-mode');
    if (res.success) {
      setHolidayMode(res.data.holidayMode);
      setHolidayCount(res.data.holidayModeCount);
    }
  }, []);

  const toggleHolidayMode = useCallback(async (value: boolean) => {
    setHolidayToggling(true);
    const res = await api.patch<{ holidayMode: boolean; holidayModeCount: number }>(
      '/users/me/holiday-mode',
      { enabled: value }
    );
    if (res.success) {
      setHolidayMode(res.data.holidayMode);
      setHolidayCount(res.data.holidayModeCount);
    }
    setHolidayToggling(false);
  }, []);

  async function load() {
    const [myListings, myOrders, myOffers, myBundles] = await Promise.all([
      api.get<any>('/listings/mine?status=ACTIVE&limit=5'),
      api.get<any>('/orders/selling?limit=5'),
      api.get<any[]>('/offers/mine'),
      api.get<Bundle[]>('/bundles/mine'),
    ]);

    const listings = myListings.success ? myListings.data.items ?? [] : [];
    const orders = myOrders.success ? myOrders.data ?? [] : [];
    const pendingOffers = myOffers.success ? myOffers.data.length : 0;
    const bundles = myBundles.success ? myBundles.data.filter((b) => b.status === 'ACTIVE') : [];

    const completedOrders = orders.filter((o: Order) => o.orderStatus === 'COMPLETED');
    const totalEarnings = completedOrders.reduce((sum: number, o: Order) => sum + o.amount, 0);

    setStats({
      listings: {
        active: myListings.success ? myListings.data.total : 0,
        draft: 0, sold: 0, reserved: 0, total: myListings.success ? myListings.data.total : 0,
      },
      orders: {
        pending: orders.filter((o: Order) => o.orderStatus === 'PENDING_PAYMENT').length,
        inEscrow: orders.filter((o: Order) => o.orderStatus === 'PAID_ESCROWED').length,
        completed: completedOrders.length,
        totalEarnings,
      },
      pendingOffers,
      recentOrders: orders.slice(0, 4),
      activeListings: listings.slice(0, 4),
      bundles,
    });
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); loadHolidayMode(); }, []);

  function onRefresh() { setRefreshing(true); load(); }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.action} size="large" />
      </SafeAreaView>
    );
  }

  const s = stats!;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Seller header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>SELLER DASHBOARD</Text>
          <Text style={styles.headerName}>{sellerProfile?.businessName ?? 'My Shop'}</Text>
          <Text style={styles.headerSub}>{sellerProfile?.city} · {sellerProfile?.businessType}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/notifications' as any)} style={styles.iconBtn}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newListingBtn}
            onPress={() => router.push('/listing/create' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.newListingText}>+ List</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.action} />}
      >
        {/* Holiday Mode card */}
        <View style={[styles.holidayCard, holidayMode && styles.holidayCardActive]}>
          <View style={styles.holidayTop}>
            <View style={styles.holidayLeft}>
              <Text style={styles.holidayIcon}>🏖️</Text>
              <View>
                <Text style={[styles.holidayTitle, holidayMode && styles.holidayTitleActive]}>
                  Holiday Mode
                </Text>
                <Text style={styles.holidaySub}>
                  {holidayMode
                    ? 'Your listings are hidden from buyers'
                    : 'Your listings are visible to buyers'}
                </Text>
              </View>
            </View>
            <Switch
              value={holidayMode}
              onValueChange={toggleHolidayMode}
              disabled={holidayToggling}
              trackColor={{ false: 'rgba(31,122,90,0.2)', true: '#c89b3c' }}
              thumbColor={holidayMode ? '#3d2a10' : '#1f7a5a'}
            />
          </View>
          {holidayCount > 0 && (
            <Text style={styles.holidayCount}>Activated {holidayCount} time{holidayCount !== 1 ? 's' : ''}</Text>
          )}
        </View>

        {/* Earnings highlight */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <Text style={styles.earningsValue}>{formatETB(s.orders.totalEarnings)}</Text>
          <Text style={styles.earningsSub}>From {s.orders.completed} completed orders</Text>
        </View>

        {/* Stats row 1: Listings */}
        <View>
          <Text style={styles.sectionTitle}>Listings</Text>
          <View style={styles.statsRow}>
            <StatBox label="Active" value={s.listings.active} accent={colors.brand} />
            <StatBox label="Reserved" value={s.listings.reserved} accent={colors.value} />
            <StatBox label="Sold" value={s.listings.sold} accent={colors.brand} />
          </View>
        </View>

        {/* Stats row 2: Orders */}
        <View>
          <Text style={styles.sectionTitle}>Orders</Text>
          <View style={styles.statsRow}>
            <StatBox label="In Escrow" value={s.orders.inEscrow} accent={colors.value} sub="Awaiting delivery" />
            <StatBox label="Pending" value={s.orders.pending} accent={s.orders.pending > 0 ? colors.action : colors.brand} />
            <StatBox
              label="Offers"
              value={s.pendingOffers}
              accent={s.pendingOffers > 0 ? colors.action : colors.brand}
              onPress={() => router.push('/offers' as any)}
            />
          </View>
        </View>

        {/* Recent orders */}
        {s.recentOrders.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <View style={styles.listCard}>
              {s.recentOrders.map((order, i) => (
                <TouchableOpacity
                  key={order.id}
                  style={[styles.orderRow, i > 0 && styles.orderRowBorder]}
                  onPress={() => router.push(`/order/${order.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderTitle} numberOfLines={1}>
                      {(order as any).listing?.title ?? 'Order'}
                    </Text>
                    <Text style={styles.orderBuyer}>
                      Buyer: {(order as any).buyer?.name ?? '—'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.orderAmount}>{formatETB(order.amount)}</Text>
                    <View style={[styles.statusBadge, getStatusStyle(order.orderStatus)]}>
                      <Text style={styles.statusText}>{formatStatus(order.orderStatus)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Active listings */}
        {s.activeListings.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Listings</Text>
              <TouchableOpacity onPress={() => router.push('/listing/create' as any)}>
                <Text style={styles.seeAll}>+ New →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.listCard}>
              {s.activeListings.map((listing, i) => (
                <TouchableOpacity
                  key={listing.id}
                  style={[styles.listingRow, i > 0 && styles.orderRowBorder]}
                  onPress={() => router.push(`/listing/edit/${listing.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.listingIcon}>
                    <Text style={{ fontSize: 18 }}>📦</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
                    <Text style={styles.listingCond}>{listing.condition} · {listing.city ?? '—'}</Text>
                  </View>
                  <Text style={styles.listingPrice}>{formatETB(listing.price)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bundles */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bundles</Text>
            <TouchableOpacity onPress={() => router.push('/bundle/create' as any)}>
              <Text style={styles.seeAll}>+ New →</Text>
            </TouchableOpacity>
          </View>
          {s.bundles.length > 0 ? (
            <View style={styles.listCard}>
              {s.bundles.map((bundle, i) => (
                <TouchableOpacity
                  key={bundle.id}
                  style={[styles.listingRow, i > 0 && styles.orderRowBorder]}
                  onPress={() => router.push(`/bundle/${bundle.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.listingIcon}>
                    <Text style={{ fontSize: 18 }}>🎁</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingTitle}>{bundle.items?.length ?? 0} items</Text>
                    <Text style={styles.listingCond}>Bundle</Text>
                  </View>
                  <Text style={styles.listingPrice}>{formatETB(bundle.price)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noBundlesText}>Group 2+ listings into a bundle with a combined price.</Text>
          )}
        </View>

        {s.listings.active === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, textAlign: 'center' }}>🏪</Text>
            <Text style={styles.emptyTitle}>Your shop is empty</Text>
            <Text style={styles.emptyDesc}>Create your first listing and start selling!</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/listing/create' as any)}
            >
              <Text style={styles.createBtnText}>Create First Listing</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()).replace('Paid Escrowed', 'In Escrow');
}

function getStatusStyle(status: string): object {
  if (status === 'PAID_ESCROWED') return { backgroundColor: '#e6f0eb' };
  if (status === 'COMPLETED') return { backgroundColor: '#e6f0eb' };
  if (status === 'DISPUTED') return { backgroundColor: 'rgba(184,92,42,0.12)' };
  if (status === 'PENDING_PAYMENT') return { backgroundColor: '#faeeda' };
  return { backgroundColor: colors.brandTint };
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.action,
    paddingHorizontal: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5 },
  headerName: { fontSize: 20, fontWeight: '800', color: colors.onAction, marginTop: 2 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  newListingBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  newListingText: { color: colors.onAction, fontWeight: '700', fontSize: 14 },
  scroll: { padding: 14, gap: 16, paddingBottom: 40 },
  earningsCard: {
    backgroundColor: colors.brand,
    borderRadius: 16, padding: 20, alignItems: 'center',
  },
  earningsLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(243,239,231,0.6)', letterSpacing: 1.2, textTransform: 'uppercase' },
  earningsValue: { fontSize: 32, fontWeight: '900', color: colors.value, marginVertical: 4 },
  earningsSub: { fontSize: 12, color: 'rgba(243,239,231,0.65)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  seeAll: { fontSize: 13, color: colors.brand, fontWeight: '600' },
  noBundlesText: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  statsRow: { flexDirection: 'row', gap: 8 },
  listCard: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden' },
  orderRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  orderRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  orderTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  orderBuyer: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  orderAmount: { fontSize: 14, fontWeight: '800', color: colors.value },
  statusBadge: { marginTop: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  statusText: { fontSize: 9, fontWeight: '700', color: colors.textPrimary },
  listingRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  listingIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center',
  },
  listingTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  listingCond: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  listingPrice: { fontSize: 13, fontWeight: '700', color: colors.value },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
  createBtn: {
    marginTop: 8, backgroundColor: colors.action,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  createBtnText: { color: colors.onAction, fontWeight: '700', fontSize: 14 },
  iconBtn: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#ffffff', borderRadius: 9,
    minWidth: 18, height: 18, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#B85C2A' },
  holidayCard: {
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, borderWidth: 1.5, borderColor: colors.border,
  },
  holidayCardActive: {
    backgroundColor: '#faeeda', borderColor: '#c89b3c',
  },
  holidayTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  holidayLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  holidayIcon: { fontSize: 22 },
  holidayTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  holidayTitleActive: { color: '#3d2a10' },
  holidaySub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  holidayCount: {
    marginTop: 8, fontSize: 11, color: '#3d2a10',
    fontWeight: '600', paddingTop: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(200,155,60,0.25)',
  },
});
