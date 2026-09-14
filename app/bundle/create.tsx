import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, Gift } from 'lucide-react-native';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing } from '@arogenpm/sdk';
import { ScreenHeader, Input, Button, EmptyState } from '../../src/components/ui';
import { haptics } from '../../src/lib/haptics';

export default function CreateBundleScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<{ items: Listing[] }>('/listings/mine?status=ACTIVE&limit=50').then((res) => {
      if (res.success) setListings(res.data.items ?? []);
      setLoading(false);
    });
  }, []);

  const selectedTotal = listings
    .filter((l) => selected.has(l.id))
    .reduce((sum, l) => sum + l.price, 0);

  function toggle(id: string) {
    haptics.select();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    if (selected.size < 2) {
      Alert.alert('Pick at least 2 items', 'A bundle needs 2 or more listings.');
      return;
    }
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      Alert.alert('Enter a price', 'Set a combined price for the bundle.');
      return;
    }

    setSubmitting(true);
    const res = await api.post<{ id: string }>('/bundles', {
      listingIds: Array.from(selected),
      price: priceNum,
    });
    setSubmitting(false);

    if (!res.success) {
      Alert.alert('Error', (res as any).message ?? 'Could not create bundle');
      return;
    }
    router.replace(`/bundle/${res.data.id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="New Bundle" tone="surface" bordered />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.green.primary} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={<Gift size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title="Not enough listings"
              subtitle="You need at least 2 active listings to make a bundle"
            />
          }
          ListHeaderComponent={
            <Text style={styles.hint}>Select 2 or more of your active listings to bundle together.</Text>
          }
          renderItem={({ item }) => {
            const isSelected = selected.has(item.id);
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
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          {selected.size} item{selected.size === 1 ? '' : 's'} selected
          {selected.size > 0 ? ` · Individually: ${formatETB(selectedTotal)}` : ''}
        </Text>
        <Input
          placeholder="Combined bundle price (ETB)"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        <Button label="Create Bundle" variant="primary" loading={submitting} onPress={handleCreate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing[3], gap: 8, paddingBottom: 200 },
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
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.cream.surface, borderTopWidth: 1, borderTopColor: Colors.line,
    padding: 16, gap: 10,
  },
  footerHint: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft, textAlign: 'center' },
});
