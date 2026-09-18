import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Radio, Plus } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../../src/constants';
import { api } from '../../../src/lib/api';
import type { LiveSession } from '@arogenpm/sdk';
import { Badge, EmptyState, SkeletonRow, IconButton } from '../../../src/components/ui';

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled', LIVE: 'Live now', ENDED: 'Ended', RECONCILED: 'Ended',
};

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral' | 'info'> = {
  SCHEDULED: 'warning', LIVE: 'success', ENDED: 'neutral', RECONCILED: 'neutral',
};

export default function LiveScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get<LiveSession[]>('/live-sessions/mine');
    if (res.success) setSessions(res.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Aroge Live</Text>
          <Text style={styles.headerSub}>Manage claims from your TikTok/IG lives</Text>
        </View>
        <IconButton tone="plain" size="lg" onPress={() => router.push('/live/create')} style={styles.newBtn}>
          <Plus size={20} color="#ffffff" strokeWidth={2.5} />
        </IconButton>
      </View>

      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.terracotta.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={<Radio size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title="No live sessions yet"
              subtitle="Start one right before you go live on TikTok or Instagram"
              actionLabel="Start a Live"
              onAction={() => router.push('/live/create')}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(item.status === 'ENDED' || item.status === 'RECONCILED' ? `/live/${item.id}/summary` : `/live/${item.id}`)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} live
                </Text>
                <Text style={styles.rowMeta}>{item.claimWindowMinutes} min claim window</Text>
              </View>
              <Badge label={STATUS_LABELS[item.status] ?? item.status} tone={STATUS_TONE[item.status] ?? 'neutral'} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontFamily: FontFamily.display, fontSize: FontSize.lg, color: Colors.ink },
  headerSub: { fontFamily: FontFamily.interRegular, fontSize: 12.5, color: Colors.inkSoft, marginTop: 3 },
  newBtn: { backgroundColor: Colors.terracotta.primary },
  list: { padding: Spacing[3], gap: 8 },
  row: {
    backgroundColor: Colors.cream.surface, borderRadius: BorderRadius.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.line, marginBottom: 8,
  },
  rowTitle: { fontFamily: FontFamily.interSemibold, fontSize: 14, color: Colors.ink },
  rowMeta: { fontFamily: FontFamily.interRegular, fontSize: 11, color: Colors.inkSoft, marginTop: 2 },
});
