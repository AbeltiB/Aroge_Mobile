import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import { formatETB } from 'aroge-sdk';
import type { Listing } from 'aroge-sdk';

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
    router.replace(`/bundle/${res.data.id}` as any);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Bundle</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 160 }}
          ListEmptyComponent={
            <Text style={styles.empty}>You need at least 2 active listings to make a bundle.</Text>
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
                  {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
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
        <TextInput
          style={styles.priceInput}
          placeholder="Combined bundle price (ETB)"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={[styles.createBtn, submitting && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={colors.onAction} size="small" />
            : <Text style={styles.createBtnText}>Create Bundle</Text>}
        </TouchableOpacity>
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
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: 4, paddingHorizontal: 2 },
  empty: {
    textAlign: 'center', color: colors.textMuted, marginTop: 40,
    fontSize: 14, paddingHorizontal: 32, lineHeight: 20,
  },
  row: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  rowSelected: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { borderColor: colors.brand, backgroundColor: colors.brand },
  checkboxMark: { color: colors.onBrand, fontSize: 13, fontWeight: '700' },
  title: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  price: { fontSize: 13, fontWeight: '700', color: colors.value, marginTop: 2 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    padding: 16, gap: 10,
  },
  footerHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  priceInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: colors.textPrimary, backgroundColor: colors.canvas,
  },
  createBtn: {
    backgroundColor: colors.action, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  createBtnText: { color: colors.onAction, fontSize: 15, fontWeight: '700' },
});
