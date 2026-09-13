import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Plus, Store, TrendingUp, ShieldCheck, Wallet } from 'lucide-react-native';
import { colors } from '../../../src/lib/colors';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../../src/constants';
import { api } from '../../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing } from '@arogenpm/sdk';
import { useAppState } from '../../../src/context/AppContext';
import { RemoteImage, Badge, Button, Chip, EmptyState, SkeletonRow } from '../../../src/components/ui';

const TIPS = [
  { Icon: Camera, text: 'Clear photos sell 3× faster' },
  { Icon: TrendingUp, text: 'Enable negotiable pricing for more offers' },
  { Icon: ShieldCheck, text: 'Funds are held in escrow until delivery is confirmed' },
  { Icon: Wallet, text: 'Get paid via Telebirr & CBE Birr bank transfer' },
] as const;

const STATUS_FILTERS = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'RESERVED', label: 'Reserved' },
  { key: 'SOLD', label: 'Sold' },
  { key: 'ARCHIVED', label: 'Archived' },
];

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral' | 'info'> = {
  ACTIVE: 'success', DRAFT: 'neutral', RESERVED: 'warning', SOLD: 'info', ARCHIVED: 'neutral',
};

function PromoHub() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sell on Aroge</Text>
        <Text style={styles.headerSub}>List your pre-loved items in minutes</Text>
      </View>

      <View style={styles.body}>
        <TouchableOpacity style={styles.promoCard} onPress={() => router.push('/listing/create')} activeOpacity={0.9}>
          <View style={styles.promoIcon}>
            <Camera size={26} color="#fff" strokeWidth={1.75} />
          </View>
          <Text style={styles.cardTitle}>Create a Listing</Text>
          <Text style={styles.cardBody}>Add photos, set your price, and let buyers come to you.</Text>
          <Button label="Start Listing" variant="primary" onPress={() => router.push('/listing/create')} />
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Selling Tips</Text>
          {TIPS.map(({ Icon, text }) => (
            <View key={text} style={styles.tipRow}>
              <Icon size={15} color={colors.brand} strokeWidth={2} />
              <Text style={styles.tip}>{text}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function MyListingsHub() {
  const router = useRouter();
  const [status, setStatus] = useState('ACTIVE');
  const [listings, setListings] = useState<(Listing & { photos?: any[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (s = status) => {
    const res = await api.get<{ items: any[] }>(`/listings/mine?status=${s}&limit=50`);
    if (res.success) setListings(res.data.items ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [status]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function selectStatus(s: string) {
    setStatus(s);
    setLoading(true);
    load(s);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Listings</Text>
          <Text style={styles.headerSub}>Manage everything you're selling</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/listing/create')} activeOpacity={0.85}>
          <Plus size={16} color={colors.onAction} strokeWidth={2.5} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <Chip label={item.label} selected={status === item.key} onPress={() => selectStatus(item.key)} tone="action" />
        )}
      />

      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.action} />}
          ListEmptyComponent={
            <EmptyState
              icon={<Store size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title={`No ${status.toLowerCase()} listings`}
              subtitle="Items you list here will show up in this tab"
              actionLabel={status === 'ACTIVE' ? 'Create a Listing' : undefined}
              onAction={status === 'ACTIVE' ? () => router.push('/listing/create') : undefined}
            />
          }
          renderItem={({ item }) => {
            const photo = item.photos?.find((p: any) => p.isPrimary) ?? item.photos?.[0];
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push(`/listing/edit/${item.id}`)}
                activeOpacity={0.85}
              >
                <RemoteImage photoKey={photo?.cloudinaryKey} style={styles.thumb} rounded={BorderRadius.md} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.rowMeta}>{item.condition} · {item.city ?? '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.rowPrice}>{formatETB(item.price)}</Text>
                  <Badge label={item.status} tone={STATUS_TONE[item.status] ?? 'neutral'} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

export default function SellScreen() {
  const { sellerMode } = useAppState();
  return sellerMode ? <MyListingsHub /> : <PromoHub />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: {
    backgroundColor: colors.action,
    paddingHorizontal: 20, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontFamily: FontFamily.serif, fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.onAction },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  newBtnText: { color: colors.onAction, fontWeight: '700', fontSize: 13 },
  body: { flex: 1, padding: Spacing[4], gap: Spacing[4] },
  promoCard: {
    backgroundColor: colors.surface, borderRadius: BorderRadius.xl, padding: Spacing[6], gap: Spacing[3],
  },
  promoIcon: {
    width: 56, height: 56, borderRadius: BorderRadius.lg,
    backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  cardBody: { fontSize: 13, color: colors.textBody, lineHeight: 18, marginBottom: Spacing[2] },
  tipCard: {
    backgroundColor: colors.brandTint, borderRadius: BorderRadius.xl, padding: Spacing[4], gap: Spacing[3],
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: colors.brandDeep, marginBottom: 2 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  tip: { flex: 1, fontSize: 13, color: colors.textBody, lineHeight: 18 },
  filterRow: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], gap: 8 },
  list: { padding: Spacing[3], gap: 8 },
  row: {
    backgroundColor: colors.surface, borderRadius: BorderRadius.lg, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  thumb: { width: 52, height: 52 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  rowMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  rowPrice: { fontSize: 13, fontWeight: '700', color: colors.value },
});
