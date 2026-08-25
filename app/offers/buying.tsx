import { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import { formatETB } from 'aroge-sdk';

interface OfferRow {
  id: string;
  amount: number;
  status: string;
  parentOfferId: string | null;
  createdAt: string;
  listing: { id: string; title: string; price: number; sellerId: string };
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: '#faeeda', color: '#3d2a10', label: 'Awaiting seller' },
  ACCEPTED: { bg: '#e6f0eb', color: '#1f7a5a', label: 'Accepted' },
  REJECTED: { bg: 'rgba(184,92,42,0.12)', color: '#B85C2A', label: 'Rejected' },
  COUNTERED: { bg: '#faeeda', color: '#3d2a10', label: 'Countered' },
  EXPIRED: { bg: '#f5f5f5', color: '#888', label: 'Expired' },
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
        { text: 'Checkout', onPress: () => router.push(`/checkout/${offer.listing.id}?offerId=${offer.id}&offerAmount=${offer.amount}` as any) },
      ]);
    }
    load();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Offers</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          ListEmptyComponent={<Text style={styles.empty}>You haven't made any offers yet.</Text>}
          renderItem={({ item }) => {
            const sc = STATUS_STYLE[item.status] ?? STATUS_STYLE.EXPIRED;
            const busy = busyId === item.id;
            const isCounteredToBuyer = item.status === 'PENDING' && item.parentOfferId !== null;
            return (
              <View style={styles.card}>
                <TouchableOpacity onPress={() => router.push(`/listing/${item.listing.id}` as any)}>
                  <Text style={styles.listingTitle} numberOfLines={1}>{item.listing.title}</Text>
                  <Text style={styles.listingPrice}>Listed at {formatETB(item.listing.price)}</Text>
                </TouchableOpacity>

                <View style={styles.offerRow}>
                  <Text style={styles.offerAmount}>
                    {isCounteredToBuyer ? 'Seller countered: ' : 'Your offer: '}{formatETB(item.amount)}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                  </View>
                </View>

                {isCounteredToBuyer && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      disabled={busy}
                      onPress={() => act(item, 'REJECT')}
                    >
                      <Text style={styles.rejectText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.counterBtn]}
                      disabled={busy}
                      onPress={() => { setCounterTarget(item); setCounterAmount(String(item.amount)); }}
                    >
                      <Text style={styles.counterText}>Counter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      disabled={busy}
                      onPress={() => act(item, 'ACCEPT')}
                    >
                      {busy ? <ActivityIndicator size="small" color={colors.onAction} /> : <Text style={styles.acceptText}>Accept</Text>}
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === 'ACCEPTED' && (
                  <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={() => router.push(`/checkout/${item.listing.id}?offerId=${item.id}&offerAmount=${item.amount}` as any)}
                  >
                    <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      <Modal visible={!!counterTarget} transparent animationType="slide" onRequestClose={() => setCounterTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Counter Offer</Text>
            {counterTarget && (
              <Text style={styles.modalSub}>
                Seller countered with {formatETB(counterTarget.amount)} on "{counterTarget.listing.title}"
              </Text>
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="Your counter amount (ETB)"
              keyboardType="numeric"
              value={counterAmount}
              onChangeText={setCounterAmount}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setCounterTarget(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSend, !counterAmount && { opacity: 0.6 }]}
                disabled={!counterAmount}
                onPress={async () => {
                  const target = counterTarget!;
                  const amount = Number(counterAmount);
                  setCounterTarget(null);
                  await act(target, 'COUNTER', amount);
                }}
              >
                <Text style={styles.modalSendText}>Send Counter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  empty: {
    textAlign: 'center', color: colors.textMuted, marginTop: 40,
    fontSize: 14, paddingHorizontal: 32, lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14, gap: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  listingTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  listingPrice: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  offerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  offerAmount: { fontSize: 14, fontWeight: '700', color: colors.value },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  rejectBtn: { backgroundColor: 'rgba(184,92,42,0.10)' },
  rejectText: { color: colors.action, fontWeight: '600', fontSize: 13 },
  counterBtn: { backgroundColor: colors.brandTint },
  counterText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  acceptBtn: { backgroundColor: colors.action },
  acceptText: { color: colors.onAction, fontWeight: '700', fontSize: 13 },
  checkoutBtn: {
    marginTop: 4, backgroundColor: colors.brand, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center',
  },
  checkoutBtnText: { color: colors.onBrand, fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  modalSub: { fontSize: 13, color: colors.textMuted },
  modalInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
    color: colors.textPrimary, backgroundColor: colors.canvas,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.brandTint, alignItems: 'center' },
  modalCancelText: { color: colors.brand, fontWeight: '600', fontSize: 14 },
  modalSend: { flex: 1.5, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.action, alignItems: 'center' },
  modalSendText: { color: colors.onAction, fontWeight: '700', fontSize: 14 },
});
