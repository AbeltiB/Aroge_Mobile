import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../src/lib/colors';
import { api } from '../../src/lib/api';
import { formatETB } from '@arogenpm/sdk';
import type { Order } from '@arogenpm/sdk';

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()).replace('Paid Escrowed', 'In Escrow');
}

function getStatusStyle(status: string): object {
  if (status === 'PAID_ESCROWED' || status === 'COMPLETED') return { backgroundColor: '#e6f0eb' };
  if (status === 'DISPUTED') return { backgroundColor: 'rgba(184,92,42,0.12)' };
  if (status === 'PENDING_PAYMENT') return { backgroundColor: '#faeeda' };
  return { backgroundColor: colors.brandTint };
}

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          ListEmptyComponent={<Text style={styles.empty}>You haven't placed any orders yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => router.push(`/order/${item.id}` as any)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.listing?.title ?? 'Order'}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>{formatETB(item.amount)}</Text>
                <View style={[styles.statusBadge, getStatusStyle(item.orderStatus)]}>
                  <Text style={styles.statusText}>{formatStatus(item.orderStatus)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.brand, paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.onBrand },
  empty: {
    textAlign: 'center', color: colors.textMuted, marginTop: 40,
    fontSize: 14, paddingHorizontal: 32, lineHeight: 20,
  },
  row: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border,
  },
  title: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '800', color: colors.value },
  statusBadge: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  statusText: { fontSize: 9, fontWeight: '700', color: colors.textPrimary },
});
