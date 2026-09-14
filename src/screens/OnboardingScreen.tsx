import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { router } from 'expo-router';
import { ShieldCheck, Lock, Store } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../constants';
import { Button } from '../components/ui';
import { haptics } from '../lib/haptics';
import { useAppState } from '../context/AppContext';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    key: '1',
    title: 'Welcome to Aroge',
    text: "Ethiopia's trusted marketplace for pre-loved treasures — buy and sell with confidence.",
    Icon: ShieldCheck,
    tint: Colors.green.tint,
    fg: Colors.green.primary,
  },
  {
    key: '2',
    title: 'Shop with Confidence',
    text: 'Every payment is held safely in escrow until you confirm your item has arrived.',
    Icon: Lock,
    tint: 'rgba(200,155,60,0.16)',
    fg: Colors.gold.dark,
  },
  {
    key: '3',
    title: 'Sell With One Toggle',
    text: 'Switch to Seller Mode anytime from your profile and start listing in minutes.',
    Icon: Store,
    tint: Colors.terracotta.tint,
    fg: Colors.terracotta.primary,
  },
] as const;

function Dot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const dotWidth = interpolate(scrollX.value, inputRange, [8, 24, 8], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP);
    return { width: dotWidth, opacity };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAppState();
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const finish = () => {
    haptics.tap();
    completeOnboarding();
    router.replace('/(auth)');
  };

  const next = () => {
    if (index < PAGES.length - 1) {
      haptics.select();
      ref.current?.scrollToIndex({ index: index + 1 });
    } else {
      finish();
    }
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.root}>
      {index < PAGES.length - 1 && (
        <Pressable style={[styles.skip, { top: insets.top + Spacing[2] }]} onPress={finish} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      <Animated.FlatList
        ref={ref}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <View style={[styles.iconCircle, { backgroundColor: item.tint }]}>
              <item.Icon size={44} color={item.fg} strokeWidth={1.75} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((p, i) => (
            <Dot key={p.key} index={i} scrollX={scrollX} />
          ))}
        </View>
        <Button label={index === PAGES.length - 1 ? 'Get Started' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream.background },
  skip: {
    position: 'absolute',
    right: Spacing[5],
    zIndex: 10,
  },
  skipText: {
    fontFamily: FontFamily.interSemibold,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  page: { width, paddingHorizontal: Spacing[8], alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[8],
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: FontSize['2xl'],
    color: Colors.text.primary,
    textAlign: 'center',
  },
  text: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing[3],
    lineHeight: FontSize.base * 1.5,
  },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    gap: Spacing[6],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.green.primary,
  },
});
