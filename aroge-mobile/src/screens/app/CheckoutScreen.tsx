import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants';

export default function CheckoutScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Checkout</Text>
      <View style={styles.card}>
        <Text style={styles.text}>Subtotal: ETB 42,000</Text>
        <Text style={styles.text}>Delivery: ETB 500</Text>
        <Text style={styles.total}>Total: ETB 42,500</Text>
      </View>
      <Pressable style={styles.btn}><Text style={styles.btnText}>Place Order</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.cream.background, padding: 16 }, title: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, marginBottom: 10 }, card: { backgroundColor: Colors.cream.surface, borderRadius: 12, padding: 14, marginBottom: 20 }, text: { color: Colors.text.secondary, marginBottom: 6 }, total: { color: Colors.text.primary, fontWeight: '700' }, btn: { backgroundColor: Colors.green.primary, padding: 14, borderRadius: 12, alignItems: 'center' }, btnText: { color: Colors.text.onGreen, fontWeight: '700' } });
