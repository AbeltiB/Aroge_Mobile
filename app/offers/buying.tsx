import { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Handshake } from 'lucide-react-native';
import { Colors, FontFamily, Spacing } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import { ScreenHeader, Card, Badge, Button, Input, EmptyState, SkeletonRow, BottomSheet, PriceText, type BadgeTone } from '../../src/components/ui';

interface OfferRow {
  id: string;
  amount: number;
  status: string;
  parentOfferId: string | null;
  createdAt: string;
  listing: { id: string; title: string; price: number; sellerId: string };
}

const STATUS_META: Record<string, { tone: BadgeTone; label: string }> = {
  PENDING: { tone: 'warning', label: 'Awaiting seller' },
  ACCEPTED: { tone: 'success', label: 'Accepted' },
  REJECTED: { tone: 'error', label: 'Rejected' },
  COUNTERED: { tone: 'warning', label: 'Countered' },
  EXPIRED: { tone: 'neutral', label: 'Expired' },
};

export default function BuyingOffersScreen() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [counterTarget, setCounterTarget] = useState<OfferRow | null>(null);
  const [counterAmount, setCounterAmount] = useState('');

  const load = useCallback(async () => {
    const res = await api.get<OfferRow[]>('/offers/buying');
    if (res.success) setOffers(res.data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Collapse each negotiation chain (linked by parentOfferId) into whichever
  // offer is currently the "tip" — the one nothing else counters.
  const threads = useMemo(() => {
    const parentIds = new Set(offers.filter((o) => o.parentOfferId).map((o) => o.parentOfferId));
    return offers.filter((o) => !parentIds.has(o.id));
  }, [offers]);

  async function act(offer: OfferRow, action: 'ACCEPT' | 'REJECT' | 'COUNTER', amount?: number) {
    setBusyId(offer.id);
    const res = await api.patch<any>(`/offers/${offer.id}`, { action, amount });
    setBusyId(null);
    if (!res.success) {
      Alert.alert('Error', (res as any).message ?? 'Could not update offer');
      return;
    }
    if (action === 'ACCEPT') {
      Alert.alert('Offer Accepted', 'You can now check out at the agreed price.', [
        { text: 'Later', style: 'cancel' },
        { text: 'Checkout', onPress: () => router.push(`/checkout/${offer.listing.id}?offerId=${offer.id}&offerAmount=${offer.amount}`) },
      ]);
    }
    load();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="My Offers" tone="surface" bordered />

      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={<Handshake size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title="No offers yet"
              subtitle="You haven't made any offers yet"
            />
          }
          renderItem={({ item }) => {
            const meta = STATUS_META[item.status] ?? STATUS_META.EXPIRED;
            const busy = busyId === item.id;
            const isCounteredToBuyer = item.status === 'PENDING' && item.parentOfferId !== null;
            return (
              <Card style={styles.card}>
                <TouchableOpacity onPress={() => router.push(`/listing/${item.listing.id}`)}>
                  <Text style={styles.listingTitle} numberOfLines={1}>{item.listing.title}</Text>
                </TouchableOpacity>

                <View style={styles.offerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerLabel}>{isCounteredToBuyer ? 'Seller countered' : 'Your offer'}</Text>
                    <PriceText amount={item.amount} originalAmount={item.listing.price} size="md" />
                  </View>
                  <Badge label={meta.label} tone={meta.tone} />
                </View>

                {isCounteredToBuyer && (
                  <View style={styles.actions}>
                    <View style={{ flex: 1 }}>
                      <Button label="Decline" variant="danger" size="sm" disabled={busy} onPress={() => act(item, 'REJECT')} />
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
                )}

                {item.status === 'ACCEPTED' && (
                  <Button
                    label="Proceed to Checkout"
                    variant="primary"
                    onPress={() => router.push(`/checkout/${item.listing.id}?offerId=${item.id}&offerAmount=${item.amount}`)}
                  />
                )}
              </Card>
            );
          }}
        />
      )}

      <BottomSheet visible={!!counterTarget} onClose={() => setCounterTarget(null)} title="Counter Offer">
        {counterTarget && (
          <Text style={styles.modalSub}>
            Seller countered with {formatETB(counterTarget.amount)} on &quot;{counterTarget.listing.title}&quot;
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
  listingTitle: { fontFamily: FontFamily.interBold, fontSize: 14, color: Colors.ink },
  offerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  offerLabel: { fontFamily: FontFamily.interRegular, fontSize: 11.5, color: Colors.inkSoft, marginBottom: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  modalSub: { fontFamily: FontFamily.interRegular, fontSize: 13, color: Colors.inkSoft },
});
