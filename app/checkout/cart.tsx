import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Info } from 'lucide-react-native';
import { Colors, FontFamily, BorderRadius, Spacing, FontSize } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB, calculateFees } from '@arogenpm/sdk';
import type { PlatformFee, AppliedFee, BankAccount } from '@arogenpm/sdk';
import { ScreenHeader, Card, RemoteImage, Input, Button, PriceText } from '../../src/components/ui';
import { useCart } from '../../src/context/CartContext';
import { haptics } from '../../src/lib/haptics';

// Same as app/checkout/[id].tsx — Telebirr/CBE Birr gateway integration is
// on hold, bank transfer is the only real payment path for now.
type DeliveryMethod = 'MEETUP' | 'AROGE_DELIVERY';

interface DeliverySettings { isEnabled: boolean; fee: number }

interface CheckoutOrder { id: string; sellerId: string; listingId: string | null; bundleId: string | null; amount: number }
interface CheckoutFailure { sellerId: string; listingIds: string[]; reason: string }
interface CheckoutResult { orders: CheckoutOrder[]; failures: CheckoutFailure[] }

function RadioOption({ label, sub, badge, selected, onPress }: {
  label: string; sub?: string; badge?: string; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.radioRow, selected && styles.radioRowSelected]} onPress={() => { haptics.select(); onPress(); }} activeOpacity={0.7}>
      <View style={[styles.radioDot, selected && styles.radioDotSelected]}>
        {selected && <View style={styles.radioDotInner} />}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
          {badge && <Text style={styles.badgeText}>{badge}</Text>}
        </View>
        {sub && <Text style={styles.radioSub}>{sub}</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function CartCheckoutScreen() {
  const { listingIds: listingIdsParam } = useLocalSearchParams<{ listingIds: string }>();
  const router = useRouter();
  const { cartItems, refreshCart } = useCart();

  const selectedIds: string[] = listingIdsParam ? JSON.parse(listingIdsParam) : [];
  const items = cartItems.filter((i) => selectedIds.includes(i.listingId));

  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({ isEnabled: false, fee: 0 });
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('MEETUP');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<PlatformFee[]>('/fees?role=buyer'),
      api.get<DeliverySettings>('/delivery/settings'),
      api.get<BankAccount[]>('/payments/bank-accounts'),
    ]).then(([feesRes, deliveryRes, bankRes]) => {
      if (feesRes.success) setFees(feesRes.data);
      if (deliveryRes.success) setDeliverySettings(deliveryRes.data);
      if (bankRes.success) setBankAccounts(bankRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.green.primary} />
      </SafeAreaView>
    );
  }

  const itemsSubtotal = items.reduce((sum, i) => sum + i.listing.price, 0);
  const deliveryFee = deliveryMethod === 'AROGE_DELIVERY' ? deliverySettings.fee : 0;
  // Fees are computed per resulting order (one per seller group) on the
  // backend, but this preview sums as if it were one order — close enough
  // for a pre-checkout estimate; the confirmed total per order is whatever
  // each order actually gets charged.
  const appliedFees: AppliedFee[] = calculateFees(itemsSubtotal, fees);
  const serviceFee = appliedFees.reduce((s, f) => s + f.amount, 0);
  const total = itemsSubtotal + deliveryFee + serviceFee;

  async function placeOrder() {
    if (bankAccounts.length === 0) {
      Alert.alert('Checkout Unavailable', 'No payment account is configured yet. Please try again later.');
      return;
    }
    if (deliveryMethod === 'AROGE_DELIVERY' && !dropoffAddress.trim()) {
      Alert.alert('Delivery Address Needed', 'Enter where the courier should drop off your items.');
      return;
    }

    setPlacing(true);
    const body: any = {
      listingIds: selectedIds,
      deliveryMethod,
      paymentMethod: 'BANK_TRANSFER',
    };
    if (deliveryMethod === 'AROGE_DELIVERY') body.dropoffAddress = dropoffAddress.trim();

    const res = await api.post<CheckoutResult>('/cart/checkout', body);
    setPlacing(false);
    await refreshCart();

    if (!res.success) {
      Alert.alert('Error', (res as any).message ?? 'Could not check out');
      return;
    }

    const { orders, failures } = res.data;
    if (orders.length === 0) {
      Alert.alert('Checkout Failed', failures[0]?.reason ?? 'None of the selected items could be ordered.');
      return;
    }

    haptics.success();
    if (failures.length > 0) {
      Alert.alert(
        `${orders.length} order${orders.length === 1 ? '' : 's'} placed`,
        `${failures.length} item${failures.length === 1 ? '' : 's'} couldn't be ordered: ${failures.map((f) => f.reason).join('; ')}`,
        [{ text: 'OK', onPress: () => router.replace(`/order/${orders[0].id}`) }]
      );
    } else {
      router.replace(`/order/${orders[0].id}`);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="Checkout" tone="surface" bordered />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{items.length} ITEM{items.length === 1 ? '' : 'S'}</Text>
          {items.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <RemoteImage
                photoKey={item.listing.photos?.find((p) => p.isPrimary)?.cloudinaryKey ?? item.listing.photos?.[0]?.cloudinaryKey}
                style={styles.itemThumb}
                rounded={BorderRadius.md}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.listing.title}</Text>
                <Text style={styles.itemSeller}>{item.listing.seller?.name ?? 'Seller'}</Text>
              </View>
              <PriceText amount={item.listing.price} size="sm" />
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <Card padded={false} style={styles.optionGroup}>
            <RadioOption label="Bank Transfer" sub="Transfer, then verify instantly with your reference number" selected onPress={() => {}} />
          </Card>
          <Card style={styles.bankNote}>
            {bankAccounts.map((acct) => (
              <View key={acct.id} style={styles.bankRow}>
                <Text style={styles.bankName}>{acct.bankName}</Text>
                <Text style={styles.bankDetail}>{acct.accountName}</Text>
                <Text style={styles.bankDetail}>{acct.accountNumber}</Text>
              </View>
            ))}
            <Text style={styles.bankNoteText}>
              Each seller's order is charged separately — you'll verify a transfer for every order created from this checkout.
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DELIVERY METHOD</Text>
          <Card padded={false} style={styles.optionGroup}>
            <RadioOption label="Meet Up" sub="Free · Coordinate directly with each seller" selected={deliveryMethod === 'MEETUP'} onPress={() => setDeliveryMethod('MEETUP')} />
            {deliverySettings.isEnabled && (
              <>
                <View style={styles.divider} />
                <RadioOption
                  label="Aroge Delivery"
                  badge="Needs Approval"
                  sub={`${formatETB(deliverySettings.fee)} per order · Pickup & drop-off handled by Aroge`}
                  selected={deliveryMethod === 'AROGE_DELIVERY'}
                  onPress={() => setDeliveryMethod('AROGE_DELIVERY')}
                />
              </>
            )}
          </Card>

          {deliveryMethod === 'AROGE_DELIVERY' && (
            <View style={styles.addressField}>
              <Input
                label="Drop-off Address *"
                placeholder="House/building, street, sub-city, city"
                value={dropoffAddress}
                onChangeText={setDropoffAddress}
                multiline
                style={{ height: 70, paddingTop: 12, textAlignVertical: 'top' }}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ESTIMATED TOTAL</Text>
          <Card style={styles.summaryCard}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Items subtotal</Text>
              <Text style={styles.feeAmount}>{formatETB(itemsSubtotal)}</Text>
            </View>
            {deliveryFee > 0 && (
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: Colors.green.primary }]}>Aroge Delivery (per order)</Text>
                <Text style={[styles.feeAmount, { color: Colors.green.primary }]}>{formatETB(deliveryFee)}</Text>
              </View>
            )}
            {appliedFees.map((fee) => (
              <View key={fee.feeId} style={styles.feeRow}>
                <Text style={styles.feeLabel}>{fee.name} ({fee.type === 'PERCENTAGE' ? `${fee.value}%` : 'flat'})</Text>
                <Text style={styles.feeAmount}>{formatETB(fee.amount)}</Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.feeRow}>
              <Text style={[styles.feeLabel, styles.feeLabelBold]}>Estimated total</Text>
              <Text style={[styles.feeAmount, styles.feeAmountBold]}>{formatETB(total)}</Text>
            </View>
          </Card>
          <Card style={styles.infoNote}>
            <Info size={14} color={Colors.gold.dark} />
            <Text style={styles.infoNoteText}>
              Items from the same seller become one order; different sellers become separate orders, each with its own delivery fee and platform fees.
            </Text>
          </Card>
          <Card style={styles.escrowNote}>
            <Lock size={14} color={Colors.green.primary} />
            <Text style={styles.escrowNoteText}>
              Payment for each order is held in escrow until you confirm receipt.
            </Text>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Est. total</Text>
          <PriceText amount={total} size="md" />
        </View>
        <View style={{ flex: 1.5 }}>
          <Button label="Place Order" variant="primary" loading={placing} disabled={placing || bankAccounts.length === 0 || items.length === 0} onPress={placeOrder} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: Colors.cream.background, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  section: { gap: 8 },
  sectionLabel: { fontFamily: FontFamily.interBold, fontSize: 10, letterSpacing: 1.4, color: Colors.inkSoft, textTransform: 'uppercase' },
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemThumb: { width: 48, height: 48 },
  itemTitle: { fontFamily: FontFamily.interSemibold, fontSize: 14, color: Colors.ink },
  itemSeller: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.green.primary, marginTop: 3 },
  optionGroup: { overflow: 'hidden' },
  radioRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  radioRowSelected: { backgroundColor: Colors.green.tint },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  radioDotSelected: { borderColor: Colors.green.primary },
  radioDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green.primary },
  radioLabel: { fontFamily: FontFamily.interMedium, fontSize: 14, color: Colors.inkSoft },
  radioLabelSelected: { color: Colors.ink, fontFamily: FontFamily.interSemibold },
  radioSub: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.inkSoft, marginTop: 2 },
  badgeText: { fontFamily: FontFamily.interBold, fontSize: FontSize.xs - 1, color: Colors.gold.dark, backgroundColor: Colors.gold.primary + '2A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm },
  divider: { height: 1, backgroundColor: Colors.line, marginLeft: 44 },
  bankNote: { backgroundColor: Colors.green.tint, gap: 6 },
  bankRow: { paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(31,122,90,0.12)', marginBottom: 4 },
  bankName: { fontFamily: FontFamily.interBold, fontSize: 13, color: Colors.green.primary },
  bankDetail: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft },
  bankNoteText: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.green.primary, lineHeight: 16 },
  addressField: { marginTop: 10 },
  summaryCard: { gap: 10 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontFamily: FontFamily.interRegular, fontSize: 13, color: Colors.inkSoft },
  feeLabelBold: { fontFamily: FontFamily.interBold, fontSize: 14, color: Colors.ink },
  feeAmount: { fontFamily: FontFamily.interRegular, fontSize: 13, color: Colors.inkSoft },
  feeAmountBold: { fontFamily: FontFamily.display, fontSize: 15, color: Colors.ink },
  summaryDivider: { height: 1, backgroundColor: Colors.line },
  infoNote: { backgroundColor: Colors.gold.primary + '1E', flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoNoteText: { flex: 1, fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.gold.dark, lineHeight: 17 },
  escrowNote: { backgroundColor: Colors.green.tint, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  escrowNoteText: { flex: 1, fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.green.primary, lineHeight: 17 },
  footer: { backgroundColor: Colors.cream.surface, borderTopWidth: 1, borderTopColor: Colors.line, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontFamily: FontFamily.interMedium, fontSize: 11, color: Colors.inkSoft },
});
