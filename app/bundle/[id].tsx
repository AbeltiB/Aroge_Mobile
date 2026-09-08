import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Bundle } from '@arogenpm/sdk';
import { useAppState } from '../../src/context/AppContext';

export default function BundleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAppState();
  const [bundle, setBundle] = useState<Bundle & { seller?: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    api.get<Bundle & { seller?: any }>(`/bundles/${id}`).then((res) => {
      if (res.success) setBundle(res.data as any);
      setLoading(false);
    });
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!bundle) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas }}>
        <Text style={{ color: colors.textMuted }}>Bundle not found</Text>
      </View>
    );
  }

  const isOwner = bundle.sellerId === user?.sub;
  const items = bundle.items ?? [];
  const individualTotal = items.reduce((sum, i) => sum + (i.listing?.price ?? 0), 0);
  const savings = individualTotal - bundle.price;

  async function handleCancel() {
    Alert.alert('Cancel Bundle', 'This will unbundle the items. They remain individually listed.', [
      { text: 'Keep Bundle', style: 'cancel' },
      {
        text: 'Cancel Bundle', style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          const res = await api.delete(`/bundles/${bundle!.id}`);
          setCancelling(false);
          if (res.success) router.back();
          else Alert.alert('Error', (res as any).message ?? 'Could not cancel bundle');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bundle</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Bundle Price</Text>
          <Text style={styles.priceValue}>{formatETB(bundle.price)}</Text>
          {savings > 0 && (
            <Text style={styles.savings}>Save {formatETB(savings)} vs. buying separately</Text>
          )}
        </View>

        {bundle.seller && (
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}><Text style={{ fontSize: 18 }}>👤</Text></View>
            <View>
              <Text style={styles.sellerName}>{bundle.seller.name}</Text>
              {bundle.seller.verified && <Text style={styles.verified}>✓ Verified</Text>}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>{items.length} Items in this Bundle</Text>
        <View style={styles.itemsCard}>
          {items.map((it, i) => (
            <TouchableOpacity
              key={it.listingId}
              style={[styles.itemRow, i > 0 && styles.itemRowBorder]}
              onPress={() => router.push(`/listing/${it.listingId}` as any)}
            >
              <View style={styles.itemThumb}><Text style={{ fontSize: 18 }}>📦</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{it.listing?.title ?? 'Listing'}</Text>
                <Text style={styles.itemMeta}>{it.listing?.condition}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatETB(it.listing?.price ?? 0)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isOwner ? (
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling || bundle.status !== 'ACTIVE'}
          >
            {cancelling
              ? <ActivityIndicator color={colors.action} size="small" />
              : <Text style={styles.cancelBtnText}>
                  {bundle.status === 'ACTIVE' ? 'Cancel Bundle' : `Bundle ${bundle.status}`}
                </Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.buyBtn, bundle.status !== 'ACTIVE' && { opacity: 0.5 }]}
            disabled={bundle.status !== 'ACTIVE'}
            onPress={() => router.push(`/checkout/${bundle.id}?type=bundle` as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.buyBtnText}>
              {bundle.status === 'ACTIVE' ? 'Buy Bundle' : 'No Longer Available'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  backText: { color: colors.onBrand, fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onBrand },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  priceCard: {
    backgroundColor: colors.brand, borderRadius: 16, padding: 20, alignItems: 'center',
  },
  priceLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(243,239,231,0.6)', letterSpacing: 1.2, textTransform: 'uppercase' },
  priceValue: { fontSize: 30, fontWeight: '900', color: colors.value, marginVertical: 4 },
  savings: { fontSize: 12, color: 'rgba(243,239,231,0.75)' },
  sellerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: colors.surface, borderRadius: 12,
  },
  sellerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.brandTint, justifyContent: 'center', alignItems: 'center',
  },
  sellerName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  verified: { fontSize: 11, color: colors.brand, marginTop: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.8 },
  itemsCard: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  itemThumb: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  itemMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: colors.value },
  footer: {
    padding: 16, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  buyBtn: {
    backgroundColor: colors.action, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  buyBtnText: { color: colors.onAction, fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    backgroundColor: 'rgba(184,92,42,0.10)', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  cancelBtnText: { color: colors.action, fontSize: 15, fontWeight: '700' },
});
