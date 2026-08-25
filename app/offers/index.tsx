import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import { formatETB } from 'aroge-sdk';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offers</Text>
        <Text style={styles.headerSub}>Pending offers on your listings</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          ListEmptyComponent={<Text style={styles.empty}>No pending offers right now.</Text>}
          renderItem={({ item }) => {
            const busy = busyId === item.id;
            return (
              <View style={styles.card}>
                <TouchableOpacity onPress={() => router.push(`/listing/${item.listing.id}` as any)}>
                  <Text style={styles.listingTitle} numberOfLines={1}>{item.listing.title}</Text>
                  <Text style={styles.listingPrice}>Listed at {formatETB(item.listing.price)}</Text>
                </TouchableOpacity>

                <View style={styles.offerRow}>
                  <Text style={styles.buyerName}>{item.buyer.name}</Text>
                  <Text style={styles.offerAmount}>offered {formatETB(item.amount)}</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    disabled={busy}
                    onPress={() => act(item, 'REJECT')}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
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
                {counterTarget.buyer.name} offered {formatETB(counterTarget.amount)} on "{counterTarget.listing.title}"
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
  header: { backgroundColor: colors.action, paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.onAction },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
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
  offerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  buyerName: { fontSize: 13, fontWeight: '600', color: colors.brand },
  offerAmount: { fontSize: 15, fontWeight: '800', color: colors.value },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  rejectBtn: { backgroundColor: 'rgba(184,92,42,0.10)' },
  rejectText: { color: colors.action, fontWeight: '600', fontSize: 13 },
  counterBtn: { backgroundColor: colors.brandTint },
  counterText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  acceptBtn: { backgroundColor: colors.action },
  acceptText: { color: colors.onAction, fontWeight: '700', fontSize: 13 },
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
