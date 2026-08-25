import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants';

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    const timer = setTimeout(() => router.replace('/onboarding'), 1400);
    return () => clearTimeout(timer);
  }, [scale]);

  return (
    <View style={styles.root}>
      <Animated.Text style={[styles.logo, { transform: [{ scale }] }]}>AROGE</Animated.Text>
      <Text style={styles.subtitle}>Trusted buying and selling</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.green.primary, alignItems: 'center', justifyContent: 'center' },
  logo: { color: Colors.cream.background, fontSize: 42, fontWeight: '700', letterSpacing: 5 },
  subtitle: { color: Colors.cream.background, marginTop: 8 },
});
