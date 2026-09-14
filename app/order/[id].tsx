import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CheckCircle2, Star, Truck, Clock, XCircle, Upload } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Order, EscrowEvent, BankAccount } from '@arogenpm/sdk';
import { useAppState } from '../../src/context/AppContext';
import { ScreenHeader, Card, Badge, Button, Input, PriceText, EmptyState, Chip, BottomSheet, EscrowHeader, EscrowTimeline, type EscrowState, type EscrowStep } from '../../src/components/ui';
import { haptics } from '../../src/lib/haptics';

const STATUS_STEPS = [
  'PENDING_PAYMENT',
  'PAID_ESCROWED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
];

const STEP_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Order placed',
  PAID_ESCROWED: 'Payment secured — held in escrow',
  IN_TRANSIT: 'Seller shipped',
  DELIVERED: 'Delivered',
  COMPLETED: 'Confirmed & released',
};

const ESCROW_STATE_BY_STATUS: Record<string, EscrowState | undefined> = {
  PAID_ESCROWED: 'held',
  IN_TRANSIT: 'held',
  DELIVERED: 'held',
  COMPLETED: 'released',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
};

const STARS = [1, 2, 3, 4, 5];

const DELIVERY_STATUS_META: Record<string, { text: string; tone: 'warning' | 'error' | 'brand'; Icon: any }> = {
  PENDING_APPROVAL: { text: 'Awaiting admin approval', tone: 'warning', Icon: Clock },
  REJECTED: { text: 'Delivery rejected', tone: 'error', Icon: XCircle },
  REQUESTED: { text: 'Delivery approved — awaiting courier', tone: 'brand', Icon: CheckCircle2 },
  ASSIGNED: { text: 'Courier assigned', tone: 'brand', Icon: Truck },
  IN_TRANSIT: { text: 'In transit', tone: 'brand', Icon: Truck },
  DELIVERED: { text: 'Delivered', tone: 'brand', Icon: CheckCircle2 },
  FAILED: { text: 'Delivery failed', tone: 'error', Icon: XCircle },
};

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAppState();
  const [order, setOrder] = useState<(Order & { listing?: any; escrowEvents?: EscrowEvent[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [suffix, setSuffix] = useState('');
  const [phone, setPhone] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifyPending, setVerifyPending] = useState(false);

  function load() {
    if (!id) return;
    api.get<Order>(`/orders/${id}`).then((res) => {
      if (res.success) setOrder(res.data as any);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (order?.paymentMethod !== 'BANK_TRANSFER' || order.orderStatus !== 'PENDING_PAYMENT') return;
    api.get<BankAccount[]>('/payments/bank-accounts').then((res) => {
      if (res.success) {
        setBankAccounts(res.data);
        if (res.data.length === 1) setSelectedBankId(res.data[0].id);
      }
    });
  }, [order?.paymentMethod, order?.orderStatus]);

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId) ?? null;

  async function submitVerification() {
    if (!order || !selectedBank || !reference.trim()) return;
    const payment = (order as any).payment;
    if (!payment) return;

    setVerifying(true);
    setVerifyError('');
    setVerifyPending(false);

    const body: any = { bank: selectedBank.bankCode, reference: reference.trim() };
    if (suffix.trim()) body.suffix = suffix.trim();
    if (phone.trim()) body.phone = phone.trim();

    const res = await api.post<{ status: 'verified' | 'pending' }>(`/payments/${payment.id}/verify-reference`, body);
    setVerifying(false);

    if (res.success) {
      if (res.data.status === 'verified') {
        haptics.success();
        Alert.alert('Payment Verified', 'Your transfer has been confirmed and is now held in escrow.');
        load();
      } else {
        setVerifyPending(true);
      }
      return;
    }
    setVerifyError((res as any).message ?? 'Could not verify this transaction');
  }

  async function checkVerificationAgain() {
    setVerifying(true);
    const payment = (order as any)?.payment;
    if (!payment) { setVerifying(false); return; }

    const statusRes = await api.get<{ status: string }>(`/payments/${payment.id}/verification-status`);
    if (statusRes.success && statusRes.data.status === 'ready_to_confirm') {
      await submitVerification();
      return;
    }
    if (statusRes.success && statusRes.data.status === 'failed') {
      setVerifyPending(false);
      setVerifyError('This transaction could not be verified — please check the details or upload a transfer screenshot instead.');
    }
    setVerifying(false);
  }

  async function confirmReceipt() {
    if (!order) return;
    Alert.alert(
      'Confirm Receipt',
      'Confirm you received the item? This will release payment to the seller.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setConfirming(true);
            const res = await api.patch(`/orders/${order.id}/confirm-receipt`, {});
            setConfirming(false);
            if (res.success) {
              haptics.success();
              load();
              setReviewModalVisible(true);
            }
          },
        },
      ]
    );
  }

  async function submitReview() {
    if (!order || !user || rating === 0) return;
    const revieweeId = user.sub === order.buyerId ? order.sellerId : order.buyerId;
    setSubmittingReview(true);
    const res = await api.post('/reviews', {
      orderId: order.id,
      revieweeId,
      rating,
      comment: comment.trim() || undefined,
    });
    setSubmittingReview(false);
    if (res.success) {
      setReviewed(true);
      setReviewModalVisible(false);
      Alert.alert('Thanks!', 'Your review has been submitted.');
    } else {
      const message = (res as any).message ?? 'Could not submit review';
      if (message.includes('already submitted')) setReviewed(true);
      Alert.alert('Review', message);
      setReviewModalVisible(false);
    }
  }

  async function uploadTransferProof() {
    if (!order) return;
    const payment = (order as any).payment;
    if (!payment) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingProof(true);
    const res = await api.uploadFile(`/payments/${payment.id}/proof`, result.assets[0].uri, 'proof');
    setUploadingProof(false);

    if (res.success) {
      Alert.alert('Uploaded', 'Your transfer proof was submitted for review.');
      load();
    } else {
      Alert.alert('Upload Failed', (res as any).message ?? 'Could not upload proof');
    }
  }

  async function submitDispute() {
    if (!order || disputeReason.trim().length < 5) return;
    setSubmittingDispute(true);
    const res = await api.post(`/escrow/orders/${order.id}/dispute`, { reason: disputeReason.trim() });
    setSubmittingDispute(false);
    setDisputeModalVisible(false);
    setDisputeReason('');
    if (res.success) Alert.alert('Dispute Filed', 'Our team will review within 24 hours.');
    load();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.green.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <EmptyState icon={<XCircle size={28} color={Colors.text.muted} strokeWidth={1.5} />} title="Order not found" />
      </View>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
  const totalPaid = order.amount + ((order as any).deliveryFee ?? 0) + ((order as any).serviceFee ?? 0);
  const escrowState = ESCROW_STATE_BY_STATUS[order.orderStatus];
  const escrowSteps: EscrowStep[] = STATUS_STEPS.map((step, i) => ({
    label: STEP_LABELS[step] ?? step,
    status: i < currentStep ? 'done' : i === currentStep ? 'current' : 'upcoming',
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="Order" tone="surface" bordered />

      <ScrollView contentContainerStyle={styles.scroll}>
        {escrowState && <EscrowHeader state={escrowState} amountEtb={totalPaid} />}

        <Card style={styles.gapCard}>
          <Text style={styles.cardTitle}>{(order as any).listing?.title ?? 'Item'}</Text>

          {/* Fee breakdown */}
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Item price</Text>
              <Text style={styles.priceRowValue}>{formatETB(order.amount)}</Text>
            </View>
            {(order as any).deliveryFee > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>Delivery fee</Text>
                <Text style={styles.priceRowValue}>{formatETB((order as any).deliveryFee)}</Text>
              </View>
            )}
            {((order as any).feeSnapshot as any[] | null)?.map((fee: any) => (
              <View key={fee.feeId} style={styles.priceRow}>
                <Text style={styles.priceRowLabel}>
                  {fee.name} ({fee.type === 'PERCENTAGE' ? `${fee.value}%` : 'flat'})
                </Text>
                <Text style={styles.priceRowValue}>{formatETB(fee.amount)}</Text>
              </View>
            ))}
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabelBold}>Total paid</Text>
              <PriceText amount={totalPaid} size="sm" />
            </View>
          </View>

          <Text style={styles.meta}>Payment: {order.paymentMethod.replace('_', ' ')}</Text>
          <Text style={styles.meta}>Delivery: {order.deliveryMethod.replace('_', ' ')}</Text>
        </Card>

        {order.paymentMethod === 'BANK_TRANSFER' && order.orderStatus === 'PENDING_PAYMENT' && (
          <Card style={styles.gapCard}>
            <Text style={styles.sectionTitle}>Bank Transfer</Text>
            {(order as any).payment?.proofUploadedAt ? (
              <View style={styles.bankPendingNote}>
                <Clock size={14} color={Colors.gold.dark} />
                <Text style={styles.bankPendingText}>
                  Proof submitted — waiting for an admin to verify your transfer.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.meta}>
                  Transfer {formatETB(totalPaid)} to the bank account shown at checkout, then enter the transaction reference below to verify automatically.
                </Text>

                {bankAccounts.length > 1 && (
                  <View style={styles.bankPickerRow}>
                    {bankAccounts.map((acct) => (
                      <Chip
                        key={acct.id}
                        label={acct.bankName}
                        selected={selectedBankId === acct.id}
                        onPress={() => setSelectedBankId(acct.id)}
                      />
                    ))}
                  </View>
                )}

                {selectedBank && (
                  <View style={{ gap: Spacing[2], marginTop: Spacing[2] }}>
                    <Input
                      placeholder={selectedBank.bankCode === 'cbebirr' ? 'Receipt number' : 'Transaction reference'}
                      value={reference}
                      onChangeText={setReference}
                      autoCapitalize="characters"
                    />
                    {(selectedBank.bankCode === 'cbe' || selectedBank.bankCode === 'boa') && (
                      <Input
                        placeholder={selectedBank.bankCode === 'cbe' ? 'Account suffix (last 8 digits)' : 'Account suffix (last 5 digits)'}
                        value={suffix}
                        onChangeText={setSuffix}
                        keyboardType="number-pad"
                      />
                    )}
                    {selectedBank.bankCode === 'cbebirr' && (
                      <Input
                        placeholder="Phone number used to pay"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                      />
                    )}

                    {!!verifyError && <Text style={styles.verifyErrorText}>{verifyError}</Text>}

                    {verifyPending ? (
                      <Button label="Check Again" variant="secondary" loading={verifying} onPress={checkVerificationAgain} />
                    ) : (
                      <Button
                        label="Verify Payment"
                        variant="secondary"
                        loading={verifying}
                        disabled={!reference.trim()}
                        onPress={submitVerification}
                      />
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.uploadProofBtn}
                  onPress={uploadTransferProof}
                  disabled={uploadingProof}
                >
                  {uploadingProof
                    ? <ActivityIndicator color={Colors.green.primary} />
                    : (
                      <View style={styles.uploadProofRow}>
                        <Upload size={13} color={Colors.green.primary} />
                        <Text style={styles.uploadProofBtnText}>Or upload a transfer screenshot instead</Text>
                      </View>
                    )
                  }
                </TouchableOpacity>
              </>
            )}
          </Card>
        )}

        <Card style={styles.gapCard}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <EscrowTimeline steps={escrowSteps} />
        </Card>

        {order.orderStatus === 'PAID_ESCROWED' && (
          <View style={styles.actions}>
            <Button label="Confirm Receipt" variant="primary" loading={confirming} onPress={confirmReceipt} />
            <Button label="Open Dispute" variant="danger" onPress={() => setDisputeModalVisible(true)} />
          </View>
        )}

        {order.orderStatus === 'COMPLETED' && !reviewed && (
          <Button
            label="Rate This Order"
            variant="secondary"
            icon={<Star size={16} color={Colors.green.primary} fill={Colors.green.primary} />}
            onPress={() => { setRating(0); setComment(''); setReviewModalVisible(true); }}
          />
        )}

        {/* Delivery status card */}
        {(order as any).delivery && (() => {
          const d = (order as any).delivery;
          const meta = DELIVERY_STATUS_META[d.status];
          if (!meta) return null;
          return (
            <Card style={styles.gapCard}>
              <Text style={styles.sectionTitle}>Delivery Status</Text>
              <Badge label={meta.text} tone={meta.tone} icon={<meta.Icon size={12} color={meta.tone === 'error' ? Colors.error : meta.tone === 'warning' ? Colors.gold.dark : Colors.green.primary} />} size="md" />
              {d.status === 'REJECTED' && d.rejectedReason && (
                <Text style={styles.rejectedReason}>Reason: {d.rejectedReason}. Order continues as meet-up.</Text>
              )}
            </Card>
          );
        })()}

        {(order as any).escrowEvents && (order as any).escrowEvents.length > 0 && (
          <Card style={styles.gapCard}>
            <Text style={styles.sectionTitle}>Escrow History</Text>
            {(order as any).escrowEvents.map((ev: EscrowEvent) => (
              <View key={ev.id} style={styles.eventRow}>
                <Text style={styles.eventType}>{ev.eventType}</Text>
                {ev.note && <Text style={styles.eventNote}>{ev.note}</Text>}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <BottomSheet visible={reviewModalVisible} onClose={() => setReviewModalVisible(false)} title="Rate This Order">
        <View style={styles.starsRow}>
          {STARS.map((s) => (
            <TouchableOpacity key={s} onPress={() => { haptics.select(); setRating(s); }} hitSlop={6}>
              <Star size={32} color={s <= rating ? Colors.gold.primary : Colors.border.default} fill={s <= rating ? Colors.gold.primary : 'transparent'} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ marginTop: Spacing[4], marginBottom: Spacing[5] }}>
          <Input
            placeholder="Add a comment (optional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            style={{ height: 80, paddingTop: 12, textAlignVertical: 'top' }}
          />
        </View>
        <View style={styles.modalActions}>
          <View style={{ flex: 1 }}>
            <Button label="Skip" variant="ghost" onPress={() => setReviewModalVisible(false)} />
          </View>
          <View style={{ flex: 1.4 }}>
            <Button label="Submit" variant="primary" loading={submittingReview} disabled={rating === 0} onPress={submitReview} />
          </View>
        </View>
      </BottomSheet>

      <BottomSheet visible={disputeModalVisible} onClose={() => setDisputeModalVisible(false)} title="Open Dispute">
        <Text style={styles.modalSub}>Describe the issue with this order:</Text>
        <View style={{ marginTop: Spacing[3], marginBottom: Spacing[5] }}>
          <Input
            placeholder="What went wrong?"
            value={disputeReason}
            onChangeText={setDisputeReason}
            multiline
            numberOfLines={3}
            style={{ height: 90, paddingTop: 12, textAlignVertical: 'top' }}
            autoFocus
          />
        </View>
        <Button
          label="Submit Dispute"
          variant="danger"
          loading={submittingDispute}
          disabled={disputeReason.trim().length < 5}
          onPress={submitDispute}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.cream.background },
  scroll: { padding: 16, gap: 12 },
  gapCard: { gap: 4 },
  cardTitle: { fontFamily: FontFamily.displaySemibold, fontSize: FontSize.md, color: Colors.ink },
  meta: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft },
  sectionTitle: { fontFamily: FontFamily.interBold, fontSize: 14, color: Colors.ink, marginBottom: 8 },
  actions: { gap: 10 },
  bankPendingNote: {
    backgroundColor: Colors.gold.primary + '1E', borderRadius: BorderRadius.md, padding: 12,
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
  },
  bankPendingText: { flex: 1, fontFamily: FontFamily.interSemibold, fontSize: 13, color: Colors.gold.dark },
  bankPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  verifyErrorText: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.error },
  uploadProofBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  uploadProofRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  uploadProofBtnText: { fontFamily: FontFamily.interSemibold, fontSize: 12, color: Colors.green.primary },
  eventRow: { paddingVertical: 4, borderTopWidth: 1, borderTopColor: Colors.line },
  eventType: { fontFamily: FontFamily.interSemibold, fontSize: 12, color: Colors.green.primary },
  eventNote: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.inkSoft, marginTop: 2 },
  priceBreakdown: { gap: 6, marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRowLabel: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft },
  priceRowLabelBold: { fontFamily: FontFamily.interBold, fontSize: 12, color: Colors.ink },
  priceRowValue: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft },
  priceDivider: { height: 1, backgroundColor: Colors.line, marginVertical: 4 },
  rejectedReason: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.error, marginTop: 6 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalSub: { fontFamily: FontFamily.interRegular, fontSize: FontSize.sm, color: Colors.text.muted },
});
