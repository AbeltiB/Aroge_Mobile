import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, FontSize, Spacing } from '../../constants';

interface LegalSectionProps {
  title: string;
  children: React.ReactNode;
}

/** A heading + body-copy block, used by Privacy/Terms for a consistent reading layout. */
export const LegalSection: React.FC<LegalSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.body}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  section: { gap: 6 },
  title: {
    fontFamily: FontFamily.displaySemibold,
    fontSize: FontSize.base,
    color: Colors.ink,
  },
  body: {
    fontFamily: FontFamily.interRegular,
    fontSize: 13.5,
    lineHeight: 20,
    color: Colors.inkSoft,
  },
});
