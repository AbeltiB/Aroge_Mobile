import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants';

export default function CartScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Cart</Text>
      <View style={styles.card}><Text style={styles.line}>iPhone 13 Pro</Text><Text style={styles.line}>ETB 42,000</Text></View>
      <Pressable style={styles.btn} onPress={() => router.push('/(app)/checkout')}><Text style={styles.btnText}>Go to Checkout</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.cream.background, padding: 16 }, title: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, marginBottom: 10 }, card: { backgroundColor: Colors.cream.surface, borderRadius: 12, padding: 14, marginBottom: 20 }, line: { color: Colors.text.primary, marginBottom: 6 }, btn: { backgroundColor: Colors.terracotta.primary, padding: 14, borderRadius: 12, alignItems: 'center' }, btnText: { color: Colors.text.onTerracotta, fontWeight: '700' } });
