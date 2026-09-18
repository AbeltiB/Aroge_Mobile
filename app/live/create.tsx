import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, Radio } from 'lucide-react-native';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing, LiveSession } from '@arogenpm/sdk';
import { ScreenHeader, Input, Button, EmptyState } from '../../src/components/ui';
import { haptics } from '../../src/lib/haptics';

// A short, spoken-on-camera code per item for this session only — e.g. "A1",
// "A2". The permanent ARG-XXXX item code is assigned server-side the first
// time each listing enters a live session.
function suggestCode(index: number): string {
  return `A${index + 1}`;
}

export default function CreateLiveSessionScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<{ items: Listing[] }>('/listings/mine?status=ACTIVE&limit=50').then((res) => {
      if (res.success) setListings(res.data.items ?? []);
      setLoading(false);
    });
  }, []);

  function toggle(id: string) {
    haptics.select();
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const next = [...prev, id];
      setCodes((c) => (c[id] ? c : { ...c, [id]: suggestCode(next.length - 1) }));
      return next;
    });
  }

  async function handleGoLive() {
    if (selected.length === 0) {
      Alert.alert('Pick at least one item', 'Tag the items you plan to show on camera.');
      return;
    }

    setSubmitting(true);
    const sessionRes = await api.post<LiveSession>('/live-sessions', {});
    if (!sessionRes.success) {
      setSubmitting(false);
      Alert.alert('Error', (sessionRes as any).message ?? 'Could not start a live session');
      return;
    }

    for (const listingId of selected) {
      const res = await api.post(`/live-sessions/${sessionRes.data.id}/items`, {
        listingId,
        code: codes[listingId],
      });
      if (!res.success) {
        setSubmitting(false);
        Alert.alert('Error tagging an item', (res as any).message ?? 'Could not tag one of the items — you can add it again from the session screen.');
        router.replace(`/live/${sessionRes.data.id}`);
        return;
      }
    }

    setSubmitting(false);
    router.replace(`/live/${sessionRes.data.id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="New Live Session" tone="surface" bordered />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.green.primary} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={<Radio size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title="No active listings"
              subtitle="List an item first, then tag it here for your live"
            />
          }
          ListHeaderComponent={
            <Text style={styles.hint}>Tag the items you'll show on camera — buyers will type these short codes to claim.</Text>
          }
          renderItem={({ item }) => {
            const isSelected = selected.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => toggle(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                  {isSelected && <Check size={14} color={Colors.text.onGreen} strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.price}>{formatETB(item.price)}</Text>
                </View>
                {isSelected && (
                  <Input
                    value={codes[item.id] ?? ''}
                    onChangeText={(v) => setCodes((c) => ({ ...c, [item.id]: v.toUpperCase() }))}
                    autoCapitalize="characters"
                    style={styles.codeInput}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          {selected.length} item{selected.length === 1 ? '' : 's'} tagged
        </Text>
        <Button label="Go Live" variant="primary" loading={submitting} onPress={handleGoLive} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing[3], gap: 8, paddingBottom: 140 },
  hint: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft, marginBottom: 4, paddingHorizontal: 2 },
  row: {
    backgroundColor: Colors.cream.surface, borderRadius: BorderRadius.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.line,
    marginBottom: 8,
  },
  rowSelected: { borderColor: Colors.green.primary, backgroundColor: Colors.green.tint },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { borderColor: Colors.green.primary, backgroundColor: Colors.green.primary },
  title: { fontFamily: FontFamily.interSemibold, fontSize: 14, color: Colors.ink },
  price: { fontFamily: FontFamily.display, fontSize: 13, color: Colors.gold.primary, marginTop: 2 },
  codeInput: { width: 72, height: 40 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.cream.surface, borderTopWidth: 1, borderTopColor: Colors.line,
    padding: 16, gap: 10,
  },
  footerHint: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft, textAlign: 'center' },
});
