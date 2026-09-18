import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Spacing, BorderRadius } from '../../../src/constants';
import { api } from '../../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { LiveSessionSummary } from '@arogenpm/sdk';
import { ScreenHeader, Card, Button } from '../../../src/components/ui';

export default function LiveSessionSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [summary, setSummary] = useState<LiveSessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<LiveSessionSummary>(`/live-sessions/${id}/summary`).then((res) => {
      if (res.success) setSummary(res.data);
      setLoading(false);
    });
  }, [id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream.background }} edges={['top']}>
      <ScreenHeader title="Live Summary" tone="surface" bordered />

      {loading || !summary ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.green.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.statGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{summary.ordersCount}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{formatETB(summary.revenue)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{formatETB(summary.paid)}</Text>
              <Text style={styles.statLabel}>Paid</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, summary.outstanding > 0 && { color: Colors.terracotta.primary }]}>
                {formatETB(summary.outstanding)}
              </Text>
              <Text style={styles.statLabel}>Outstanding</Text>
            </Card>
          </View>

          {summary.bestSellers.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Best Sellers</Text>
              {summary.bestSellers.map((item) => (
                <Card key={item.listingId} style={styles.bestSellerRow}>
                  <Text style={styles.bestSellerTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.bestSellerCount}>{item.unitsSold} sold</Text>
                </Card>
              ))}
            </>
          )}

          {summary.outstanding > 0 && (
            <Button
              label="Go collect outstanding payments"
              variant="primary"
              onPress={() => router.push(`/live/${id}`)}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: Spacing[3], gap: 12, paddingBottom: 60 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', padding: 14, gap: 4 },
  statValue: { fontFamily: FontFamily.display, fontSize: 20, color: Colors.ink },
  statLabel: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft },
  sectionTitle: { fontFamily: FontFamily.interBold, fontSize: 13, color: Colors.ink, marginTop: 8 },
  bestSellerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12,
  },
  bestSellerTitle: { fontFamily: FontFamily.interSemibold, fontSize: 13, color: Colors.ink, flex: 1 },
  bestSellerCount: { fontFamily: FontFamily.interRegular, fontSize: 12, color: Colors.inkSoft },
});
