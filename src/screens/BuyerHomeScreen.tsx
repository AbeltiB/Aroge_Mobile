import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../lib/colors';
import { api } from '../lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing, Category } from '@arogenpm/sdk';
import { useAppState } from '../context/AppContext';

interface ListingsPage { items: (Listing & { category?: Category; photos?: any[] })[]; total: number }

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor',
};

export default function BuyerHomeScreen() {
  const router = useRouter();
  const { unreadCount } = useAppState();
  const [listings, setListings] = useState<ListingsPage['items']>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  async function load(cat = selectedCat, q = '') {
    const path = q
      ? `/search?q=${encodeURIComponent(q)}${cat ? `&categoryId=${cat}` : ''}`
      : `/listings?status=ACTIVE${cat ? `&categoryId=${cat}` : ''}&limit=20`;
    const res = await api.get<ListingsPage>(path);
    if (res.success) setListings(res.data.items ?? []);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    api.get<Category[]>('/categories').then((res) => {
      if (res.success) setCategories(res.data);
    });
    load();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    load(selectedCat, search);
  }

  function selectCategory(id: string) {
    const next = id === selectedCat ? '' : id;
    setSelectedCat(next);
    load(next, search);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Aroge</Text>
          <Text style={styles.headerSub}>አሮጌ · Pre-Loved Marketplace</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/notifications' as any)} style={styles.iconBtn}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchIcon}
            onPress={() => router.push('/(app)/(tabs)/search' as any)}
          >
            <Text style={{ fontSize: 20 }}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search listings…"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(selectedCat, search)}
          returnKeyType="search"
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); load(selectedCat, ''); }}>
            <Text style={{ color: colors.textMuted, fontSize: 14, paddingRight: 12 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <FlatList
        horizontal
        data={[{ id: '', nameEn: 'All', nameAm: 'ሁሉም', slug: 'all', iconKey: null }, ...categories]}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.catChip, selectedCat === cat.id && styles.catChipActive]}
            onPress={() => selectCategory(cat.id)}
          >
            <Text style={[styles.catText, selectedCat === cat.id && styles.catTextActive]}>
              {cat.nameEn}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Listings grid */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🛍</Text>
              <Text style={styles.emptyText}>No listings found</Text>
              <Text style={styles.emptyHint}>Try a different category or search term</Text>
            </View>
          }
          renderItem={({ item: listing }) => {
            const photo = listing.photos?.find((p) => p.isPrimary) ?? listing.photos?.[0];
            return (
              <TouchableOpacity
                style={styles.listingCard}
                onPress={() => router.push(`/listing/${listing.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.listingPhoto}>
                  {photo ? (
                    <View style={[styles.listingPhoto, { backgroundColor: colors.brandTint }]}>
                      <Text style={{ fontSize: 32, textAlign: 'center', lineHeight: 100 }}>📦</Text>
                    </View>
                  ) : (
                    <View style={[styles.listingPhoto, { backgroundColor: colors.brandTint, justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ fontSize: 32 }}>📦</Text>
                    </View>
                  )}
                  {listing.negotiable && (
                    <View style={styles.negotiableBadge}>
                      <Text style={styles.negotiableBadgeText}>Offer</Text>
                    </View>
                  )}
                </View>
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
                  <Text style={styles.listingPrice}>{formatETB(listing.price)}</Text>
                  <View style={styles.listingMeta}>
                    <Text style={styles.listingCondition}>{CONDITION_LABELS[listing.condition] ?? listing.condition}</Text>
                    {listing.city && <Text style={styles.listingCity}>{listing.city}</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.brand,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.onBrand, letterSpacing: -0.5 },
  headerSub: { fontSize: 11, color: 'rgba(243,239,231,0.6)', marginTop: 1 },
  searchIcon: { padding: 6 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginVertical: 8,
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border,
  },
  searchInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary,
  },
  catList: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  catText: { fontSize: 13, fontWeight: '500', color: colors.textBody },
  catTextActive: { color: colors.onBrand },
  grid: { padding: 12, gap: 10 },
  listingCard: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  listingPhoto: { width: '100%', height: 100, position: 'relative' },
  negotiableBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: colors.value, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  negotiableBadgeText: { fontSize: 10, fontWeight: '700', color: colors.valueText },
  listingInfo: { padding: 10, gap: 3 },
  listingTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, lineHeight: 17 },
  listingPrice: { fontSize: 15, fontWeight: '800', color: colors.value, marginTop: 1 },
  listingMeta: { flexDirection: 'row', gap: 6, marginTop: 2 },
  listingCondition: {
    fontSize: 10, color: colors.brand, fontWeight: '600',
    backgroundColor: colors.brandTint, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  listingCity: { fontSize: 10, color: colors.textMuted },
  empty: { alignItems: 'center', marginTop: 60, gap: 6 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  emptyHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  iconBtn: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#B85C2A', borderRadius: 9,
    minWidth: 18, height: 18, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#ffffff' },
});
