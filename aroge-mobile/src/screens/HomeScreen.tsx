import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { LogoMark } from '../componenets/ui/LogoMark';
import {
  BorderRadius,
  Colors,
  FontFamily,
  FontSize,
  FontWeight,
  Layout,
  LetterSpacing,
  LineHeight,
  Shadow,
  Spacing,
} from '../constants';

const { width: W } = Dimensions.get('window');
const CARD_WIDTH = (W - Layout.pagePadding * 2 - Spacing[3]) / 2;

// ── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  icon: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  location: string;
  badge?: 'Hot' | 'Reduced';
  emoji: string; // placeholder for image
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'electronics', label: 'Electronics', icon: '📱' },
  { id: 'fashion', label: 'Fashion', icon: '👗' },
  { id: 'furniture', label: 'Furniture', icon: '🪑' },
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { id: 'tools', label: 'Tools', icon: '🔧' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
];

const LISTINGS: Listing[] = [
  { id: '1', title: 'iPhone 13 Pro 256GB', price: 42000, condition: 'Like New', location: 'Bole', badge: 'Hot', emoji: '📱' },
  { id: '2', title: 'Samsung 4K TV 55"', price: 18500, condition: 'Good', location: 'CMC', emoji: '📺' },
  { id: '3', title: 'Leather Sofa Set', price: 9800, condition: 'Good', location: 'Kazanchis', badge: 'Reduced', emoji: '🛋️' },
  { id: '4', title: 'MacBook Air M1', price: 55000, condition: 'Like New', location: 'Sarbet', emoji: '💻' },
  { id: '5', title: 'Toyota Vitz 2016', price: 820000, condition: 'Good', location: 'Gerji', emoji: '🚗' },
  { id: '6', title: 'Dumbbell Set 20kg', price: 2400, condition: 'New', location: 'Megenagna', emoji: '🏋️' },
];

// ── Formatters ────────────────────────────────────────────────────────────────

function formatPrice(n: number): string {
  return `ETB ${n.toLocaleString()}`;
}

// ── Home Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header collapses on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const filteredListings = LISTINGS.filter((l) =>
    search.trim() === '' ? true : l.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />

      {/* ── App bar ──────────────────────────────────── */}
      <Animated.View style={[styles.appBar, { opacity: headerOpacity }]}>
        <View style={styles.appBarLeft}>
          <LogoMark size={32} color={Colors.green.primary} accentColor={Colors.gold.primary} showRing={false} />
          <Text style={styles.appBarTitle}>AROGE</Text>
        </View>

        <View style={styles.appBarRight}>
          <Pressable style={styles.iconBtn} accessibilityLabel="Notifications" hitSlop={8}>
            <Text style={styles.iconBtnText}>🔔</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} accessibilityLabel="Profile" hitSlop={8}>
            <Text style={styles.iconBtnText}>👤</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Search bar ────────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search listings…"
            placeholderTextColor={Colors.text.muted}
            style={styles.searchInput}
            returnKeyType="search"
            selectionColor={Colors.green.primary}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text style={styles.clearSearch}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Scrollable body ───────────────────────────── */}
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        {/* Hero banner */}
        {search.trim() === '' && <HeroBanner />}

        {/* Categories */}
        <CategoryRow active={activeCategory} onSelect={setActiveCategory} />

        {/* Section heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {search.trim() ? `Results for "${search}"` : 'Recent listings'}
          </Text>
          <Pressable hitSlop={8}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {/* Listing grid */}
        {filteredListings.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.grid}>
            {filteredListings.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* Bottom breathing room for FAB */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* ── FAB — post listing ───────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => { }}
        accessibilityRole="button"
        accessibilityLabel="Post a listing"
      >
        <LinearGradient
          colors={[Colors.terracotta.primary, Colors.terracotta.pressed]}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
          <Text style={styles.fabLabel}>Sell</Text>
        </LinearGradient>
      </Pressable>
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function HeroBanner() {
  return (
    <LinearGradient
      colors={[Colors.green.primary, `${Colors.green.primary}cc`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={heroBannerStyles.container}
    >
      <View style={heroBannerStyles.content}>
        <Text style={heroBannerStyles.eyebrow}>✦ FEATURED</Text>
        <Text style={heroBannerStyles.headline}>Give things{'\n'}a second story</Text>
        <Text style={heroBannerStyles.sub}>
          Thousands of listings from Addis and beyond
        </Text>
      </View>
      <Text style={heroBannerStyles.emoji}>🏪</Text>
    </LinearGradient>
  );
}

const heroBannerStyles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.pagePadding,
    marginBottom: Spacing[5],
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  content: { flex: 1, gap: Spacing[2] },
  eyebrow: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.gold.primary,
    letterSpacing: LetterSpacing.eyebrow,
  },
  headline: {
    fontFamily: FontFamily.serif,
    fontSize: FontSize.xl,
    color: Colors.text.onGreen,
    lineHeight: FontSize.xl * LineHeight.snug,
  },
  sub: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    color: `${Colors.text.onGreen}bb`,
    lineHeight: FontSize.sm * LineHeight.normal,
  },
  emoji: { fontSize: 52 },
});

