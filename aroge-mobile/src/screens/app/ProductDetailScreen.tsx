import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../constants';
import { products } from '../../data/mock';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = products.find((p) => p.id === id) ?? products[0];
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.price}>ETB {product.price.toLocaleString()}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <Pressable style={styles.btn} onPress={() => router.push('/(app)/cart')}><Text style={styles.btnText}>Add to Cart</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.cream.background, padding: 16 }, title: { fontSize: 24, fontWeight: '700', color: Colors.text.primary }, price: { color: Colors.gold.primary, fontWeight: '700', fontSize: 20, marginVertical: 8 }, description: { color: Colors.text.secondary, marginBottom: 20 }, btn: { backgroundColor: Colors.terracotta.primary, padding: 14, borderRadius: 12, alignItems: 'center' }, btnText: { color: Colors.text.onTerracotta, fontWeight: '700' } });
