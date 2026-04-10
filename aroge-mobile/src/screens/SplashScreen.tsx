import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogoMark } from '../src/components/ui/LogoMark';
import { Colors, FontFamily, FontSize, FontWeight, LetterSpacing } from '../src/constants';

const { width: W, height: H } = Dimensions.get('window');

/**
 * Animated splash screen for Aroge.
 *
 * Sequence (total ~3.0s):
 *   0ms    — Forest green gradient fills screen
 *   0ms    — Ring expands from center (scale 0→1, opacity 0→1)
 *   150ms  — Logo mark fades in + scales up (0.6→1)
 *   550ms  — "AROGE" wordmark slides up + fades in
 *   750ms  — "አሮጌ" Amharic text fades in
 *   950ms  — Gold rule line draws from center outward
 *   1150ms — Tagline fades in word by word (staggered)
 *   1600ms — Floating orbs drift upward
 *   2400ms — Everything fades to cream → navigate to auth
 */

const ANIMATION_CONFIG = {
  ringStart: 0,
  logoStart: 150,
  wordmarkStart: 550,
  amharicStart: 750,
  ruleStart: 950,
  taglineStart: 1150,
  exitStart: 2400,
  exitDuration: 600,
  totalDuration: 3000,
} as const;

function useAnimatedValue(initial: number) {
  return useRef(new Animated.Value(initial)).current;
}

// Easing presets
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);

