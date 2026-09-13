import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Handshake } from 'lucide-react-native';
import { colors } from '../../src/lib/colors';
import { Colors, Spacing } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import { ScreenHeader, Card, Button, Input, EmptyState, SkeletonRow, BottomSheet } from '../../src/components/ui';

interface OfferItem {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  buyer: { id: string; name: string; avatarUrl?: string | null };
  listing: { id: string; title: string; price: number };
}

export default function SellerOffersScreen() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [counterTarget, setCounterTarget] = useState<OfferItem | null>(null);
  const [counterAmount, setCounterAmount] = useState('');

  const load = useCallback(async () => {
    const res = await api.get<OfferItem[]>('/offers/mine');
    if (res.success) setOffers(res.data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function act(offer: OfferItem, action: 'ACCEPT' | 'REJECT' | 'COUNTER', amount?: number) {
    setBusyId(offer.id);
    const res = await api.patch<any>(`/offers/${offer.id}`, { action, amount });
    setBusyId(null);
    if (!res.success) {
      Alert.alert('Error', (res as any).message ?? 'Could not update offer');
      return;
    }
    if (action === 'ACCEPT') {
      Alert.alert('Offer Accepted', 'The buyer can now check out at the agreed price.');
    }
    setOffers((prev) => prev.filter((o) => o.id !== offer.id));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title="Offers" subtitle="Pending offers on your listings" tone="action" bordered />

      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={<Handshake size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title="No pending offers"
              subtitle="Offers buyers make on your listings show up here"
            />
          }
          renderItem={({ item }) => {
            const busy = busyId === item.id;
            return (
              <Card style={styles.card}>
                <TouchableOpacity onPress={() => router.push(`/listing/${item.listing.id}`)}>
                  <Text style={styles.listingTitle} numberOfLines={1}>{item.listing.title}</Text>
                  <Text style={styles.listingPrice}>Listed at {formatETB(item.listing.price)}</Text>
                </TouchableOpacity>

                <View style={styles.offerRow}>
                  <Text style={styles.buyerName}>{item.buyer.name}</Text>
                  <Text style={styles.offerAmount}>offered {formatETB(item.amount)}</Text>
                </View>

                <View style={styles.actions}>
                  <View style={{ flex: 1 }}>
                    <Button label="Reject" variant="danger" size="sm" disabled={busy} onPress={() => act(item, 'REJECT')} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Counter"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onPress={() => { setCounterTarget(item); setCounterAmount(String(item.amount)); }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button label="Accept" variant="primary" size="sm" loading={busy} onPress={() => act(item, 'ACCEPT')} />
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}

      <BottomSheet visible={!!counterTarget} onClose={() => setCounterTarget(null)} title="Counter Offer">
        {counterTarget && (
          <Text style={styles.modalSub}>
            {counterTarget.buyer.name} offered {formatETB(counterTarget.amount)} on &quot;{counterTarget.listing.title}&quot;
          </Text>
        )}
        <View style={{ marginTop: Spacing[3], marginBottom: Spacing[5] }}>
          <Input
            placeholder="Your counter amount (ETB)"
            keyboardType="numeric"
            value={counterAmount}
            onChangeText={setCounterAmount}
            autoFocus
          />
        </View>
        <Button
          label="Send Counter"
          variant="primary"
          disabled={!counterAmount}
          onPress={async () => {
            const target = counterTarget!;
            const amount = Number(counterAmount);
            setCounterTarget(null);
            await act(target, 'COUNTER', amount);
          }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing[3], gap: 10 },
  card: { gap: 8, marginBottom: 10 },
  listingTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  listingPrice: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  offerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  buyerName: { fontSize: 13, fontWeight: '600', color: colors.brand },
  offerAmount: { fontSize: 15, fontWeight: '800', color: colors.value },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  modalSub: { fontSize: 13, color: colors.textMuted },
});
