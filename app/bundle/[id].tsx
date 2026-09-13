import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gift } from 'lucide-react-native';
import { colors } from '../../src/lib/colors';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Bundle } from '@arogenpm/sdk';
import { useAppState } from '../../src/context/AppContext';
import { ScreenHeader, Card, Avatar, Button, EmptyState, RemoteImage } from '../../src/components/ui';

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

  if (loading || !bundle) {
    return (
      <View style={styles.centered}>
        {!loading && (
          <EmptyState icon={<Gift size={28} color={Colors.text.muted} strokeWidth={1.5} />} title="Bundle not found" />
        )}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title="Bundle" tone="brand" bordered />

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
            <Avatar name={bundle.seller.name} size={40} />
            <View>
              <Text style={styles.sellerName}>{bundle.seller.name}</Text>
              {bundle.seller.verified && <Text style={styles.verified}>✓ Verified</Text>}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>{items.length} Items in this Bundle</Text>
        <Card padded={false} style={styles.itemsCard}>
          {items.map((it, i) => (
            <TouchableOpacity
              key={it.listingId}
              style={[styles.itemRow, i > 0 && styles.itemRowBorder]}
              onPress={() => router.push(`/listing/${it.listingId}`)}
            >
              <RemoteImage photoKey={(it.listing as any)?.photos?.[0]?.cloudinaryKey} style={styles.itemThumb} rounded={BorderRadius.sm} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{it.listing?.title ?? 'Listing'}</Text>
                <Text style={styles.itemMeta}>{it.listing?.condition}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatETB(it.listing?.price ?? 0)}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        {isOwner ? (
          <Button
            label={bundle.status === 'ACTIVE' ? 'Cancel Bundle' : `Bundle ${bundle.status}`}
            variant="danger"
            loading={cancelling}
            disabled={cancelling || bundle.status !== 'ACTIVE'}
            onPress={handleCancel}
          />
        ) : (
          <Button
            label={bundle.status === 'ACTIVE' ? 'Buy Bundle' : 'No Longer Available'}
            variant="primary"
            disabled={bundle.status !== 'ACTIVE'}
            onPress={() => router.push(`/checkout/${bundle.id}?type=bundle`)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  priceCard: {
    backgroundColor: colors.brand, borderRadius: BorderRadius.xl, padding: 20, alignItems: 'center',
  },
  priceLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(243,239,231,0.6)', letterSpacing: 1.2, textTransform: 'uppercase' },
  priceValue: { fontFamily: FontFamily.serif, fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: colors.value, marginVertical: 4 },
  savings: { fontSize: 12, color: 'rgba(243,239,231,0.75)' },
  sellerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  sellerName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  verified: { fontSize: 11, color: colors.brand, marginTop: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.8 },
  itemsCard: { overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: Spacing[3] },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  itemThumb: { width: 36, height: 36 },
  itemTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  itemMeta: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: colors.value },
  footer: {
    padding: 16, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
});
