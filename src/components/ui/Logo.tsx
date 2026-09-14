import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../constants';

type Background = 'cream' | 'forest' | 'none';

interface LogoProps {
  size?: number;
  background?: Background;
}

const BACKGROUND_COLOR: Record<Background, string> = {
  cream: Colors.cream.background,
  forest: Colors.green.primary,
  none: 'transparent',
};

/** The Aroge mark — two figures mid-handoff, built from A/G, gold dot passing
 *  between their hands. Always this image; never approximate the letterforms. */
export const Logo: React.FC<LogoProps> = ({ size = 64, background = 'none' }) => (
  <View
    style={[
      styles.wrap,
      {
        width: size,
        height: size,
        backgroundColor: BACKGROUND_COLOR[background],
        borderRadius: background === 'none' ? 0 : BorderRadius.lg,
      },
    ]}
  >
    {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
    <Image source={require('../../../assets/logo-mark.png')} style={styles.image} resizeMode="contain" />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '72%',
    height: '72%',
  },
});
