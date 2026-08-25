import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../../src/lib/colors';
import { api } from '../../../src/lib/api';
import { formatETB } from 'aroge-sdk';
import { ItemCondition } from 'aroge-sdk';
import type { Listing, Category } from 'aroge-sdk';

interface SearchResults { items: (Listing & { category?: Category; photos?: any[] })[]; total: number }

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings…"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => runSearch()}
            returnKeyType="search"
            autoFocus
            placeholderTextColor={colors.textMuted}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Text style={{ color: colors.textMuted, fontSize: 14, paddingRight: 12 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilters}>
          <Text style={styles.filterBtnText}>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          ListEmptyComponent={
            searched ? (
              <Text style={styles.empty}>No listings found. Try adjusting your search or filters.</Text>
            ) : (
              <Text style={styles.empty}>Search for items, or use filters to browse</Text>
            )
          }
          renderItem={({ item }) => {
            const photo = item.photos?.find((p) => p.isPrimary) ?? item.photos?.[0];
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push(`/listing/${item.id}` as any)}
              >
                <View style={styles.thumb}>
                  <Text style={{ fontSize: 24 }}>📦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.price}>{formatETB(item.price)}</Text>
                  {item.city && <Text style={styles.meta}>{item.city}</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Filters</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.filterLabel}>Condition</Text>
              <View style={styles.chipRow}>
                {['', ...CONDITIONS].map((c) => (
                  <TouchableOpacity
                    key={c || 'ANY'}
                    style={[styles.chip, draftFilters.condition === c && styles.chipActive]}
                    onPress={() => setDraftFilters((f) => ({ ...f, condition: c }))}
                  >
                    <Text style={[styles.chipText, draftFilters.condition === c && styles.chipTextActive]}>
                      {c ? c.replace('_', ' ') : 'Any'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Price Range (ETB)</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.priceInput, { flex: 1 }]}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={draftFilters.minPrice}
                  onChangeText={(v) => setDraftFilters((f) => ({ ...f, minPrice: v }))}
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[styles.priceInput, { flex: 1 }]}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={draftFilters.maxPrice}
                  onChangeText={(v) => setDraftFilters((f) => ({ ...f, maxPrice: v }))}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text style={styles.filterLabel}>Seller Type</Text>
              <View style={styles.chipRow}>
                {SELLER_TYPES.map((s) => (
                  <TouchableOpacity
                    key={s.key || 'ANY'}
                    style={[styles.chip, draftFilters.sellerType === s.key && styles.chipActive]}
                    onPress={() => setDraftFilters((f) => ({ ...f, sellerType: s.key }))}
                  >
                    <Text style={[styles.chipText, draftFilters.sellerType === s.key && styles.chipTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.chipRow}>
                {SORTS.map((s) => (
                  <TouchableOpacity
                    key={s.key || 'DEFAULT'}
                    style={[styles.chip, draftFilters.sort === s.key && styles.chipActive]}
                    onPress={() => setDraftFilters((f) => ({ ...f, sort: s.key }))}
                  >
                    <Text style={[styles.chipText, draftFilters.sort === s.key && styles.chipTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={clearFilters}>
                <Text style={styles.modalCancelText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSend} onPress={applyFilters}>
                <Text style={styles.modalSendText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.brand, paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.onBrand },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginVertical: 8, gap: 8 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.textPrimary },
  filterBtn: {
    backgroundColor: colors.brandTint, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  filterBtnText: { color: colors.brand, fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14, paddingHorizontal: 32, lineHeight: 20 },
  row: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  price: { fontSize: 14, fontWeight: '800', color: colors.value, marginTop: 2 },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  filterLabel: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginTop: 12, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    backgroundColor: colors.brandTint, borderWidth: 1, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 12, color: colors.brandDeep, fontWeight: '500' },
  chipTextActive: { color: colors.onBrand },
  priceInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: colors.textPrimary, backgroundColor: colors.canvas,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.brandTint, alignItems: 'center' },
  modalCancelText: { color: colors.brand, fontWeight: '600', fontSize: 14 },
  modalSend: { flex: 1.5, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.action, alignItems: 'center' },
  modalSendText: { color: colors.onAction, fontWeight: '700', fontSize: 14 },
});
