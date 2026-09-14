import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search as SearchIcon, SlidersHorizontal, PackageSearch } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../../src/constants';
import { api } from '../../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import { ItemCondition } from '@arogenpm/sdk';
import type { Listing, Category } from '@arogenpm/sdk';
import { Input, EmptyState, SkeletonListingCard, Chip, BottomSheet, Button, ProductCard } from '../../../src/components/ui';

interface SearchResults { items: (Listing & { category?: Category; photos?: { cloudinaryKey: string; isPrimary?: boolean }[] })[]; total: number }

const CONDITIONS = Object.values(ItemCondition);
const SORTS = [
  { key: '', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
];
const SELLER_TYPES = [
  { key: '', label: 'All Sellers' },
  { key: 'individual', label: 'Individual' },
  { key: 'business', label: 'Business' },
];

interface Filters {
  condition: string;
  minPrice: string;
  maxPrice: string;
  sellerType: string;
  sort: string;
}

const EMPTY_FILTERS: Filters = { condition: '', minPrice: '', maxPrice: '', sellerType: '', sort: '' };

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [results, setResults] = useState<SearchResults['items']>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  async function runSearch(q = query, f = filters) {
    if (!q.trim() && Object.values(f).every((v) => !v)) return;
    setLoading(true);
    setSearched(true);

    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (f.condition) params.set('condition', f.condition);
    if (f.minPrice) params.set('minPrice', f.minPrice);
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
    if (f.sellerType) params.set('sellerType', f.sellerType);
    if (f.sort) params.set('sort', f.sort);

    const res = await api.get<SearchResults>(`/search?${params.toString()}`);
    if (res.success) setResults(res.data.items ?? []);
    setLoading(false);
  }

  function openFilters() {
    setDraftFilters(filters);
    setFilterModalVisible(true);
  }

  function applyFilters() {
    setFilters(draftFilters);
    setFilterModalVisible(false);
    runSearch(query, draftFilters);
  }

  function clearFilters() {
    setDraftFilters(EMPTY_FILTERS);
  }

  const sortLabel = SORTS.find((s) => s.key === filters.sort)?.label ?? 'Newest';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <Input
            placeholder="Search listings…"
            value={query}
            onChangeText={(v) => { setQuery(v); if (!v) { setResults([]); setSearched(false); } }}
            onSubmitEditing={() => runSearch()}
            returnKeyType="search"
            autoFocus
            clearable
            leftElement={<SearchIcon size={17} color={Colors.text.muted} />}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilters}>
          <SlidersHorizontal size={16} color={Colors.green.primary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={[styles.list, styles.skeletonRow]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.skeletonCol}>
              <SkeletonListingCard />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.listRow}
          ListHeaderComponent={
            searched && results.length > 0 ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>{results.length} RESULTS</Text>
                <Text style={styles.resultsSort}>Sort: {sortLabel}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={<PackageSearch size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title={searched ? 'No listings found' : 'Find something great'}
              subtitle={searched ? 'Try adjusting your search or filters' : 'Search for items, or use filters to browse'}
            />
          }
          renderItem={({ item }) => {
            const photo = item.photos?.find((p) => p.isPrimary) ?? item.photos?.[0];
            const meta = [item.condition?.replace('_', ' '), item.city].filter(Boolean).join(' · ');
            return (
              <ProductCard
                photoKey={photo?.cloudinaryKey}
                title={item.title}
                meta={meta}
                priceLabel={formatETB(item.price)}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            );
          }}
        />
      )}

      <BottomSheet visible={filterModalVisible} onClose={() => setFilterModalVisible(false)} title="Filters">
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.filterLabel}>Condition</Text>
          <View style={styles.chipRow}>
            {['', ...CONDITIONS].map((c) => (
              <Chip
                key={c || 'ANY'}
                label={c ? c.replace('_', ' ') : 'Any'}
                selected={draftFilters.condition === c}
                onPress={() => setDraftFilters((f) => ({ ...f, condition: c }))}
              />
            ))}
          </View>

          <Text style={styles.filterLabel}>Price Range (ETB)</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Min"
                keyboardType="numeric"
                value={draftFilters.minPrice}
                onChangeText={(v) => setDraftFilters((f) => ({ ...f, minPrice: v }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Max"
                keyboardType="numeric"
                value={draftFilters.maxPrice}
                onChangeText={(v) => setDraftFilters((f) => ({ ...f, maxPrice: v }))}
              />
            </View>
          </View>

          <Text style={styles.filterLabel}>Seller Type</Text>
          <View style={styles.chipRow}>
            {SELLER_TYPES.map((s) => (
              <Chip
                key={s.key || 'ANY'}
                label={s.label}
                selected={draftFilters.sellerType === s.key}
                onPress={() => setDraftFilters((f) => ({ ...f, sellerType: s.key }))}
              />
            ))}
          </View>

          <Text style={styles.filterLabel}>Sort By</Text>
          <View style={styles.chipRow}>
            {SORTS.map((s) => (
              <Chip
                key={s.key || 'DEFAULT'}
                label={s.label}
                selected={draftFilters.sort === s.key}
                onPress={() => setDraftFilters((f) => ({ ...f, sort: s.key }))}
              />
            ))}
          </View>

          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <Button label="Clear All" variant="ghost" onPress={clearFilters} />
            </View>
            <View style={{ flex: 1.4 }}>
              <Button label="Apply Filters" variant="primary" onPress={applyFilters} />
            </View>
          </View>
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 8, marginBottom: 4, gap: 8 },
  filterBtn: {
    backgroundColor: Colors.green.tint, borderRadius: BorderRadius.lg,
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  filterCount: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.terracotta.primary, borderRadius: 9,
    minWidth: 18, height: 18, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  filterCountText: { fontSize: FontSize.xs - 1, fontFamily: FontFamily.interBold, color: '#ffffff' },
  list: { padding: 12, gap: 10 },
  listRow: { gap: 10 },
  skeletonRow: { flexDirection: 'row', flexWrap: 'wrap' },
  skeletonCol: { width: '48%', marginBottom: 10 },
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing[2], width: '100%',
  },
  resultsCount: { fontFamily: FontFamily.interBold, fontSize: FontSize.xs, color: Colors.ink, letterSpacing: 0.4 },
  resultsSort: { fontFamily: FontFamily.interSemibold, fontSize: 11.5, color: Colors.green.primary },
  filterLabel: { fontFamily: FontFamily.interBold, fontSize: FontSize.sm, color: Colors.text.primary, marginTop: Spacing[4], marginBottom: Spacing[2] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: Spacing[6], marginBottom: Spacing[2] },
});
