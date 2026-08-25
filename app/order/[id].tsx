import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import { formatETB } from 'aroge-sdk';
import type { Order, EscrowEvent, BankAccount } from 'aroge-sdk';
import { useAppState } from '../../src/context/AppContext';

const STATUS_STEPS = [
  'PENDING_PAYMENT',
  'PAID_ESCROWED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
];

const STARS = [1, 2, 3, 4, 5];

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

  async function openDispute() {
    if (!order) return;
    Alert.prompt(
      'Open Dispute',
      'Describe the issue:',
      async (reason) => {
        if (!reason) return;
        const res = await api.post(`/escrow/orders/${order.id}/dispute`, { reason });
        if (res.success) Alert.alert('Dispute Filed', 'Our team will review within 24 hours.');
        load();
      }
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas }}>
        <Text style={{ color: colors.textMuted }}>Order not found</Text>
      </View>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={styles.card}>
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
              <Text style={[styles.priceRowLabel, { fontWeight: '700', color: colors.textPrimary }]}>Total paid</Text>
              <Text style={styles.price}>
                {formatETB(order.amount + ((order as any).deliveryFee ?? 0) + ((order as any).serviceFee ?? 0))}
              </Text>
            </View>
          </View>

          <Text style={styles.meta}>Payment: {order.paymentMethod.replace('_', ' ')}</Text>
          <Text style={styles.meta}>Delivery: {order.deliveryMethod.replace('_', ' ')}</Text>
        </View>

        {order.paymentMethod === 'BANK_TRANSFER' && order.orderStatus === 'PENDING_PAYMENT' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Bank Transfer</Text>
            {(order as any).payment?.proofUploadedAt ? (
              <View style={styles.bankPendingNote}>
                <Text style={styles.bankPendingText}>
                  ⏳ Proof submitted — waiting for an admin to verify your transfer.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.meta}>
                  Transfer {formatETB(order.amount + ((order as any).deliveryFee ?? 0) + ((order as any).serviceFee ?? 0))} to the bank account shown at checkout, then enter the transaction reference below to verify automatically.
                </Text>

                {bankAccounts.length > 1 && (
                  <View style={styles.bankPickerRow}>
                    {bankAccounts.map((acct) => (
                      <TouchableOpacity
                        key={acct.id}
                        style={[styles.bankPickerChip, selectedBankId === acct.id && styles.bankPickerChipSelected]}
                        onPress={() => setSelectedBankId(acct.id)}
                      >
                        <Text style={[styles.bankPickerChipText, selectedBankId === acct.id && styles.bankPickerChipTextSelected]}>
                          {acct.bankName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {selectedBank && (
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <TextInput
                      style={styles.verifyInput}
                      placeholder={selectedBank.bankCode === 'cbebirr' ? 'Receipt number' : 'Transaction reference'}
                      value={reference}
                      onChangeText={setReference}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                    />
                    {(selectedBank.bankCode === 'cbe' || selectedBank.bankCode === 'boa') && (
                      <TextInput
                        style={styles.verifyInput}
                        placeholder={selectedBank.bankCode === 'cbe' ? 'Account suffix (last 8 digits)' : 'Account suffix (last 5 digits)'}
                        value={suffix}
                        onChangeText={setSuffix}
                        keyboardType="number-pad"
                        placeholderTextColor={colors.textMuted}
                      />
                    )}
                    {selectedBank.bankCode === 'cbebirr' && (
                      <TextInput
                        style={styles.verifyInput}
                        placeholder="Phone number used to pay"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.textMuted}
                      />
                    )}

                    {!!verifyError && <Text style={styles.verifyErrorText}>{verifyError}</Text>}

                    {verifyPending ? (
                      <TouchableOpacity
                        style={[styles.confirmBtn, verifying && { opacity: 0.6 }]}
                        onPress={checkVerificationAgain}
                        disabled={verifying}
                      >
                        {verifying
                          ? <ActivityIndicator color={colors.onBrand} />
                          : <Text style={styles.confirmBtnText}>Check Again</Text>}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.confirmBtn, (verifying || !reference.trim()) && { opacity: 0.6 }]}
                        onPress={submitVerification}
                        disabled={verifying || !reference.trim()}
                      >
                        {verifying
                          ? <ActivityIndicator color={colors.onBrand} />
                          : <Text style={styles.confirmBtnText}>Verify Payment</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.uploadProofBtn, uploadingProof && { opacity: 0.6 }]}
                  onPress={uploadTransferProof}
                  disabled={uploadingProof}
                >
                  {uploadingProof
                    ? <ActivityIndicator color={colors.brand} />
                    : <Text style={styles.uploadProofBtnText}>Or upload a transfer screenshot instead</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, i) => (
              <View key={step} style={styles.timelineRow}>
                <View style={[
                  styles.dot,
                  i <= currentStep && styles.dotActive,
                  i === currentStep && styles.dotCurrent,
                ]} />
                <Text style={[
                  styles.stepText,
                  i <= currentStep && styles.stepTextActive,
                ]}>
                  {step.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {order.orderStatus === 'PAID_ESCROWED' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.confirmBtn, confirming && { opacity: 0.6 }]}
              onPress={confirmReceipt}
              disabled={confirming}
            >
              {confirming
                ? <ActivityIndicator color={colors.onBrand} />
                : <Text style={styles.confirmBtnText}>Confirm Receipt</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.disputeBtn} onPress={openDispute}>
              <Text style={styles.disputeBtnText}>Open Dispute</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.orderStatus === 'COMPLETED' && !reviewed && (
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => { setRating(0); setComment(''); setReviewModalVisible(true); }}
          >
            <Text style={styles.rateBtnText}>⭐ Rate This Order</Text>
          </TouchableOpacity>
        )}

        {/* Delivery status card */}
        {(order as any).delivery && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Status</Text>
            {(() => {
              const d = (order as any).delivery;
              const isPending = d.status === 'PENDING_APPROVAL';
              const isRejected = d.status === 'REJECTED';
              return (
                <View style={[
                  styles.deliveryStatusCard,
                  isPending && { backgroundColor: colors.valueTint },
                  isRejected && { backgroundColor: colors.actionTint },
                  !isPending && !isRejected && { backgroundColor: colors.brandTint },
                ]}>
                  <Text style={[
                    styles.deliveryStatusText,
                    isPending && { color: colors.valueText },
                    isRejected && { color: colors.action },
                    !isPending && !isRejected && { color: colors.brand },
                  ]}>
                    {isPending && '⏳ Awaiting admin approval'}
                    {isRejected && '✕ Delivery rejected'}
                    {d.status === 'REQUESTED' && '✓ Delivery approved — awaiting courier'}
                    {d.status === 'ASSIGNED' && '🚚 Courier assigned'}
                    {d.status === 'IN_TRANSIT' && '🚚 In transit'}
                    {d.status === 'DELIVERED' && '✓ Delivered'}
                    {d.status === 'FAILED' && '✕ Delivery failed'}
                  </Text>
                  {isRejected && d.rejectedReason && (
                    <Text style={{ fontSize: 11, color: colors.action, marginTop: 4 }}>
                      Reason: {d.rejectedReason}. Order continues as meet-up.
                    </Text>
                  )}
                </View>
              );
            })()}
          </View>
        )}

        {(order as any).escrowEvents && (order as any).escrowEvents.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Escrow History</Text>
            {(order as any).escrowEvents.map((ev: EscrowEvent) => (
              <View key={ev.id} style={styles.eventRow}>
                <Text style={styles.eventType}>{ev.eventType}</Text>
                {ev.note && <Text style={styles.eventNote}>{ev.note}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Rate This Order</Text>
            <View style={styles.starsRow}>
              {STARS.map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={[styles.star, s <= rating && styles.starFilled]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment (optional)"
              value={comment}
              onChangeText={setComment}
              multiline
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setReviewModalVisible(false)}>
                <Text style={styles.modalCancelText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSend, (rating === 0 || submittingReview) && { opacity: 0.6 }]}
                disabled={rating === 0 || submittingReview}
                onPress={submitReview}
              >
                {submittingReview
                  ? <ActivityIndicator color={colors.onAction} size="small" />
                  : <Text style={styles.modalSendText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  back: { color: colors.onBrand, fontSize: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onBrand },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  price: { fontSize: 20, fontWeight: '800', color: colors.value },
  meta: { fontSize: 12, color: colors.textBody },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  timeline: { gap: 10 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.border,
    borderWidth: 1.5, borderColor: colors.border,
  },
  dotActive: { backgroundColor: colors.brandTint, borderColor: colors.brand },
  dotCurrent: { backgroundColor: colors.brand },
  stepText: { fontSize: 13, color: colors.textMuted },
  stepTextActive: { color: colors.textPrimary, fontWeight: '500' },
  actions: { gap: 10 },
  confirmBtn: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: { color: colors.onBrand, fontSize: 15, fontWeight: '700' },
  disputeBtn: {
    backgroundColor: colors.actionTint,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disputeBtnText: { color: colors.action, fontSize: 14, fontWeight: '600' },
  bankPendingNote: {
    backgroundColor: colors.valueTint, borderRadius: 10, padding: 12,
  },
  bankPendingText: { fontSize: 13, fontWeight: '600', color: colors.valueText },
  bankPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  bankPickerChip: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  bankPickerChipSelected: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  bankPickerChipText: { fontSize: 12, color: colors.textBody, fontWeight: '500' },
  bankPickerChipTextSelected: { color: colors.brand, fontWeight: '700' },
  verifyInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
    color: colors.textPrimary, backgroundColor: colors.canvas,
  },
  verifyErrorText: { fontSize: 12, color: '#d32f2f' },
  uploadProofBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  uploadProofBtnText: { fontSize: 12, color: colors.brand, fontWeight: '600', textDecorationLine: 'underline' },
  eventRow: { paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.border },
  eventType: { fontSize: 12, fontWeight: '600', color: colors.brand },
  eventNote: { fontSize: 11, color: colors.textBody, marginTop: 2 },
  priceBreakdown: { gap: 6, marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceRowLabel: { fontSize: 12, color: colors.textBody },
  priceRowValue: { fontSize: 12, color: colors.textBody },
  priceDivider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  deliveryStatusCard: { borderRadius: 10, padding: 12 },
  deliveryStatusText: { fontSize: 13, fontWeight: '600' },
  rateBtn: {
    backgroundColor: colors.valueTint, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  rateBtnText: { color: colors.valueText, fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  star: { fontSize: 34, color: colors.border },
  starFilled: { color: colors.value },
  commentInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: colors.textPrimary, backgroundColor: colors.canvas, minHeight: 70, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: colors.brandTint, alignItems: 'center',
  },
  modalCancelText: { color: colors.brand, fontWeight: '600', fontSize: 14 },
  modalSend: {
    flex: 1.5, paddingVertical: 13, borderRadius: 12,
    backgroundColor: colors.action, alignItems: 'center',
  },
  modalSendText: { color: colors.onAction, fontWeight: '700', fontSize: 14 },
});
