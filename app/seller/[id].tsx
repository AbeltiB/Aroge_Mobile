import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Alert, Modal, TextInput,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing } from '@arogenpm/sdk';
import { useAppState } from '../../src/context/AppContext';

interface SellerProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  subCity: string | null;
  verified: boolean;
  isTrusted: boolean;
  memberSince: string;
  business: { id: string; name: string } | null;
  activeListingCount: number;
  followerCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
  rating: { average: number; count: number };
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string };
}

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAppState();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [followPending, setFollowPending] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    Promise.all([
      api.get<SellerProfile>(`/users/${id}/profile`),
      api.get<Listing[]>(`/users/${id}/listings`),
      api.get<ReviewRow[]>(`/reviews/users/${id}`),
    ]).then(([profileRes, listingsRes, reviewsRes]) => {
      if (profileRes.success) setProfile(profileRes.data);
      if (listingsRes.success) setListings(listingsRes.data);
      if (reviewsRes.success) setReviews(reviewsRes.data);
      setLoading(false);
    });
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggleFollow() {
    if (!profile || followPending) return;
    setFollowPending(true);
    const wasFollowing = profile.isFollowing;
    setProfile({ ...profile, isFollowing: !wasFollowing, followerCount: profile.followerCount + (wasFollowing ? -1 : 1) });
    const res = wasFollowing
      ? await api.delete(`/users/${profile.id}/follow`)
      : await api.post(`/users/${profile.id}/follow`, {});
    if (!res.success) load();
    setFollowPending(false);
  }

  async function toggleBlock() {
    if (!profile) return;
    const wasBlocked = profile.isBlocked;
    Alert.alert(
      wasBlocked ? 'Unblock User' : 'Block User',
      wasBlocked
        ? 'They will be able to message you again.'
        : 'They won\'t be able to message you, and you won\'t see their listings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: wasBlocked ? 'Unblock' : 'Block',
          style: wasBlocked ? 'default' : 'destructive',
          onPress: async () => {
            const res = wasBlocked
              ? await api.delete(`/users/${profile.id}/block`)
              : await api.post(`/users/${profile.id}/block`, {});
            if (res.success) setProfile({ ...profile, isBlocked: !wasBlocked });
          },
        },
      ]
    );
  }

  async function submitReport() {
    if (!profile || reportReason.trim().length < 5) return;
    setSubmittingReport(true);
    const res = await api.post('/reports', {
      targetType: 'USER',
      targetId: profile.id,
      reason: reportReason.trim(),
    });
    setSubmittingReport(false);
    setReportModalVisible(false);
    setReportReason('');
    Alert.alert(res.success ? 'Reported' : 'Error', res.success
      ? 'Thanks — our team will review this.'
      : (res as any).message ?? 'Could not submit report');
  }

  function showMoreMenu() {
    Alert.alert('More Options', undefined, [
      { text: 'Report User', onPress: () => setReportModalVisible(true) },
      { text: profile?.isBlocked ? 'Unblock User' : 'Block User', onPress: toggleBlock, style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (loading || !profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  const isSelf = user?.sub === profile.id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller</Text>
        {isSelf ? (
          <View style={{ width: 36 }} />
        ) : (
          <TouchableOpacity onPress={showMoreMenu} style={styles.backBtn}>
            <Text style={styles.backText}>⋯</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={{ fontSize: 30 }}>👤</Text></View>
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.badgeRow}>
            {profile.verified && (
              <View style={styles.badge}><Text style={styles.badgeText}>✓ Verified</Text></View>
            )}
            {profile.isTrusted && (
              <View style={[styles.badge, { backgroundColor: colors.valueTint }]}>
                <Text style={[styles.badgeText, { color: colors.valueText }]}>⭐ Trusted</Text>
              </View>
            )}
            {profile.business && (
              <View style={[styles.badge, { backgroundColor: colors.brandTint }]}>
                <Text style={[styles.badgeText, { color: colors.brand }]}>🏪 {profile.business.name}</Text>
              </View>
            )}
          </View>
          <Text style={styles.meta}>
            {[profile.subCity, profile.city].filter(Boolean).join(', ') || 'Ethiopia'}
            {' · '}Member since {new Date(profile.memberSince).getFullYear()}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.activeListingCount}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {profile.rating.count > 0 ? `${profile.rating.average.toFixed(1)} ★` : '—'}
              </Text>
              <Text style={styles.statLabel}>{profile.rating.count} review{profile.rating.count === 1 ? '' : 's'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>

          {!isSelf && (
            <TouchableOpacity
              style={[styles.followBtn, profile.isFollowing && styles.followBtnActive]}
              onPress={toggleFollow}
              disabled={followPending}
            >
              <Text style={[styles.followBtnText, profile.isFollowing && styles.followBtnTextActive]}>
                {profile.isFollowing ? 'Following' : '+ Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Listings ({listings.length})</Text>
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
          columnWrapperStyle={{ gap: 10 }}
          ListEmptyComponent={<Text style={styles.empty}>No active listings.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listingCard} onPress={() => router.push(`/listing/${item.id}` as any)}>
              <View style={styles.listingPhoto}><Text style={{ fontSize: 28 }}>📦</Text></View>
              <View style={{ padding: 8 }}>
                <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.listingPrice}>{formatETB(item.price)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {reviews.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={{ paddingHorizontal: 12, gap: 8 }}>
              {reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{r.reviewer.name}</Text>
                    <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                  </View>
                  {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={reportModalVisible} transparent animationType="slide" onRequestClose={() => setReportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Report {profile.name}</Text>
            <TextInput
              style={styles.reportInput}
              placeholder="What's wrong? (min 5 characters)"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setReportModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSend, (reportReason.trim().length < 5 || submittingReport) && { opacity: 0.6 }]}
                disabled={reportReason.trim().length < 5 || submittingReport}
                onPress={submitReport}
              >
                {submittingReport
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  backText: { color: colors.onBrand, fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onBrand },
  profileCard: { alignItems: 'center', padding: 20, gap: 6 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  badge: { backgroundColor: colors.brandTint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.brand },
  meta: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 24, marginTop: 10 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  followBtn: {
    marginTop: 10, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, backgroundColor: colors.brand,
  },
  followBtnActive: { backgroundColor: colors.brandTint },
  followBtnText: { color: colors.onBrand, fontWeight: '700', fontSize: 13 },
  followBtnTextActive: { color: colors.brand },
  sectionTitle: {
    fontSize: 13, fontWeight: '800', color: colors.textPrimary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 12, marginTop: 16, marginBottom: 8,
  },
  empty: { color: colors.textMuted, fontSize: 13, paddingHorizontal: 12 },
  listingCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
  },
  listingPhoto: {
    height: 90, backgroundColor: colors.brandTint,
    alignItems: 'center', justifyContent: 'center',
  },
  listingTitle: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  listingPrice: { fontSize: 13, fontWeight: '800', color: colors.value, marginTop: 2 },
  reviewCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  reviewStars: { fontSize: 12, color: colors.value },
  reviewComment: { fontSize: 12, color: colors.textBody, lineHeight: 17 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  reportInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: colors.textPrimary, backgroundColor: colors.canvas, minHeight: 80, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.brandTint, alignItems: 'center' },
  modalCancelText: { color: colors.brand, fontWeight: '600', fontSize: 14 },
  modalSend: { flex: 1.5, paddingVertical: 13, borderRadius: 12, backgroundColor: colors.action, alignItems: 'center' },
  modalSendText: { color: colors.onAction, fontWeight: '700', fontSize: 14 },
});
