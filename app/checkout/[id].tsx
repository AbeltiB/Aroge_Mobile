import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import { formatETB, calculateFees } from 'aroge-sdk';
import type { Listing, Bundle, PlatformFee, AppliedFee, BankAccount } from 'aroge-sdk';

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
    <TouchableOpacity style={[styles.radioRow, selected && styles.radioRowSelected]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.radioDot, selected && styles.radioDotSelected]}>
        {selected && <View style={styles.radioDotInner} />}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
          {badge && (
            <View style={styles.radioBadge}>
              <Text style={styles.radioBadgeText}>{badge}</Text>
            </View>
          )}
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
      <Text style={[styles.feeLabel, isBold && styles.feeLabelBold, isDelivery && { color: colors.brand }]}>
        {label}
      </Text>
      <Text style={[styles.feeAmount, isBold && styles.feeAmountBold, isDelivery && { color: colors.brand }]}>
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

  const [listing, setListing] = useState<Listing & { seller?: any } | null>(null);
  const [bundle, setBundle] = useState<Bundle & { seller?: any } | null>(null);
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({ isEnabled: false, fee: 0 });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TELEBIRR');
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
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  const itemTitle = isBundle ? `Bundle (${bundle?.items?.length ?? 0} items)` : listing!.title;
  const itemPrice = isBundle ? bundle!.price : (offerAmount ? Number(offerAmount) : listing!.price);
  const deliveryFee = deliveryMethod === 'AROGE_DELIVERY' ? deliverySettings.fee : 0;
  const appliedFees: AppliedFee[] = calculateFees(itemPrice, fees);
  const serviceFee = appliedFees.reduce((s, f) => s + f.amount, 0);
  const total = itemPrice + deliveryFee + serviceFee;

  async function placeOrder() {
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

    router.replace(`/order/${res.data.order.id}` as any);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Item */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ITEM</Text>
          <View style={styles.itemCard}>
            <View style={styles.itemThumb}><Text style={{ fontSize: 22 }}>📦</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={2}>{itemTitle}</Text>
              <Text style={styles.itemSeller}>
                {(item as any).seller?.name ?? 'Seller'}
                {(item as any).seller?.verified ? ' ✓' : ''}
              </Text>
              {!isBundle && offerId && (
                <View style={styles.offerBadge}>
                  <Text style={styles.offerBadgeText}>Accepted Offer Price</Text>
                </View>
              )}
            </View>
            <Text style={styles.itemPrice}>{formatETB(itemPrice)}</Text>
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <View style={styles.optionGroup}>
            <RadioOption
              label="Telebirr"
              sub="Ethiopia's #1 mobile money"
              selected={paymentMethod === 'TELEBIRR'}
              onPress={() => setPaymentMethod('TELEBIRR')}
            />
            <View style={styles.divider} />
            <RadioOption
              label="CBE Birr"
              sub="Commercial Bank of Ethiopia"
              selected={paymentMethod === 'CBE_BIRR'}
              onPress={() => setPaymentMethod('CBE_BIRR')}
            />
            {bankAccounts.length > 0 && (
              <>
                <View style={styles.divider} />
                <RadioOption
                  label="Bank Transfer"
                  sub="Transfer manually, then upload your receipt"
                  selected={paymentMethod === 'BANK_TRANSFER'}
                  onPress={() => setPaymentMethod('BANK_TRANSFER')}
                />
              </>
            )}
          </View>

          {paymentMethod === 'BANK_TRANSFER' && (
            <View style={styles.bankNote}>
              {bankAccounts.map((acct) => (
                <View key={acct.id} style={styles.bankRow}>
                  <Text style={styles.bankName}>{acct.bankName}</Text>
                  <Text style={styles.bankDetail}>{acct.accountName}</Text>
                  <Text style={styles.bankDetail}>{acct.accountNumber}</Text>
                </View>
              ))}
              <Text style={styles.bankNoteText}>
                After placing your order, you'll be asked to upload a photo of your transfer receipt. An admin will verify it before your payment is held in escrow.
              </Text>
            </View>
          )}
        </View>

        {/* Delivery method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DELIVERY METHOD</Text>
          <View style={styles.optionGroup}>
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
          </View>

          {!deliverySettings.isEnabled && (
            <View style={styles.deliveryOffNote}>
              <Text style={styles.deliveryOffNoteText}>
                Aroge Delivery is not available in your area yet. Meet-up only.
              </Text>
            </View>
          )}

          {deliveryMethod === 'AROGE_DELIVERY' && (
            <>
              <View style={styles.addressField}>
                <Text style={styles.label}>Drop-off Address *</Text>
                <TextInput
                  style={styles.addressInput}
                  placeholder="House/building, street, sub-city, city"
                  value={dropoffAddress}
                  onChangeText={setDropoffAddress}
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
              </View>
              <View style={styles.approvalNote}>
                <Text style={styles.approvalNoteTitle}>Requires admin approval</Text>
                <Text style={styles.approvalNoteBody}>
                  Your delivery request will be reviewed. You'll be notified once approved. If rejected, your order continues as meet-up at no extra charge.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Order summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
          <View style={styles.summaryCard}>
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
          </View>

          <View style={styles.escrowNote}>
            <Text style={styles.escrowNoteText}>
              🔒 Payment is held in escrow until you confirm receipt. You have 7 days to confirm or open a dispute.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>{formatETB(total)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeBtn, placing && { opacity: 0.6 }]}
          onPress={placeOrder}
          disabled={placing}
          activeOpacity={0.85}
        >
          {placing
            ? <ActivityIndicator color={colors.onAction} />
            : <Text style={styles.placeBtnText}>Place Order</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.brand,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  backText: { color: colors.onBrand, fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onBrand },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, color: colors.textMuted, textTransform: 'uppercase' },
  itemCard: {
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  itemThumb: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  itemSeller: { fontSize: 12, color: colors.brand, marginTop: 3 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: colors.value },
  offerBadge: {
    marginTop: 5, alignSelf: 'flex-start',
    backgroundColor: colors.valueTint, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  offerBadgeText: { fontSize: 10, fontWeight: '700', color: colors.valueText },
  optionGroup: {
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  radioRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  radioRowSelected: { backgroundColor: colors.brandTint },
  radioDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDotSelected: { borderColor: colors.brand },
  radioDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand },
  radioLabel: { fontSize: 14, fontWeight: '500', color: colors.textBody },
  radioLabelSelected: { color: colors.textPrimary, fontWeight: '600' },
  radioSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  radioBadge: {
    backgroundColor: colors.valueTint, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  radioBadgeText: { fontSize: 9, fontWeight: '700', color: colors.valueText },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 44 },
  bankNote: {
    backgroundColor: colors.brandTint, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: 'rgba(31,122,90,0.15)', gap: 6,
  },
  bankRow: { paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(31,122,90,0.12)', marginBottom: 4 },
  bankName: { fontSize: 13, fontWeight: '700', color: colors.brand },
  bankDetail: { fontSize: 12, color: colors.textBody },
  bankNoteText: { fontSize: 11, color: colors.brand, lineHeight: 16 },
  deliveryOffNote: {
    backgroundColor: colors.brandTint, borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: 'rgba(31,122,90,0.12)',
  },
  deliveryOffNoteText: { fontSize: 12, color: colors.brand },
  addressField: { marginTop: 10, gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  addressInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: colors.textPrimary, backgroundColor: colors.canvas,
    minHeight: 60, textAlignVertical: 'top',
  },
  approvalNote: {
    backgroundColor: colors.valueTint, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: 'rgba(200,155,60,0.2)', gap: 4,
  },
  approvalNoteTitle: { fontSize: 12, fontWeight: '700', color: colors.valueText },
  approvalNoteBody: { fontSize: 11, color: colors.valueText, lineHeight: 16 },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    gap: 10, borderWidth: 1, borderColor: colors.border,
  },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: 13, color: colors.textBody },
  feeLabelBold: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  feeAmount: { fontSize: 13, color: colors.textBody },
  feeAmountBold: { fontSize: 15, fontWeight: '800', color: colors.value },
  summaryDivider: { height: 1, backgroundColor: colors.border },
  escrowNote: {
    backgroundColor: colors.brandTint, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: 'rgba(31,122,90,0.15)',
  },
  escrowNoteText: { fontSize: 12, color: colors.brand, lineHeight: 17 },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  footerTotalValue: { fontSize: 18, fontWeight: '800', color: colors.value },
  placeBtn: {
    flex: 1.5, backgroundColor: colors.action,
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  placeBtnText: { color: colors.onAction, fontSize: 15, fontWeight: '700' },
});
