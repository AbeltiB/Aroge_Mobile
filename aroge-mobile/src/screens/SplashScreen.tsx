import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogoMark } from '../componenets/ui/LogoMark';
import { Colors, FontFamily, FontSize } from '../constants';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Simple, type-safe animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after delay
    const timer = setTimeout(() => {
      router.replace('/(auth)');
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0d4d38', '#1f7a5a', '#28936b']}
        style={StyleSheet.absoluteFill}
      />

      {/* Centered Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LogoMark 
          size={100} 
          color={Colors.cream.background} 
          accentColor={Colors.gold.primary} 
        />
        
        <Text style={styles.wordmark}>AROGE</Text>
        <Text style={styles.tagline}>Give things a second story</Text>
      </Animated.View>

      {/* Bottom Text */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>Ethiopia's secondhand marketplace</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.green.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  wordmark: {
    fontFamily: FontFamily.serif,
    fontSize: 40,
    color: Colors.cream.background,
    letterSpacing: 8,
  },
  tagline: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: `${Colors.cream.background}cc`,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: `${Colors.cream.background}66`,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});