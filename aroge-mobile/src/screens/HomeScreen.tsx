import React, { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants';
import { api } from '../services/api';

const items = [
  { id: '1', title: 'iPhone 13 Pro', price: 'ETB 42,000' },
  { id: '2', title: 'Sofa Set', price: 'ETB 9,800' },
  { id: '3', title: 'MacBook Air M1', price: 'ETB 55,000' },
];

export default function HomeScreen() {
  useEffect(() => {
    api.sendHeartbeat();
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Trusted Marketplace</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>{item.price}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background, padding: 16 },
  heading: { fontSize: 26, fontWeight: '700', color: Colors.text.primary, marginBottom: 12 },
  card: { backgroundColor: Colors.cream.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderColor: Colors.border.default, borderWidth: 1 },
  title: { color: Colors.text.primary, fontSize: 18, fontWeight: '600' },
  price: { color: Colors.gold.primary, marginTop: 4, fontWeight: '700' },
});
