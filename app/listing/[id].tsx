import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, Modal, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing } from '@arogenpm/sdk';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing & { seller?: any; photos?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerAmount, setOfferAmount] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<Listing>(`/listings/${id}`).then((res) => {
      if (res.success) setListing(res.data as any);
      setLoading(false);
    });
    api.get<{ items: { id: string }[] }>('/listings/saved').then((res) => {
      if (res.success) setSaved(res.data.items.some((l) => l.id === id));
    });
  }, [id]);

  async function toggleSave() {
    if (!listing || savePending) return;
    setSavePending(true);
    const wasSaved = saved;
    setSaved(!wasSaved);
    const res = wasSaved
      ? await api.delete(`/listings/${listing.id}/save`)
      : await api.post(`/listings/${listing.id}/save`, {});
    if (!res.success) setSaved(wasSaved);
    setSavePending(false);
  }

  function showMoreMenu() {
    Alert.alert('More Options', undefined, [
      {
        text: 'Report Listing',
        onPress: () => {
          Alert.prompt(
            'Report Listing',
            'What\'s wrong with this listing?',
            async (reason) => {
              if (!reason || reason.trim().length < 5) return;
              const res = await api.post('/reports', {
                targetType: 'LISTING',
                targetId: id,
                reason: reason.trim(),
              });
              Alert.alert(res.success ? 'Reported' : 'Error', res.success
                ? 'Thanks — our team will review this.'
                : (res as any).message ?? 'Could not submit report');
            }
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleBuyNow() {
    if (!listing) return;
    router.push(`/checkout/${listing.id}` as any);
  }

  async function handleMakeOffer() {
    if (!listing || !offerAmount) return;
    setSendingOffer(true);
    const res = await api.post<any>(`/listings/${listing.id}/offers`, {
      amount: Number(offerAmount),
    });
    setSendingOffer(false);
    if (res.success) {
      Alert.alert('Offer Sent', 'The seller will respond within 48 hours.');
    } else {
      Alert.alert('Error', (res as any).message ?? 'Could not send offer');
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.canvas }}>
        <Text style={{ color: colors.textMuted }}>Listing not found</Text>
      </View>
    );
  }

  const primaryPhoto = listing.photos?.find((p: any) => p.isPrimary) ?? listing.photos?.[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView>
        <View style={styles.photoContainer}>
          {primaryPhoto ? (
            <Image
              source={{ uri: `https://res.cloudinary.com/demo/image/upload/${primaryPhoto.cloudinaryKey}` }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photo, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.brandTint }]}>
              <Text style={{ color: colors.textMuted, fontSize: 40 }}>📦</Text>
            </View>
          )}
          <TouchableOpacity style={styles.floatingBackBtn} onPress={() => router.back()}>
            <Text style={styles.floatingIconText}>←</Text>
          </TouchableOpacity>
          <View style={styles.floatingRightRow}>
            <TouchableOpacity style={styles.floatingIconBtn} onPress={showMoreMenu}>
              <Text style={styles.floatingIconText}>⋯</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatingIconBtn} onPress={toggleSave} disabled={savePending}>
              <Text style={styles.floatingIconText}>{saved ? '♥' : '♡'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{formatETB(listing.price)}</Text>

          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{listing.condition}</Text>
            </View>
            {listing.negotiable && (
              <View style={[styles.tag, { backgroundColor: colors.valueTint }]}>
                <Text style={[styles.tagText, { color: colors.valueText }]}>Negotiable</Text>
              </View>
            )}
            {listing.city && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>📍 {listing.city}</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>

          {(listing as any).seller && (
            <TouchableOpacity
              style={styles.sellerRow}
              onPress={() => router.push(`/seller/${(listing as any).seller.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.sellerAvatar}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sellerName}>{(listing as any).seller.name}</Text>
                {(listing as any).seller.verified && (
                  <Text style={styles.verified}>✓ Verified</Text>
                )}
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.buyBtn} onPress={handleBuyNow} activeOpacity={0.85}>
          <Text style={styles.buyBtnText}>Buy Now</Text>
        </TouchableOpacity>
        {listing.negotiable && (
          <TouchableOpacity
            style={styles.offerBtn}
            onPress={() => setOfferModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.offerBtnText}>Make Offer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Offer modal */}
      <Modal visible={offerModalVisible} transparent animationType="slide" onRequestClose={() => setOfferModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Make an Offer</Text>
            <Text style={styles.modalSub}>Listing price: {formatETB(listing.price)}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your offer amount (ETB)"
              keyboardType="numeric"
              value={offerAmount}
              onChangeText={setOfferAmount}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setOfferModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSend, sendingOffer && { opacity: 0.6 }]}
                disabled={sendingOffer || !offerAmount}
                onPress={async () => {
                  await handleMakeOffer();
                  setOfferModalVisible(false);
                  setOfferAmount('');
                }}
              >
                {sendingOffer
                  ? <ActivityIndicator color={colors.onAction} size="small" />
                  : <Text style={styles.modalSendText}>Send Offer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  photoContainer: { height: 280, backgroundColor: colors.brandTint },
  photo: { width: '100%', height: '100%' },
  floatingBackBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  floatingRightRow: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', gap: 8,
  },
  floatingIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  floatingIconText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 20, gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  price: { fontSize: 24, fontWeight: '800', color: colors.value },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: {
    backgroundColor: colors.brandTint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: colors.brandDeep, fontWeight: '500' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  description: { fontSize: 14, color: colors.textBody, lineHeight: 20 },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.brandTint,
    justifyContent: 'center', alignItems: 'center',
  },
  sellerName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  verified: { fontSize: 11, color: colors.brand, marginTop: 1 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  buyBtn: {
    flex: 1,
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buyBtnText: { color: colors.onAction, fontSize: 15, fontWeight: '700' },
  offerBtn: {
    flex: 1,
    backgroundColor: colors.brandTint,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  offerBtnText: { color: colors.brand, fontSize: 15, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  modalSub: { fontSize: 13, color: colors.textMuted },
  modalInput: {
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: colors.textPrimary,
    backgroundColor: colors.canvas,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
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