export default function SplashEntry() {
  // Animation values
  const ringScale = useAnimatedValue(0.3);
  const ringOpacity = useAnimatedValue(0);

  const logoScale = useAnimatedValue(0.65);
  const logoOpacity = useAnimatedValue(0);
  const logoTranslateY = useAnimatedValue(12);

  const wordmarkOpacity = useAnimatedValue(0);
  const wordmarkTranslateY = useAnimatedValue(20);

  const amharicOpacity = useAnimatedValue(0);

  const ruleScaleX = useAnimatedValue(0);
  const ruleOpacity = useAnimatedValue(0);

  const taglineOpacity = useAnimatedValue(0);

  const orb1Y = useAnimatedValue(0);
  const orb2Y = useAnimatedValue(0);
  const orb3Y = useAnimatedValue(0);
  const orbOpacity = useAnimatedValue(0);

  const screenOpacity = useAnimatedValue(1);
  const screenBg = useAnimatedValue(0); // 0 = green, 1 = cream

  useEffect(() => {
    const { delay } = Animated;

    const sequence = [
      // Ring appears
      delay(
        ANIMATION_CONFIG.ringStart,
        Animated.parallel([
          Animated.spring(ringScale, {
            toValue: 1,
            damping: 18,
            stiffness: 90,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.6,
            duration: 500,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ]),
      ),

      // Logo mark
      delay(
        ANIMATION_CONFIG.logoStart,
        Animated.parallel([
          Animated.spring(logoScale, {
            toValue: 1,
            damping: 14,
            stiffness: 100,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 400,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(logoTranslateY, {
            toValue: 0,
            duration: 400,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ]),
      ),

      // "AROGE" wordmark
      delay(
        ANIMATION_CONFIG.wordmarkStart,
        Animated.parallel([
          Animated.timing(wordmarkOpacity, {
            toValue: 1,
            duration: 350,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(wordmarkTranslateY, {
            toValue: 0,
            duration: 350,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ]),
      ),

      // Amharic text
      delay(
        ANIMATION_CONFIG.amharicStart,
        Animated.timing(amharicOpacity, {
          toValue: 1,
          duration: 400,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ),

      // Gold rule line
      delay(
        ANIMATION_CONFIG.ruleStart,
        Animated.parallel([
          Animated.timing(ruleScaleX, {
            toValue: 1,
            duration: 500,
            easing: easeInOut,
            useNativeDriver: true,
          }),
          Animated.timing(ruleOpacity, {
            toValue: 1,
            duration: 200,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ]),
      ),

      // Tagline
      delay(
        ANIMATION_CONFIG.taglineStart,
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ),

      // Floating orbs
      delay(
        1400,
        Animated.parallel([
          Animated.timing(orbOpacity, {
            toValue: 0.25,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(orb1Y, {
                toValue: -20,
                duration: 2800,
                easing: easeInOut,
                useNativeDriver: true,
              }),
              Animated.timing(orb1Y, {
                toValue: 0,
                duration: 2800,
                easing: easeInOut,
                useNativeDriver: true,
              }),
            ]),
          ),
        ]),
      ),
    ];

    // Run entrance animations
    Animated.parallel(sequence).start();

    // Exit sequence
    const exitTimer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: ANIMATION_CONFIG.exitDuration,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.replace('/(auth)');
      });
    }, ANIMATION_CONFIG.exitStart);

    return () => clearTimeout(exitTimer);
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#0d4d38', '#1f7a5a', '#28936b']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle dot-matrix texture overlay */}
      <View style={styles.texture} pointerEvents="none" />

      {/* Background ambient orbs */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          { opacity: orbOpacity, transform: [{ translateY: orb1Y }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.orb, styles.orb2, { opacity: orbOpacity }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.orb, styles.orb3, { opacity: orbOpacity }]}
        pointerEvents="none"
      />

      {/* ── Main content ─────────────────────────────── */}
      <View style={styles.content}>

        {/* Amharic eyebrow */}
        <Animated.Text
          style={[styles.amharic, { opacity: amharicOpacity }]}
          accessibilityLabel="Aroge in Amharic"
        >
          አሮጌ
        </Animated.Text>

        {/* Expanding ring behind logo */}
        <Animated.View
          style={[
            styles.ring,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />

        {/* Logo mark */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY },
              ],
            },
          ]}
        >
          <LogoMark size={88} color={Colors.cream.background} accentColor={Colors.gold.primary} showRing={false} />
        </Animated.View>

        {/* AROGE wordmark */}
        <Animated.Text
          style={[
            styles.wordmark,
            {
              opacity: wordmarkOpacity,
              transform: [{ translateY: wordmarkTranslateY }],
            },
          ]}
          accessibilityLabel="Aroge"
        >
          AROGE
        </Animated.Text>

        {/* Gold separator rule */}
        <Animated.View
          style={[
            styles.ruleContainer,
            {
              opacity: ruleOpacity,
              transform: [{ scaleX: ruleScaleX }],
            },
          ]}
        >
          <View style={styles.rule} />
          <View style={styles.ruleDot} />
          <View style={styles.rule} />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[styles.tagline, { opacity: taglineOpacity }]}
          accessibilityLabel="Give things a second story"
        >
          Give things a second story
        </Animated.Text>
      </View>

      {/* Bottom wordmark strip */}
      <Animated.View
        style={[styles.bottomStrip, { opacity: taglineOpacity }]}
      >
        <Text style={styles.bottomText}>
          Ethiopia's secondhand marketplace
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.green.primary,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: 'transparent',
  },

  // Ambient orbs
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: Colors.gold.primary,
  },
  orb1: {
    width: 200,
    height: 200,
    top: -60,
    right: -60,
    opacity: 0,
  },
  orb2: {
    width: 140,
    height: 140,
    bottom: H * 0.12,
    left: -50,
    backgroundColor: Colors.cream.background,
    opacity: 0,
  },
  orb3: {
    width: 80,
    height: 80,
    bottom: H * 0.3,
    right: 20,
    backgroundColor: Colors.terracotta.primary,
    opacity: 0,
  },

  // Main content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  amharic: {
    fontFamily: FontFamily.serif,
    fontSize: FontSize.sm,
    color: Colors.gold.primary,
    letterSpacing: LetterSpacing.eyebrow,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: `${Colors.gold.primary}40`,
    alignSelf: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: FontFamily.serif,
    fontSize: 52,
    fontWeight: FontWeight.regular,
    color: Colors.cream.background,
    letterSpacing: 14,
    marginBottom: 28,
  },
  ruleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    width: 160,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gold.primary,
    opacity: 0.7,
  },
  ruleDot: {
    width: 5,
    height: 5,
    borderRadius: 9999,
    backgroundColor: Colors.gold.primary,
  },
  tagline: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    color: `${Colors.cream.background}99`,
    letterSpacing: LetterSpacing.wide,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.7,
  },

  // Bottom
  bottomStrip: {
    paddingBottom: 48,
    alignItems: 'center',
  },
  bottomText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: `${Colors.cream.background}50`,
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
  },
});