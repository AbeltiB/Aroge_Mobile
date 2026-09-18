import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Share2, Check, X } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../src/constants';
import { api } from '../../src/lib/api';
import type { LiveSession, LiveItem, Claim } from '@arogenpm/sdk';
import { ScreenHeader, Card, Badge, Button, Input, Chip } from '../../src/components/ui';
import { haptics } from '../../src/lib/haptics';

type QueueResponse = {
  claimed: Claim[];
  waitlisted: Claim[];
  converted: Claim[];
  expired: Claim[];
  cancelled: Claim[];
};

const POLL_MS = 6000;

export default function LiveSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [items, setItems] = useState<(LiveItem & { listing: { id: string; title: string; price: number } })[]>([]);
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const [sessionRes, itemsRes, queueRes] = await Promise.all([
      api.get<LiveSession>(`/live-sessions/${id}`),
      api.get<typeof items>(`/live-sessions/${id}/items`),
      api.get<QueueResponse>(`/live-sessions/${id}/queue`),
    ]);
    if (sessionRes.success) setSession(sessionRes.data);
    if (itemsRes.success) setItems(itemsRes.data);
    if (queueRes.success) setQueue(queueRes.data);
  }, [id]);

  useFocusEffect(useCallback(() => {
    load();
    pollRef.current = setInterval(load, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]));

  async function toggleReveal(item: LiveItem) {
    haptics.select();
    const res = await api.patch(`/live-sessions/${id}/items/${item.id}/reveal`, {});
    if (res.success) load();
  }

  async function handleClaim() {
    if (!code.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Enter both the item code and the buyer\'s phone number.');
      return;
    }
    setSubmitting(true);
    const res = await api.post<Claim>('/claims', { liveSessionId: id, code: code.trim(), customerPhone: phone.trim() });
    setSubmitting(false);
    if (!res.success) {
      Alert.alert('Could not create claim', (res as any).message ?? 'Try again');
      return;
    }
    haptics.success();
    setCode('');
    setPhone('');
    load();
  }

  async function handleShareLink(claim: Claim) {
    setActingId(claim.id);
    const res = await api.post<{ deepLink: string }>('/auth/telegram/bot/start', { intent: 'user', claimId: claim.id });
    setActingId(null);
    if (!res.success) {
      Alert.alert('Error', (res as any).message ?? 'Could not generate a confirmation link');
      return;
    }
    await Share.share({
      message: `Confirm your Aroge order — tap to log in and complete it: ${res.data.deepLink}`,
    });
  }

  async function handleConvert(claim: Claim) {
    setActingId(claim.id);
    const res = await api.post(`/claims/${claim.id}/convert`, {});
    setActingId(null);
    if (!res.success) {
      Alert.alert('Could not convert', (res as any).message ?? 'Try again');
      return;
    }
    load();
  }

  async function handleMarkPaid(claim: Claim) {
    setActingId(claim.id);
    const res = await api.post(`/claims/${claim.id}/mark-paid`, {});
    setActingId(null);
    if (!res.success) {
      Alert.alert('Could not mark paid', (res as any).message ?? 'Try again');
      return;
    }
    load();
  }

  async function handleCancel(claim: Claim) {
    setActingId(claim.id);
    const res = await api.post(`/claims/${claim.id}/cancel`, {});
    setActingId(null);
    if (!res.success) {
      Alert.alert('Error', (res as any).message ?? 'Try again');
      return;
    }
    load();
  }

  async function handleEndSession() {
    Alert.alert('End this live?', 'You can still process outstanding claims and payments after ending it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Live', style: 'destructive', onPress: async () => {
          const res = await api.patch(`/live-sessions/${id}/status`, { status: 'ENDED' });
          if (res.success) router.replace(`/live/${id}/summary`);
        },
      },
    ]);
  }

  if (!session) {
    return <SafeAreaView style={styles.root}><ScreenHeader title="Live Session" tone="surface" bordered /></SafeAreaView>;
  }

  const activeClaims = [...(queue?.claimed ?? []), ...(queue?.waitlisted ?? [])];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScreenHeader
        title="Live Session"
        tone="surface"
        bordered
        rightActions={
          session.status !== 'ENDED' && session.status !== 'RECONCILED' ? (
            <TouchableOpacity onPress={handleEndSession}><Text style={styles.endLink}>End</Text></TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.itemChips}>
          {items.map((item) => (
            <Chip
              key={item.id}
              label={`${item.code} · ${item.listing.title}`}
              selected={item.revealed}
              onPress={() => toggleReveal(item)}
              tone="action"
            />
          ))}
        </View>
        {items.length === 0 && <Text style={styles.hint}>No items tagged yet.</Text>}

        <Card style={styles.claimCard}>
          <Text style={styles.sectionTitle}>New Claim</Text>
          <View style={styles.claimRow}>
            <Input placeholder="Code (e.g. A1)" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" style={styles.codeField} />
            <Input placeholder="09XXXXXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.phoneField} />
          </View>
          <Button label="Claim" variant="primary" loading={submitting} onPress={handleClaim} />
        </Card>

        <Text style={styles.sectionTitle}>Queue ({activeClaims.length})</Text>
        {activeClaims.length === 0 && <Text style={styles.hint}>No claims yet — they'll show up here as buyers claim items.</Text>}
        {activeClaims.map((claim) => {
          const item = items.find((i) => i.id === claim.liveItemId);
          const isWaitlisted = claim.status === 'WAITLISTED';
          const busy = actingId === claim.id;
          return (
            <Card key={claim.id} style={styles.claimRowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.claimItemTitle}>
                  {item?.code ?? '?'} — {item?.listing.title ?? 'Unknown item'}
                </Text>
                <Text style={styles.claimMeta}>{claim.customerPhone}</Text>
                {isWaitlisted && <Badge label={`Waitlist #${claim.waitlistPosition}`} tone="warning" />}
                {!isWaitlisted && !claim.buyerId && <Badge label="Awaiting buyer confirmation" tone="warning" />}
                {!isWaitlisted && claim.buyerId && <Badge label="Ready to convert" tone="success" />}
              </View>
              <View style={styles.claimActions}>
                {!isWaitlisted && !claim.buyerId && (
                  <TouchableOpacity style={styles.iconAction} onPress={() => handleShareLink(claim)} disabled={busy}>
                    <Share2 size={18} color={Colors.terracotta.primary} />
                  </TouchableOpacity>
                )}
                {!isWaitlisted && claim.buyerId && (
                  <TouchableOpacity style={styles.iconAction} onPress={() => handleConvert(claim)} disabled={busy}>
                    <Check size={18} color={Colors.green.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.iconAction} onPress={() => handleCancel(claim)} disabled={busy}>
                  <X size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}

        {(queue?.converted?.length ?? 0) > 0 && (
          <>
            <Text style={styles.sectionTitle}>Converted ({queue!.converted.length})</Text>
            {queue!.converted.map((claim) => {
              const item = items.find((i) => i.id === claim.liveItemId);
              const busy = actingId === claim.id;
              return (
                <Card key={claim.id} style={styles.claimRowCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.claimItemTitle}>{item?.code ?? '?'} — {item?.listing.title ?? 'Unknown item'}</Text>
                    <Text style={styles.claimMeta}>{claim.customerPhone}</Text>
                  </View>
                  <Button label="Mark Paid" size="sm" variant="secondary" loading={busy} onPress={() => handleMarkPaid(claim)} />
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background },
  body: { padding: Spacing[3], gap: 10, paddingBottom: 60 },
  sectionTitle: { fontFamily: FontFamily.interBold, fontSize: 13, color: Colors.ink, marginTop: 8 },
  hint: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft },
  itemChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  claimCard: { padding: 14, gap: 10 },
  claimRow: { flexDirection: 'row', gap: 8 },
  codeField: { flex: 1 },
  phoneField: { flex: 2 },
  claimRowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
  },
  claimItemTitle: { fontFamily: FontFamily.interSemibold, fontSize: 13, color: Colors.ink },
  claimMeta: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.inkSoft, marginTop: 2, marginBottom: 4 },
  claimActions: { flexDirection: 'row', gap: 6 },
  iconAction: {
    width: 34, height: 34, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.cream.subtle,
  },
  endLink: { fontFamily: FontFamily.interSemibold, fontSize: 13, color: Colors.error },
});
