import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { colors } from '../../src/lib/colors';
import { Colors, Spacing, BorderRadius } from '../../src/constants';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Order } from '@arogenpm/sdk';
import { ScreenHeader, Badge, EmptyState, SkeletonRow, type BadgeTone } from '../../src/components/ui';

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()).replace('Paid Escrowed', 'In Escrow');
}

const STATUS_TONE: Record<string, BadgeTone> = {
  PAID_ESCROWED: 'success',
  COMPLETED: 'success',
  DISPUTED: 'error',
  PENDING_PAYMENT: 'warning',
};

export default function MyOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<(Order & { listing?: any })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<(Order & { listing?: any })[]>('/orders/mine').then((res) => {
      if (res.success) setOrders(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }} edges={['top']}>
      <ScreenHeader title="My Orders" showBack={false} bordered />

      {loading ? (
        <View style={{ paddingTop: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon={<ShoppingBag size={28} color={Colors.text.muted} strokeWidth={1.5} />}
              title="No orders yet"
              subtitle="You haven't placed any orders yet"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => router.push(`/order/${item.id}`)} activeOpacity={0.85}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.listing?.title ?? 'Order'}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={styles.amount}>{formatETB(item.amount)}</Text>
                <Badge label={formatStatus(item.orderStatus)} tone={STATUS_TONE[item.orderStatus] ?? 'neutral'} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing[3], gap: 8 },
  row: {
    backgroundColor: colors.surface, borderRadius: BorderRadius.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 8,
  },
  title: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '800', color: colors.value },
});
