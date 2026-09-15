import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, LetterSpacing } from '../constants';
import { Logo } from '../components/ui';
import { useAppState } from '../context/AppContext';

export default function SplashScreen() {
  const { isAuthenticated, hasSeenOnboarding } = useAppState();
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 140 });
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    taglineOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    // AppProvider withholds rendering until the stored session/onboarding
    // state has loaded, so by the time this mounts isAuthenticated and
    // hasSeenOnboarding already reflect reality — a returning, already
    // logged-in user should never see onboarding or login again.
    const destination = isAuthenticated ? '/(app)/(tabs)' : hasSeenOnboarding ? '/(auth)' : '/onboarding';
    const timer = setTimeout(() => router.replace(destination), 1500);
    return () => clearTimeout(timer);
  }, [scale, opacity, taglineOpacity, isAuthenticated, hasSeenOnboarding]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.tile, markStyle]}>
        <Logo size={64} background="cream" />
      </Animated.View>
      <Animated.View style={taglineStyle}>
        <Text style={styles.wordmark}>AROGE</Text>
        <Text style={styles.subtitle}>SECONDHAND, FIRST CHOICE</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.green.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    marginBottom: 18,
  },
  wordmark: {
    fontFamily: FontFamily.display,
    fontSize: FontSize.xl,
    color: Colors.cream.background,
    letterSpacing: LetterSpacing.wider,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontFamily: FontFamily.interSemibold,
    fontSize: 11,
    color: 'rgba(243,239,231,0.65)',
    letterSpacing: LetterSpacing.wide,
    textAlign: 'center',
  },
});
