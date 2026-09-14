import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Info } from 'lucide-react-native';
import { Colors, FontFamily, BorderRadius } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB, calculateFees } from '@arogenpm/sdk';
import type { Listing, Bundle, PlatformFee, AppliedFee, BankAccount } from '@arogenpm/sdk';
import { ScreenHeader, Card, Badge, RemoteImage, Input, Button, PriceText } from '../../src/components/ui';
import { haptics } from '../../src/lib/haptics';

// Telebirr/CBE Birr gateway integration is on hold — bank transfer (verified
// via verify.et, with manual review as a fallback) is the only real payment
// path for now. Kept in the type/schema for when real gateways come online.
type PaymentMethod = 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER';
type DeliveryMethod = 'MEETUP' | 'AROGE_DELIVERY';

interface DeliverySettings {
  isEnabled: boolean;
  fee: number;
}

function RadioOption({
  label, sub, badge, selected, onPress,
}: { label: string; sub?: string; badge?: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.radioRow, selected && styles.radioRowSelected]} onPress={() => { haptics.select(); onPress(); }} activeOpacity={0.7}>
      <View style={[styles.radioDot, selected && styles.radioDotSelected]}>
        {selected && <View style={styles.radioDotInner} />}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
          {badge && <Badge label={badge} tone="gold" />}
        </View>
        {sub && <Text style={styles.radioSub}>{sub}</Text>}
      </View>
    </TouchableOpacity>
  );
}

function FeeRow({ label, amount, isBold, isDelivery }: {
  label: string; amount: number; isBold?: boolean; isDelivery?: boolean;
}) {
  return (
    <View style={styles.feeRow}>
      <Text style={[styles.feeLabel, isBold && styles.feeLabelBold, isDelivery && { color: Colors.green.primary }]}>
        {label}
      </Text>
      <Text style={[styles.feeAmount, isBold && styles.feeAmountBold, isDelivery && { color: Colors.green.primary }]}>
        {formatETB(amount)}
      </Text>
    </View>
  );
}

