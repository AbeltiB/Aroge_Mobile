import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants';
import { useAppState } from '../context/AppContext';

const { width } = Dimensions.get('window');
const PAGES = [
  { key: '1', title: 'Welcome to AROGE', text: 'A trust-based marketplace for Ethiopia.' },
  { key: '2', title: 'Buy with confidence', text: 'Verified users and transparent profiles.' },
  { key: '3', title: 'Sell with one toggle', text: 'Enable Seller Mode anytime from profile.' },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);
  const { completeOnboarding } = useAppState();

  const next = () => {
    if (index < PAGES.length - 1) ref.current?.scrollToIndex({ index: index + 1 });
    else {
      completeOnboarding();
      router.replace('/(auth)');
    }
  };

  return (
    <View style={styles.root}>
      <FlatList
        ref={ref}
        data={PAGES}
        horizontal
        pagingEnabled
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />
      <Pressable style={styles.button} onPress={next}><Text style={styles.buttonText}>{index === 2 ? 'Get Started' : 'Next'}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background, justifyContent: 'center' },
  page: { width, padding: 24, justifyContent: 'center' },
  title: { fontSize: 30, color: Colors.text.primary, fontWeight: '700' },
  text: { fontSize: 18, color: Colors.text.secondary, marginTop: 12 },
  button: { margin: 24, backgroundColor: Colors.terracotta.primary, padding: 16, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: Colors.text.onTerracotta, fontWeight: '700' },
});
