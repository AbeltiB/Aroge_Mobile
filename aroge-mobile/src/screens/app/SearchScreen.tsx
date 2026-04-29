import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '../../constants';
import { products } from '../../data/mock';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => products.filter((p) => p.title.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <View style={styles.root}>
      <TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder='Search products' />
      <FlatList data={filtered} keyExtractor={(item) => item.id} renderItem={({ item }) => <View style={styles.row}><Text style={styles.title}>{item.title}</Text><Text style={styles.price}>ETB {item.price.toLocaleString()}</Text></View>} />
    </View>
  );
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.cream.background, padding: 16 }, input: { backgroundColor: Colors.cream.surface, borderRadius: 12, padding: 12, marginBottom: 10 }, row: { backgroundColor: Colors.cream.surface, borderRadius: 12, padding: 12, marginBottom: 8 }, title: { color: Colors.text.primary }, price: { color: Colors.gold.primary, fontWeight: '700', marginTop: 3 } });
