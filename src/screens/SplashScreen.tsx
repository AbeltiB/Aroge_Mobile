import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, FontWeight, LetterSpacing } from '../constants';

export default function SplashScreen() {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 140 });
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    taglineOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    const timer = setTimeout(() => router.replace('/onboarding'), 1500);
    return () => clearTimeout(timer);
  }, [scale, opacity, taglineOpacity]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <View style={styles.root}>
      <Animated.View style={markStyle}>
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image source={require('../../assets/adaptive-icon.png')} style={styles.mark} resizeMode="contain" />
      </Animated.View>
      <Animated.Text style={[styles.wordmark, taglineStyle]}>AROGE</Animated.Text>
      <Animated.Text style={[styles.subtitle, taglineStyle]}>Trusted buying and selling</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 140,
    height: 140,
  },
  wordmark: {
    marginTop: 20,
    fontFamily: FontFamily.serif,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.green.primary,
    letterSpacing: LetterSpacing.widest,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
});
