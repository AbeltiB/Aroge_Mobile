import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../constants';
import { formatETB } from '@arogenpm/sdk';

export interface EscrowStep {
  label: string;
  detail?: string;
  status: 'done' | 'current' | 'upcoming';
}

export type EscrowState = 'held' | 'released' | 'refunded' | 'disputed';

const STATE_COPY: Record<EscrowState, { headline: string; sub: string; bg: string }> = {
  held: { headline: 'Held in escrow', sub: 'Released to the seller once you confirm receipt.', bg: Colors.green.primary },
  released: { headline: 'Released to seller', sub: 'Transaction complete.', bg: Colors.green.primary },
  refunded: { headline: 'Refunded to you', sub: 'Funds have been returned.', bg: Colors.inkSoft },
  disputed: { headline: 'Under review', sub: 'Aroge support is looking into this order.', bg: Colors.terracotta.primary },
};

/** The funds-status banner — deliberately the visual anchor of the order
 *  detail screen; the delivery timeline underneath is secondary to this. */
export const EscrowHeader: React.FC<{ state: EscrowState; amountEtb: number }> = ({ state, amountEtb }) => {
  const copy = STATE_COPY[state];
  return (
    <View style={[styles.headerCard, { backgroundColor: copy.bg }]}>
      <Text style={styles.headerEyebrow}>FUNDS STATUS</Text>
      <Text style={styles.headerTitle}>{copy.headline} — {formatETB(amountEtb)}</Text>
      <Text style={styles.headerSub}>{copy.sub}</Text>
    </View>
  );
};

export const EscrowTimeline: React.FC<{ steps: EscrowStep[] }> = ({ steps }) => (
  <View style={styles.timeline}>
    <View style={styles.rail} />
    {steps.map((step, i) => (
      <View key={i} style={[styles.stepRow, i === steps.length - 1 && { marginBottom: 0 }, step.status === 'upcoming' && styles.upcoming]}>
        <View
          style={[
            styles.dot,
            step.status === 'done' && { backgroundColor: Colors.green.primary },
            step.status === 'current' && { backgroundColor: Colors.gold.primary },
            step.status === 'upcoming' && styles.dotUpcoming,
          ]}
        >
          {step.status === 'done' && <Check size={11} color={Colors.cream.background} strokeWidth={3} />}
        </View>
        <View>
          <Text style={styles.stepLabel}>{step.label}</Text>
          {step.detail ? <Text style={styles.stepDetail}>{step.detail}</Text> : null}
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  headerCard: { borderRadius: BorderRadius.lg, padding: Spacing[4], marginBottom: Spacing[6] },
  headerEyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, fontFamily: FontFamily.interBold },
  headerTitle: { color: Colors.cream.background, fontSize: FontSize.lg, fontFamily: FontFamily.display, marginTop: 2 },
  headerSub: { color: 'rgba(255,255,255,0.78)', fontSize: 11.5, fontFamily: FontFamily.interRegular, marginTop: 4 },

  timeline: { paddingLeft: Spacing[6] + Spacing[1], position: 'relative' },
  rail: { position: 'absolute', left: 9, top: 6, bottom: 30, width: 2, backgroundColor: Colors.line },
  stepRow: { marginBottom: Spacing[6] + Spacing[1], position: 'relative' },
  upcoming: { opacity: 0.4 },
  dot: {
    position: 'absolute', left: -26, top: 0, width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  dotUpcoming: { backgroundColor: 'transparent', borderWidth: 1.6, borderColor: Colors.line },
  stepLabel: { fontSize: 13, fontFamily: FontFamily.interBold, color: Colors.ink },
  stepDetail: { fontSize: 11, fontFamily: FontFamily.interRegular, color: Colors.inkSoft, marginTop: 1 },
});