interface CategoryRowProps {
  active: string;
  onSelect: (id: string) => void;
}

function CategoryRow({ active, onSelect }: CategoryRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={categoryRowStyles.container}
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat.id === active;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={[categoryRowStyles.chip, isActive && categoryRowStyles.chipActive]}
          >
            <Text style={categoryRowStyles.icon}>{cat.icon}</Text>
            <Text style={[categoryRowStyles.label, isActive && categoryRowStyles.labelActive]}>
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const categoryRowStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.pagePadding,
    gap: Spacing[2],
    paddingBottom: Spacing[4],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    backgroundColor: Colors.cream.surface,
  },
  chipActive: {
    borderColor: Colors.green.primary,
    backgroundColor: Colors.green.primary,
  },
  icon: { fontSize: 15 },
  label: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
  labelActive: {
    color: Colors.text.onGreen,
  },
});

interface ListingCardProps {
  item: Listing;
}

function ListingCard({ item }: ListingCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 20, stiffness: 300 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 20, stiffness: 300 }).start();

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => { }}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${formatPrice(item.price)}`}
    >
      <Animated.View style={[listingCardStyles.card, { transform: [{ scale }] }]}>
        {/* Image placeholder */}
        <View style={listingCardStyles.imagePlaceholder}>
          <Text style={listingCardStyles.imageEmoji}>{item.emoji}</Text>
          {item.badge && (
            <View
              style={[
                listingCardStyles.badge,
                item.badge === 'Hot' ? listingCardStyles.badgeHot : listingCardStyles.badgeReduced,
              ]}
            >
              <Text style={listingCardStyles.badgeText}>{item.badge}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={listingCardStyles.content}>
          <Text style={listingCardStyles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={listingCardStyles.price}>{formatPrice(item.price)}</Text>

          <View style={listingCardStyles.meta}>
            <View
              style={[
                listingCardStyles.conditionBadge,
                item.condition === 'New' || item.condition === 'Like New'
                  ? listingCardStyles.conditionGreen
                  : listingCardStyles.conditionAmber,
              ]}
            >
              <Text style={listingCardStyles.conditionText}>{item.condition}</Text>
            </View>
            <Text style={listingCardStyles.location}>📍 {item.location}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const listingCardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.cream.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  imagePlaceholder: {
    width: '100%',
    height: CARD_WIDTH * 0.85,
    backgroundColor: Colors.cream.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: {
    fontSize: 48,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeHot: {
    backgroundColor: Colors.terracotta.primary,
  },
  badgeReduced: {
    backgroundColor: Colors.gold.primary,
  },
  badgeText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#fff',
    letterSpacing: LetterSpacing.wide,
  },
  content: {
    padding: Spacing[3],
    gap: 4,
  },
  title: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    lineHeight: FontSize.sm * LineHeight.snug,
  },
  price: {
    fontFamily: FontFamily.serif,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gold.dark,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  conditionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  conditionGreen: {
    backgroundColor: Colors.green.tint,
  },
  conditionAmber: {
    backgroundColor: Colors.terracotta.tint,
  },
  conditionText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },
  location: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
});

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>🔍</Text>
      <Text style={emptyStyles.title}>No listings found</Text>
      <Text style={emptyStyles.sub}>Try adjusting your search or browse categories.</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing[16],
    gap: Spacing[2],
  },
  icon: { fontSize: 40 },
  title: {
    fontFamily: FontFamily.serif,
    fontSize: FontSize.lg,
    color: Colors.text.primary,
  },
  sub: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
  },
});

// ── Main styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream.background,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appBarTitle: {
    fontFamily: FontFamily.serif,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    color: Colors.green.primary,
    letterSpacing: 6,
  },
  appBarRight: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cream.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  iconBtnText: {
    fontSize: 18,
  },
  searchRow: {
    paddingHorizontal: Layout.pagePadding,
    paddingBottom: Spacing[3],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing[4],
    height: 48,
    gap: Spacing[2],
    ...Shadow.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: Colors.text.primary,
    height: '100%',
  },
  clearSearch: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  body: {
    paddingTop: Spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.pagePadding,
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontFamily: FontFamily.serif,
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    color: Colors.text.primary,
    letterSpacing: LetterSpacing.tight,
  },
  seeAll: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.green.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    paddingHorizontal: Layout.pagePadding,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: Layout.pagePadding,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    gap: 6,
  },
  fabIcon: {
    fontSize: 22,
    color: '#fff',
    fontWeight: FontWeight.bold,
    lineHeight: 26,
  },
  fabLabel: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#fff',
    letterSpacing: LetterSpacing.wide,
  },
});