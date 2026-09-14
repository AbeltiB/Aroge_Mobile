import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Colors, FontFamily, BorderRadius, Spacing } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing } from '@arogenpm/sdk';
import { ScreenHeader, RemoteImage, EmptyState, SkeletonRow, IconButton } from '../../src/components/ui';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="Saved Items" showBack={false} bordered />

      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={<Heart size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title="No saved items"
              subtitle="Items you save will show up here"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity style={styles.rowMain} onPress={() => router.push(`/listing/${item.id}`)}>
                <RemoteImage
                  photoKey={item.photos?.find((p: any) => p.isPrimary)?.cloudinaryKey ?? item.photos?.[0]?.cloudinaryKey}
                  style={styles.thumb}
                  rounded={BorderRadius.md}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.price}>{formatETB(item.price)}</Text>
                </View>
              </TouchableOpacity>
              <IconButton tone="plain" onPress={() => unsave(item.id)} silent>
                <Heart size={19} color={Colors.terracotta.primary} fill={Colors.terracotta.primary} />
              </IconButton>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing[3], gap: 8 },
  row: {
    backgroundColor: Colors.cream.surface, borderRadius: BorderRadius.lg, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.line,
    marginBottom: 8,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 56 },
  title: { fontFamily: FontFamily.interSemibold, fontSize: 14, color: Colors.ink },
  price: { fontFamily: FontFamily.display, fontSize: 14, color: Colors.gold.primary, marginTop: 2 },
});
