import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants';

const categories = ['Electronics', 'Fashion', 'Furniture', 'Vehicles', 'Books', 'Tools', 'Sports'];

export default function CategoriesScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Categories</Text>
      <FlatList data={categories} keyExtractor={(item) => item} renderItem={({ item }) => <View style={styles.card}><Text style={styles.text}>{item}</Text></View>} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background, padding: 16 },
  heading: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, marginBottom: 10 },
  card: { backgroundColor: Colors.cream.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  text: { color: Colors.text.primary, fontWeight: '600' },
});
