import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MoreHorizontal, Heart, MapPin, ChevronRight, PackageSearch, MessageCircle } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing } from '@arogenpm/sdk';
import { RemoteImage, IconButton, Badge, Avatar, EmptyState, BottomSheet, Input, Button, PriceText } from '../../src/components/ui';
import { haptics } from '../../src/lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONDITION_LABELS: Record<string, string> = {
  NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor',
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing & { seller?: any; photos?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerAmount, setOfferAmount] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [sendingReport, setSendingReport] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

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
    haptics.tap();
    setSavePending(true);
    const wasSaved = saved;
    setSaved(!wasSaved);
    const res = wasSaved
      ? await api.delete(`/listings/${listing.id}/save`)
      : await api.post(`/listings/${listing.id}/save`, {});
    if (!res.success) setSaved(wasSaved);
    setSavePending(false);
  }

  async function submitReport() {
    if (reportReason.trim().length < 5) return;
    setSendingReport(true);
    const res = await api.post('/reports', {
      targetType: 'LISTING',
      targetId: id,
      reason: reportReason.trim(),
    });
    setSendingReport(false);
    setReportModalVisible(false);
    setReportReason('');
    Alert.alert(res.success ? 'Reported' : 'Error', res.success
      ? 'Thanks — our team will review this.'
      : (res as any).message ?? 'Could not submit report');
  }

  function handleBuyNow() {
    if (!listing) return;
    router.push(`/checkout/${listing.id}`);
  }

  async function handleMakeOffer() {
    if (!listing || !offerAmount) return;
    setSendingOffer(true);
    const res = await api.post<any>(`/listings/${listing.id}/offers`, {
      amount: Number(offerAmount),
    });
    setSendingOffer(false);
    if (res.success) {
      setOfferModalVisible(false);
      setOfferAmount('');
      Alert.alert('Offer Sent', 'The seller will respond within 48 hours.');
    } else {
      Alert.alert('Error', (res as any).message ?? 'Could not send offer');
    }
  }

  function onPhotoScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.green.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.centered}>
        <EmptyState icon={<PackageSearch size={28} color={Colors.text.muted} strokeWidth={1.5} />} title="Listing not found" />
      </View>
    );
  }

  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [undefined];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView bounces={false}>
        <View style={styles.photoContainer}>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPhotoScroll}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <RemoteImage photoKey={item?.cloudinaryKey} preset="hero" style={styles.photo} />
            )}
          />

          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          <IconButton tone="floating" style={styles.floatingBack} onPress={() => router.back()} silent>
            <ChevronLeft size={20} color="#fff" />
          </IconButton>
          <View style={styles.floatingRightRow}>
            <IconButton tone="floating" onPress={() => setReportModalVisible(true)}>
              <MoreHorizontal size={20} color="#fff" />
            </IconButton>
            <IconButton tone="floating" onPress={toggleSave} disabled={savePending} silent>
              <Heart size={19} color="#fff" fill={saved ? '#fff' : 'transparent'} />
            </IconButton>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{listing.title}</Text>
          <PriceText amount={listing.price} size="lg" />

          <View style={styles.tags}>
            <Badge label={CONDITION_LABELS[listing.condition] ?? listing.condition} tone="brand" />
            {listing.negotiable && <Badge label="Negotiable" tone="gold" />}
            {listing.city && (
              <Badge label={listing.city} tone="neutral" icon={<MapPin size={11} color={Colors.text.secondary} />} />
            )}
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>

          {listing.seller && (
            <TouchableOpacity
              style={styles.sellerRow}
              onPress={() => router.push(`/seller/${listing.seller.id}`)}
              activeOpacity={0.7}
            >
              <Avatar photoKey={listing.seller.avatarKey} name={listing.seller.name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sellerName}>{listing.seller.name}</Text>
                {listing.seller.verified && <Text style={styles.verified}>✓ Verified seller</Text>}
              </View>
              <ChevronRight size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {listing.seller && (
          <IconButton
            tone="tint"
            size="lg"
            onPress={() => router.push({
              pathname: '/messages/[listingId]/[otherUserId]',
              params: { listingId: listing.id, otherUserId: listing.seller.id, name: listing.seller.name, listingTitle: listing.title },
            })}
          >
            <MessageCircle size={20} color={Colors.green.primary} />
          </IconButton>
        )}
        <View style={{ flex: 1 }}>
          <Button label="Buy — held in escrow" variant="primary" onPress={handleBuyNow} />
        </View>
        {listing.negotiable && (
          <View style={{ flex: 0.8 }}>
            <Button label="Offer" variant="secondary" onPress={() => setOfferModalVisible(true)} />
          </View>
        )}
      </View>

      <BottomSheet visible={offerModalVisible} onClose={() => setOfferModalVisible(false)} title="Make an Offer">
        <Text style={styles.modalSub}>Listing price: {formatETB(listing.price)}</Text>
        <View style={{ marginTop: Spacing[3], marginBottom: Spacing[5] }}>
          <Input
            placeholder="Your offer amount (ETB)"
            keyboardType="numeric"
            value={offerAmount}
            onChangeText={setOfferAmount}
            autoFocus
          />
        </View>
        <Button
          label="Send Offer"
          variant="primary"
          loading={sendingOffer}
          disabled={!offerAmount}
          onPress={handleMakeOffer}
        />
      </BottomSheet>

      <BottomSheet visible={reportModalVisible} onClose={() => setReportModalVisible(false)} title="Report Listing">
        <Text style={styles.modalSub}>What&apos;s wrong with this listing?</Text>
        <View style={{ marginTop: Spacing[3], marginBottom: Spacing[5] }}>
          <Input
            placeholder="Tell us what's wrong…"
            value={reportReason}
            onChangeText={setReportReason}
            multiline
            numberOfLines={3}
            style={{ height: 90, paddingTop: 12, textAlignVertical: 'top' }}
            autoFocus
          />
        </View>
        <Button
          label="Submit Report"
          variant="danger"
          loading={sendingReport}
          disabled={reportReason.trim().length < 5}
          onPress={submitReport}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.cream.background },
  photoContainer: { height: 340, backgroundColor: Colors.green.tint },
  photo: { width: SCREEN_WIDTH, height: 340 },
  dots: {
    position: 'absolute', bottom: 14, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff', width: 16 },
  floatingBack: { position: 'absolute', top: 12, left: 12 },
  floatingRightRow: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  content: { padding: 20, gap: Spacing[2] },
  title: { fontFamily: FontFamily.display, fontSize: FontSize.lg, color: Colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  sectionTitle: { fontFamily: FontFamily.interBold, fontSize: FontSize.sm, color: Colors.ink, marginTop: Spacing[2] },
  description: { fontFamily: FontFamily.interRegular, fontSize: FontSize.sm, color: Colors.inkSoft, lineHeight: FontSize.sm * 1.5 },
  sellerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    marginTop: Spacing[2], padding: Spacing[3],
    backgroundColor: Colors.cream.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.line,
  },
  sellerName: { fontFamily: FontFamily.interSemibold, fontSize: FontSize.base, color: Colors.ink },
  verified: { fontFamily: FontFamily.interRegular, fontSize: FontSize.xs, color: Colors.green.primary, marginTop: 1 },
  footer: {
    flexDirection: 'row', gap: Spacing[3], padding: Spacing[4], alignItems: 'center',
    backgroundColor: Colors.cream.surface, borderTopWidth: 1, borderTopColor: Colors.line,
  },
  modalSub: { fontFamily: FontFamily.interRegular, fontSize: FontSize.sm, color: Colors.text.muted },
});
