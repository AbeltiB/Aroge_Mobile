import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/lib/colors';

export default function SellScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.action }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sell on Aroge</Text>
        <Text style={styles.headerSub}>List your pre-loved items in minutes</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/listing/create')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardTitle}>📷 Create a Listing</Text>
          <Text style={styles.cardBody}>
            Add photos, set your price and let buyers come to you.
          </Text>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Start Listing →</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Selling Tips</Text>
          <Text style={styles.tip}>• Clear photos sell 3× faster</Text>
          <Text style={styles.tip}>• Enable negotiable pricing for more offers</Text>
          <Text style={styles.tip}>• Funds are held in escrow until delivery confirmed</Text>
          <Text style={styles.tip}>• Ethiopian payment rails — Telebirr & CBE Birr</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.action,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.onAction,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  body: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 18,
    marginBottom: 16,
  },
  cta: {
    backgroundColor: colors.action,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: {
    color: colors.onAction,
    fontSize: 14,
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: colors.brandTint,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brandDeep,
    marginBottom: 4,
  },
  tip: {
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 18,
  },
});
