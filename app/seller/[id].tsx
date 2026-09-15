import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoreHorizontal, BadgeCheck, Star, Store } from 'lucide-react-native';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Listing } from '@arogenpm/sdk';
import { useAppState } from '../../src/context/AppContext';
import { ScreenHeader, Avatar, Badge, Button, RemoteImage, EmptyState, BottomSheet, Input, IconButton } from '../../src/components/ui';

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
  const [listings, setListings] = useState<(Listing & { photos?: any[] })[]>([]);
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
      if (listingsRes.success) setListings(listingsRes.data as any);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.green.primary} />
      </SafeAreaView>
    );
  }

  const isSelf = user?.sub === profile.id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader
        title="Seller"
        tone="surface"
        bordered
        rightActions={!isSelf ? (
          <IconButton tone="tint" size="md" onPress={showMoreMenu}>
            <MoreHorizontal size={18} color={Colors.green.primary} />
          </IconButton>
        ) : undefined}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.profileCard}>
          <Avatar name={profile.name} size={72} />
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.badgeRow}>
            {profile.verified && <Badge label="Verified" tone="brand" icon={<BadgeCheck size={11} color={Colors.green.primary} />} />}
            {profile.isTrusted && <Badge label="Trusted" tone="gold" icon={<Star size={11} color={Colors.gold.dark} fill={Colors.gold.dark} />} />}
            {profile.business && <Badge label={profile.business.name} tone="brand" icon={<Store size={11} color={Colors.green.primary} />} />}
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
            <View style={styles.actionRow}>
              <Button
                label="Message"
                variant="secondary"
                size="sm"
                fullWidth={false}
                onPress={() => router.push({
                  pathname: '/messages/[listingId]/[otherUserId]',
                  params: { listingId: 'general', otherUserId: profile.id, name: profile.name },
                })}
                style={styles.actionBtn}
              />
              <Button
                label={profile.isFollowing ? 'Following' : '+ Follow'}
                variant={profile.isFollowing ? 'secondary' : 'primary'}
                size="sm"
                fullWidth={false}
                disabled={followPending}
                onPress={toggleFollow}
                style={styles.actionBtn}
              />
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Listings ({listings.length})</Text>
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.listingsGrid}
          columnWrapperStyle={{ gap: 10 }}
          ListEmptyComponent={<EmptyState icon={<Store size={24} color={Colors.text.muted} strokeWidth={1.5} />} title="No active listings" />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listingCard} onPress={() => router.push(`/listing/${item.id}`)}>
              <RemoteImage
                photoKey={item.photos?.find((p: any) => p.isPrimary)?.cloudinaryKey ?? item.photos?.[0]?.cloudinaryKey}
                style={styles.listingPhoto}
              />
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
                    <View style={{ flexDirection: 'row', gap: 1 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} color={Colors.gold.primary} fill={i < r.rating ? Colors.gold.primary : 'transparent'} />
                      ))}
                    </View>
                  </View>
                  {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <BottomSheet visible={reportModalVisible} onClose={() => setReportModalVisible(false)} title={`Report ${profile.name}`}>
        <View style={{ marginTop: Spacing[2], marginBottom: Spacing[5] }}>
          <Input
            placeholder="What's wrong? (min 5 characters)"
            value={reportReason}
            onChangeText={setReportReason}
            multiline
            numberOfLines={3}
            style={{ height: 90, paddingTop: 12, textAlignVertical: 'top' }}
            autoFocus
          />
        </View>
        <Button
          label="Submit"
          variant="danger"
          loading={submittingReport}
          disabled={reportReason.trim().length < 5}
          onPress={submitReport}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileCard: { alignItems: 'center', padding: 20, gap: 6 },
  name: { fontFamily: FontFamily.display, fontSize: 18, color: Colors.ink, marginTop: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  meta: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 24, marginTop: 10 },
  statBox: { alignItems: 'center' },
  statValue: { fontFamily: FontFamily.displaySemibold, fontSize: 16, color: Colors.ink },
  statLabel: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.inkSoft, marginTop: 1 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: { paddingHorizontal: 22 },
  sectionTitle: {
    fontFamily: FontFamily.interBold, fontSize: 13, color: Colors.ink,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 12, marginTop: 16, marginBottom: 8,
  },
  listingsGrid: { paddingHorizontal: Spacing[3], gap: 10 },
  listingCard: {
    flex: 1, backgroundColor: Colors.cream.surface, borderRadius: BorderRadius.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.line,
  },
  listingPhoto: { height: 100, width: '100%' },
  listingTitle: { fontFamily: FontFamily.interSemibold, fontSize: 12, color: Colors.ink },
  listingPrice: { fontFamily: FontFamily.display, fontSize: 13, color: Colors.gold.primary, marginTop: 2 },
  reviewCard: {
    backgroundColor: Colors.cream.surface, borderRadius: BorderRadius.md, padding: 12,
    borderWidth: 1, borderColor: Colors.line, gap: 4,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontFamily: FontFamily.interSemibold, fontSize: 13, color: Colors.ink },
  reviewComment: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft, lineHeight: 17 },
});
