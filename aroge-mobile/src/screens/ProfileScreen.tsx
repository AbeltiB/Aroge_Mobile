import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Colors } from '../constants';
import { useAppState } from '../context/AppContext';

export default function ProfileScreen() {
  const { sellerMode, setSellerMode, logout } = useAppState();

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Profile</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Seller Mode</Text>
        <Switch value={sellerMode} onValueChange={setSellerMode} trackColor={{ true: Colors.green.primary }} />
      </View>
      <Text style={styles.note}>{sellerMode ? 'You can now create listings and sell.' : 'Toggle on Seller Mode to start selling.'}</Text>
      <Pressable style={styles.logout} onPress={logout}><Text style={styles.logoutText}>Logout</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background, padding: 16 },
  heading: { fontSize: 26, fontWeight: '700', color: Colors.text.primary, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.cream.surface, borderRadius: 14, padding: 14 },
  label: { fontSize: 17, color: Colors.text.primary, fontWeight: '600' },
  note: { marginTop: 12, color: Colors.text.secondary },
  logout: { marginTop: 30, backgroundColor: Colors.terracotta.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: Colors.text.onTerracotta, fontWeight: '700' },
});
