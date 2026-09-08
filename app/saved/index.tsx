import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing } from '@arogenpm/sdk';

interface SavedRes { items: (Listing & { photos?: any[] })[]; total: number }

export default function SavedItemsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<SavedRes['items']>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api.get<SavedRes>('/listings/saved');
    if (res.success) setItems(res.data.items ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function unsave(id: string) {
    setItems((prev) => prev.filter((l) => l.id !== id));
    await api.delete(`/listings/${id}/save`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Items</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          ListEmptyComponent={<Text style={styles.empty}>Items you save will show up here.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }} onPress={() => router.push(`/listing/${item.id}` as any)}>
                <View style={styles.thumb}>
                  <Text style={{ fontSize: 24 }}>📦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.price}>{formatETB(item.price)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => unsave(item.id)} style={styles.unsaveBtn}>
                <Text style={{ fontSize: 18 }}>♥</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.brand, paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.onBrand },
  empty: {
    textAlign: 'center', color: colors.textMuted, marginTop: 40,
    fontSize: 14, paddingHorizontal: 32, lineHeight: 20,
  },
  row: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  thumb: {
    width: 56, height: 56, borderRadius: 10,
    backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  price: { fontSize: 14, fontWeight: '800', color: colors.value, marginTop: 2 },
  unsaveBtn: { padding: 8 },
});
