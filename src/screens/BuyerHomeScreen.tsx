import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Search as SearchIcon, ShoppingBag } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../constants';
import { api } from '../lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing, Category } from '@arogenpm/sdk';
import { useAppState } from '../context/AppContext';
import { Input, EmptyState, SkeletonListingCard, Chip, ProductCard } from '../components/ui';
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
      {/* App bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>አሮጌ</Text>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconBtn} hitSlop={8}>
            <Bell size={20} color={Colors.ink} strokeWidth={2} />
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
            <SearchIcon size={20} color={Colors.ink} strokeWidth={2} />
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
        data={[{ id: '', nameEn: 'For you', nameAm: 'ሁሉም', slug: 'all', iconKey: null } as unknown as Category, ...categories]}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={<ShoppingBag size={30} color={Colors.text.muted} strokeWidth={1.5} />}
              title="No listings found"
              subtitle="Try a different category or search term"
            />
          }
          renderItem={({ item: listing }) => {
            const photo = listing.photos?.find((p) => p.isPrimary) ?? listing.photos?.[0];
            const meta = [CONDITION_LABELS[listing.condition] ?? listing.condition, listing.city].filter(Boolean).join(' · ');
            return (
              <ProductCard
                photoKey={photo?.cloudinaryKey}
                title={listing.title}
                meta={meta}
                priceLabel={formatETB(listing.price)}
                badge={listing.negotiable ? { label: 'OFFER', tone: 'gold' } : undefined}
                onPress={() => router.push(`/listing/${listing.id}`)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
  },
  eyebrow: { fontFamily: FontFamily.interSemibold, fontSize: 11, color: Colors.inkSoft },
  headerTitle: { fontFamily: FontFamily.display, fontSize: 18, color: Colors.ink, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchWrap: { paddingHorizontal: 12, paddingVertical: 8 },
  catList: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  grid: { padding: 12, gap: 10 },
  gridRow: { gap: 10 },
  skeletonRow: { flexDirection: 'row', flexWrap: 'wrap' },
  skeletonCol: { width: '48%', marginBottom: 10 },
  iconBtn: {
    width: 34, height: 34, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)', position: 'relative',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.terracotta.primary, borderRadius: 9,
    minWidth: 18, height: 18, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: FontSize.xs - 1, fontFamily: FontFamily.interBold, color: '#ffffff' },
});
