import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants';
import { products, storyCards } from '../data/mock';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.heading}>AROGE Marketplace</Text>
      <Text style={styles.sub}>Buy, sell, and build trust.</Text>

      <Text style={styles.section}>Stories</Text>
      <FlatList
        horizontal
        data={storyCards}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <Pressable style={styles.storyCard}>
            <Text style={styles.storyEmoji}>{item.emoji}</Text>
            <Text style={styles.storyTitle}>{item.title}</Text>
            <Text style={styles.storySub}>{item.subtitle}</Text>
          </Pressable>
        )}
      />

      <View style={styles.rowHead}>
        <Text style={styles.section}>Featured Products</Text>
        <Pressable onPress={() => router.push('/(app)/search')}><Text style={styles.link}>Search</Text></Pressable>
      </View>

      {products.map((p) => (
        <Pressable key={p.id} style={styles.product} onPress={() => router.push({ pathname: '/(app)/product/[id]', params: { id: p.id } })}>
          <Text style={styles.productTitle}>{p.title}</Text>
          <Text style={styles.productMeta}>{p.location} • {p.condition}</Text>
          <Text style={styles.price}>ETB {p.price.toLocaleString()}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background, padding: 16 },
  heading: { color: Colors.text.primary, fontSize: 28, fontWeight: '700' },
  sub: { color: Colors.text.secondary, marginTop: 4, marginBottom: 10 },
  section: { color: Colors.text.primary, fontSize: 18, fontWeight: '700', marginBottom: 8, marginTop: 6 },
  storyCard: { width: 140, backgroundColor: Colors.green.primary, borderRadius: 14, padding: 12, marginBottom: 10 },
  storyEmoji: { fontSize: 22 },
  storyTitle: { color: Colors.text.onGreen, fontWeight: '700', marginTop: 6 },
  storySub: { color: Colors.cream.background, opacity: 0.9, fontSize: 12, marginTop: 2 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: Colors.terracotta.primary, fontWeight: '700' },
  product: { backgroundColor: Colors.cream.surface, borderRadius: 14, borderColor: Colors.border.default, borderWidth: 1, padding: 14, marginBottom: 10 },
  productTitle: { color: Colors.text.primary, fontSize: 16, fontWeight: '700' },
  productMeta: { color: Colors.text.secondary, marginTop: 3 },
  price: { color: Colors.gold.primary, marginTop: 6, fontWeight: '700' },
});
