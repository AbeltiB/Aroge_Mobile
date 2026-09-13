import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Search as SearchIcon, ShoppingBag } from 'lucide-react-native';
import { colors } from '../lib/colors';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius } from '../constants';
import { api } from '../lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing, Category } from '@arogenpm/sdk';
import { useAppState } from '../context/AppContext';
import { RemoteImage, Badge, Input, EmptyState, SkeletonListingCard, Chip } from '../components/ui';
import { haptics } from '../lib/haptics';

interface ListingsPage { items: (Listing & { category?: Category; photos?: { cloudinaryKey: string; isPrimary?: boolean }[] })[]; total: number }

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
    haptics.select();
    const next = id === selectedCat ? '' : id;
    setSelectedCat(next);
    load(next, search);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Aroge</Text>
          <Text style={styles.headerSub}>አሮጌ · Pre-Loved Marketplace</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconBtn} hitSlop={8}>
            <Bell size={22} color={colors.onBrand} strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(app)/(tabs)/search')}
            hitSlop={8}
          >
            <SearchIcon size={22} color={colors.onBrand} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Input
          placeholder="Search listings…"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(selectedCat, search)}
          returnKeyType="search"
          clearable
          leftElement={<SearchIcon size={17} color={Colors.text.muted} />}
        />
      </View>

      {/* Category chips */}
      <FlatList
        horizontal
        data={[{ id: '', nameEn: 'All', nameAm: 'ሁሉም', slug: 'all', iconKey: null } as unknown as Category, ...categories]}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        renderItem={({ item: cat }) => (
          <Chip label={cat.nameEn} selected={selectedCat === cat.id} onPress={() => selectCategory(cat.id)} />
        )}
      />

      {/* Listings grid */}
      {loading ? (
        <View style={[styles.grid, styles.skeletonRow]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.skeletonCol}>
              <SkeletonListingCard />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          ListEmptyComponent={
            <EmptyState
              icon={<ShoppingBag size={30} color={Colors.text.muted} strokeWidth={1.5} />}
              title="No listings found"
              subtitle="Try a different category or search term"
            />
          }
          renderItem={({ item: listing }) => {
            const photo = listing.photos?.find((p) => p.isPrimary) ?? listing.photos?.[0];
            return (
              <TouchableOpacity
                style={styles.listingCard}
                onPress={() => router.push(`/listing/${listing.id}`)}
                activeOpacity={0.9}
              >
                <View style={styles.listingPhoto}>
                  <RemoteImage photoKey={photo?.cloudinaryKey} style={StyleSheet.absoluteFill} />
                  {listing.negotiable && (
                    <Badge label="Offer" tone="gold" style={styles.negotiableBadge} />
                  )}
                </View>
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
                  <Text style={styles.listingPrice}>{formatETB(listing.price)}</Text>
                  <View style={styles.listingMeta}>
                    <Badge label={CONDITION_LABELS[listing.condition] ?? listing.condition} tone="brand" />
                    {listing.city && <Text style={styles.listingCity} numberOfLines={1}>{listing.city}</Text>}
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

const cardShadow = {
  shadowColor: Colors.green.dark,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.brand,
  },
  headerTitle: { fontFamily: FontFamily.serif, fontSize: 22, fontWeight: '800', color: colors.onBrand, letterSpacing: -0.5 },
  headerSub: { fontSize: 11, color: 'rgba(243,239,231,0.6)', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchWrap: { paddingHorizontal: 12, paddingVertical: 8 },
  catList: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  grid: { padding: 12, gap: 10 },
  gridRow: { gap: 10 },
  skeletonRow: { flexDirection: 'row', flexWrap: 'wrap' },
  skeletonCol: { width: '48%', marginBottom: 10 },
  listingCard: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    ...cardShadow,
  },
  listingPhoto: { width: '100%', height: 130, position: 'relative', backgroundColor: Colors.cream.subtle },
  negotiableBadge: {
    position: 'absolute', top: 8, right: 8,
  },
  listingInfo: { padding: 10, gap: 3 },
  listingTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, lineHeight: 17 },
  listingPrice: { fontFamily: FontFamily.serif, fontSize: 15, fontWeight: FontWeight.bold, color: colors.value, marginTop: 1 },
  listingMeta: { flexDirection: 'row', gap: 6, marginTop: 2, alignItems: 'center' },
  listingCity: { fontSize: 10, color: colors.textMuted, flexShrink: 1 },
  iconBtn: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: Colors.terracotta.primary, borderRadius: 9,
    minWidth: 18, height: 18, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#ffffff' },
});