export default function CheckoutScreen() {
  const { id, type, offerId, offerAmount } = useLocalSearchParams<{
    id: string; type?: string; offerId?: string; offerAmount?: string;
  }>();
  const router = useRouter();
  const isBundle = type === 'bundle';

  const [listing, setListing] = useState<Listing & { seller?: any; photos?: any[] } | null>(null);
  const [bundle, setBundle] = useState<Bundle & { seller?: any } | null>(null);
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({ isEnabled: false, fee: 0 });
  const [paymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('MEETUP');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      isBundle ? api.get<Bundle>(`/bundles/${id}`) : api.get<Listing>(`/listings/${id}`),
      api.get<PlatformFee[]>('/fees?role=buyer'),
      api.get<DeliverySettings>('/delivery/settings'),
      api.get<BankAccount[]>('/payments/bank-accounts'),
    ]).then(([itemRes, feesRes, deliveryRes, bankRes]) => {
      if (itemRes.success) {
        if (isBundle) setBundle(itemRes.data as any);
        else setListing(itemRes.data as any);
      }
      if (feesRes.success) setFees(feesRes.data);
      if (deliveryRes.success) setDeliverySettings(deliveryRes.data);
      if (bankRes.success) setBankAccounts(bankRes.data);
      setLoading(false);
    });
  }, [id, isBundle]);

  const item = isBundle ? bundle : listing;

  if (loading || !item) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.green.primary} />
      </SafeAreaView>
    );
  }

  const itemTitle = isBundle ? `Bundle (${bundle?.items?.length ?? 0} items)` : listing!.title;
  const itemPrice = isBundle ? bundle!.price : (offerAmount ? Number(offerAmount) : listing!.price);
  const deliveryFee = deliveryMethod === 'AROGE_DELIVERY' ? deliverySettings.fee : 0;
  const appliedFees: AppliedFee[] = calculateFees(itemPrice, fees);
  const serviceFee = appliedFees.reduce((s, f) => s + f.amount, 0);
  const total = itemPrice + deliveryFee + serviceFee;
  const itemPhoto = !isBundle ? (listing?.photos?.find((p: any) => p.isPrimary) ?? listing?.photos?.[0]) : undefined;

  async function placeOrder() {
    if (bankAccounts.length === 0) {
      Alert.alert('Checkout Unavailable', 'No payment account is configured yet. Please try again later.');
      return;
    }
    if (deliveryMethod === 'AROGE_DELIVERY' && !dropoffAddress.trim()) {
      Alert.alert('Delivery Address Needed', 'Enter where the courier should drop off your item.');
      return;
    }

    setPlacing(true);
    const body: any = isBundle
      ? { bundleId: bundle!.id, deliveryMethod, paymentMethod }
      : { listingId: listing!.id, deliveryMethod, paymentMethod };
    if (!isBundle && offerId) body.offerId = offerId;
    if (deliveryMethod === 'AROGE_DELIVERY') body.dropoffAddress = dropoffAddress.trim();

    const res = await api.post<any>('/orders', body);
    setPlacing(false);

    if (!res.success) {
      Alert.alert('Error', (res as any).message ?? 'Could not place order');
      return;
    }

    haptics.success();
    router.replace(`/order/${res.data.order.id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="Checkout" tone="surface" bordered />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Item */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ITEM</Text>
          <Card style={styles.itemCard}>
            <RemoteImage photoKey={itemPhoto?.cloudinaryKey} style={styles.itemThumb} rounded={BorderRadius.md} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={2}>{itemTitle}</Text>
              <Text style={styles.itemSeller}>
                {(item as any).seller?.name ?? 'Seller'}
                {(item as any).seller?.verified ? ' ✓' : ''}
              </Text>
              {!isBundle && offerId && (
                <Badge label="Accepted Offer Price" tone="gold" style={{ marginTop: 5 }} />
              )}
            </View>
            <PriceText amount={itemPrice} size="sm" />
          </Card>
        </View>

        {/* Payment method — Telebirr/CBE Birr gateway integration is on hold;
            bank transfer (verified via verify.et, with manual review as a
            fallback) is the only real payment path for now. */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <Card padded={false} style={styles.optionGroup}>
            <RadioOption
              label="Bank Transfer"
              sub="Transfer, then verify instantly with your reference number"
              selected
              onPress={() => {}}
            />
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
              After placing your order, transfer the total to one of the accounts above. Enter the transaction reference to verify automatically, or upload a receipt photo for manual review.
            </Text>
          </Card>
        </View>

        {/* Delivery method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DELIVERY METHOD</Text>
          <Card padded={false} style={styles.optionGroup}>
            <RadioOption
              label="Meet Up"
              sub="Free · Coordinate directly with seller"
              selected={deliveryMethod === 'MEETUP'}
              onPress={() => setDeliveryMethod('MEETUP')}
            />
            {deliverySettings.isEnabled && (
              <>
                <View style={styles.divider} />
                <RadioOption
                  label="Aroge Delivery"
                  badge="Needs Approval"
                  sub={`${formatETB(deliverySettings.fee)} · Pickup & drop-off handled by Aroge`}
                  selected={deliveryMethod === 'AROGE_DELIVERY'}
                  onPress={() => setDeliveryMethod('AROGE_DELIVERY')}
                />
              </>
            )}
          </Card>

          {!deliverySettings.isEnabled && (
            <Card style={styles.deliveryOffNote}>
              <Text style={styles.deliveryOffNoteText}>
                Aroge Delivery is not available in your area yet. Meet-up only.
              </Text>
            </Card>
          )}

          {deliveryMethod === 'AROGE_DELIVERY' && (
            <>
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
              <Card style={styles.approvalNote}>
                <View style={styles.approvalHeader}>
                  <Info size={14} color={Colors.gold.dark} />
                  <Text style={styles.approvalNoteTitle}>Requires admin approval</Text>
                </View>
                <Text style={styles.approvalNoteBody}>
                  Your delivery request will be reviewed. You&apos;ll be notified once approved. If rejected, your order continues as meet-up at no extra charge.
                </Text>
              </Card>
            </>
          )}
        </View>

        {/* Order summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
          <Card style={styles.summaryCard}>
            <FeeRow label="Item price" amount={itemPrice} />

            {deliveryFee > 0 && (
              <FeeRow label="Aroge Delivery" amount={deliveryFee} isDelivery />
            )}

            {appliedFees.map((fee) => (
              <FeeRow
                key={fee.feeId}
                label={`${fee.name} (${fee.type === 'PERCENTAGE' ? `${fee.value}%` : 'flat'})`}
                amount={fee.amount}
              />
            ))}

            <View style={styles.summaryDivider} />
            <FeeRow label="Total" amount={total} isBold />
          </Card>

          <Card style={styles.escrowNote}>
            <Lock size={14} color={Colors.green.primary} />
            <Text style={styles.escrowNoteText}>
              Payment is held in escrow until you confirm receipt. You have 7 days to confirm or open a dispute.
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <PriceText amount={total} size="md" />
        </View>
        <View style={{ flex: 1.5 }}>
          <Button
            label="Place Order"
            variant="primary"
            loading={placing}
            disabled={placing || bankAccounts.length === 0}
            onPress={placeOrder}
          />
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
  itemCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemThumb: { width: 48, height: 48 },
  itemTitle: { fontFamily: FontFamily.interSemibold, fontSize: 14, color: Colors.ink },
  itemSeller: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.green.primary, marginTop: 3 },
  optionGroup: { overflow: 'hidden' },
  radioRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  radioRowSelected: { backgroundColor: Colors.green.tint },
  radioDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDotSelected: { borderColor: Colors.green.primary },
  radioDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green.primary },
  radioLabel: { fontFamily: FontFamily.interMedium, fontSize: 14, color: Colors.inkSoft },
  radioLabelSelected: { color: Colors.ink, fontFamily: FontFamily.interSemibold },
  radioSub: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.inkSoft, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.line, marginLeft: 44 },
  bankNote: {
    backgroundColor: Colors.green.tint, gap: 6,
  },
  bankRow: { paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(31,122,90,0.12)', marginBottom: 4 },
  bankName: { fontFamily: FontFamily.interBold, fontSize: 13, color: Colors.green.primary },
  bankDetail: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft },
  bankNoteText: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.green.primary, lineHeight: 16 },
  deliveryOffNote: { backgroundColor: Colors.green.tint },
  deliveryOffNoteText: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.green.primary },
  addressField: { marginTop: 10 },
  approvalNote: { backgroundColor: Colors.gold.primary + '1E', gap: 4 },
  approvalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  approvalNoteTitle: { fontFamily: FontFamily.interBold, fontSize: 12, color: Colors.gold.dark },
  approvalNoteBody: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.gold.dark, lineHeight: 16 },
  summaryCard: { gap: 10 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontFamily: FontFamily.interRegular, fontSize: 13, color: Colors.inkSoft },
  feeLabelBold: { fontFamily: FontFamily.interBold, fontSize: 14, color: Colors.ink },
  feeAmount: { fontFamily: FontFamily.interRegular, fontSize: 13, color: Colors.inkSoft },
  feeAmountBold: { fontFamily: FontFamily.display, fontSize: 15, color: Colors.ink },
  summaryDivider: { height: 1, backgroundColor: Colors.line },
  escrowNote: {
    backgroundColor: Colors.green.tint, flexDirection: 'row', gap: 8, alignItems: 'flex-start',
  },
  escrowNoteText: { flex: 1, fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.green.primary, lineHeight: 17 },
  footer: {
    backgroundColor: Colors.cream.surface,
    borderTopWidth: 1, borderTopColor: Colors.line,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontFamily: FontFamily.interMedium, fontSize: 11, color: Colors.inkSoft },
});
