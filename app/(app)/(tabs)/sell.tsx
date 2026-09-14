import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Plus, Store, TrendingUp, ShieldCheck, Wallet } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../../src/constants';
import { api } from '../../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing } from '@arogenpm/sdk';
import { useAppState } from '../../../src/context/AppContext';
import { RemoteImage, Badge, Button, Chip, EmptyState, SkeletonRow, IconButton } from '../../../src/components/ui';

const TIPS = [
  { Icon: Camera, text: 'Clear photos sell 3× faster' },
  { Icon: TrendingUp, text: 'Enable negotiable pricing for more offers' },
  { Icon: ShieldCheck, text: 'Funds are held in escrow until delivery is confirmed' },
  { Icon: Wallet, text: 'Get paid via Telebirr & CBE Birr bank transfer' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Live', DRAFT: 'Draft', RESERVED: 'Reserved', SOLD: 'Sold', ARCHIVED: 'Archived',
};

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
              <Icon size={15} color={Colors.green.primary} strokeWidth={2} />
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
          <Text style={styles.headerTitle}>My Shop</Text>
          <Text style={styles.headerSub}>Manage everything you're selling</Text>
        </View>
        <IconButton tone="plain" size="lg" onPress={() => router.push('/listing/create')} style={styles.newBtn}>
          <Plus size={20} color="#ffffff" strokeWidth={2.5} />
        </IconButton>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.terracotta.primary} />}
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
                  <Badge label={STATUS_LABELS[item.status] ?? item.status} tone={STATUS_TONE[item.status] ?? 'neutral'} />
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
  root: { flex: 1, backgroundColor: Colors.cream.background },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontFamily: FontFamily.display, fontSize: FontSize.lg, color: Colors.ink },
  headerSub: { fontFamily: FontFamily.interRegular, fontSize: 12.5, color: Colors.inkSoft, marginTop: 3 },
  newBtn: { backgroundColor: Colors.terracotta.primary },
  body: { flex: 1, padding: Spacing[4], gap: Spacing[4] },
  promoCard: {
    backgroundColor: Colors.cream.surface, borderRadius: BorderRadius.xl, padding: Spacing[6], gap: Spacing[3],
  },
  promoIcon: {
    width: 56, height: 56, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.terracotta.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  cardTitle: { fontFamily: FontFamily.displaySemibold, fontSize: 18, color: Colors.ink },
  cardBody: { fontFamily: FontFamily.interRegular, fontSize: 13, color: Colors.inkSoft, lineHeight: 18, marginBottom: Spacing[2] },
  tipCard: {
    backgroundColor: Colors.green.tint, borderRadius: BorderRadius.xl, padding: Spacing[4], gap: Spacing[3],
  },
  tipTitle: { fontFamily: FontFamily.interBold, fontSize: 14, color: Colors.green.dark, marginBottom: 2 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  tip: { flex: 1, fontFamily: FontFamily.interRegular, fontSize: 13, color: Colors.inkSoft, lineHeight: 18 },
  filterRow: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], gap: 8 },
  list: { padding: Spacing[3], gap: 8 },
  row: {
    backgroundColor: Colors.cream.surface, borderRadius: BorderRadius.lg, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.line, marginBottom: 8,
  },
  thumb: { width: 52, height: 52 },
  rowTitle: { fontFamily: FontFamily.interSemibold, fontSize: 14, color: Colors.ink },
  rowMeta: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.inkSoft, marginTop: 2 },
  rowPrice: { fontFamily: FontFamily.display, fontSize: 13, color: Colors.ink },
});
