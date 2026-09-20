import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, X, CheckCircle2, Circle } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../src/constants';
import { formatETB } from '@arogenpm/sdk';
import { ScreenHeader, Card, Button, RemoteImage, EmptyState } from '../src/components/ui';
import { useCart, type CartItem } from '../src/context/CartContext';
import { haptics } from '../src/lib/haptics';

export default function CartScreen() {
  const router = useRouter();
  const { cartItems, loading, refreshCart, removeFromCart } = useCart();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removingId, setRemovingId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { refreshCart(); }, [refreshCart]));

  // Default every item to selected whenever the cart's contents change
  // (initial load, or an item gets removed) — matches how most cart UIs
  // behave: everything's included unless you deliberately uncheck it.
  const listingIds = cartItems.map((i) => i.listingId).join(',');
  useMemo(() => {
    setSelected(new Set(cartItems.map((i) => i.listingId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingIds]);

  const groups = useMemo(() => {
    const bySeller = new Map<string, { seller: CartItem['listing']['seller']; items: CartItem[] }>();
    for (const item of cartItems) {
      const sellerId = item.listing.seller?.id ?? 'unknown';
      const group = bySeller.get(sellerId);
      if (group) group.items.push(item);
      else bySeller.set(sellerId, { seller: item.listing.seller, items: [item] });
    }
    return Array.from(bySeller.values());
  }, [cartItems]);

  function toggleSelected(listingId: string) {
    haptics.select();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  }

  async function handleRemove(listingId: string) {
    setRemovingId(listingId);
    await removeFromCart(listingId);
    setRemovingId(null);
  }

  const selectedItems = cartItems.filter((i) => selected.has(i.listingId));
  const total = selectedItems.reduce((sum, i) => sum + i.listing.price, 0);

  function handleCheckout() {
    if (selectedItems.length === 0) {
      Alert.alert('Select items', 'Choose at least one item to check out.');
      return;
    }
    router.push({
      pathname: '/checkout/cart',
      params: { listingIds: JSON.stringify(selectedItems.map((i) => i.listingId)) },
    } as any);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScreenHeader title="Cart" tone="surface" bordered showBack />

      {!loading && cartItems.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={28} color={Colors.text.muted} strokeWidth={1.5} />}
          title="Your cart is empty"
          subtitle="Items you add to your cart will show up here."
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {groups.map((group) => (
            <View key={group.seller?.id ?? 'unknown'} style={styles.sellerGroup}>
              <Text style={styles.sellerName}>{group.seller?.name ?? 'Seller'}</Text>
              {group.items.map((item) => (
                <Card key={item.id} style={styles.itemCard}>
                  <TouchableOpacity onPress={() => toggleSelected(item.listingId)} hitSlop={8}>
                    {selected.has(item.listingId)
                      ? <CheckCircle2 size={22} color={Colors.green.primary} />
                      : <Circle size={22} color={Colors.line} />}
                  </TouchableOpacity>
                  <RemoteImage
                    photoKey={item.listing.photos?.find((p) => p.isPrimary)?.cloudinaryKey ?? item.listing.photos?.[0]?.cloudinaryKey}
                    style={styles.thumb}
                    rounded={BorderRadius.md}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.listing.title}</Text>
                    <Text style={styles.itemPrice}>{formatETB(item.listing.price)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(item.listingId)} disabled={removingId === item.listingId} hitSlop={8}>
                    <X size={18} color={Colors.text.muted} />
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>{selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} selected</Text>
            <Text style={styles.footerTotalAmount}>{formatETB(total)}</Text>
          </View>
          <View style={{ flex: 1.3 }}>
            <Button label="Checkout" variant="primary" onPress={handleCheckout} disabled={selectedItems.length === 0} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background },
  scroll: { padding: Spacing[4], gap: Spacing[5], paddingBottom: 40 },
  sellerGroup: { gap: Spacing[2] },
  sellerName: { fontFamily: FontFamily.interBold, fontSize: FontSize.sm, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  thumb: { width: 56, height: 56 },
  itemTitle: { fontFamily: FontFamily.interSemibold, fontSize: FontSize.sm, color: Colors.ink },
  itemPrice: { fontFamily: FontFamily.display, fontSize: FontSize.sm, color: Colors.ink, marginTop: 2 },
  footer: {
    flexDirection: 'row', gap: Spacing[3], padding: Spacing[4], alignItems: 'center',
    backgroundColor: Colors.cream.surface, borderTopWidth: 1, borderTopColor: Colors.line,
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontFamily: FontFamily.interMedium, fontSize: FontSize.xs, color: Colors.text.muted },
  footerTotalAmount: { fontFamily: FontFamily.display, fontSize: FontSize.md, color: Colors.ink, marginTop: 2 },
});
